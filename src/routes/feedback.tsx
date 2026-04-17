import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { Star, AlertTriangle, MessageSquare, Plus, ChevronDown, ChevronUp, Upload, ShieldAlert } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/feedback")({
  component: Feedback,
  head: () => ({
    meta: [
      { title: "Feedback y Calificaciones - TRAMMOS" },
      { name: "description", content: "Calificación de conductores, usuarios, formatos y reporte de incidentalidad" },
    ],
  }),
});

/* ── Star Rating Component ── */
function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(i)}
          onMouseEnter={() => !readonly && setHover(i)}
          onMouseLeave={() => setHover(0)}
          className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer"}`}
        >
          <Star
            className={`h-5 w-5 ${
              i <= (hover || value) ? "fill-warning text-warning" : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

/* ── Types ── */
interface Calificacion {
  id: string;
  tipo: "conductor" | "usuario";
  nombre: string;
  servicio: string;
  fecha: string;
  estrellas: number;
  mejoras: string;
}

interface Incidente {
  id: string;
  fecha: string;
  conductor: string;
  vehiculo: string;
  tipoIncidente: string;
  quePaso: string;
  cuando: string;
  porQue: string;
  soporte: string;
  solucion: string;
  planMejoramiento: string;
  estado: "Abierto" | "En revisión" | "Cerrado";
}


/* ── Mock data ── */
const calificaciones: Calificacion[] = [
  { id: "CAL-001", tipo: "conductor", nombre: "Carlos Mejía", servicio: "SRV-1290", fecha: "2025-04-15", estrellas: 4, mejoras: "Mejorar puntualidad en recogida" },
  { id: "CAL-002", tipo: "usuario", nombre: "Juan López", servicio: "SRV-1290", fecha: "2025-04-15", estrellas: 5, mejoras: "Excelente servicio, sin observaciones" },
  { id: "CAL-003", tipo: "conductor", nombre: "Luis García", servicio: "SRV-1289", fecha: "2025-04-14", estrellas: 3, mejoras: "Comunicación con el pasajero puede mejorar" },
  { id: "CAL-004", tipo: "usuario", nombre: "María Gómez", servicio: "SRV-1289", fecha: "2025-04-14", estrellas: 4, mejoras: "Indicar mejor la ubicación de recogida" },
];

const tiposIncidente = [
  "Choque / Colisión",
  "Multa de tránsito",
  "Infracción de velocidad",
  "Comparendo electrónico",
  "Daño a propiedad ajena",
  "Incidente con peatón",
  "Falla mecánica en vía",
  "Otro",
];

const incidentes: Incidente[] = [
  {
    id: "INC-001", fecha: "2025-04-10", conductor: "Pedro Ruiz", vehiculo: "JKL-012",
    tipoIncidente: "Choque / Colisión",
    quePaso: "Colisión menor en parqueadero del cliente",
    cuando: "10/04/2025 - 08:45 AM",
    porQue: "Punto ciego al reversar en espacio reducido",
    soporte: "Fotos del vehículo, reporte de tránsito",
    solucion: "Reparación de parachoques trasero, revisión técnica completada",
    planMejoramiento: "Capacitación en maniobras de reversa y uso de sensores",
    estado: "Cerrado",
  },
  {
    id: "INC-002", fecha: "2025-04-13", conductor: "Ana Torres", vehiculo: "GHI-789",
    tipoIncidente: "Multa de tránsito",
    quePaso: "Comparendo por estacionar en zona prohibida durante recogida de pasajero",
    cuando: "13/04/2025 - 02:20 PM",
    porQue: "No había zona de parqueo disponible cerca del punto de recogida",
    soporte: "Foto del comparendo, captura de ubicación GPS",
    solucion: "Pago del comparendo, solicitud de zona de cargue al edificio",
    planMejoramiento: "Identificar puntos de parqueo seguros por cada ruta frecuente",
    estado: "En revisión",
  },
  {
    id: "INC-003", fecha: "2025-04-14", conductor: "Carlos Mejía", vehiculo: "ABC-123",
    tipoIncidente: "Infracción de velocidad",
    quePaso: "Foto-multa por exceso de velocidad en Autopista Norte",
    cuando: "14/04/2025 - 07:10 AM",
    porQue: "Conductor reportó no haber visto señalización de límite reducido por obra",
    soporte: "Notificación electrónica SIMIT, captura de velocidad registrada",
    solucion: "Verificación en SIMIT, descargo presentado ante autoridad",
    planMejoramiento: "Refuerzo en límites de velocidad por zonas de obra, alerta en app",
    estado: "Abierto",
  },
];

function getEstadoIncidente(estado: string) {
  switch (estado) {
    case "Abierto": return "bg-destructive/15 text-destructive";
    case "En revisión": return "bg-warning/15 text-warning";
    case "Cerrado": return "bg-success/15 text-success";
    default: return "bg-muted text-muted-foreground";
  }
}


/* ── Main Component ── */
function Feedback() {
  const [tab, setTab] = useState<"calificaciones" | "incidentalidad">("calificaciones");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "conductor" | "usuario">("todos");
  const [showNuevaCal, setShowNuevaCal] = useState(false);
  const [showNuevoInc, setShowNuevoInc] = useState(false);
  const [expandedInc, setExpandedInc] = useState<string | null>(null);

  const [newCal, setNewCal] = useState({ tipo: "conductor" as "conductor" | "usuario", nombre: "", servicio: "", estrellas: 0, mejoras: "" });
  const [newInc, setNewInc] = useState({ conductor: "", vehiculo: "", tipoIncidente: "", quePaso: "", cuando: "", porQue: "", soporte: "", solucion: "", planMejoramiento: "" });

  const calFiltradas = calificaciones.filter((c) => filtroTipo === "todos" || c.tipo === filtroTipo);

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Feedback y Calificaciones</h1>
            <p className="text-sm text-muted-foreground">Evaluaciones y reporte de incidentalidad</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          <button
            onClick={() => setTab("calificaciones")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "calificaciones" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Star className="h-4 w-4" /> Calificaciones
          </button>
          <button
            onClick={() => setTab("incidentalidad")}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "incidentalidad" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldAlert className="h-4 w-4" /> Incidentalidad
          </button>
        </div>

        {/* ═══ CALIFICACIONES TAB ═══ */}
        {tab === "calificaciones" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {(["todos", "conductor", "usuario"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFiltroTipo(f)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      filtroTipo === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f === "todos" ? "Todos" : f === "conductor" ? "Conductores" : "Usuarios"}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowNuevaCal(!showNuevaCal)}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" /> Nueva Calificación
              </button>
            </div>

            {showNuevaCal && (
              <div className="rounded-lg border border-primary/30 bg-card p-5 space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Registrar Calificación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
                    <select value={newCal.tipo} onChange={(e) => setNewCal({ ...newCal, tipo: e.target.value as "conductor" | "usuario" })} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                      <option value="conductor">Conductor</option>
                      <option value="usuario">Usuario</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Nombre</label>
                    <input value={newCal.nombre} onChange={(e) => setNewCal({ ...newCal, nombre: e.target.value })} placeholder="Nombre completo" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Servicio asociado</label>
                    <input value={newCal.servicio} onChange={(e) => setNewCal({ ...newCal, servicio: e.target.value })} placeholder="SRV-XXXX" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Calificación</label>
                    <StarRating value={newCal.estrellas} onChange={(v) => setNewCal({ ...newCal, estrellas: v })} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">¿Qué se puede mejorar?</label>
                  <textarea value={newCal.mejoras} onChange={(e) => setNewCal({ ...newCal, mejoras: e.target.value })} rows={3} placeholder="Describe las observaciones o mejoras sugeridas..." className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowNuevaCal(false)} className="px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
                  <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Guardar</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {calFiltradas.map((c) => (
                <div key={c.id} className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">{c.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.tipo === "conductor" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent-foreground"}`}>
                        {c.tipo === "conductor" ? "Conductor" : "Usuario"}
                      </span>
                    </div>
                    <StarRating value={c.estrellas} readonly />
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground">Servicio {c.servicio} · {c.fecha}</p>
                  </div>
                  <div className="mt-2 rounded-md bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">Observaciones / Mejoras</p>
                    <p className="text-sm">{c.mejoras}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ ACCIDENTALIDAD / INCIDENTALIDAD TAB ═══ */}
        {tab === "incidentalidad" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Registro y seguimiento de accidentes, multas, comparendos e incidentes viales</p>
              <button
                onClick={() => setShowNuevoInc(!showNuevoInc)}
                className="flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                <Plus className="h-4 w-4" /> Reportar Incidente
              </button>
            </div>

            {showNuevoInc && (
              <div className="rounded-lg border border-destructive/30 bg-card p-5 space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-destructive" /> Reporte de Incidentalidad</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Tipo de incidente</label>
                    <select value={newInc.tipoIncidente} onChange={(e) => setNewInc({ ...newInc, tipoIncidente: e.target.value })} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                      <option value="">Seleccionar...</option>
                      {tiposIncidente.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Conductor</label>
                    <input value={newInc.conductor} onChange={(e) => setNewInc({ ...newInc, conductor: e.target.value })} placeholder="Nombre del conductor" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Vehículo (placa)</label>
                    <input value={newInc.vehiculo} onChange={(e) => setNewInc({ ...newInc, vehiculo: e.target.value })} placeholder="ABC-123" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">¿Qué pasó?</label>
                  <textarea value={newInc.quePaso} onChange={(e) => setNewInc({ ...newInc, quePaso: e.target.value })} rows={2} placeholder="Describa el incidente..." className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">¿Cuándo?</label>
                  <input value={newInc.cuando} onChange={(e) => setNewInc({ ...newInc, cuando: e.target.value })} placeholder="Fecha y hora del incidente" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">¿Por qué?</label>
                  <textarea value={newInc.porQue} onChange={(e) => setNewInc({ ...newInc, porQue: e.target.value })} rows={2} placeholder="Causa probable..." className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Soporte (evidencias)</label>
                  <textarea value={newInc.soporte} onChange={(e) => setNewInc({ ...newInc, soporte: e.target.value })} rows={2} placeholder="Fotos, videos, testimonios, comparendos..." className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
                  <button className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline"><Upload className="h-3.5 w-3.5" /> Adjuntar archivos</button>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Solución</label>
                  <textarea value={newInc.solucion} onChange={(e) => setNewInc({ ...newInc, solucion: e.target.value })} rows={2} placeholder="Acciones correctivas tomadas..." className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Plan de Mejoramiento</label>
                  <textarea value={newInc.planMejoramiento} onChange={(e) => setNewInc({ ...newInc, planMejoramiento: e.target.value })} rows={2} placeholder="Acciones preventivas y capacitaciones..." className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowNuevoInc(false)} className="px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
                  <button className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors">Registrar Incidente</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {incidentes.map((a) => (
                <div key={a.id} className="rounded-lg border border-border bg-card overflow-hidden hover:border-destructive/30 transition-colors">
                  <button onClick={() => setExpandedInc(expandedInc === a.id ? null : a.id)} className="w-full p-4 text-left">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                        <span className="text-sm font-bold">{a.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getEstadoIncidente(a.estado)}`}>{a.estado}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-secondary text-foreground">{a.tipoIncidente}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{a.fecha}</span>
                        {expandedInc === a.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                    <p className="mt-1 text-sm">{a.quePaso}</p>
                    <p className="text-xs text-muted-foreground mt-1">Conductor: {a.conductor} · Vehículo: {a.vehiculo}</p>
                  </button>
                  {expandedInc === a.id && (
                    <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                      {[
                        { label: "Tipo de Incidente", value: a.tipoIncidente },
                        { label: "¿Qué pasó?", value: a.quePaso },
                        { label: "¿Cuándo?", value: a.cuando },
                        { label: "¿Por qué?", value: a.porQue },
                        { label: "Soporte / Evidencias", value: a.soporte },
                        { label: "Solución", value: a.solucion },
                        { label: "Plan de Mejoramiento", value: a.planMejoramiento },
                      ].map((item) => (
                        <div key={item.label} className="rounded-md bg-secondary/50 p-3">
                          <p className="text-xs text-muted-foreground mb-0.5 font-medium">{item.label}</p>
                          <p className="text-sm">{item.value}</p>
                        </div>
                      ))}
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
