import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { AdminOnly } from "../components/layout/AdminOnly";
import { BarChart3, Download, Loader2 } from "lucide-react";
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
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { fetchReportesData, type ReportesData } from "@/lib/reportes/data";
import { daysAgoStr, todayStr, lastNMonths, monthKey, monthLabel } from "@/lib/reportes/utils";
import {
  downloadServiciosExcel,
  downloadUsoVehiculosExcel,
  downloadRendimientoConductoresExcel,
  downloadFacturacionExcel,
  downloadDocumentosPorVencerExcel,
  downloadConsolidadoExcel,
} from "@/lib/reportes/excel";
import { downloadCumplimientoANSPdf } from "@/lib/reportes/pdf";

export const Route = createFileRoute("/reportes")({
  component: () => <AdminOnly><Reportes /></AdminOnly>,
  head: () => ({
    meta: [
      { title: "Reportes - TRAMMOS" },
      { name: "description", content: "Reportes y estadísticas del sistema" },
    ],
  }),
});

const tooltipStyle = {
  backgroundColor: "oklch(1 0 0)",
  border: "1px solid oklch(0.9 0.01 220)",
  borderRadius: "8px",
  color: "oklch(0.2 0.02 220)",
};

type ReportKey =
  | "servicios"
  | "ans"
  | "vehiculos"
  | "conductores"
  | "facturacion"
  | "documentos";

const reports: { key: ReportKey; label: string }[] = [
  { key: "servicios", label: "Servicios realizados por período" },
  { key: "ans", label: "Cumplimiento ANS detallado" },
  { key: "vehiculos", label: "Uso de vehículos por mes" },
  { key: "conductores", label: "Rendimiento de conductores" },
  { key: "facturacion", label: "Facturación por centro de costo" },
  { key: "documentos", label: "Documentos por vencer" },
];

function Reportes() {
  const { cliente } = useAuth();
  const [desde, setDesde] = useState(daysAgoStr(30));
  const [hasta, setHasta] = useState(todayStr());
  const [data, setData] = useState<ReportesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<ReportKey | "exportar" | null>(null);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    fetchReportesData({ desde, hasta })
      .then((d) => { if (!cancel) setData(d); })
      .catch(() => toast.error("Error cargando datos"))
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [desde, hasta]);

  const clienteLabel = cliente ?? null;

  // ---- Charts data (last 6 months, ignoring date filter) ----
  const serviciosPorMes = useMemo(() => {
    if (!data) return [];
    const months = lastNMonths(6);
    return months.map((ym) => {
      const inMonth = data.servicios.filter((s) => monthKey(s.fecha) === ym);
      return {
        mes: monthLabel(ym),
        total: inMonth.length,
        completados: inMonth.filter((s) => s.estado === "Finalizado").length,
      };
    });
  }, [data]);

  const cumplimientoMensual = useMemo(() => {
    return serviciosPorMes.map((m) => ({
      mes: m.mes,
      cumplimiento: m.total === 0 ? 0 : Math.round((m.completados / m.total) * 1000) / 10,
    }));
  }, [serviciosPorMes]);

  async function handleDownload(key: ReportKey) {
    if (!data) return;
    setBusy(key);
    try {
      const empty =
        (key === "servicios" && data.servicios.length === 0) ||
        (key === "vehiculos" && data.vehiculos.length === 0) ||
        (key === "conductores" && data.conductores.length === 0) ||
        (key === "facturacion" && data.servicios.length === 0);
      if (empty) {
        toast.warning("No hay datos para el período seleccionado");
        return;
      }
      switch (key) {
        case "servicios": downloadServiciosExcel(data.servicios, clienteLabel); break;
        case "ans": downloadCumplimientoANSPdf(data, clienteLabel, desde, hasta); break;
        case "vehiculos": downloadUsoVehiculosExcel(data.vehiculos, data.servicios, clienteLabel); break;
        case "conductores": downloadRendimientoConductoresExcel(data.conductores, data.servicios, clienteLabel); break;
        case "facturacion": downloadFacturacionExcel(data.servicios, clienteLabel); break;
        case "documentos": downloadDocumentosPorVencerExcel(data.vehiculos, data.conductores, clienteLabel); break;
      }
      toast.success("Reporte descargado");
    } catch (e) {
      toast.error("No se pudo generar el reporte");
      console.error(e);
    } finally {
      setBusy(null);
    }
  }

  async function handleExportarTodo() {
    if (!data) return;
    setBusy("exportar");
    try {
      downloadConsolidadoExcel(data, clienteLabel);
      toast.success("Reporte consolidado descargado");
    } catch (e) {
      toast.error("No se pudo generar el consolidado");
      console.error(e);
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Reportes</h1>
            <p className="text-sm text-muted-foreground">Estadísticas y análisis de operaciones</p>
          </div>
          <button
            onClick={handleExportarTodo}
            disabled={loading || busy !== null}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {busy === "exportar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Exportar Todo
          </button>
        </div>

        {/* Date range selector */}
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="text-xs text-muted-foreground ml-auto">
            {loading ? "Cargando…" : `${data?.servicios.length ?? 0} servicios en el período`}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Servicios por Mes (últimos 6 meses)
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={serviciosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 220)" />
                <XAxis dataKey="mes" tick={{ fill: "oklch(0.5 0.02 220)", fontSize: 12 }} />
                <YAxis tick={{ fill: "oklch(0.5 0.02 220)", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="total" name="Total" fill="oklch(0.72 0.14 200)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completados" name="Completados" fill="oklch(0.8 0.18 115)" radius={[4, 4, 0, 0]} />
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
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 220)" />
                <XAxis dataKey="mes" tick={{ fill: "oklch(0.5 0.02 220)", fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "oklch(0.5 0.02 220)", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="cumplimiento" stroke="oklch(0.72 0.14 200)" strokeWidth={2} dot={{ fill: "oklch(0.72 0.14 200)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick reports */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Reportes Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {reports.map((r) => {
              const isBusy = busy === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => handleDownload(r.key)}
                  disabled={loading || busy !== null}
                  className="flex items-center justify-between px-3 py-2.5 rounded-md bg-secondary/50 hover:bg-secondary text-sm text-left transition-colors disabled:opacity-50"
                >
                  <span>{r.label}</span>
                  {isBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  ) : (
                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
