import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { Search, Plus, Filter, MoreVertical, CheckCircle, AlertTriangle, Wrench, Calendar, ClipboardCheck, Car } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/vehiculos")({
  component: Vehiculos,
  head: () => ({
    meta: [
      { title: "Vehículos - TRAMMOS" },
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

interface Mantenimiento {
  id: string;
  vehiculo: string;
  placa: string;
  tipo: string;
  fechaProgramada: string;
  kilometraje: string;
  estado: "Programado" | "Completado" | "Vencido";
  responsable: string;
}

const cronogramaMantenimiento: Mantenimiento[] = [
  { id: "MNT-001", vehiculo: "V001", placa: "ABC-123", tipo: "Cambio de aceite y filtros", fechaProgramada: "2025-04-20", kilometraje: "15,000 km", estado: "Programado", responsable: "Taller Renault Bogotá" },
  { id: "MNT-002", vehiculo: "V002", placa: "DEF-456", tipo: "Revisión de frenos", fechaProgramada: "2025-04-18", kilometraje: "20,000 km", estado: "Programado", responsable: "Taller Renault Bogotá" },
  { id: "MNT-003", vehiculo: "V003", placa: "GHI-789", tipo: "Cambio de correa de distribución", fechaProgramada: "2025-04-10", kilometraje: "60,000 km", estado: "Completado", responsable: "Taller Renault Calle 80" },
  { id: "MNT-004", vehiculo: "V004", placa: "JKL-012", tipo: "Alineación y balanceo", fechaProgramada: "2025-04-25", kilometraje: "10,000 km", estado: "Programado", responsable: "Taller Renault Bogotá" },
  { id: "MNT-005", vehiculo: "V001", placa: "ABC-123", tipo: "Revisión general 30,000 km", fechaProgramada: "2025-03-15", kilometraje: "30,000 km", estado: "Vencido", responsable: "Taller Renault Bogotá" },
  { id: "MNT-006", vehiculo: "V006", placa: "PQR-678", tipo: "Cambio de llantas", fechaProgramada: "2025-05-01", kilometraje: "40,000 km", estado: "Programado", responsable: "Taller Renault Calle 80" },
];

interface Preoperacional {
  id: string;
  vehiculo: string;
  placa: string;
  conductor: string;
  fecha: string;
  hora: string;
  luces: boolean;
  frenos: boolean;
  llantas: boolean;
  espejos: boolean;
  documentos: boolean;
  aseo: boolean;
  combustible: string;
  observaciones: string;
  estado: "Aprobado" | "Con observaciones" | "No realizado";
}

const preoperacionales: Preoperacional[] = [
  { id: "PRE-001", vehiculo: "V001", placa: "ABC-123", conductor: "Carlos Mejía", fecha: "2025-04-15", hora: "06:30", luces: true, frenos: true, llantas: true, espejos: true, documentos: true, aseo: true, combustible: "3/4", observaciones: "Sin novedad", estado: "Aprobado" },
  { id: "PRE-002", vehiculo: "V004", placa: "JKL-012", conductor: "María F. Díaz", fecha: "2025-04-15", hora: "06:45", luces: true, frenos: true, llantas: false, espejos: true, documentos: true, aseo: true, combustible: "1/2", observaciones: "Llanta trasera derecha con desgaste, reportar a mantenimiento", estado: "Con observaciones" },
  { id: "PRE-003", vehiculo: "V006", placa: "PQR-678", conductor: "Jorge A. Muñoz", fecha: "2025-04-15", hora: "07:00", luces: true, frenos: true, llantas: true, espejos: true, documentos: true, aseo: false, combustible: "Full", observaciones: "Vehículo requiere lavado interior", estado: "Con observaciones" },
  { id: "PRE-004", vehiculo: "V002", placa: "DEF-456", conductor: "—", fecha: "2025-04-15", hora: "—", luces: false, frenos: false, llantas: false, espejos: false, documentos: false, aseo: false, combustible: "—", observaciones: "Vehículo sin asignar", estado: "No realizado" },
];

function getEstadoBadge(estado: string) {
  switch (estado) {
    case "Disponible": return { className: "bg-success/15 text-success", icon: <CheckCircle className="h-3 w-3" /> };
    case "En servicio": return { className: "bg-primary/15 text-primary", icon: <CheckCircle className="h-3 w-3" /> };
    case "En mantenimiento": return { className: "bg-warning/15 text-warning", icon: <Wrench className="h-3 w-3" /> };
    default: return { className: "bg-muted text-muted-foreground", icon: null };
  }
}

function getEstadoMant(estado: string) {
  switch (estado) {
    case "Programado": return "bg-primary/15 text-primary";
    case "Completado": return "bg-success/15 text-success";
    case "Vencido": return "bg-destructive/15 text-destructive";
    default: return "bg-muted text-muted-foreground";
  }
}

function getEstadoPre(estado: string) {
  switch (estado) {
    case "Aprobado": return "bg-success/15 text-success";
    case "Con observaciones": return "bg-warning/15 text-warning";
    case "No realizado": return "bg-muted text-muted-foreground";
    default: return "bg-muted text-muted-foreground";
  }
}

function Vehiculos() {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [tab, setTab] = useState<"flota" | "mantenimiento" | "preoperacional">("flota");

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
            <p className="text-sm text-muted-foreground">Administración de la flota, mantenimiento y preoperacional</p>
          </div>
          <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Nuevo Vehículo
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          <button onClick={() => setTab("flota")} className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === "flota" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <Car className="h-4 w-4" /> Flota
          </button>
          <button onClick={() => setTab("mantenimiento")} className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === "mantenimiento" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <Calendar className="h-4 w-4" /> Mantenimiento Preventivo
          </button>
          <button onClick={() => setTab("preoperacional")} className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === "preoperacional" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <ClipboardCheck className="h-4 w-4" /> Preoperacional Diaria
          </button>
        </div>

        {/* ═══ FLOTA TAB ═══ */}
        {tab === "flota" && (
          <>
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
                      <button className="flex-1 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors">Ver detalle</button>
                      <button className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ═══ MANTENIMIENTO PREVENTIVO TAB ═══ */}
        {tab === "mantenimiento" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Cronograma de mantenimiento preventivo de la flota</p>
              <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" /> Programar Mantenimiento
              </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-border bg-card p-4 text-center">
                <p className="text-2xl font-bold text-primary">{cronogramaMantenimiento.filter(m => m.estado === "Programado").length}</p>
                <p className="text-xs text-muted-foreground mt-1">Programados</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 text-center">
                <p className="text-2xl font-bold text-success">{cronogramaMantenimiento.filter(m => m.estado === "Completado").length}</p>
                <p className="text-xs text-muted-foreground mt-1">Completados</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4 text-center">
                <p className="text-2xl font-bold text-destructive">{cronogramaMantenimiento.filter(m => m.estado === "Vencido").length}</p>
                <p className="text-xs text-muted-foreground mt-1">Vencidos</p>
              </div>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">ID</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Placa</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Tipo de Mantenimiento</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Fecha Programada</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Kilometraje</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Responsable</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cronogramaMantenimiento.map((m) => (
                    <tr key={m.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{m.id}</td>
                      <td className="px-4 py-3 font-bold">{m.placa}</td>
                      <td className="px-4 py-3">{m.tipo}</td>
                      <td className="px-4 py-3">{m.fechaProgramada}</td>
                      <td className="px-4 py-3">{m.kilometraje}</td>
                      <td className="px-4 py-3 text-xs">{m.responsable}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getEstadoMant(m.estado)}`}>{m.estado}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ PREOPERACIONAL DIARIA TAB ═══ */}
        {tab === "preoperacional" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Inspección preoperacional diaria de vehículos — {new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" /> Registrar Inspección
              </button>
            </div>

            <div className="space-y-3">
              {preoperacionales.map((p) => (
                <div key={p.id} className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <ClipboardCheck className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold">{p.placa}</span>
                      <span className="text-xs text-muted-foreground">· {p.conductor} · {p.hora !== "—" ? `${p.hora} hrs` : "Sin registro"}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getEstadoPre(p.estado)}`}>{p.estado}</span>
                  </div>

                  {p.estado !== "No realizado" && (
                    <div className="mt-3 grid grid-cols-3 md:grid-cols-7 gap-2">
                      {[
                        { label: "Luces", ok: p.luces },
                        { label: "Frenos", ok: p.frenos },
                        { label: "Llantas", ok: p.llantas },
                        { label: "Espejos", ok: p.espejos },
                        { label: "Documentos", ok: p.documentos },
                        { label: "Aseo", ok: p.aseo },
                      ].map((item) => (
                        <div key={item.label} className={`rounded-md px-2 py-1.5 text-center text-xs font-medium ${item.ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                          {item.ok ? "✓" : "✗"} {item.label}
                        </div>
                      ))}
                      <div className="rounded-md bg-secondary px-2 py-1.5 text-center text-xs font-medium">
                        ⛽ {p.combustible}
                      </div>
                    </div>
                  )}

                  {p.observaciones && p.estado !== "No realizado" && (
                    <div className="mt-2 rounded-md bg-secondary/50 p-2.5">
                      <p className="text-xs text-muted-foreground">Observaciones:</p>
                      <p className="text-xs mt-0.5">{p.observaciones}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
