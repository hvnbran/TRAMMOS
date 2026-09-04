import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Inbox, Check, X, MapPin, Clock, Loader2, Phone, AlertCircle } from "lucide-react";

interface SolicitudEntrante {
  id: string;
  cliente: "corona" | "sodimac" | "hospital_sur";
  pasajero_pcd_id: string;
  origen: string;
  destino: string;
  hora_recogida: string;
  programado: boolean;
  notas: string | null;
  estado: string;
  created_at: string;
  // joined
  pasajero_nombre?: string;
  pasajero_telefono?: string | null;
}

// Solo las solicitudes que aún requieren acción de operación.
// Al aceptarlas se crea el servicio y desaparecen de esta bandeja.
const ESTADOS_PENDIENTES = ["solicitada"] as const;

function formatHora(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-CO", {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function badgeEstado(estado: string) {
  switch (estado) {
    case "solicitada": return "bg-warning/15 text-warning border-warning/30";
    case "aceptada":
    case "asignada":  return "bg-primary/15 text-primary border-primary/30";
    case "en_curso":  return "bg-accent/15 text-accent border-accent/30";
    case "finalizada":return "bg-success/15 text-success border-success/30";
    case "cancelada": return "bg-destructive/15 text-destructive border-destructive/30";
    default:          return "bg-muted text-muted-foreground border-border";
  }
}

export function SolicitudesEntrantes() {
  const { cliente, user } = useAuth();
  const [rows, setRows] = useState<SolicitudEntrante[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    let q = supabase
      .from("solicitudes_pasajero")
      .select("*")
      .in("estado", ESTADOS_PENDIENTES as unknown as string[])
      .order("hora_recogida", { ascending: true });
    if (cliente) q = q.eq("cliente", cliente);
    const { data, error: e } = await q;
    if (e) { setError(e.message); setLoading(false); return; }

    // Hidratar nombre/telefono del pasajero
    const ids = Array.from(new Set((data ?? []).map((r) => r.pasajero_pcd_id)));
    let pasajerosMap = new Map<string, { nombre: string; telefono: string | null }>();
    if (ids.length > 0) {
      const { data: ps } = await supabase
        .from("pasajeros_pcd")
        .select("id,nombre,telefono")
        .in("id", ids);
      pasajerosMap = new Map((ps ?? []).map((p) => [p.id, { nombre: p.nombre, telefono: p.telefono }]));
    }

    setRows(
      (data ?? []).map((r) => ({
        ...(r as SolicitudEntrante),
        pasajero_nombre: pasajerosMap.get(r.pasajero_pcd_id)?.nombre ?? "Pasajero",
        pasajero_telefono: pasajerosMap.get(r.pasajero_pcd_id)?.telefono ?? null,
      })),
    );
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // Realtime: refrescar cuando cambien solicitudes
    const ch = supabase
      .channel("solicitudes-operacion")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "solicitudes_pasajero" },
        () => { void load(); },
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente]);

  async function aceptarYCrearServicio(s: SolicitudEntrante) {
    setBusyId(s.id);
    setError(null);
    try {
      const fecha = s.hora_recogida.slice(0, 10);
      const hora = new Date(s.hora_recogida).toLocaleTimeString("es-CO", {
        hour: "2-digit", minute: "2-digit", hour12: false,
      });

      const { data: srv, error: e1 } = await supabase
        .from("servicios")
        .insert([{
          cliente: s.cliente,
          fecha,
          hora,
          origen: s.origen,
          destino: s.destino,
          pasajero: s.pasajero_nombre ?? null,
          pasajero_pcd_id: s.pasajero_pcd_id,
          estado: "Programado",
          created_by: user?.id ?? null,
        }])
        .select("id")
        .single();
      if (e1) throw e1;

      const { error: e2 } = await supabase
        .from("solicitudes_pasajero")
        .update({ estado: "aceptada", servicio_id: srv!.id })
        .eq("id", s.id);
      if (e2) throw e2;

      // Disparar envío de notificación push (no bloqueante)
      fetch("/api/public/push/process", { method: "POST" }).catch(() => { /* ignore */ });

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo aceptar la solicitud");
    } finally {
      setBusyId(null);
    }
  }

  async function rechazar(s: SolicitudEntrante) {
    if (!confirm(`¿Rechazar solicitud de ${s.pasajero_nombre}?`)) return;
    setBusyId(s.id);
    const motivo = prompt("Motivo del rechazo (opcional):") ?? "";
    const { error: e } = await supabase
      .from("solicitudes_pasajero")
      .update({ estado: "cancelada", cancelado_motivo: motivo || "Rechazada por operación" })
      .eq("id", s.id);
    setBusyId(null);
    if (e) { setError(e.message); return; }
    await load();
  }

  // Bandeja vacía: no ocupar espacio en la pantalla de servicios.
  if (!loading && rows.length === 0 && !error) return null;

  return (
    <section
      aria-labelledby="solicitudes-entrantes-title"
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary/15 flex items-center justify-center">
            <Inbox className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h2 id="solicitudes-entrantes-title" className="text-sm font-semibold text-foreground">
              Solicitudes de pasajeros en vivo
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Llegan en tiempo real desde la app del pasajero. Acéptalas para crear un servicio.
            </p>
          </div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
          {loading ? "…" : `${rows.length} pendientes`}
        </span>
      </header>

      {error && (
        <div role="alert" className="mx-4 mt-3 rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" /> {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="px-4 py-10 text-center text-muted-foreground text-sm">
          No hay solicitudes pendientes. Cuando un pasajero pida un servicio aparecerá aquí al instante.
        </div>
      ) : (
        <ul className="divide-y divide-border" role="list">
          {rows.map((s) => (
            <li key={s.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3 hover:bg-secondary/20">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground truncate">{s.pasajero_nombre}</span>
                  <span className="text-[11px] capitalize px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {s.cliente}
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${badgeEstado(s.estado)}`}>
                    {s.estado}
                  </span>
                  {s.programado && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/30">
                      Programado
                    </span>
                  )}
                </div>
                <div className="text-sm text-foreground flex items-center gap-1 flex-wrap">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate">{s.origen}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="truncate">{s.destino}</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {formatHora(s.hora_recogida)}
                  </span>
                  {s.pasajero_telefono && (
                    <a href={`tel:${s.pasajero_telefono}`} className="flex items-center gap-1 hover:text-primary">
                      <Phone className="h-3 w-3" aria-hidden="true" /> {s.pasajero_telefono}
                    </a>
                  )}
                  {s.notas && <span className="italic truncate">"{s.notas}"</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => aceptarYCrearServicio(s)}
                  disabled={busyId === s.id || s.estado !== "solicitada"}
                  className="inline-flex items-center gap-1 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-50"
                >
                  {busyId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {s.estado === "solicitada" ? "Aceptar y crear servicio" : "Ya aceptada"}
                </button>
                <button
                  type="button"
                  onClick={() => rechazar(s)}
                  disabled={busyId === s.id}
                  className="inline-flex items-center gap-1 h-9 px-3 rounded-md border border-border text-sm text-muted-foreground hover:text-destructive hover:border-destructive/40 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Rechazar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
