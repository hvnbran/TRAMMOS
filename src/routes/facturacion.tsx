import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { AdminOnly } from "../components/layout/AdminOnly";
import { FileText, Download, DollarSign, Calendar } from "lucide-react";

export const Route = createFileRoute("/facturacion")({
  component: () => <AdminOnly><Facturacion /></AdminOnly>,
  head: () => ({
    meta: [
      { title: "Facturación - TRAMMOS" },
      { name: "description", content: "Gestión de facturación y reportes financieros" },
    ],
  }),
});

const facturas = [
  { id: "FAC-2025-004", periodo: "Abril 2025", cliente: "Corona", servicios: 47, monto: "$8.695.000", estado: "Pendiente", fecha: "2025-04-05" },
  { id: "FAC-2025-003", periodo: "Marzo 2025", cliente: "Corona", servicios: 180, monto: "$33.300.000", estado: "Pagada", fecha: "2025-03-05" },
  { id: "FAC-2025-002", periodo: "Febrero 2025", cliente: "Corona", servicios: 165, monto: "$30.525.000", estado: "Pagada", fecha: "2025-02-05" },
  { id: "FAC-2025-001", periodo: "Enero 2025", cliente: "Corona", servicios: 150, monto: "$27.750.000", estado: "Pagada", fecha: "2025-01-05" },
];

function Facturacion() {
  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Facturación</h1>
            <p className="text-sm text-muted-foreground">Gestión de facturas y control financiero</p>
          </div>
          <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <FileText className="h-4 w-4" />
            Nueva Factura
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              Facturado (Año)
            </div>
            <span className="text-xl font-bold">$100.270.000</span>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              Pendiente
            </div>
            <span className="text-xl font-bold text-accent">$8.695.000</span>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              Facturas Emitidas
            </div>
            <span className="text-xl font-bold">4</span>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Factura</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Período</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Servicios</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Monto</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((f) => (
                  <tr key={f.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{f.id}</td>
                    <td className="px-4 py-3">{f.periodo}</td>
                    <td className="px-4 py-3">{f.cliente}</td>
                    <td className="px-4 py-3 text-right">{f.servicios}</td>
                    <td className="px-4 py-3 text-right font-medium">{f.monto}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        f.estado === "Pagada" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                      }`}>
                        {f.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Descargar">
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
