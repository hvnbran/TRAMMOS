import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import {
  Users,
  Car,
  Route as RouteIcon,
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
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

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const stats = [
  { label: "Conductores Activos", value: "24", icon: Users, change: "+2", color: "bg-primary/15 text-primary" },
  { label: "Vehículos Disponibles", value: "18", icon: Car, change: "-1", color: "bg-accent/15 text-accent" },
  { label: "Servicios Hoy", value: "47", icon: RouteIcon, change: "+12", color: "bg-success/15 text-success" },
  { label: "Cumplimiento ANS", value: "94%", icon: ClipboardCheck, change: "+3%", color: "bg-warning/15 text-warning" },
];

const serviciosData = [
  { mes: "Ene", servicios: 320 },
  { mes: "Feb", servicios: 380 },
  { mes: "Mar", servicios: 410 },
  { mes: "Abr", servicios: 390 },
  { mes: "May", servicios: 450 },
  { mes: "Jun", servicios: 480 },
];

const estadoVehiculos = [
  { name: "Disponible", value: 18, color: "oklch(0.8 0.18 115)" },
  { name: "En servicio", value: 12, color: "oklch(0.72 0.14 200)" },
  { name: "Mantenimiento", value: 3, color: "oklch(0.45 0 0)" },
];

const alertasRecientes = [
  { tipo: "warning", mensaje: "SOAT vehículo ABC-123 vence en 5 días", tiempo: "Hace 2h" },
  { tipo: "error", mensaje: "Conductor J. Pérez - Licencia vencida", tiempo: "Hace 4h" },
  { tipo: "info", mensaje: "Servicio #1284 completado exitosamente", tiempo: "Hace 5h" },
  { tipo: "warning", mensaje: "Revisión técnico-mecánica DEF-456 vence mañana", tiempo: "Hace 6h" },
];

const serviciosRecientes = [
  { id: "SRV-1290", origen: "Bogotá", destino: "Sopó", estado: "En curso", conductor: "Carlos Mejía", hora: "14:30" },
  { id: "SRV-1289", origen: "Sopó", destino: "Madrid", estado: "Programado", conductor: "Luis García", hora: "15:00" },
  { id: "SRV-1288", origen: "Bogotá", destino: "Funza", estado: "Finalizado", conductor: "Ana Torres", hora: "12:00" },
  { id: "SRV-1287", origen: "Madrid", destino: "Bogotá", estado: "Finalizado", conductor: "Pedro Ruiz", hora: "11:00" },
];

function getEstadoStyle(estado: string) {
  switch (estado) {
    case "En curso": return "bg-primary/15 text-primary";
    case "Programado": return "bg-warning/15 text-warning";
    case "Finalizado": return "bg-success/15 text-success";
    default: return "bg-muted text-muted-foreground";
  }
}

function getAlertIcon(tipo: string) {
  switch (tipo) {
    case "warning": return <AlertTriangle className="h-4 w-4 text-accent" />;
    case "error": return <AlertTriangle className="h-4 w-4 text-destructive" />;
    default: return <CheckCircle className="h-4 w-4 text-success" />;
  }
}

function Dashboard() {
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
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-md ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="text-xs text-success flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar chart */}
          <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-4">Servicios por Mes</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={serviciosData}>
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
          </div>

          {/* Pie chart */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-4">Estado Vehículos</h3>
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
            <div className="flex justify-center gap-4 mt-2">
              {estadoVehiculos.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name} ({item.value})
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent services */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Servicios Recientes</h3>
            <div className="space-y-3">
              {serviciosRecientes.map((srv) => (
                <div key={srv.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{srv.id}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getEstadoStyle(srv.estado)}`}>
                        {srv.estado}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {srv.origen} → {srv.destino} · {srv.conductor}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {srv.hora}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-3">Alertas Recientes</h3>
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
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
