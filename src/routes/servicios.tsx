import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { Plus, Filter, Clock, MapPin, Loader2, Trash2, AlertTriangle, Accessibility, ShieldCheck, Route as RouteIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { CardGridSkeleton } from "@/components/ui/loading-skeletons";
import { SpeakButton } from "@/components/SpeakButton";
import { Pictograma } from "@/components/Pictograma";
import { SimplifyText } from "@/components/SimplifyText";
import { generarBrief, type PasajeroPCD, TIPOS_DISC } from "@/lib/pcd-helpers";
import { SolicitudesEntrantes } from "@/components/operacion/SolicitudesEntrantes";
import { AddressAutocomplete, type ExtraSuggestion } from "@/components/AddressAutocomplete";
import { ConductorPicker } from "@/components/servicios/ConductorPicker";
import { VehiculoPicker } from "@/components/servicios/VehiculoPicker";
import { ParadasEditor, nuevaParada, type ParadaDraft } from "@/components/servicios/ParadasEditor";

function isVencido(fecha: string | null | undefined): boolean {
  if (!fecha) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fecha);
  f.setHours(0, 0, 0, 0);
  return f.getTime() < hoy.getTime();
}

interface ConductorOpt {
  id: string;
  nombre: string;
  cliente: "corona" | "sodimac" | "hospital_sur" | null;
  clientes: ("corona" | "sodimac" | "hospital_sur")[] | null;
  estado: string;
  vence_licencia: string | null;
  foto_url: string | null;
}

interface VehiculoOpt {
  id: string;
  placa: string;
  marca: string | null;
  linea: string | null;
  cliente: "corona" | "sodimac" | "hospital_sur" | null;
  clientes: ("corona" | "sodimac" | "hospital_sur")[] | null;
  estado: string;
  vence_soat: string | null;
  vence_rtm: string | null;
  foto_url: string | null;
}

interface VehConductorRel {
  conductor_id: string;
  vehiculo_id: string;
  es_principal: boolean;
  asignado_hasta: string | null;
}

export const Route = createFileRoute("/servicios")({
  component: Servicios,
  head: () => ({
    meta: [
      { title: "Servicios - TRAMMOS" },
      { name: "description", content: "Gestión de trayectos y servicios de transporte" },
    ],
  }),
});

interface ServicioRow {
  id: string;
  cliente: "corona" | "sodimac" | "hospital_sur";
  numero_orden: string | null;
  fecha: string;
  hora: string | null;
  origen: string | null;
  destino: string | null;
  pasajero: string | null;
  centro_costo: string | null;
  conductor: string | null;
  vehiculo: string | null;
  estado: string;
  pasajero_pcd_id: string | null;
  es_multidestino: boolean | null;
  iniciado_at: string | null;
  finalizado_at: string | null;
}

/** ISO → valor para <input type="datetime-local"> en hora local */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

interface ParadaRow {
  id: string;
  servicio_id: string;
  orden: number;
  direccion: string;
  hora_estimada: string | null;
  nota: string | null;
}

function estadoStyle(e: string) {
  switch (e) {
    case "En curso": return "bg-primary/15 text-primary";
    case "Programado": return "bg-warning/15 text-warning";
    case "Finalizado": return "bg-success/15 text-success";
    case "Cancelado": return "bg-destructive/15 text-destructive";
    default: return "bg-muted text-muted-foreground";
  }
}

function Servicios() {
  const navigate = useNavigate();
  const { role, cliente, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ServicioRow[]>([]);
  const [conductoresAll, setConductoresAll] = useState<ConductorOpt[]>([]);
  const [vehiculosAll, setVehiculosAll] = useState<VehiculoOpt[]>([]);
  const [vehConductores, setVehConductores] = useState<VehConductorRel[]>([]);
  const [centrosRutas, setCentrosRutas] = useState<{ codigo: string; origen: string; destino: string; departamento: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("Todos");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paradasPorServicio, setParadasPorServicio] = useState<Record<string, ParadaRow[]>>({});
  const [editandoOrden, setEditandoOrden] = useState(false);
  const [multidestino, setMultidestino] = useState(false);
  const [paradas, setParadas] = useState<ParadaDraft[]>([nuevaParada(), nuevaParada()]);

  // ... keep existing code (form state)
  const [pasajerosPCD, setPasajerosPCD] = useState<PasajeroPCD[]>([]);
  const [form, setForm] = useState({
    cliente: (cliente ?? "corona") as "corona" | "sodimac" | "hospital_sur",
    numero_orden: "",
    fecha: new Date().toISOString().slice(0, 10),
    hora: "08:00",
    origen: "",
    destino: "",
    pasajero: "",
    pasajero_pcd_id: "" as string,
    centro_costo: "",
    conductor: "",
    vehiculo: "",
    estado: "Programado",
  });

  const clienteActivo = (cliente ?? form.cliente) as "corona" | "sodimac" | "hospital_sur";
  const usaCentroCosto = clienteActivo !== "hospital_sur";

  useEffect(() => {
    if (!authLoading && !role) navigate({ to: "/login" });
  }, [authLoading, role, navigate]);

  useEffect(() => {
    if (!role) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // Consecutivo automático de orden de servicio al abrir el formulario
  useEffect(() => {
    if (!showForm) return;
    let cancelado = false;
    (async () => {
      const { data, error } = await supabase.rpc("siguiente_orden_servicio");
      if (!cancelado && !error && typeof data === "string") {
        setForm((f) => ({ ...f, numero_orden: data }));
        setEditandoOrden(false);
      }
    })();
    return () => { cancelado = true; };
  }, [showForm]);

  async function load() {
    setLoading(true);
    const [serviciosRes, conductoresRes, vehiculosRes, pcdRes, vcRes, centrosRes, paradasRes] = await Promise.all([
      supabase.from("servicios").select("*").order("fecha", { ascending: false }).order("hora", { ascending: false }),
      supabase.from("conductores").select("id,nombre,cliente,clientes,estado,vence_licencia,foto_url"),
      supabase.from("vehiculos").select("id,placa,marca,linea,cliente,clientes,estado,vence_soat,vence_rtm,foto_url"),
      supabase.from("pasajeros_pcd").select("*").order("nombre"),
      supabase.from("vehiculo_conductores").select("conductor_id,vehiculo_id,es_principal,asignado_hasta"),
      supabase.from("centros_costo").select("codigo,origen,destino,departamento").eq("activo", true).order("codigo"),
      supabase.from("servicio_paradas").select("*").order("orden"),
    ]);
    if (!serviciosRes.error && serviciosRes.data) setItems(serviciosRes.data as ServicioRow[]);
    if (!conductoresRes.error && conductoresRes.data) setConductoresAll(conductoresRes.data as ConductorOpt[]);
    if (!vehiculosRes.error && vehiculosRes.data) setVehiculosAll(vehiculosRes.data as VehiculoOpt[]);
    if (!pcdRes.error && pcdRes.data) setPasajerosPCD(pcdRes.data as PasajeroPCD[]);
    if (!vcRes.error && vcRes.data) setVehConductores(vcRes.data as VehConductorRel[]);
    if (!centrosRes.error && centrosRes.data) setCentrosRutas(centrosRes.data as typeof centrosRutas);
    if (!paradasRes.error && paradasRes.data) {
      const mapa: Record<string, ParadaRow[]> = {};
      for (const p of paradasRes.data as ParadaRow[]) {
        (mapa[p.servicio_id] ??= []).push(p);
      }
      setParadasPorServicio(mapa);
    }
    setLoading(false);
  }

  // Un conductor/vehículo es elegible si:
  //  - está asignado al cliente del servicio (en `clientes[]` o legacy `cliente`), O
  //  - no está asignado a ningún cliente (queda como recurso compartido / pool)
  // Solo se excluye si está asignado explícitamente a otros clientes que NO incluyen el del servicio.
  function perteneceA(cs: ("corona" | "sodimac" | "hospital_sur")[] | null | undefined, cliLegacy: "corona" | "sodimac" | "hospital_sur" | null, target: "corona" | "sodimac" | "hospital_sur"): boolean {
    const arr = (cs && cs.length > 0) ? cs : (cliLegacy ? [cliLegacy] : []);
    if (arr.length === 0) return true; // sin asignar → disponible para todos
    return arr.includes(target);
  }

  const conductoresDisponibles = useMemo(() => {
    const clienteForm = (cliente ?? form.cliente) as "corona" | "sodimac" | "hospital_sur";
    return conductoresAll.filter((c) =>
      perteneceA(c.clientes, c.cliente, clienteForm) &&
      c.estado !== "Inactivo" &&
      !isVencido(c.vence_licencia)
    );
  }, [conductoresAll, cliente, form.cliente]);

  const vehiculosDisponibles = useMemo(() => {
    const clienteForm = (cliente ?? form.cliente) as "corona" | "sodimac" | "hospital_sur";
    return vehiculosAll.filter((v) =>
      perteneceA(v.clientes, v.cliente, clienteForm) &&
      v.estado !== "Inactivo" &&
      !isVencido(v.vence_soat) &&
      !isVencido(v.vence_rtm)
    );
  }, [vehiculosAll, cliente, form.cliente]);

  const sugerenciasOrigen: ExtraSuggestion[] = useMemo(() => {
    const seen = new Set<string>();
    const out: ExtraSuggestion[] = [];
    for (const r of centrosRutas) {
      const key = r.origen.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({ label: r.origen, sublabel: [r.codigo, r.departamento].filter(Boolean).join(" · "), group: "Rutas de Operación" });
    }
    return out;
  }, [centrosRutas]);

  const sugerenciasDestino: ExtraSuggestion[] = useMemo(() => {
    const seen = new Set<string>();
    const out: ExtraSuggestion[] = [];
    for (const r of centrosRutas) {
      const key = r.destino.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({ label: r.destino, sublabel: [r.codigo, r.departamento].filter(Boolean).join(" · "), group: "Rutas de Operación" });
    }
    return out;
  }, [centrosRutas]);

  // Devuelve las placas asignadas al conductor (por nombre), principal primero,
  // filtradas por las disponibles (cliente, estado, SOAT/RTM vigentes).
  function placasDeConductor(nombreConductor: string | null | undefined): VehiculoOpt[] {
    if (!nombreConductor) return [];
    const cond = conductoresAll.find(
      (c) => c.nombre.trim().toLowerCase() === nombreConductor.trim().toLowerCase()
    );
    if (!cond) return [];
    const hoy = new Date().toISOString().slice(0, 10);
    const rels = vehConductores
      .filter((r) => r.conductor_id === cond.id && (!r.asignado_hasta || r.asignado_hasta >= hoy))
      .sort((a, b) => Number(b.es_principal) - Number(a.es_principal));
    const placas: VehiculoOpt[] = [];
    for (const r of rels) {
      const v = vehiculosDisponibles.find((vv) => vv.id === r.vehiculo_id);
      if (v && !placas.some((p) => p.id === v.id)) placas.push(v);
    }
    return placas;
  }

  // Conductores con foto y placa principal para el desplegable
  const conductoresPicker = conductoresDisponibles.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    foto_url: c.foto_url,
    placa: placasDeConductor(c.nombre)[0]?.placa ?? null,
  }));


  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const paradasValidas = paradas.filter((p) => p.direccion.trim());
    if (multidestino && paradasValidas.length < 2) {
      alert("Un multiservicio necesita al menos 2 paradas con dirección.");
      return;
    }
    setSaving(true);
    // Si seleccionó un pasajero PCD, usamos su nombre como "pasajero" textual también
    const pcdSel = pasajerosPCD.find((p) => p.id === form.pasajero_pcd_id);
    const payload = {
      ...form,
      cliente: cliente ?? form.cliente,
      centro_costo: usaCentroCosto ? form.centro_costo : null,
      pasajero: pcdSel ? pcdSel.nombre : form.pasajero,
      pasajero_pcd_id: form.pasajero_pcd_id || null,
      es_multidestino: multidestino,
      destino: multidestino ? paradasValidas[paradasValidas.length - 1].direccion : form.destino,
    };
    const { data: creado, error } = await supabase.from("servicios").insert(payload).select("id").single();
    if (!error && creado && multidestino) {
      const filas = paradasValidas.map((p, i) => ({
        servicio_id: creado.id,
        orden: i + 1,
        direccion: p.direccion.trim(),
        hora_estimada: p.hora_estimada || null,
        nota: p.nota || null,
      }));
      const { error: errP } = await supabase.from("servicio_paradas").insert(filas);
      if (errP) {
        setSaving(false);
        alert("El servicio se creó pero las paradas fallaron: " + errP.message);
        load();
        return;
      }
    }
    setSaving(false);
    if (error) {
      alert("Error: " + error.message);
      return;
    }
    setShowForm(false);
    setMultidestino(false);
    setParadas([nuevaParada(), nuevaParada()]);
    setForm({ ...form, numero_orden: "", origen: "", destino: "", pasajero: "", pasajero_pcd_id: "", conductor: "", vehiculo: "" });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este servicio?")) return;
    const { error } = await supabase.from("servicios").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    load();
  }

  async function handleEstadoChange(id: string, nuevoEstado: string) {
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, estado: nuevoEstado } : s)));
    const { error } = await supabase.from("servicios").update({ estado: nuevoEstado }).eq("id", id);
    if (error) {
      alert("Error al actualizar estado: " + error.message);
      load();
      return;
    }
    // Disparar envío de notificación push (el trigger de BD ya encoló)
    fetch("/api/public/push/process", { method: "POST" }).catch(() => { /* ignore */ });
  }

  /** Editar manualmente la hora de inicio o de finalización real del servicio */
  async function handleTiempoChange(id: string, campo: "iniciado_at" | "finalizado_at", local: string) {
    const iso = local ? new Date(local).toISOString() : null;
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, [campo]: iso } : s)));
    const { error } = await supabase.from("servicios").update({ [campo]: iso }).eq("id", id);
    if (error) {
      alert("No se pudo guardar la hora: " + error.message);
      load();
    }
  }

  async function handleFieldChange(id: string, campo: "conductor" | "vehiculo", valor: string) {
    const nuevoValor = valor === "" ? null : valor;

    // Si se asigna conductor: auto-llenar vehículo si solo tiene 1 asignado;
    // si tiene varios, limpiar el vehículo previo (deja al usuario elegir entre los suyos).
    let placaAuto: string | null | undefined;
    if (campo === "conductor") {
      const placas = placasDeConductor(nuevoValor);
      const servicioActual = items.find((s) => s.id === id);
      if (placas.length === 1) {
        placaAuto = placas[0].placa;
      } else if (placas.length > 1) {
        // Si la placa actual no pertenece al nuevo conductor, limpiar
        if (servicioActual?.vehiculo && !placas.some((p) => p.placa === servicioActual.vehiculo)) {
          placaAuto = null;
        }
      } else if (nuevoValor === null) {
        // Quitar conductor: no tocar vehículo automáticamente
        placaAuto = undefined;
      }
    }

    setItems((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      const next = { ...s, [campo]: nuevoValor } as ServicioRow;
      if (campo === "conductor" && placaAuto !== undefined) next.vehiculo = placaAuto;
      return next;
    }));

    const payload: { conductor?: string | null; vehiculo?: string | null } =
      campo === "conductor" ? { conductor: nuevoValor } : { vehiculo: nuevoValor };
    if (campo === "conductor" && placaAuto !== undefined) payload.vehiculo = placaAuto;

    const { error } = await supabase.from("servicios").update(payload).eq("id", id);
    if (error) {
      alert(`Error al actualizar ${campo}: ` + error.message);
      load();
      return;
    }
    // Disparar envío de notificación push si se asignó conductor/vehículo
    if (campo === "conductor" && nuevoValor) {
      fetch("/api/public/push/process", { method: "POST" }).catch(() => { /* ignore */ });
    }
  }

  const filtered = items.filter((s) => filtro === "Todos" || s.estado === filtro);

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Servicios</h1>
            <p className="text-sm text-muted-foreground">
              {role === "admin" ? "Todos los clientes" : `Cliente: ${cliente}`}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Nuevo Servicio
          </button>
        </div>

        {/* Solicitudes entrantes en vivo (pasajeros) — aceptar / asignar conductor desde aquí */}
        <SolicitudesEntrantes />

        {showForm && (
          <form onSubmit={handleCreate} className="rounded-xl border border-primary/30 bg-card p-5 md:p-6 space-y-6 max-w-4xl mx-auto">
            {/* ── 1. Datos de la orden ───────────────────────────── */}
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary">Datos de la orden</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Orden de servicio</label>
                  <div className="flex items-center gap-2">
                    <input
                      required
                      readOnly={!editandoOrden}
                      value={form.numero_orden}
                      onChange={(e) => setForm({ ...form, numero_orden: e.target.value })}
                      placeholder="OS-000001"
                      className={`w-full rounded-md border border-input px-3 py-2 text-sm font-semibold ${editandoOrden ? "bg-background" : "bg-muted text-muted-foreground"}`}
                    />
                    <button type="button" onClick={() => setEditandoOrden((v) => !v)} className="shrink-0 text-[11px] text-primary hover:underline">
                      {editandoOrden ? "auto" : "editar"}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">Consecutivo automático</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Fecha</label>
                  <input type="date" required value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Hora</label>
                  <input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                </div>
                {role === "admin" && (
                  <div className="md:col-span-3">
                    <label className="text-xs text-muted-foreground">Cliente</label>
                    <select
                      value={form.cliente}
                      onChange={(e) => setForm({ ...form, cliente: e.target.value as "corona" | "sodimac" | "hospital_sur" })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="corona">Corona</option>
                      <option value="sodimac">Sodimac</option>
                      <option value="hospital_sur">Hospital del Sur</option>
                    </select>
                  </div>
                )}
              </div>
            </section>

            {/* ── 2. Ruta ────────────────────────────────────────── */}
            <section className="space-y-3 border-t border-border pt-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary">Ruta</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                <div>
                  <label className="text-xs text-muted-foreground">Origen</label>
                  <AddressAutocomplete
                    value={form.origen}
                    onChange={(v) => setForm({ ...form, origen: v })}
                    extraSuggestions={sugerenciasOrigen}
                    placeholder="Buscar dirección o ruta…"
                    required
                    inputClassName="h-10 text-sm"
                  />
                </div>
                {!multidestino && (
                  <div>
                    <label className="text-xs text-muted-foreground">Destino</label>
                    <AddressAutocomplete
                      value={form.destino}
                      onChange={(v) => setForm({ ...form, destino: v })}
                      extraSuggestions={sugerenciasDestino}
                      placeholder="Buscar dirección o ruta…"
                      required
                      inputClassName="h-10 text-sm"
                    />
                  </div>
                )}
              </div>

              <label className="flex items-start gap-2 rounded-lg border border-primary/25 bg-primary/5 p-3 cursor-pointer max-w-3xl mx-auto">
                <input
                  type="checkbox"
                  checked={multidestino}
                  onChange={(e) => setMultidestino(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
                />
                <span className="text-sm">
                  <span className="font-medium">Multiservicio (varios destinos)</span>
                  <span className="block text-xs text-muted-foreground">Un solo servicio con varias paradas en orden</span>
                </span>
              </label>

              {multidestino && (
                <div className="max-w-3xl mx-auto">
                  <ParadasEditor paradas={paradas} onChange={setParadas} sugerencias={sugerenciasDestino} />
                </div>
              )}
            </section>

            {/* ── 3. Pasajero ────────────────────────────────────── */}
            <section className="space-y-3 border-t border-border pt-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary">Pasajero</h2>
              <div className="max-w-3xl mx-auto space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Accessibility className="h-3 w-3 text-primary" aria-hidden="true" />
                    Pasajero registrado (perfil PCD)
                  </label>
                  <select
                    value={form.pasajero_pcd_id}
                    onChange={(e) => {
                      const id = e.target.value;
                      const sel = pasajerosPCD.find((p) => p.id === id);
                      setForm({
                        ...form,
                        pasajero_pcd_id: id,
                        pasajero: sel ? sel.nombre : form.pasajero,
                      });
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">— Sin perfil registrado —</option>
                    {pasajerosPCD
                      .filter((p) => p.cliente === clienteActivo)
                      .map((p) => {
                        const tipo = TIPOS_DISC.find((t) => t.value === p.tipo_discapacidad)!;
                        const tag = p.tipo_discapacidad === "ninguna" ? "" : ` · ${tipo.label}`;
                        const adapt = p.requiere_vehiculo_adaptado ? " · Vehículo adaptado" : "";
                        return (
                          <option key={p.id} value={p.id}>
                            {p.nombre}{tag}{adapt}
                          </option>
                        );
                      })}
                  </select>
                  {form.pasajero_pcd_id && (() => {
                    const sel = pasajerosPCD.find((p) => p.id === form.pasajero_pcd_id);
                    if (!sel) return null;
                    const brief = generarBrief(sel);
                    return (
                      <div className="mt-2 rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm">
                        <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          Brief automático para el conductor
                        </div>
                        <SimplifyText text={brief} className="text-foreground" />
                      </div>
                    );
                  })()}
                </div>

                {!form.pasajero_pcd_id && (
                  <div className="rounded-lg border border-dashed border-border p-3">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pasajero no registrado</label>
                    <input
                      value={form.pasajero}
                      onChange={(e) => setForm({ ...form, pasajero: e.target.value })}
                      placeholder="Nombre del pasajero ocasional"
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                )}

                {usaCentroCosto && (
                  <div>
                    <label className="text-xs text-muted-foreground">Centro de costo</label>
                    <input value={form.centro_costo} onChange={(e) => setForm({ ...form, centro_costo: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                  </div>
                )}
              </div>
            </section>

            {/* ── 4. Asignación ──────────────────────────────────── */}
            <section className="space-y-3 border-t border-border pt-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary">Asignación</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                <div>
                  <label className="text-xs text-muted-foreground">Conductor</label>
                  <ConductorPicker
                    value={form.conductor}
                    items={conductoresPicker}
                    disabled={conductoresDisponibles.length === 0}
                    onChange={(nombre) => {
                      const placas = placasDeConductor(nombre);
                      let nuevaPlaca = form.vehiculo;
                      if (placas.length === 1) nuevaPlaca = placas[0].placa;
                      else if (placas.length > 1 && !placas.some((p) => p.placa === form.vehiculo)) nuevaPlaca = "";
                      setForm({ ...form, conductor: nombre, vehiculo: nuevaPlaca });
                    }}
                  />
                  {conductoresDisponibles.length === 0 && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-warning">
                      <AlertTriangle className="h-3 w-3" /> Actualiza licencias vencidas en Conductores
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Vehículo (placa)</label>
                  {(() => {
                    const placasCond = placasDeConductor(form.conductor);
                    const tieneConductor = !!form.conductor;
                    const lista = tieneConductor && placasCond.length > 0 ? placasCond : vehiculosDisponibles;
                    return (
                      <>
                        <VehiculoPicker
                          value={form.vehiculo}
                          items={lista}
                          disabled={lista.length === 0}
                          onChange={(placa) => setForm({ ...form, vehiculo: placa })}
                        />
                        {tieneConductor && placasCond.length === 0 && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-warning">
                            <AlertTriangle className="h-3 w-3" /> Asigna un vehículo a este conductor en Vehículos
                          </p>
                        )}
                        {tieneConductor && placasCond.length > 1 && (
                          <p className="mt-1 text-[11px] text-muted-foreground">El conductor maneja {placasCond.length} vehículos · selecciona uno</p>
                        )}
                        {!tieneConductor && vehiculosDisponibles.length === 0 && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-warning">
                            <AlertTriangle className="h-3 w-3" /> Actualiza SOAT/RTM vencidos en Vehículos
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </section>

            {/* ── 5. Estado ──────────────────────────────────────── */}
            <section className="space-y-3 border-t border-border pt-5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary">Estado</h2>
              <div className="flex flex-wrap gap-2 max-w-3xl mx-auto">
                {["Programado", "En curso", "Finalizado", "Cancelado"].map((x) => (
                  <button
                    key={x}
                    type="button"
                    onClick={() => setForm({ ...form, estado: x })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.estado === x ? `${estadoStyle(x)} border-current` : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {x}
                  </button>
                ))}
              </div>
            </section>

            <div className="flex gap-2 justify-end border-t border-border pt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
                {saving ? "Guardando..." : "Guardar servicio"}
              </button>
            </div>
          </form>
        )}


        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          {["Todos", "Programado", "En curso", "Finalizado", "Cancelado"].map((e) => (
            <button
              key={e}
              onClick={() => setFiltro(e)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium ${filtro === e ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              {e}
            </button>
          ))}
        </div>

        {loading ? (
          <CardGridSkeleton count={5} />
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No hay servicios. Crea el primero con "Nuevo Servicio".
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s, i) => (
              <div
                key={s.id}
                className="stagger-item rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors"
                style={{ ["--i" as string]: i } as React.CSSProperties}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-wrap">
                    {s.numero_orden ? (
                      <span className="text-xs font-bold text-foreground">OS: {s.numero_orden}</span>
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">{s.id.slice(0, 8)}</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoStyle(s.estado)}`}>{s.estado}</span>
                    {role === "admin" && <span className="text-xs px-2 py-0.5 rounded-full bg-secondary capitalize">{s.cliente}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" aria-hidden="true" />{s.fecha} · {s.hora}
                    </div>
                    <SpeakButton
                      text={[
                        s.numero_orden ? `Orden ${s.numero_orden}` : `Servicio`,
                        `Estado ${s.estado}`,
                        `Fecha ${s.fecha}${s.hora ? ` a las ${s.hora}` : ""}`,
                        s.origen ? `Origen ${s.origen}` : "",
                        s.destino ? `Destino ${s.destino}` : "",
                        s.pasajero ? `Pasajero ${s.pasajero}` : "",
                        s.conductor ? `Conductor ${s.conductor}` : "",
                        s.vehiculo ? `Vehículo ${s.vehiculo}` : "",
                      ].filter(Boolean).join(". ")}
                      label="Escuchar detalles del servicio"
                    />
                    <select
                      value={s.estado}
                      onChange={(e) => handleEstadoChange(s.id, e.target.value)}
                      aria-label="Cambiar estado del servicio"
                      className="text-xs rounded-md border border-input bg-background px-2 py-1 hover:border-primary/50 cursor-pointer"
                      title="Cambiar estado"
                    >
                      {["Programado", "En curso", "Finalizado", "Cancelado"].map((x) => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleDelete(s.id)}
                      aria-label="Eliminar servicio"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                {s.es_multidestino ? (
                  <div className="mt-3 rounded-lg border border-primary/25 bg-primary/5 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-2">
                      <RouteIcon className="h-3.5 w-3.5" aria-hidden="true" /> Multiservicio · {(paradasPorServicio[s.id] ?? []).length} paradas
                    </div>
                    <ol className="space-y-1 text-sm">
                      {s.origen && (
                        <li className="flex items-start gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" aria-hidden="true" />
                          <span>Salida: {s.origen}</span>
                        </li>
                      )}
                      {(paradasPorServicio[s.id] ?? []).map((p) => (
                        <li key={p.id} className="flex items-start gap-2">
                          <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-primary/15 text-[10px] font-bold text-primary flex items-center justify-center">{p.orden}</span>
                          <span>
                            {p.direccion}
                            {p.hora_estimada && <span className="text-xs text-muted-foreground"> · {p.hora_estimada.slice(0, 5)}</span>}
                            {p.nota && <span className="block text-xs text-muted-foreground">{p.nota}</span>}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    <span>{s.origen}</span>
                    <span className="text-muted-foreground">→</span>
                    <span>{s.destino}</span>
                  </div>
                )}
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div><span className="text-muted-foreground">Pasajero</span><p className="font-medium">{s.pasajero || "—"}</p></div>
                  {s.cliente !== "hospital_sur" && (
                    <div><span className="text-muted-foreground">Centro costo</span><p className="font-medium">{s.centro_costo || "—"}</p></div>
                  )}
                  <div>
                    <label className="text-muted-foreground" htmlFor={`cond-${s.id}`}>Conductor</label>
                    <select
                      id={`cond-${s.id}`}
                      value={s.conductor ?? ""}
                      onChange={(e) => handleFieldChange(s.id, "conductor", e.target.value)}
                      aria-label="Asignar conductor"
                      className={`mt-0.5 w-full rounded-md border bg-background px-2 py-1 text-xs hover:border-primary/50 cursor-pointer ${
                        !s.conductor && s.estado === "Programado"
                          ? "border-destructive/60 text-destructive font-medium"
                          : "border-input font-medium"
                      }`}
                    >
                      <option value="">{!s.conductor && s.estado === "Programado" ? "⚠ Sin asignar" : "— Sin asignar —"}</option>
                      {/* Conductor actual aunque ya no esté disponible (ej. licencia vencida después) */}
                      {s.conductor && !conductoresDisponibles.some((c) => c.nombre === s.conductor) && (
                        <option value={s.conductor}>{s.conductor} (no disponible)</option>
                      )}
                      {conductoresDisponibles.map((c) => (
                        <option key={c.id} value={c.nombre}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-muted-foreground" htmlFor={`veh-${s.id}`}>Vehículo</label>
                    {(() => {
                      const placasCond = placasDeConductor(s.conductor);
                      const lista = s.conductor && placasCond.length > 0 ? placasCond : vehiculosDisponibles;
                      const autoUnico = !!s.conductor && placasCond.length === 1;
                      return (
                        <select
                          id={`veh-${s.id}`}
                          value={s.vehiculo ?? ""}
                          onChange={(e) => handleFieldChange(s.id, "vehiculo", e.target.value)}
                          aria-label="Asignar vehículo"
                          disabled={autoUnico}
                          title={autoUnico ? "Auto-asignado: único vehículo del conductor" : undefined}
                          className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-xs font-medium hover:border-primary/50 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          <option value="">— Sin asignar —</option>
                          {s.vehiculo && !lista.some((v) => v.placa === s.vehiculo) && (
                            <option value={s.vehiculo}>{s.vehiculo} (no disponible)</option>
                          )}
                          {lista.map((v) => (
                            <option key={v.id} value={v.placa}>{v.placa}</option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>
                </div>

                {s.pasajero_pcd_id && (() => {
                  const pcd = pasajerosPCD.find((p) => p.id === s.pasajero_pcd_id);
                  if (!pcd) return null;
                  const tipo = TIPOS_DISC.find((t) => t.value === pcd.tipo_discapacidad)!;
                  const brief = generarBrief(pcd);
                  return (
                    <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 p-3">
                      <div className="flex items-start gap-3">
                        <Pictograma name={tipo.picto} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                              <Accessibility className="h-3.5 w-3.5" aria-hidden="true" />
                              Pasajero con perfil PCD · {tipo.label}
                              {pcd.requiere_vehiculo_adaptado && (
                                <span className="text-warning">· Vehículo adaptado</span>
                              )}
                            </div>
                          </div>
                          <SimplifyText text={brief} className="text-xs text-foreground" />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
