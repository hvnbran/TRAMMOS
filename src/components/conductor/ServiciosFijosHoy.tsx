import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Play, CheckCircle2, MapPin, Clock, Repeat } from "lucide-react";

interface Fijo {
  fijo_id: string;
  pasajero: string | null;
  origen: string | null;
  destino: string | null;
  vehiculo: string | null;
  centro_costo: string | null;
  hora_inicio_prog: string | null;
  hora_fin_prog: string | null;
  ejecucion_id: string | null;
  estado: string;
  iniciado_at: string | null;
  finalizado_at: string | null;
}

export function ServiciosFijosHoy() {
  const [rows, setRows] = useState<Fijo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.rpc("listar_fijos_hoy_conductor");
    setRows((data as Fijo[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function iniciar(id: string) {
    setBusy(id);
    const { data } = await supabase.rpc("conductor_iniciar_fijo", { _fijo_id: id });
    setBusy(null);
    const r = data as { ok?: boolean; error?: string } | null;
    if (!r?.ok) {
      alert("No se pudo iniciar: " + (r?.error ?? "error"));
      return;
    }
    load();
  }

  async function finalizar(id: string) {
    if (!confirm("¿Finalizar el servicio fijo de hoy?")) return;
    const notas = prompt("Notas del turno (opcional):") ?? null;
    setBusy(id);
    const { data } = await supabase.rpc("conductor_finalizar_fijo", {
      _fijo_id: id,
      _notas: notas ?? undefined,
    });
    setBusy(null);
    const r = data as { ok?: boolean; error?: string } | null;
    if (!r?.ok) {
      alert("No se pudo finalizar: " + (r?.error ?? "error"));
      return;
    }
    load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (rows.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-wide text-foreground mb-2 flex items-center gap-1.5">
        <Repeat className="h-3.5 w-3.5" /> Servicio fijo de hoy ({rows.length})
      </h2>
      <ul className="space-y-2">
        {rows.map((f) => {
          const fin = f.estado === "finalizado";
          const running = f.estado === "en_curso";
          return (
            <li
              key={f.fijo_id}
              className={`bg-card border rounded-lg p-3 ${
                fin
                  ? "border-success/40"
                  : running
                  ? "border-warning/40"
                  : "border-border"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                    fin
                      ? "bg-success/15 text-success border-success/30"
                      : running
                      ? "bg-warning/15 text-warning border-warning/30"
                      : "bg-blue-500/15 text-blue-700 border-blue-500/30"
                  }`}
                >
                  {fin ? "Finalizado" : running ? "En curso" : "Pendiente"}
                </span>
                {(f.hora_inicio_prog || f.hora_fin_prog) && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {f.hora_inicio_prog?.slice(0, 5) ?? "--"} → {f.hora_fin_prog?.slice(0, 5) ?? "--"}
                  </span>
                )}
              </div>

              <div className="text-sm font-semibold truncate">
                {f.pasajero || "Servicio fijo"}
              </div>
              {(f.origen || f.destino) && (
                <p className="mt-1 text-xs text-muted-foreground flex items-start gap-1 truncate">
                  <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                  <span className="truncate">
                    {f.origen && <span className="text-success">{f.origen}</span>}
                    {f.destino && (
                      <>
                        {" "}→ <span className="text-primary">{f.destino}</span>
                      </>
                    )}
                  </span>
                </p>
              )}

              {(f.iniciado_at || f.finalizado_at) && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {f.iniciado_at && <>Inicio real: {new Date(f.iniciado_at).toLocaleTimeString()}</>}
                  {f.finalizado_at && <> · Fin: {new Date(f.finalizado_at).toLocaleTimeString()}</>}
                </p>
              )}

              <div className="mt-2 flex gap-2">
                {!running && !fin && (
                  <button
                    onClick={() => iniciar(f.fijo_id)}
                    disabled={busy === f.fijo_id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-success text-success-foreground py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    {busy === f.fijo_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    Iniciar
                  </button>
                )}
                {running && (
                  <button
                    onClick={() => finalizar(f.fijo_id)}
                    disabled={busy === f.fijo_id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-warning text-warning-foreground py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    {busy === f.fijo_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Finalizar
                  </button>
                )}
                {fin && (
                  <div className="flex-1 text-center text-xs text-success font-semibold py-2 inline-flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Turno completado
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
