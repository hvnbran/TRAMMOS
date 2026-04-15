import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { Plus, MapPin, Building2, DollarSign } from "lucide-react";

export const Route = createFileRoute("/operacion")({
  component: Operacion,
  head: () => ({
    meta: [
      { title: "Operación - TRAMOS" },
      { name: "description", content: "Centros de costo y rutas operativas" },
    ],
  }),
});

const centrosCosto = [
  { id: "CC001", cliente: "Corona", origen: "Bogotá", destino: "Sopó", departamento: "Cundinamarca", tipo: "Empresarial", tarifa: "$185.000", serviciosMes: 48 },
  { id: "CC002", cliente: "Corona", origen: "Sopó", destino: "Madrid", departamento: "Cundinamarca", tipo: "VIP", tarifa: "$220.000", serviciosMes: 32 },
  { id: "CC003", cliente: "Corona", origen: "Bogotá", destino: "Funza", departamento: "Cundinamarca", tipo: "Empresarial", tarifa: "$165.000", serviciosMes: 56 },
  { id: "CC004", cliente: "Corona", origen: "Madrid", destino: "Bogotá", departamento: "Cundinamarca", tipo: "Especial", tarifa: "$195.000", serviciosMes: 24 },
  { id: "CC005", cliente: "Corona", origen: "Bogotá", destino: "Tocancipá", departamento: "Cundinamarca", tipo: "Empresarial", tarifa: "$210.000", serviciosMes: 40 },
];

function getTipoBadge(tipo: string) {
  switch (tipo) {
    case "Empresarial": return "bg-primary/15 text-primary";
    case "VIP": return "bg-accent/15 text-accent";
    case "Especial": return "bg-success/15 text-success";
    default: return "bg-muted text-muted-foreground";
  }
}

function Operacion() {
  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Operación</h1>
            <p className="text-sm text-muted-foreground">Centros de costo, rutas y tarifas</p>
          </div>
          <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Nueva Ruta
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-primary/15 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-2xl font-bold">1</span>
              <p className="text-xs text-muted-foreground">Cliente activo</p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-accent/15 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-accent" />
            </div>
            <div>
              <span className="text-2xl font-bold">5</span>
              <p className="text-xs text-muted-foreground">Rutas activas</p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-success/15 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <span className="text-2xl font-bold">200</span>
              <p className="text-xs text-muted-foreground">Servicios/mes</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ruta</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Departamento</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Tarifa</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Srv/Mes</th>
                </tr>
              </thead>
              <tbody>
                {centrosCosto.map((cc) => (
                  <tr key={cc.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{cc.id}</td>
                    <td className="px-4 py-3">{cc.cliente}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1">
                        {cc.origen} <span className="text-muted-foreground">→</span> {cc.destino}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{cc.departamento}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTipoBadge(cc.tipo)}`}>{cc.tipo}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{cc.tarifa}</td>
                    <td className="px-4 py-3 text-right">{cc.serviciosMes}</td>
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
