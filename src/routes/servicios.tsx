import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { Plus, Filter, Clock, MapPin, Loader2, Trash2, AlertTriangle, Accessibility, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { CardGridSkeleton } from "@/components/ui/loading-skeletons";
import { SpeakButton } from "@/components/SpeakButton";
import { Pictograma } from "@/components/Pictograma";
import { SimplifyText } from "@/components/SimplifyText";
import { generarBrief, type PasajeroPCD, TIPOS_DISC } from "@/lib/pcd-helpers";
import { SolicitudesEntrantes } from "@/components/operacion/SolicitudesEntrantes";

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
  cliente: "corona" | "sodimac" | null;
  clientes: ("corona" | "sodimac")[] | null;
  estado: string;
  vence_licencia: string | null;
}

interface VehiculoOpt {
  id: string;
  placa: string;
  marca: string | null;
  linea: string | null;
  cliente: "corona" | "sodimac" | null;
  clientes: ("corona" | "sodimac")[] | null;
  estado: string;
  vence_soat: string | null;
  vence_rtm: string | null;
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
  cliente: "corona" | "sodimac";
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
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("Todos");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // ... keep existing code (form state)
  const [pasajerosPCD, setPasajerosPCD] = useState<PasajeroPCD[]>([]);
  const [form, setForm] = useState({
    cliente: (cliente ?? "corona") as "corona" | "sodimac",
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

  useEffect(() => {
    if (!authLoading && !role) navigate({ to: "/login" });
  }, [authLoading, role, navigate]);

  useEffect(() => {
    if (!role) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  async function load() {
    setLoading(true);
    const [serviciosRes, conductoresRes, vehiculosRes, pcdRes, vcRes] = await Promise.all([
      supabase.from("servicios").select("*").order("fecha", { ascending: false }).order("hora", { ascending: false }),
      supabase.from("conductores").select("id,nombre,cliente,clientes,estado,vence_licencia"),
      supabase.from("vehiculos").select("id,placa,marca,linea,cliente,clientes,estado,vence_soat,vence_rtm"),
      supabase.from("pasajeros_pcd").select("*").order("nombre"),
      supabase.from("vehiculo_conductores").select("conductor_id,vehiculo_id,es_principal,asignado_hasta"),
    ]);
    if (!serviciosRes.error && serviciosRes.data) setItems(serviciosRes.data as ServicioRow[]);
    if (!conductoresRes.error && conductoresRes.data) setConductoresAll(conductoresRes.data as ConductorOpt[]);
    if (!vehiculosRes.error && vehiculosRes.data) setVehiculosAll(vehiculosRes.data as VehiculoOpt[]);
    if (!pcdRes.error && pcdRes.data) setPasajerosPCD(pcdRes.data as PasajeroPCD[]);
    if (!vcRes.error && vcRes.data) setVehConductores(vcRes.data as VehConductorRel[]);
    setLoading(false);
  }

  // Un conductor/vehículo es elegible si:
  //  - está asignado al cliente del servicio (en `clientes[]` o legacy `cliente`), O
  //  - no está asignado a ningún cliente (queda como recurso compartido / pool)
  // Solo se excluye si está asignado explícitamente a otros clientes que NO incluyen el del servicio.
  function perteneceA(cs: ("corona" | "sodimac")[] | null | undefined, cliLegacy: "corona" | "sodimac" | null, target: "corona" | "sodimac"): boolean {
    const arr = (cs && cs.length > 0) ? cs : (cliLegacy ? [cliLegacy] : []);
    if (arr.length === 0) return true; // sin asignar → disponible para todos
    return arr.includes(target);
  }

  const conductoresDisponibles = useMemo(() => {
    const clienteForm = (cliente ?? form.cliente) as "corona" | "sodimac";
    return conductoresAll.filter((c) =>
      perteneceA(c.clientes, c.cliente, clienteForm) &&
      c.estado !== "Inactivo" &&
      !isVencido(c.vence_licencia)
    );
  }, [conductoresAll, cliente, form.cliente]);

  const vehiculosDisponibles = useMemo(() => {
    const clienteForm = (cliente ?? form.cliente) as "corona" | "sodimac";
    return vehiculosAll.filter((v) =>
      perteneceA(v.clientes, v.cliente, clienteForm) &&
      v.estado !== "Inactivo" &&
      !isVencido(v.vence_soat) &&
      !isVencido(v.vence_rtm)
    );
  }, [vehiculosAll, cliente, form.cliente]);

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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // Si seleccionó un pasajero PCD, usamos su nombre como "pasajero" textual también
    const pcdSel = pasajerosPCD.find((p) => p.id === form.pasajero_pcd_id);
    const payload = {
      ...form,
      cliente: cliente ?? form.cliente,
      pasajero: pcdSel ? pcdSel.nombre : form.pasajero,
      pasajero_pcd_id: form.pasajero_pcd_id || null,
    };
    const { error } = await supabase.from("servicios").insert(payload);
    setSaving(false);
    if (error) {
      alert("Error: " + error.message);
      return;
    }
    setShowForm(false);
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
          <form onSubmit={handleCreate} className="rounded-lg border border-primary/30 bg-card p-5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {role === "admin" && (
                <div>
                  <label className="text-xs text-muted-foreground">Cliente</label>
                  <select
                    value={form.cliente}
                    onChange={(e) => setForm({ ...form, cliente: e.target.value as "corona" | "sodimac" })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="corona">Corona</option>
                    <option value="sodimac">Sodimac</option>
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs text-muted-foreground">N° orden de servicio</label>
                <input required value={form.numero_orden} onChange={(e) => setForm({ ...form, numero_orden: e.target.value })} placeholder="Ej. OS-001234" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Fecha</label>
                <input type="date" required value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Hora</label>
                <input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Origen</label>
                <input required value={form.origen} onChange={(e) => setForm({ ...form, origen: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Destino</label>
                <input required value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Accessibility className="h-3 w-3 text-primary" aria-hidden="true" />
                  Pasajero registrado con perfil PCD (opcional, recomendado)
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
                  <option value="">— Sin perfil PCD (pasajero ocasional) —</option>
                  {pasajerosPCD
                    .filter((p) => p.cliente === (cliente ?? form.cliente))
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
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          Brief automático para el conductor
                        </div>
                      </div>
                      <SimplifyText text={brief} className="text-foreground" />
                    </div>
                  );
                })()}
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Pasajero (texto libre)</label>
                <input
                  value={form.pasajero}
                  onChange={(e) => setForm({ ...form, pasajero: e.target.value })}
                  placeholder={form.pasajero_pcd_id ? "Auto-completado del perfil PCD" : "Nombre del pasajero"}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Centro de costo</label>
                <input value={form.centro_costo} onChange={(e) => setForm({ ...form, centro_costo: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Conductor</label>
                <select
                  value={form.conductor}
                  onChange={(e) => setForm({ ...form, conductor: e.target.value })}
                  disabled={conductoresDisponibles.length === 0}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
                >
                  <option value="">{conductoresDisponibles.length === 0 ? "Sin conductores disponibles" : "Selecciona un conductor"}</option>
                  {conductoresDisponibles.map((c) => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
                {conductoresDisponibles.length === 0 && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-warning">
                    <AlertTriangle className="h-3 w-3" /> Actualiza licencias vencidas en Conductores
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Vehículo (placa)</label>
                <select
                  value={form.vehiculo}
                  onChange={(e) => setForm({ ...form, vehiculo: e.target.value })}
                  disabled={vehiculosDisponibles.length === 0}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-60"
                >
                  <option value="">{vehiculosDisponibles.length === 0 ? "Sin vehículos disponibles" : "Selecciona un vehículo"}</option>
                  {vehiculosDisponibles.map((v) => (
                    <option key={v.id} value={v.placa}>
                      {v.placa}{v.marca || v.linea ? ` — ${[v.marca, v.linea].filter(Boolean).join(" ")}` : ""}
                    </option>
                  ))}
                </select>
                {vehiculosDisponibles.length === 0 && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-warning">
                    <AlertTriangle className="h-3 w-3" /> Actualiza SOAT/RTM vencidos en Vehículos
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Estado</label>
                <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {["Programado", "En curso", "Finalizado", "Cancelado"].map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">
                {saving ? "Guardando..." : "Guardar"}
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
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>{s.origen}</span>
                  <span className="text-muted-foreground">→</span>
                  <span>{s.destino}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div><span className="text-muted-foreground">Pasajero</span><p className="font-medium">{s.pasajero || "—"}</p></div>
                  <div><span className="text-muted-foreground">Centro costo</span><p className="font-medium">{s.centro_costo || "—"}</p></div>
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
                    <select
                      id={`veh-${s.id}`}
                      value={s.vehiculo ?? ""}
                      onChange={(e) => handleFieldChange(s.id, "vehiculo", e.target.value)}
                      aria-label="Asignar vehículo"
                      className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1 text-xs font-medium hover:border-primary/50 cursor-pointer"
                    >
                      <option value="">— Sin asignar —</option>
                      {s.vehiculo && !vehiculosDisponibles.some((v) => v.placa === s.vehiculo) && (
                        <option value={s.vehiculo}>{s.vehiculo} (no disponible)</option>
                      )}
                      {vehiculosDisponibles.map((v) => (
                        <option key={v.id} value={v.placa}>{v.placa}</option>
                      ))}
                    </select>
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
