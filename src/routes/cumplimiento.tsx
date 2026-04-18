import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { AdminOnly } from "../components/layout/AdminOnly";
import { CheckCircle, XCircle, AlertTriangle, Shield, MinusCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/cumplimiento")({
  component: () => (
    <AdminOnly>
      <Cumplimiento />
    </AdminOnly>
  ),
  head: () => ({
    meta: [
      { title: "Cumplimiento ANS - TRAMMOS" },
      { name: "description", content: "Control de acuerdos de nivel de servicio" },
    ],
  }),
});

interface ReglaItem {
  regla: string;
  cumplimiento: number | null; // null = no medido
  total: number;
  cumplidos: number;
}
interface Categoria {
  categoria: string;
  items: ReglaItem[];
}

function getCumplimientoColor(val: number) {
  if (val >= 98) return "text-success";
  if (val >= 95) return "text-primary";
  if (val >= 90) return "text-accent";
  return "text-destructive";
}

function getCumplimientoIcon(val: number | null) {
  if (val === null) return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
  if (val >= 98) return <CheckCircle className="h-4 w-4 text-success" />;
  if (val >= 90) return <AlertTriangle className="h-4 w-4 text-accent" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
}

function diasHasta(fechaISO: string | null): number | null {
  if (!fechaISO) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fechaISO);
  f.setHours(0, 0, 0, 0);
  return Math.ceil((f.getTime() - hoy.getTime()) / 86_400_000);
}

function pct(num: number, den: number): number | null {
  if (den === 0) return null;
  return Math.round((num / den) * 1000) / 10;
}

function Cumplimiento() {
  const { cliente } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reglas, setReglas] = useState<Categoria[]>([]);
  const [global, setGlobal] = useState<number | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente]);

  async function load() {
    setLoading(true);
    try {
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartISO = monthStart.toISOString().slice(0, 10);

      const filterCliente = <T extends { eq: (col: string, v: string) => T }>(q: T) =>
        cliente ? q.eq("cliente", cliente) : q;

      const [serviciosMes, vehiculosAll, conductoresAll, incidentesMes, calificacionesMes] = await Promise.all([
        filterCliente(
          supabase.from("servicios").select("id,estado,fecha,hora").gte("fecha", monthStartISO),
        ),
        filterCliente(supabase.from("vehiculos").select("id,estado,vence_soat,vence_rtm")),
        filterCliente(supabase.from("conductores").select("id,estado,vence_licencia")),
        filterCliente(
          supabase.from("incidentes").select("id,tipo_incidente").gte("fecha", monthStartISO),
        ),
        filterCliente(
          supabase.from("calificaciones").select("estrellas").gte("fecha", monthStartISO),
        ),
      ]);

      const srv = serviciosMes.data ?? [];
      const veh = vehiculosAll.data ?? [];
      const con = conductoresAll.data ?? [];
      const inc = incidentesMes.data ?? [];
      const cal = calificacionesMes.data ?? [];

      const totalSrv = srv.length;
      const finalizados = srv.filter((s: { estado: string }) => /final|complet/i.test(s.estado)).length;
      const conHora = srv.filter((s: { hora: string | null }) => !!s.hora).length;
      const sinIncidente = totalSrv - inc.length;
      const calBuenas = cal.filter((c: { estrellas: number }) => c.estrellas >= 4).length;

      const vehDocsOk = veh.filter((v: { vence_soat: string | null; vence_rtm: string | null }) => {
        const dSoat = diasHasta(v.vence_soat);
        const dRtm = diasHasta(v.vence_rtm);
        return (dSoat === null || dSoat >= 0) && (dRtm === null || dRtm >= 0);
      }).length;
      const vehAutorizados = veh.filter((v: { estado: string }) => !/inact|baja/i.test(v.estado)).length;

      const conLicOk = con.filter((c: { vence_licencia: string | null }) => {
        const d = diasHasta(c.vence_licencia);
        return d === null || d >= 0;
      }).length;
      const conActivos = con.filter((c: { estado: string }) => /activ/i.test(c.estado)).length;

      const cats: Categoria[] = [
        {
          categoria: "Operativas",
          items: [
            {
              regla: "Servicios finalizados a tiempo",
              cumplimiento: pct(finalizados, totalSrv),
              total: totalSrv,
              cumplidos: finalizados,
            },
            {
              regla: "Servicios con hora programada",
              cumplimiento: pct(conHora, totalSrv),
              total: totalSrv,
              cumplidos: conHora,
            },
            {
              regla: "Servicios sin incidentes",
              cumplimiento: pct(Math.max(0, sinIncidente), totalSrv),
              total: totalSrv,
              cumplidos: Math.max(0, sinIncidente),
            },
          ],
        },
        {
          categoria: "Vehículo",
          items: [
            {
              regla: "Documentación vigente (SOAT y RTM)",
              cumplimiento: pct(vehDocsOk, veh.length),
              total: veh.length,
              cumplidos: vehDocsOk,
            },
            {
              regla: "Vehículos autorizados",
              cumplimiento: pct(vehAutorizados, veh.length),
              total: veh.length,
              cumplidos: vehAutorizados,
            },
          ],
        },
        {
          categoria: "Conductor",
          items: [
            {
              regla: "Licencia vigente",
              cumplimiento: pct(conLicOk, con.length),
              total: con.length,
              cumplidos: conLicOk,
            },
            {
              regla: "Conductores activos",
              cumplimiento: pct(conActivos, con.length),
              total: con.length,
              cumplidos: conActivos,
            },
          ],
        },
        {
          categoria: "Atención y Calidad",
          items: [
            {
              regla: "Calificaciones ≥ 4 estrellas",
              cumplimiento: pct(calBuenas, cal.length),
              total: cal.length,
              cumplidos: calBuenas,
            },
          ],
        },
      ];

      setReglas(cats);

      // Global = promedio de cumplimientos no nulos, ponderado por su 'total'
      const flat = cats.flatMap((c) => c.items).filter((i) => i.cumplimiento !== null && i.total > 0);
      if (flat.length === 0) {
        setGlobal(null);
      } else {
        const totalW = flat.reduce((a, i) => a + i.total, 0);
        const sum = flat.reduce((a, i) => a + (i.cumplimiento as number) * i.total, 0);
        setGlobal(Math.round((sum / totalW) * 10) / 10);
      }
    } finally {
      setLoading(false);
    }
  }

  const periodoLabel = new Date().toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  const periodoCap = periodoLabel.charAt(0).toUpperCase() + periodoLabel.slice(1);

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Cumplimiento ANS</h1>
          <p className="text-sm text-muted-foreground">
            Control de Acuerdos de Nivel de Servicio
            {cliente ? ` con ${cliente === "corona" ? "Corona" : "Sodimac"}` : ""}
          </p>
        </div>

        {/* Global score */}
        <div className="rounded-lg border border-border bg-card p-6 flex items-center gap-6">
          <div
            className={`h-20 w-20 rounded-full border-4 flex items-center justify-center ${
              global === null ? "border-muted-foreground/30" : "border-primary"
            }`}
          >
            <span className="text-2xl font-bold">{loading ? "—" : global === null ? "—" : `${global}%`}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Cumplimiento Global</h3>
            <p className="text-sm text-muted-foreground">Período: {periodoCap}</p>
            {global !== null && (
              <div
                className={`flex items-center gap-1 mt-1 text-sm ${
                  global >= 95 ? "text-success" : global >= 90 ? "text-accent" : "text-destructive"
                }`}
              >
                <Shield className="h-4 w-4" />
                {global >= 95 ? "Dentro del rango aceptable" : global >= 90 ? "Atención requerida" : "Fuera de rango"}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-border bg-card p-10 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {reglas.map((cat) => (
              <div key={cat.categoria} className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 bg-secondary/50 border-b border-border">
                  <h3 className="text-sm font-semibold">{cat.categoria}</h3>
                </div>
                <div className="divide-y divide-border">
                  {cat.items.map((item) => (
                    <div key={item.regla} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getCumplimientoIcon(item.cumplimiento)}
                        <div className="min-w-0">
                          <span className="text-sm">{item.regla}</span>
                          <p className="text-xs text-muted-foreground">
                            {item.total === 0 ? "Sin datos en el período" : `${item.cumplidos}/${item.total} cumplidos`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {item.cumplimiento !== null ? (
                          <>
                            <div className="w-20 sm:w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${item.cumplimiento}%` }}
                              />
                            </div>
                            <span className={`text-sm font-bold w-14 text-right ${getCumplimientoColor(item.cumplimiento)}`}>
                              {item.cumplimiento}%
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground italic w-32 text-right">No medido</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
