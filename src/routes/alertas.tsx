import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { AlertTriangle, CheckCircle, Info, Clock, Filter } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/alertas")({
  component: Alertas,
  head: () => ({
    meta: [
      { title: "Alertas - TRAMOS" },
      { name: "description", content: "Sistema de alertas y notificaciones" },
    ],
  }),
});

interface Alerta {
  id: string;
  tipo: "warning" | "error" | "info" | "success";
  categoria: string;
  mensaje: string;
  detalle: string;
  fecha: string;
  leida: boolean;
}

const alertas: Alerta[] = [
  { id: "A001", tipo: "warning", categoria: "Documento", mensaje: "SOAT vehículo ABC-123 vence en 5 días", detalle: "Fecha vencimiento: 2025-04-20", fecha: "2025-04-15 10:30", leida: false },
  { id: "A002", tipo: "error", categoria: "Conductor", mensaje: "Licencia vencida - Pedro Ruiz Castillo", detalle: "Venció el 2024-12-01. Conductor suspendido automáticamente.", fecha: "2025-04-15 08:00", leida: false },
  { id: "A003", tipo: "warning", categoria: "Documento", mensaje: "RTM vehículo DEF-456 vence mañana", detalle: "Fecha vencimiento: 2025-04-16", fecha: "2025-04-15 07:00", leida: false },
  { id: "A004", tipo: "info", categoria: "Servicio", mensaje: "Servicio SRV-1288 completado exitosamente", detalle: "Bogotá → Funza. Sin novedades.", fecha: "2025-04-15 12:30", leida: true },
  { id: "A005", tipo: "warning", categoria: "Operativa", mensaje: "Retraso de 18 min en servicio SRV-1285", detalle: "Superó los 15 minutos de desviación permitida.", fecha: "2025-04-14 16:20", leida: true },
  { id: "A006", tipo: "success", categoria: "Facturación", mensaje: "Factura FAC-2025-003 pagada por Corona", detalle: "Monto: $33.300.000", fecha: "2025-04-10 09:00", leida: true },
  { id: "A007", tipo: "error", categoria: "Conductor", mensaje: "Documentos incompletos - Ana María Torres", detalle: "Falta certificado médico vigente y curso de conducción defensiva.", fecha: "2025-04-09 11:00", leida: true },
];

function getAlertIcon(tipo: string) {
  switch (tipo) {
    case "warning": return <AlertTriangle className="h-4 w-4 text-accent" />;
    case "error": return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case "success": return <CheckCircle className="h-4 w-4 text-success" />;
    default: return <Info className="h-4 w-4 text-primary" />;
  }
}

function getAlertBorder(tipo: string) {
  switch (tipo) {
    case "warning": return "border-l-accent";
    case "error": return "border-l-destructive";
    case "success": return "border-l-success";
    default: return "border-l-primary";
  }
}

function Alertas() {
  const [filtro, setFiltro] = useState("Todas");

  const filtered = alertas.filter((a) => {
    if (filtro === "Todas") return true;
    if (filtro === "No leídas") return !a.leida;
    return a.tipo === filtro.toLowerCase();
  });

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Alertas</h1>
          <p className="text-sm text-muted-foreground">
            {alertas.filter((a) => !a.leida).length} alertas sin leer
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          {["Todas", "No leídas", "Warning", "Error"].map((e) => (
            <button
              key={e}
              onClick={() => setFiltro(e)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filtro === e ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map((a) => (
            <div
              key={a.id}
              className={`rounded-lg border border-border border-l-4 ${getAlertBorder(a.tipo)} bg-card p-4 ${!a.leida ? "bg-card" : "opacity-70"}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getAlertIcon(a.tipo)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{a.mensaje}</span>
                    {!a.leida && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.detalle}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="px-1.5 py-0.5 bg-secondary rounded">{a.categoria}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{a.fecha}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
