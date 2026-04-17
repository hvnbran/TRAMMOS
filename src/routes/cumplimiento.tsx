import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { AdminOnly } from "../components/layout/AdminOnly";
import { CheckCircle, XCircle, AlertTriangle, Shield } from "lucide-react";

export const Route = createFileRoute("/cumplimiento")({
  component: () => <AdminOnly><Cumplimiento /></AdminOnly>,
  head: () => ({
    meta: [
      { title: "Cumplimiento ANS - TRAMOS" },
      { name: "description", content: "Control de acuerdos de nivel de servicio" },
    ],
  }),
});

const reglas = [
  { categoria: "Operativas", items: [
    { regla: "Desviación máxima 15 minutos", cumplimiento: 96, total: 200, cumplidos: 192 },
    { regla: "Cumplimiento de horarios", cumplimiento: 94, total: 200, cumplidos: 188 },
    { regla: "Tiempo de espera ≤ 20 min", cumplimiento: 98, total: 200, cumplidos: 196 },
    { regla: "Solicitud con 2h anticipación", cumplimiento: 91, total: 200, cumplidos: 182 },
  ]},
  { categoria: "Vehículo", items: [
    { regla: "Documentación vigente", cumplimiento: 100, total: 33, cumplidos: 33 },
    { regla: "Vehículos autorizados", cumplimiento: 100, total: 33, cumplidos: 33 },
  ]},
  { categoria: "Conductor", items: [
    { regla: "Licencia válida", cumplimiento: 96, total: 24, cumplidos: 23 },
    { regla: "Documentos completos", cumplimiento: 92, total: 24, cumplidos: 22 },
  ]},
  { categoria: "Facturación", items: [
    { regla: "Entrega primeros 5 días", cumplimiento: 100, total: 6, cumplidos: 6 },
    { regla: "Reporte de inconsistencias", cumplimiento: 100, total: 6, cumplidos: 6 },
  ]},
  { categoria: "Atención", items: [
    { regla: "Solicitudes por correo (horario laboral)", cumplimiento: 98, total: 150, cumplidos: 147 },
    { regla: "Call center (horario no laboral)", cumplimiento: 95, total: 50, cumplidos: 47 },
  ]},
];

function getCumplimientoColor(val: number) {
  if (val >= 98) return "text-success";
  if (val >= 95) return "text-primary";
  if (val >= 90) return "text-accent";
  return "text-destructive";
}

function getCumplimientoIcon(val: number) {
  if (val >= 98) return <CheckCircle className="h-4 w-4 text-success" />;
  if (val >= 90) return <AlertTriangle className="h-4 w-4 text-accent" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
}

function Cumplimiento() {
  const globalCumplimiento = 95.4;

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Cumplimiento ANS</h1>
          <p className="text-sm text-muted-foreground">Control de Acuerdos de Nivel de Servicio con Corona</p>
        </div>

        {/* Global score */}
        <div className="rounded-lg border border-border bg-card p-6 flex items-center gap-6">
          <div className="h-20 w-20 rounded-full border-4 border-primary flex items-center justify-center">
            <span className="text-2xl font-bold">{globalCumplimiento}%</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Cumplimiento Global</h3>
            <p className="text-sm text-muted-foreground">Período: Abril 2025</p>
            <div className="flex items-center gap-1 mt-1 text-sm text-success">
              <Shield className="h-4 w-4" />
              Dentro del rango aceptable
            </div>
          </div>
        </div>

        {/* Rules by category */}
        <div className="space-y-4">
          {reglas.map((cat) => (
            <div key={cat.categoria} className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 bg-secondary/50 border-b border-border">
                <h3 className="text-sm font-semibold">{cat.categoria}</h3>
              </div>
              <div className="divide-y divide-border">
                {cat.items.map((item) => (
                  <div key={item.regla} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {getCumplimientoIcon(item.cumplimiento)}
                      <div>
                        <span className="text-sm">{item.regla}</span>
                        <p className="text-xs text-muted-foreground">{item.cumplidos}/{item.total} cumplidos</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${item.cumplimiento}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold w-12 text-right ${getCumplimientoColor(item.cumplimiento)}`}>
                        {item.cumplimiento}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
