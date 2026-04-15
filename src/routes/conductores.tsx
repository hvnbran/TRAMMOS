import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { Search, Plus, Filter, MoreVertical, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/conductores")({
  component: Conductores,
  head: () => ({
    meta: [
      { title: "Conductores - TRAMOS" },
      { name: "description", content: "Gestión de conductores y documentación" },
    ],
  }),
});

interface Conductor {
  id: string;
  nombre: string;
  cedula: string;
  telefono: string;
  licencia: string;
  categoriaLic: string;
  estado: "Activo" | "Suspendido" | "Vencido";
  venceLicencia: string;
  foto: string;
  servicios: number;
  cumplimiento: number;
}

const conductores: Conductor[] = [
  { id: "C001", nombre: "Carlos Mejía Rodríguez", cedula: "1.023.456.789", telefono: "310-555-1234", licencia: "C2", categoriaLic: "C2", estado: "Activo", venceLicencia: "2025-08-15", foto: "CM", servicios: 142, cumplimiento: 97 },
  { id: "C002", nombre: "Luis García Hernández", cedula: "1.045.678.901", telefono: "312-555-5678", licencia: "C1", categoriaLic: "C1", estado: "Activo", venceLicencia: "2025-03-20", foto: "LG", servicios: 98, cumplimiento: 95 },
  { id: "C003", nombre: "Ana María Torres López", cedula: "1.067.890.123", telefono: "315-555-9012", licencia: "C2", categoriaLic: "C2", estado: "Suspendido", venceLicencia: "2025-06-10", foto: "AT", servicios: 76, cumplimiento: 89 },
  { id: "C004", nombre: "Pedro Ruiz Castillo", cedula: "1.089.012.345", telefono: "311-555-3456", licencia: "C1", categoriaLic: "C1", estado: "Vencido", venceLicencia: "2024-12-01", foto: "PR", servicios: 210, cumplimiento: 92 },
  { id: "C005", nombre: "María Fernanda Díaz", cedula: "1.012.345.678", telefono: "320-555-7890", licencia: "C2", categoriaLic: "C2", estado: "Activo", venceLicencia: "2026-01-30", foto: "MD", servicios: 185, cumplimiento: 98 },
  { id: "C006", nombre: "Jorge Andrés Muñoz", cedula: "1.034.567.890", telefono: "318-555-2345", licencia: "C1", categoriaLic: "C1", estado: "Activo", venceLicencia: "2025-11-22", foto: "JM", servicios: 120, cumplimiento: 94 },
];

function getEstadoBadge(estado: string) {
  switch (estado) {
    case "Activo": return { className: "bg-success/15 text-success", icon: <CheckCircle className="h-3 w-3" /> };
    case "Suspendido": return { className: "bg-warning/15 text-warning", icon: <AlertTriangle className="h-3 w-3" /> };
    case "Vencido": return { className: "bg-destructive/15 text-destructive", icon: <XCircle className="h-3 w-3" /> };
    default: return { className: "bg-muted text-muted-foreground", icon: null };
  }
}

function Conductores() {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const filtered = conductores.filter((c) => {
    const matchSearch = c.nombre.toLowerCase().includes(search.toLowerCase()) || c.cedula.includes(search);
    const matchEstado = filtroEstado === "Todos" || c.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Conductores</h1>
            <p className="text-sm text-muted-foreground">Gestión de conductores y documentación legal</p>
          </div>
          <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Nuevo Conductor
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre o cédula..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-md bg-secondary pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {["Todos", "Activo", "Suspendido", "Vencido"].map((e) => (
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

        {/* Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Conductor</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cédula</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Licencia</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vence Lic.</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Servicios</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Cumpl.</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const badge = getEstadoBadge(c.estado);
                  return (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                            {c.foto}
                          </div>
                          <div>
                            <span className="font-medium">{c.nombre}</span>
                            <p className="text-xs text-muted-foreground">{c.telefono}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.cedula}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-secondary rounded text-xs font-medium">{c.categoriaLic}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                          {badge.icon}
                          {c.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.venceLicencia}</td>
                      <td className="px-4 py-3 text-right">{c.servicios}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={c.cumplimiento >= 95 ? "text-success" : c.cumplimiento >= 90 ? "text-accent" : "text-destructive"}>
                          {c.cumplimiento}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
