import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { Search, Plus, Filter, MoreVertical, CheckCircle, AlertTriangle, Wrench } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/vehiculos")({
  component: Vehiculos,
  head: () => ({
    meta: [
      { title: "Vehículos - TRAMOS" },
      { name: "description", content: "Administración de flota vehicular" },
    ],
  }),
});

interface Vehiculo {
  id: string;
  placa: string;
  marca: string;
  linea: string;
  modelo: number;
  color: string;
  numInterno: string;
  estado: "Disponible" | "En servicio" | "En mantenimiento";
  venceSOAT: string;
  venceRTM: string;
  conductor: string | null;
}

const vehiculos: Vehiculo[] = [
  { id: "V001", placa: "ABC-123", marca: "Renault", linea: "Duster", modelo: 2023, color: "Blanco", numInterno: "01", estado: "En servicio", venceSOAT: "2025-04-20", venceRTM: "2025-06-15", conductor: "Carlos Mejía" },
  { id: "V002", placa: "DEF-456", marca: "Renault", linea: "Duster", modelo: 2023, color: "Gris", numInterno: "02", estado: "Disponible", venceSOAT: "2025-09-10", venceRTM: "2025-10-01", conductor: null },
  { id: "V003", placa: "GHI-789", marca: "Renault", linea: "Duster", modelo: 2022, color: "Negro", numInterno: "03", estado: "En mantenimiento", venceSOAT: "2025-05-05", venceRTM: "2025-07-20", conductor: null },
  { id: "V004", placa: "JKL-012", marca: "Renault", linea: "Duster", modelo: 2024, color: "Blanco", numInterno: "04", estado: "En servicio", venceSOAT: "2026-01-15", venceRTM: "2026-02-28", conductor: "María F. Díaz" },
  { id: "V005", placa: "MNO-345", marca: "Renault", linea: "Duster", modelo: 2023, color: "Rojo", numInterno: "05", estado: "Disponible", venceSOAT: "2025-07-22", venceRTM: "2025-08-10", conductor: null },
  { id: "V006", placa: "PQR-678", marca: "Renault", linea: "Duster", modelo: 2022, color: "Gris", numInterno: "06", estado: "En servicio", venceSOAT: "2025-11-30", venceRTM: "2025-12-15", conductor: "Jorge A. Muñoz" },
];

function getEstadoBadge(estado: string) {
  switch (estado) {
    case "Disponible": return { className: "bg-success/15 text-success", icon: <CheckCircle className="h-3 w-3" /> };
    case "En servicio": return { className: "bg-primary/15 text-primary", icon: <CheckCircle className="h-3 w-3" /> };
    case "En mantenimiento": return { className: "bg-warning/15 text-warning", icon: <Wrench className="h-3 w-3" /> };
    default: return { className: "bg-muted text-muted-foreground", icon: null };
  }
}

function Vehiculos() {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const filtered = vehiculos.filter((v) => {
    const matchSearch = v.placa.toLowerCase().includes(search.toLowerCase()) || v.numInterno.includes(search);
    const matchEstado = filtroEstado === "Todos" || v.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Vehículos</h1>
            <p className="text-sm text-muted-foreground">Administración de la flota Renault Duster</p>
          </div>
          <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Nuevo Vehículo
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por placa o número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-md bg-secondary pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {["Todos", "Disponible", "En servicio", "En mantenimiento"].map((e) => (
              <button
                key={e}
                onClick={() => setFiltroEstado(e)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filtroEstado === e ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Grid cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => {
            const badge = getEstadoBadge(v.estado);
            return (
              <div key={v.id} className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-lg font-bold">{v.placa}</span>
                    <p className="text-xs text-muted-foreground">{v.marca} {v.linea} · {v.modelo} · {v.color}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                    {badge.icon}
                    {v.estado}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">N° Interno</span>
                    <p className="font-medium">{v.numInterno}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Conductor</span>
                    <p className="font-medium">{v.conductor || "—"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vence SOAT</span>
                    <p className="font-medium">{v.venceSOAT}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vence RTM</span>
                    <p className="font-medium">{v.venceRTM}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors">
                    Ver detalle
                  </button>
                  <button className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
