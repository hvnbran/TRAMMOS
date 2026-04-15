import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { FileText, Plus, Upload } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/formatos")({
  component: Formatos,
  head: () => ({
    meta: [
      { title: "Formatos de Auditoría - TRAMMOS" },
      { name: "description", content: "Formatos de auditoría de vehículos por cliente y vendedor" },
    ],
  }),
});

interface Formato {
  id: string;
  nombre: string;
  tipo: "cliente" | "vendedor";
  cliente?: string;
  vendedor?: string;
  fecha: string;
  estado: "Pendiente" | "Completado" | "En revisión";
  vehiculosAuditados: number;
}

const formatos: Formato[] = [
  { id: "FMT-001", nombre: "Auditoría Vehículos Q1 2025", tipo: "cliente", cliente: "Corona - Planta Sogamoso", fecha: "2025-03-30", estado: "Completado", vehiculosAuditados: 6 },
  { id: "FMT-002", nombre: "Auditoría Vehículos Q1 2025", tipo: "vendedor", vendedor: "Renault Bogotá Norte", fecha: "2025-03-28", estado: "Completado", vehiculosAuditados: 4 },
  { id: "FMT-003", nombre: "Auditoría Vehículos Abril 2025", tipo: "cliente", cliente: "Corona - Planta Madrid", fecha: "2025-04-10", estado: "En revisión", vehiculosAuditados: 3 },
  { id: "FMT-004", nombre: "Inspección Pre-entrega Lote", tipo: "vendedor", vendedor: "Renault Calle 80", fecha: "2025-04-12", estado: "Pendiente", vehiculosAuditados: 2 },
];

function getEstadoFormato(estado: string) {
  switch (estado) {
    case "Pendiente": return "bg-warning/15 text-warning";
    case "En revisión": return "bg-primary/15 text-primary";
    case "Completado": return "bg-success/15 text-success";
    default: return "bg-muted text-muted-foreground";
  }
}

function Formatos() {
  const [filtroFormato, setFiltroFormato] = useState<"todos" | "cliente" | "vendedor">("todos");
  const [showNuevoFmt, setShowNuevoFmt] = useState(false);

  const fmtFiltrados = formatos.filter((f) => filtroFormato === "todos" || f.tipo === filtroFormato);

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Formatos de Auditoría</h1>
            <p className="text-sm text-muted-foreground">Auditoría de vehículos por cliente y por vendedor</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {(["todos", "cliente", "vendedor"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltroFormato(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filtroFormato === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "todos" ? "Todos" : f === "cliente" ? "Por Cliente" : "Por Vendedor"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowNuevoFmt(!showNuevoFmt)}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Nuevo Formato
          </button>
        </div>

        {showNuevoFmt && (
          <div className="rounded-lg border border-primary/30 bg-card p-5 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Cargar Formato de Auditoría</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tipo de Auditoría</label>
                <select className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                  <option value="cliente">Auditoría de vehículos por cliente</option>
                  <option value="vendedor">Auditoría de vehículos por vendedor</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nombre del formato</label>
                <input placeholder="Ej: Auditoría Q2 2025" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Cliente / Vendedor</label>
                <input placeholder="Nombre del cliente o vendedor" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Vehículos auditados</label>
                <input type="number" placeholder="Cantidad" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Archivo del formato</label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Arrastra archivos aquí o haz clic para seleccionar</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, Excel, Word (máx 10MB)</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNuevoFmt(false)} className="px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
              <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Guardar Formato</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fmtFiltrados.map((f) => (
            <div key={f.id} className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold">{f.id}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getEstadoFormato(f.estado)}`}>{f.estado}</span>
              </div>
              <p className="mt-2 text-sm font-medium">{f.nombre}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">{f.tipo === "cliente" ? "Cliente" : "Vendedor"}</span>
                  <p className="font-medium">{f.cliente || f.vendedor}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vehículos auditados</span>
                  <p className="font-medium">{f.vehiculosAuditados}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Fecha</span>
                  <p className="font-medium">{f.fecha}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo</span>
                  <p className="font-medium capitalize">{f.tipo === "cliente" ? "Auditoría por cliente" : "Auditoría por vendedor"}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors">Ver formato</button>
                <button className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors">Descargar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
