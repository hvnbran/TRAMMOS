import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Loader2, Star, UserCheck, AlertTriangle, Filter, CheckCircle2 } from "lucide-react";

interface Conductor {
  id: string;
  nombre: string;
  cedula: string | null;
  estado: string;
  vence_licencia: string | null;
}

type FiltroEstado = "todos" | "aptos" | "Activo" | "Suspendido" | "Vencido";

function isVencido(fechaISO: string | null): boolean {
  if (!fechaISO) return false;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const f = new Date(fechaISO); f.setHours(0, 0, 0, 0);
  return f.getTime() < hoy.getTime();
}

function estadoEfectivoCond(c: Conductor): "Activo" | "Suspendido" | "Vencido" {
  if (isVencido(c.vence_licencia)) return "Vencido";
  if (c.estado === "Suspendido") return "Suspendido";
  return "Activo";
}

interface Asignacion {
  id: string;
  vehiculo_id: string;
  conductor_id: string;
  es_principal: boolean;
  asignado_desde: string;
  asignado_hasta: string | null;
  notas: string | null;
}

interface Props {
  vehiculoId: string;
  cliente: "corona" | "sodimac";
}

export function VehiculoConductores({ vehiculoId, cliente }: Props) {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedConductor, setSelectedConductor] = useState<string>("");
  const [esPrincipal, setEsPrincipal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filtro, setFiltro] = useState<FiltroEstado>("aptos");

  async function load() {
    setLoading(true);
    const [a, c] = await Promise.all([
      (supabase.from("vehiculo_conductores") as any)
        .select("*")
        .eq("vehiculo_id", vehiculoId)
        .order("es_principal", { ascending: false }),
      supabase
        .from("conductores")
        .select("id, nombre, cedula, estado, vence_licencia")
        .order("nombre"),
    ]);
    setAsignaciones((a.data ?? []) as Asignacion[]);
    setConductores((c.data ?? []) as Conductor[]);
    setLoading(false);
  }

  useEffect(() => {
    if (vehiculoId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehiculoId]);

  async function agregar() {
    if (!selectedConductor) return;
    setSaving(true);
    // Si va a ser principal, quito principal de los demás
    if (esPrincipal) {
      await (supabase.from("vehiculo_conductores") as any)
        .update({ es_principal: false })
        .eq("vehiculo_id", vehiculoId);
    }
    const { error } = await (supabase.from("vehiculo_conductores") as any).insert({
      cliente,
      vehiculo_id: vehiculoId,
      conductor_id: selectedConductor,
      es_principal: esPrincipal,
    });
    setSaving(false);
    if (error) {
      alert(error.message);
      return;
    }
    setAdding(false);
    setSelectedConductor("");
    setEsPrincipal(false);
    load();
  }

  async function quitar(id: string) {
    if (!confirm("¿Quitar este conductor del vehículo?")) return;
    await (supabase.from("vehiculo_conductores") as any).delete().eq("id", id);
    load();
  }

  async function marcarPrincipal(id: string) {
    await (supabase.from("vehiculo_conductores") as any)
      .update({ es_principal: false })
      .eq("vehiculo_id", vehiculoId);
    await (supabase.from("vehiculo_conductores") as any)
      .update({ es_principal: true })
      .eq("id", id);
    load();
  }

  const conductoresDisponibles = conductores.filter(
    (c) => !asignaciones.some((a) => a.conductor_id === c.id),
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
          <UserCheck className="h-3.5 w-3.5" /> Conductores asignados
        </p>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-[11px] flex items-center gap-1 text-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> Asignar conductor
          </button>
        )}
      </div>

      {adding && (
        <div className="rounded-md border border-primary/30 p-2 space-y-2 bg-primary/5">
          <select
            value={selectedConductor}
            onChange={(e) => setSelectedConductor(e.target.value)}
            className="w-full text-xs rounded border border-input bg-background px-2 py-1.5"
          >
            <option value="">Selecciona conductor...</option>
            {conductoresDisponibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.cedula ? `(${c.cedula})` : ""}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-[11px]">
            <input
              type="checkbox"
              checked={esPrincipal}
              onChange={(e) => setEsPrincipal(e.target.checked)}
            />
            Marcar como conductor principal
          </label>
          <div className="flex gap-1.5 justify-end">
            <button
              onClick={() => { setAdding(false); setSelectedConductor(""); }}
              className="text-[11px] px-2 py-1 rounded text-muted-foreground"
            >
              Cancelar
            </button>
            <button
              onClick={agregar}
              disabled={!selectedConductor || saving}
              className="text-[11px] px-2 py-1 rounded bg-primary text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Asignar"}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        </div>
      ) : asignaciones.length === 0 ? (
        <div className="flex items-center gap-2 text-[11px] px-3 py-2.5 rounded-md border border-dashed border-warning/40 bg-warning/5">
          <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-warning">Asignación pendiente</p>
            <p className="text-muted-foreground">
              Este vehículo aún no tiene conductores asignados. Usa "Asignar conductor" para vincular uno o varios.
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-1">
          {asignaciones.map((a) => {
            const c = conductores.find((x) => x.id === a.conductor_id);
            return (
              <li
                key={a.id}
                className="flex items-center gap-2 text-xs px-2 py-1.5 rounded bg-secondary/40"
              >
                <button
                  onClick={() => !a.es_principal && marcarPrincipal(a.id)}
                  title={a.es_principal ? "Conductor principal" : "Marcar como principal"}
                  className={a.es_principal ? "text-warning" : "text-muted-foreground hover:text-warning"}
                >
                  <Star className={`h-3.5 w-3.5 ${a.es_principal ? "fill-warning" : ""}`} />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c?.nombre ?? "Conductor eliminado"}</p>
                  {c?.cedula && <p className="text-[10px] text-muted-foreground">{c.cedula}</p>}
                </div>
                {a.es_principal && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/15 text-warning font-medium">
                    Principal
                  </span>
                )}
                <button
                  onClick={() => quitar(a.id)}
                  className="text-muted-foreground hover:text-destructive"
                  title="Quitar"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
