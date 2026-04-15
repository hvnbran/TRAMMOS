import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { BarChart3, Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

export const Route = createFileRoute("/reportes")({
  component: Reportes,
  head: () => ({
    meta: [
      { title: "Reportes - TRAMOS" },
      { name: "description", content: "Reportes y estadísticas del sistema" },
    ],
  }),
});

const serviciosPorMes = [
  { mes: "Ene", total: 150, completados: 145 },
  { mes: "Feb", total: 165, completados: 160 },
  { mes: "Mar", total: 180, completados: 172 },
  { mes: "Abr", total: 47, completados: 44 },
];

const cumplimientoMensual = [
  { mes: "Ene", cumplimiento: 93 },
  { mes: "Feb", cumplimiento: 95 },
  { mes: "Mar", cumplimiento: 94 },
  { mes: "Abr", cumplimiento: 95.4 },
];

const tooltipStyle = {
  backgroundColor: "oklch(0.2 0.025 260)",
  border: "1px solid oklch(0.28 0.02 260)",
  borderRadius: "8px",
  color: "oklch(0.95 0.01 260)",
};

function Reportes() {
  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Reportes</h1>
            <p className="text-sm text-muted-foreground">Estadísticas y análisis de operaciones</p>
          </div>
          <button className="flex items-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Servicios por Mes
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={serviciosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 260)" />
                <XAxis dataKey="mes" tick={{ fill: "oklch(0.65 0.02 260)", fontSize: 12 }} />
                <YAxis tick={{ fill: "oklch(0.65 0.02 260)", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="total" name="Total" fill="oklch(0.62 0.18 250)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completados" name="Completados" fill="oklch(0.7 0.18 160)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-success" />
              Cumplimiento ANS (%)
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={cumplimientoMensual}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 260)" />
                <XAxis dataKey="mes" tick={{ fill: "oklch(0.65 0.02 260)", fontSize: 12 }} />
                <YAxis domain={[85, 100]} tick={{ fill: "oklch(0.65 0.02 260)", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="cumplimiento" stroke="oklch(0.7 0.18 160)" strokeWidth={2} dot={{ fill: "oklch(0.7 0.18 160)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick reports */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Reportes Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              "Servicios realizados por período",
              "Cumplimiento ANS detallado",
              "Uso de vehículos por mes",
              "Rendimiento de conductores",
              "Facturación por centro de costo",
              "Documentos por vencer",
            ].map((r) => (
              <button key={r} className="flex items-center justify-between px-3 py-2.5 rounded-md bg-secondary/50 hover:bg-secondary text-sm text-left transition-colors">
                <span>{r}</span>
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
