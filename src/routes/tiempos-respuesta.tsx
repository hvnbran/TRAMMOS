import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { AdminOnly } from "../components/layout/AdminOnly";
import { supabase } from "@/integrations/supabase/client";
import { Timer, Clock, AlertTriangle, Users, BarChart3, Loader2 } from "lucide-react";
import { avg, median, computeSlaBuckets, diffMin, formatMin } from "@/lib/metricas/tiempos";

export const Route = createFileRoute("/tiempos-respuesta")({
  component: () => (
    <AdminOnly>
      <TiemposRespuesta />
    </AdminOnly>
  ),
  head: () => ({
    meta: [
      { title: "Tiempos de respuesta - TRAMMOS" },
      { name: "description", content: "Monitoreo de tiempos de creación y asignación de servicios" },
    ],
  }),
});

interface SolicitudRow {
  id: string;
  origen: string;
  destino: string;
  estado: string;
  created_at: string;
  aceptada_at: string | null;
  asignado_at: string | null;
  asignado_by: string | null;
  iniciado_at: string | null;
  finalizado_at: string | null;
  conductor_nombre: string | null;
  vehiculo_placa: string | null;
}

interface ServicioRow {
  id: string;
  fecha: string;
  pasajero: string | null;
  conductor: string | null;
  vehiculo: string | null;
  estado: string;
  created_at: string;
  created_by: string | null;
  asignado_at: string | null;
  asignado_by: string | null;
  iniciado_at: string | null;
  finalizado_at: string | null;
}

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  email: string | null;
}

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function TiemposRespuesta() {
  const [loading, setLoading] = useState(true);
  const [solicitudes, setSolicitudes] = useState<SolicitudRow[]>([]);
  const [servicios, setServicios] = useState<ServicioRow[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileRow>>(new Map());
  const [rangeDays, setRangeDays] = useState<number>(30);

  async function load() {
    setLoading(true);
    const since = isoDaysAgo(rangeDays);

    const [solRes, srvRes] = await Promise.all([
      supabase
        .from("solicitudes_pasajero")
        .select("id, origen, destino, estado, created_at, aceptada_at, asignado_at, asignado_by, conductor_nombre, vehiculo_placa")
        .gte("created_at", since)
        .order("created_at", { ascending: false }),
      supabase
        .from("servicios")
        .select("id, fecha, pasajero, conductor, vehiculo, estado, created_at, created_by, asignado_at, asignado_by")
        .gte("created_at", since)
        .order("created_at", { ascending: false }),
    ]);

    const sol = (solRes.data as unknown as SolicitudRow[]) ?? [];
    const srv = (srvRes.data as unknown as ServicioRow[]) ?? [];
    setSolicitudes(sol);
    setServicios(srv);

    const userIds = new Set<string>();
    sol.forEach((s) => s.asignado_by && userIds.add(s.asignado_by));
    srv.forEach((s) => {
      if (s.created_by) userIds.add(s.created_by);
      if (s.asignado_by) userIds.add(s.asignado_by);
    });

    if (userIds.size > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name, email")
        .in("user_id", Array.from(userIds));
      const map = new Map<string, ProfileRow>();
      (profs ?? []).forEach((p) => map.set(p.user_id, p as ProfileRow));
      setProfiles(map);
    } else {
      setProfiles(new Map());
    }

    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeDays]);

  // ===== Métricas de solicitudes (app pasajero → asignación) =====
  const tiemposAceptacion = useMemo(
    () =>
      solicitudes
        .map((s) => diffMin(s.created_at, s.aceptada_at))
        .filter((n): n is number => n !== null && n >= 0),
    [solicitudes],
  );
  const tiemposAsignacion = useMemo(
    () =>
      solicitudes
        .map((s) => diffMin(s.created_at, s.asignado_at))
        .filter((n): n is number => n !== null && n >= 0),
    [solicitudes],
  );
  const sla = useMemo(() => computeSlaBuckets(tiemposAsignacion), [tiemposAsignacion]);

  const pendientes = useMemo(
    () =>
      solicitudes
        .filter((s) => !s.asignado_at && s.estado !== "cancelada")
        .map((s) => ({
          ...s,
          esperaMin: diffMin(s.created_at, new Date().toISOString()) ?? 0,
        }))
        .sort((a, b) => b.esperaMin - a.esperaMin),
    [solicitudes],
  );

  const lentas = useMemo(
    () =>
      solicitudes
        .map((s) => ({
          ...s,
          minAsig: diffMin(s.created_at, s.asignado_at),
        }))
        .filter((s) => s.minAsig !== null && s.minAsig > 30)
        .sort((a, b) => (b.minAsig ?? 0) - (a.minAsig ?? 0))
        .slice(0, 20),
    [solicitudes],
  );

  // ===== Métricas por administrador =====
  interface AdminStats {
    userId: string;
    nombre: string;
    serviciosCreados: number;
    solicitudesAsignadas: number;
    tiemposAsignacion: number[];
  }

  const porAdmin = useMemo(() => {
    const map = new Map<string, AdminStats>();
    const get = (uid: string): AdminStats => {
      let s = map.get(uid);
      if (!s) {
        const p = profiles.get(uid);
        s = {
          userId: uid,
          nombre: p?.display_name || p?.email || uid.slice(0, 8),
          serviciosCreados: 0,
          solicitudesAsignadas: 0,
          tiemposAsignacion: [],
        };
        map.set(uid, s);
      }
      return s;
    };

    servicios.forEach((s) => {
      if (s.created_by) get(s.created_by).serviciosCreados += 1;
    });

    solicitudes.forEach((s) => {
      if (s.asignado_by && s.asignado_at) {
        const stats = get(s.asignado_by);
        stats.solicitudesAsignadas += 1;
        const t = diffMin(s.created_at, s.asignado_at);
        if (t !== null && t >= 0) stats.tiemposAsignacion.push(t);
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => b.solicitudesAsignadas + b.serviciosCreados - (a.solicitudesAsignadas + a.serviciosCreados),
    );
  }, [servicios, solicitudes, profiles]);

  // ===== Tendencia diaria =====
  const tendencia = useMemo(() => {
    const buckets = new Map<string, number[]>();
    solicitudes.forEach((s) => {
      const t = diffMin(s.created_at, s.asignado_at);
      if (t === null || t < 0) return;
      const day = s.created_at.slice(0, 10);
      const arr = buckets.get(day) ?? [];
      arr.push(t);
      buckets.set(day, arr);
    });
    return Array.from(buckets.entries())
      .map(([day, arr]) => ({ day, prom: avg(arr), n: arr.length }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [solicitudes]);

  const maxProm = Math.max(1, ...tendencia.map((t) => t.prom));

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Timer className="h-5 w-5" /> Tiempos de respuesta
            </h1>
            <p className="text-sm text-muted-foreground">
              Cuánto se tarda en aceptar y asignar conductor + vehículo a cada solicitud o servicio.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Rango:</span>
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setRangeDays(d)}
                className={`px-2.5 py-1 rounded-full border ${
                  rangeDays === d
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-secondary/40"
                }`}
              >
                {d} días
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard
                icon={<Clock className="h-4 w-4" />}
                label="Tiempo prom. asignación"
                value={formatMin(avg(tiemposAsignacion))}
                hint={`${tiemposAsignacion.length} solicitudes`}
              />
              <KpiCard
                icon={<Clock className="h-4 w-4" />}
                label="Tiempo mediano asignación"
                value={formatMin(median(tiemposAsignacion))}
                hint="Mitad de los casos"
              />
              <KpiCard
                icon={<Clock className="h-4 w-4" />}
                label="Tiempo prom. aceptación"
                value={formatMin(avg(tiemposAceptacion))}
                hint={`${tiemposAceptacion.length} solicitudes`}
              />
              <KpiCard
                icon={<AlertTriangle className="h-4 w-4" />}
                label="Pendientes ahora"
                value={String(pendientes.length)}
                hint={
                  pendientes.length > 0
                    ? `Más antigua: ${formatMin(pendientes[0].esperaMin)}`
                    : "Sin pendientes"
                }
                tone={pendientes.length > 0 ? "warning" : "success"}
              />
            </div>

            {/* SLA Buckets */}
            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Cumplimiento SLA de asignación
              </h2>
              {sla.total === 0 ? (
                <p className="text-sm text-muted-foreground">No hay datos en este rango.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <SlaBar label="≤ 5 min" count={sla.bajo5} total={sla.total} color="success" />
                  <SlaBar label="5–15 min" count={sla.bajo15} total={sla.total} color="primary" />
                  <SlaBar label="15–30 min" count={sla.bajo30} total={sla.total} color="warning" />
                  <SlaBar label="> 30 min" count={sla.sobre30} total={sla.total} color="destructive" />
                </div>
              )}
            </section>

            {/* Tendencia diaria */}
            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Tendencia diaria (tiempo prom. de asignación)
              </h2>
              {tendencia.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin datos suficientes.</p>
              ) : (
                <div className="flex items-end gap-1 h-32">
                  {tendencia.map((t) => (
                    <div
                      key={t.day}
                      className="flex-1 flex flex-col items-center gap-1 group"
                      title={`${t.day} · ${formatMin(t.prom)} (${t.n} solicitudes)`}
                    >
                      <div
                        className="w-full bg-primary/30 group-hover:bg-primary rounded-t transition-colors"
                        style={{ height: `${(t.prom / maxProm) * 100}%`, minHeight: 2 }}
                      />
                      <span className="text-[9px] text-muted-foreground rotate-45 origin-top-left whitespace-nowrap">
                        {t.day.slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Por administrador */}
            <section className="rounded-xl border border-border bg-card overflow-hidden">
              <header className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Desempeño por administrador</h2>
              </header>
              {porAdmin.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Sin actividad en este rango.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/30 text-xs text-muted-foreground">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium">Administrador</th>
                        <th className="text-right px-3 py-2 font-medium">Servicios creados</th>
                        <th className="text-right px-3 py-2 font-medium">Solicitudes asignadas</th>
                        <th className="text-right px-3 py-2 font-medium">Tiempo prom.</th>
                        <th className="text-right px-3 py-2 font-medium">Tiempo mediano</th>
                      </tr>
                    </thead>
                    <tbody>
                      {porAdmin.map((a) => (
                        <tr key={a.userId} className="border-t border-border hover:bg-secondary/20">
                          <td className="px-3 py-2 font-medium">{a.nombre}</td>
                          <td className="px-3 py-2 text-right">{a.serviciosCreados}</td>
                          <td className="px-3 py-2 text-right">{a.solicitudesAsignadas}</td>
                          <td className="px-3 py-2 text-right">{formatMin(avg(a.tiemposAsignacion))}</td>
                          <td className="px-3 py-2 text-right">{formatMin(median(a.tiemposAsignacion))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Pendientes ahora */}
            {pendientes.length > 0 && (
              <section className="rounded-xl border border-warning/40 bg-warning/5 overflow-hidden">
                <header className="px-4 py-3 border-b border-warning/30 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <h2 className="text-sm font-semibold">Solicitudes pendientes ahora ({pendientes.length})</h2>
                </header>
                <ul className="divide-y divide-border">
                  {pendientes.slice(0, 10).map((p) => (
                    <li key={p.id} className="px-4 py-2 flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.origen} → {p.destino}</p>
                        <p className="text-xs text-muted-foreground">Estado: {p.estado}</p>
                      </div>
                      <span className="text-xs font-semibold text-warning">
                        Esperando {formatMin(p.esperaMin)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Lentas (>30 min) */}
            {lentas.length > 0 && (
              <section className="rounded-xl border border-border bg-card overflow-hidden">
                <header className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <Clock className="h-4 w-4 text-destructive" />
                  <h2 className="text-sm font-semibold">Asignaciones lentas (más de 30 min)</h2>
                </header>
                <ul className="divide-y divide-border">
                  {lentas.map((s) => (
                    <li key={s.id} className="px-4 py-2 flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{s.origen} → {s.destino}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(s.created_at).toLocaleString("es-CO")}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-destructive">
                        {formatMin(s.minAsig)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "border-warning/40"
      : tone === "success"
      ? "border-success/40"
      : "border-border";
  return (
    <div className={`rounded-xl border bg-card p-4 ${toneClass}`}>
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon} {label}
      </div>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function SlaBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: "success" | "primary" | "warning" | "destructive";
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  const bgMap = {
    success: "bg-success",
    primary: "bg-primary",
    warning: "bg-warning",
    destructive: "bg-destructive",
  } as const;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {count} ({pct.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full ${bgMap[color]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
