import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { Plus, Filter, Clock, MapPin } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/servicios")({
  component: Servicios,
  head: () => ({
    meta: [
      { title: "Servicios - TRAMOS" },
      { name: "description", content: "Gestión de trayectos y servicios de transporte" },
    ],
  }),
});

interface Servicio {
  id: string;
  fecha: string;
  hora: string;
  origen: string;
  destino: string;
  pasajero: string;
  centroCosto: string;
  conductor: string;
  vehiculo: string;
  estado: "Programado" | "En curso" | "Finalizado" | "Cancelado";
}

const servicios: Servicio[] = [
  { id: "SRV-1290", fecha: "2025-04-15", hora: "14:30", origen: "Bogotá", destino: "Sopó", pasajero: "Juan López", centroCosto: "CC001", conductor: "Carlos Mejía", vehiculo: "ABC-123", estado: "En curso" },
  { id: "SRV-1289", fecha: "2025-04-15", hora: "15:00", origen: "Sopó", destino: "Madrid", pasajero: "María Gómez", centroCosto: "CC002", conductor: "Luis García", vehiculo: "DEF-456", estado: "Programado" },
  { id: "SRV-1288", fecha: "2025-04-15", hora: "12:00", origen: "Bogotá", destino: "Funza", pasajero: "Carlos Pérez", centroCosto: "CC003", conductor: "Ana Torres", vehiculo: "GHI-789", estado: "Finalizado" },
  { id: "SRV-1287", fecha: "2025-04-15", hora: "11:00", origen: "Madrid", destino: "Bogotá", pasajero: "Laura Díaz", centroCosto: "CC004", conductor: "Pedro Ruiz", vehiculo: "JKL-012", estado: "Finalizado" },
  { id: "SRV-1286", fecha: "2025-04-15", hora: "09:30", origen: "Bogotá", destino: "Tocancipá", pasajero: "Andrés Muñoz", centroCosto: "CC005", conductor: "María F. Díaz", vehiculo: "MNO-345", estado: "Finalizado" },
  { id: "SRV-1285", fecha: "2025-04-14", hora: "16:00", origen: "Sopó", destino: "Bogotá", pasajero: "Diana Sánchez", centroCosto: "CC001", conductor: "Jorge A. Muñoz", vehiculo: "PQR-678", estado: "Cancelado" },
];

function getEstadoStyle(estado: string) {
  switch (estado) {
    case "En curso": return "bg-primary/15 text-primary";
    case "Programado": return "bg-warning/15 text-warning";
    case "Finalizado": return "bg-success/15 text-success";
    case "Cancelado": return "bg-destructive/15 text-destructive";
    default: return "bg-muted text-muted-foreground";
  }
}

function Servicios() {
  const [filtro, setFiltro] = useState("Todos");

  const filtered = servicios.filter((s) => filtro === "Todos" || s.estado === filtro);

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Servicios</h1>
            <p className="text-sm text-muted-foreground">Gestión de trayectos y asignaciones</p>
          </div>
          <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Nuevo Servicio
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 text-sm">
          <span className="text-muted-foreground">Hoy:</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />2 En curso</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" />1 Programado</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" />3 Finalizados</span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          {["Todos", "Programado", "En curso", "Finalizado", "Cancelado"].map((e) => (
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

        {/* Services list */}
        <div className="space-y-3">
          {filtered.map((s) => (
            <div key={s.id} className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">{s.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getEstadoStyle(s.estado)}`}>{s.estado}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {s.fecha} · {s.hora}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>{s.origen}</span>
                <span className="text-muted-foreground">→</span>
                <span>{s.destino}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Pasajero</span>
                  <p className="font-medium">{s.pasajero}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Centro de costo</span>
                  <p className="font-medium">{s.centroCosto}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Conductor</span>
                  <p className="font-medium">{s.conductor}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vehículo</span>
                  <p className="font-medium">{s.vehiculo}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
