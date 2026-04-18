import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  Users,
  Car,
  Route as RouteIcon,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Inbox,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { StatsGridSkeleton, ChartSkeleton, CardGridSkeleton, HeaderSkeleton } from "@/components/ui/loading-skeletons";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard - TRAMMOS" },
      { name: "description", content: "Resumen general de operaciones TRAMMOS" },
    ],
  }),
});

interface ServicioRow {
  id: string;
  numero_orden: string | null;
  origen: string | null;
  destino: string | null;
  estado: string;
  conductor: string | null;
  hora: string | null;
  fecha: string;
  created_at: string;
}

interface AlertaRecienteItem {
  tipo: "warning" | "error" | "info";
  mensaje: string;
  tiempo: string;
}

function getEstadoStyle(estado: string) {
  const e = estado.toLowerCase();
  if (e.includes("curso") || e.includes("ruta")) return "bg-primary/15 text-primary";
  if (e.includes("program")) return "bg-warning/15 text-warning";
  if (e.includes("final") || e.includes("complet")) return "bg-success/15 text-success";
  return "bg-muted text-muted-foreground";
}

function getAlertIcon(tipo: string) {
  if (tipo === "warning") return <AlertTriangle className="h-4 w-4 text-accent" />;
  if (tipo === "error") return <AlertTriangle className="h-4 w-4 text-destructive" />;
  return <CheckCircle className="h-4 w-4 text-success" />;
}

function diasHasta(fechaISO: string | null): number | null {
  if (!fechaISO) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fechaISO);
  f.setHours(0, 0, 0, 0);
  return Math.ceil((f.getTime() - hoy.getTime()) / 86_400_000);
}

function tiempoRelativo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Hace un momento";
  if (m < 60) return `Hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  const d2 = Math.floor(h / 24);
  return `Hace ${d2}d`;
}

function Dashboard() {
  const { cliente, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conductoresActivos, setConductoresActivos] = useState(0);
  const [vehiculosDisp, setVehiculosDisp] = useState(0);
  const [serviciosHoy, setServiciosHoy] = useState(0);
  const [cumplimiento, setCumplimiento] = useState<number | null>(null);
  const [serviciosPorMes, setServiciosPorMes] = useState<{ mes: string; servicios: number }[]>([]);
  const [estadoVehiculos, setEstadoVehiculos] = useState<{ name: string; value: number; color: string }[]>([]);
  const [serviciosRecientes, setServiciosRecientes] = useState<ServicioRow[]>([]);
  const [alertasRecientes, setAlertasRecientes] = useState<AlertaRecienteItem[]>([]);

  useEffect(() => {
    if (authLoading) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, cliente]);

  async function load() {
    setLoading(true);
    try {
      const filterCliente = <T extends { eq: (col: string, v: string) => T }>(q: T) =>
        cliente ? q.eq("cliente", cliente) : q;

      const today = new Date().toISOString().slice(0, 10);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      const sixMonthsISO = sixMonthsAgo.toISOString().slice(0, 10);

      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartISO = monthStart.toISOString().slice(0, 10);

      const [
        { count: cAct },
        { count: vDisp },
        { count: sHoy },
        { data: serviciosTrend },
        { data: vehiculosAll },
        { data: serviciosRec },
        { data: serviciosMes },
        { data: incidentesMes },
        { data: conductoresLic },
        { data: vehiculosVenc },
      ] = await Promise.all([
        filterCliente(
          supabase.from("conductores").select("*", { count: "exact", head: true }).eq("estado", "Activo"),
        ),
        filterCliente(
          supabase.from("vehiculos").select("*", { count: "exact", head: true }).eq("estado", "Disponible"),
        ),
        filterCliente(
          supabase.from("servicios").select("*", { count: "exact", head: true }).eq("fecha", today),
        ),
        filterCliente(
          supabase.from("servicios").select("fecha").gte("fecha", sixMonthsISO),
        ),
        filterCliente(supabase.from("vehiculos").select("estado")),
        filterCliente(
          supabase
            .from("servicios")
            .select("id,numero_orden,origen,destino,estado,conductor,hora,fecha,created_at")
            .order("created_at", { ascending: false })
            .limit(5),
        ),
        filterCliente(
          supabase.from("servicios").select("estado").gte("fecha", monthStartISO),
        ),
        filterCliente(
          supabase.from("incidentes").select("id").gte("fecha", monthStartISO),
        ),
        filterCliente(
          supabase.from("conductores").select("nombre,vence_licencia").not("vence_licencia", "is", null),
        ),
        filterCliente(
          supabase
            .from("vehiculos")
            .select("placa,vence_soat,vence_rtm"),
        ),
      ]);

      setConductoresActivos(cAct ?? 0);
      setVehiculosDisp(vDisp ?? 0);
      setServiciosHoy(sHoy ?? 0);

      // Servicios por mes
      const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const trendMap = new Map<string, number>();
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        trendMap.set(key, 0);
      }
      serviciosTrend?.forEach((s: { fecha: string }) => {
        const d = new Date(s.fecha);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
      });
      const trendArr = Array.from(trendMap.entries()).map(([k, v]) => {
        const [, m] = k.split("-").map(Number);
        return { mes: meses[m], servicios: v };
      });
      setServiciosPorMes(trendArr);

      // Estado vehículos
      const estados = new Map<string, number>();
      vehiculosAll?.forEach((v: { estado: string }) => {
        estados.set(v.estado, (estados.get(v.estado) ?? 0) + 1);
      });
      const colorMap: Record<string, string> = {
        Disponible: "oklch(0.8 0.18 115)",
        "En servicio": "oklch(0.72 0.14 200)",
        "En ruta": "oklch(0.72 0.14 200)",
        Mantenimiento: "oklch(0.45 0 0)",
        Inactivo: "oklch(0.6 0.05 30)",
      };
      setEstadoVehiculos(
        Array.from(estados.entries()).map(([name, value]) => ({
          name,
          value,
          color: colorMap[name] ?? "oklch(0.6 0.05 220)",
        })),
      );

      // Servicios recientes
      setServiciosRecientes((serviciosRec as ServicioRow[]) ?? []);

      // Cumplimiento global = (servicios finalizados / total mes) - incidentes abiertos como demérito
      const totalMes = serviciosMes?.length ?? 0;
      const finMes = serviciosMes?.filter((s) => /final|complet/i.test(s.estado)).length ?? 0;
      if (totalMes > 0) {
        const base = (finMes / totalMes) * 100;
        const penalIncid = Math.min(10, (incidentesMes?.length ?? 0));
        setCumplimiento(Math.max(0, Math.round((base - penalIncid) * 10) / 10));
      } else {
        setCumplimiento(null);
      }

      // Alertas recientes (vencimientos próximos)
      const alerts: AlertaRecienteItem[] = [];
      conductoresLic?.forEach((c: { nombre: string; vence_licencia: string | null }) => {
        const dias = diasHasta(c.vence_licencia);
        if (dias === null) return;
        if (dias < 0) {
          alerts.push({
            tipo: "error",
            mensaje: `Conductor ${c.nombre} - Licencia vencida`,
            tiempo: `Hace ${Math.abs(dias)}d`,
          });
        } else if (dias <= 15) {
          alerts.push({
            tipo: "warning",
            mensaje: `Licencia de ${c.nombre} vence en ${dias} días`,
            tiempo: "Próximamente",
          });
        }
      });
      vehiculosVenc?.forEach((v: { placa: string; vence_soat: string | null; vence_rtm: string | null }) => {
        const dSoat = diasHasta(v.vence_soat);
        const dRtm = diasHasta(v.vence_rtm);
        if (dSoat !== null && dSoat <= 15) {
          alerts.push({
            tipo: dSoat < 0 ? "error" : "warning",
            mensaje:
              dSoat < 0
                ? `SOAT ${v.placa} vencido hace ${Math.abs(dSoat)} días`
                : `SOAT ${v.placa} vence en ${dSoat} días`,
            tiempo: dSoat < 0 ? `Hace ${Math.abs(dSoat)}d` : "Próximamente",
          });
        }
        if (dRtm !== null && dRtm <= 15) {
          alerts.push({
            tipo: dRtm < 0 ? "error" : "warning",
            mensaje:
              dRtm < 0
                ? `RTM ${v.placa} vencida hace ${Math.abs(dRtm)} días`
                : `RTM ${v.placa} vence en ${dRtm} días`,
            tiempo: dRtm < 0 ? `Hace ${Math.abs(dRtm)}d` : "Próximamente",
          });
        }
      });
      // Add 1 info from servicios recientes finalizados
      const finished = (serviciosRec as ServicioRow[])?.find((s) => /final|complet/i.test(s.estado));
      if (finished) {
        alerts.push({
          tipo: "info",
          mensaje: `Servicio ${finished.numero_orden ?? finished.id.slice(0, 8)} completado`,
          tiempo: tiempoRelativo(finished.created_at),
        });
      }
      setAlertasRecientes(alerts.slice(0, 5));
    } finally {
      setLoading(false);
    }
  }

  const stats = [
    {
      label: "Conductores Activos",
      value: conductoresActivos.toString(),
      icon: Users,
      color: "bg-primary/15 text-primary",
    },
    {
      label: "Vehículos Disponibles",
      value: vehiculosDisp.toString(),
      icon: Car,
      color: "bg-accent/15 text-accent",
    },
    {
      label: "Servicios Hoy",
      value: serviciosHoy.toString(),
      icon: RouteIcon,
      color: "bg-success/15 text-success",
    },
    {
      label: "Cumplimiento ANS",
      value: cumplimiento === null ? "—" : `${cumplimiento}%`,
      icon: ClipboardCheck,
      color: "bg-warning/15 text-warning",
    },
  ];

  const totalTrend = serviciosPorMes.reduce((a, b) => a + b.servicios, 0);

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <HeaderSkeleton />
          <StatsGridSkeleton count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2"><ChartSkeleton height={240} /></div>
            <ChartSkeleton height={200} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CardGridSkeleton count={2} />
            <CardGridSkeleton count={2} />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Resumen general de operaciones TRAMMOS</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="stagger-item rounded-lg border border-border bg-card p-4"
              style={{ ["--i" as string]: i } as React.CSSProperties}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-md ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold">{loading ? "—" : stat.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-4">Servicios por Mes</h3>
            {totalTrend === 0 ? (
              <div className="h-[240px] flex flex-col items-center justify-center text-center text-muted-foreground">
                <Inbox className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Sin servicios registrados aún</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={serviciosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 220)" />
                  <XAxis dataKey="mes" tick={{ fill: "oklch(0.5 0.02 220)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "oklch(0.5 0.02 220)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(1 0 0)",
                      border: "1px solid oklch(0.9 0.01 220)",
                      borderRadius: "8px",
                      color: "oklch(0.2 0.02 220)",
                    }}
                  />
                  <Bar dataKey="servicios" fill="oklch(0.72 0.14 200)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-4">Estado Vehículos</h3>
            {estadoVehiculos.length === 0 ? (
              <div className="h-[200px] flex flex-col items-center justify-center text-center text-muted-foreground">
                <Inbox className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Sin vehículos registrados</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={estadoVehiculos}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      stroke="none"
                    >
                      {estadoVehiculos.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(1 0 0)",
                        border: "1px solid oklch(0.9 0.01 220)",
                        borderRadius: "8px",
                        color: "oklch(0.2 0.02 220)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {estadoVehiculos.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name} ({item.value})
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Servicios Recientes</h3>
            {serviciosRecientes.length === 0 ? (
              <div className="py-10 flex flex-col items-center text-center text-muted-foreground">
                <Inbox className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Sin servicios registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {serviciosRecientes.map((srv, i) => (
                  <div
                    key={srv.id}
                    className="stagger-item flex items-center justify-between py-2 border-b border-border last:border-0"
                    style={{ ["--i" as string]: i } as React.CSSProperties}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{srv.numero_orden ?? srv.id.slice(0, 8)}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getEstadoStyle(srv.estado)}`}>
                          {srv.estado}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {srv.origen ?? "—"} → {srv.destino ?? "—"} · {srv.conductor ?? "Sin asignar"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3" />
                      {srv.hora ?? srv.fecha}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Alertas Recientes</h3>
            {alertasRecientes.length === 0 ? (
              <div className="py-10 flex flex-col items-center text-center text-muted-foreground">
                <CheckCircle className="h-8 w-8 mb-2 text-success opacity-70" />
                <p className="text-sm text-foreground">Todo en orden</p>
                <p className="text-xs">Sin alertas activas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alertasRecientes.map((alerta, idx) => (
                  <div key={idx} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <div className="mt-0.5">{getAlertIcon(alerta.tipo)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{alerta.mensaje}</p>
                      <span className="text-xs text-muted-foreground">{alerta.tiempo}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
