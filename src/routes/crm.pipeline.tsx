import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X, Pencil, Trash2, Phone, MessageCircle, Mail, MapPin, FileText, Users as UsersIcon, Calendar, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/crm/pipeline")({
  component: PipelinePage,
  head: () => ({ meta: [{ title: "Pipeline comercial — CRM TRAMMOS" }] }),
});

type EstadoOportunidad = "prospecto" | "contactado" | "cotizado" | "negociacion" | "ganado" | "perdido";

type Oportunidad = {
  id: string;
  cliente_id: string;
  asesor_id: string | null;
  concesionario_id: string | null;
  titulo: string;
  vehiculo_interes: string | null;
  valor_estimado: number;
  estado: EstadoOportunidad;
  fuente: string | null;
  motivo_perdida: string | null;
  probabilidad: number;
  fecha_cierre_estimada: string | null;
  fecha_cierre_real: string | null;
  notas: string | null;
  created_at: string;
};

type Interaccion = {
  id: string;
  oportunidad_id: string | null;
  cliente_id: string;
  tipo: "llamada" | "whatsapp" | "email" | "visita" | "cotizacion" | "reunion" | "otro";
  fecha: string;
  nota: string | null;
  proximo_seguimiento: string | null;
};

type Lite = { id: string; nombre: string };

const ESTADOS: { key: EstadoOportunidad; label: string; color: string }[] = [
  { key: "prospecto",   label: "Prospecto",    color: "oklch(0.72 0.14 215)" },
  { key: "contactado",  label: "Contactado",   color: "oklch(0.70 0.13 250)" },
  { key: "cotizado",    label: "Cotizado",     color: "oklch(0.75 0.15 90)" },
  { key: "negociacion", label: "Negociación",  color: "oklch(0.72 0.16 40)" },
  { key: "ganado",      label: "Ganado",       color: "oklch(0.78 0.18 145)" },
  { key: "perdido",     label: "Perdido",      color: "oklch(0.65 0.05 25)" },
];

const FUENTES = ["Referido", "Web", "Redes sociales", "Convenio", "Visita en frío", "Llamada entrante", "Otro"];

const INPUT_CLS = "w-full h-9 px-3 rounded-md border border-input bg-background text-sm";
const TEXTAREA_CLS = "w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[70px]";

const EMPTY_OP = {
  cliente_id: "",
  asesor_id: "",
  concesionario_id: "",
  titulo: "",
  vehiculo_interes: "",
  valor_estimado: 0,
  estado: "prospecto" as EstadoOportunidad,
  fuente: "",
  motivo_perdida: "",
  probabilidad: 20,
  fecha_cierre_estimada: "",
  notas: "",
};

const EMPTY_INT = {
  tipo: "llamada" as Interaccion["tipo"],
  fecha: new Date().toISOString().slice(0, 16),
  nota: "",
  proximo_seguimiento: "",
};

const TIPO_ICON: Record<Interaccion["tipo"], typeof Phone> = {
  llamada: Phone, whatsapp: MessageCircle, email: Mail, visita: MapPin, cotizacion: FileText, reunion: UsersIcon, otro: FileText,
};

const fmtCOP = (n: number) => n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

function PipelinePage() {
  const [items, setItems] = useState<Oportunidad[]>([]);
  const [clientes, setClientes] = useState<Lite[]>([]);
  const [asesores, setAsesores] = useState<Lite[]>([]);
  const [concesionarios, setConcesionarios] = useState<Lite[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroAsesor, setFiltroAsesor] = useState("todos");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_OP });
  const [saving, setSaving] = useState(false);

  const [detalle, setDetalle] = useState<Oportunidad | null>(null);
  const [interacciones, setInteracciones] = useState<Interaccion[]>([]);
  const [intForm, setIntForm] = useState({ ...EMPTY_INT });

  async function load() {
    setLoading(true);
    const [op, cli, ase, con] = await Promise.all([
      supabase.from("crm_oportunidades").select("*").order("created_at", { ascending: false }),
      supabase.from("crm_clientes").select("id,nombre").order("nombre"),
      supabase.from("crm_asesores").select("id,nombre").order("nombre"),
      supabase.from("crm_concesionarios").select("id,nombre").order("nombre"),
    ]);
    if (op.error) toast.error(op.error.message);
    setItems((op.data ?? []) as Oportunidad[]);
    setClientes((cli.data ?? []) as Lite[]);
    setAsesores((ase.data ?? []) as Lite[]);
    setConcesionarios((con.data ?? []) as Lite[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const cliMap = useMemo(() => Object.fromEntries(clientes.map((c) => [c.id, c.nombre])), [clientes]);
  const aseMap = useMemo(() => Object.fromEntries(asesores.map((a) => [a.id, a.nombre])), [asesores]);

  const filtrados = useMemo(() => {
    return filtroAsesor === "todos" ? items : items.filter((o) => o.asesor_id === filtroAsesor);
  }, [items, filtroAsesor]);

  // Métricas
  const metrics = useMemo(() => {
    const total = filtrados.length;
    const ganados = filtrados.filter((o) => o.estado === "ganado").length;
    const perdidos = filtrados.filter((o) => o.estado === "perdido").length;
    const cerrados = ganados + perdidos;
    const conversion = cerrados > 0 ? Math.round((ganados / cerrados) * 100) : 0;
    const pipelineValue = filtrados
      .filter((o) => o.estado !== "ganado" && o.estado !== "perdido")
      .reduce((s, o) => s + Number(o.valor_estimado || 0), 0);
    const ganadosValor = filtrados
      .filter((o) => o.estado === "ganado")
      .reduce((s, o) => s + Number(o.valor_estimado || 0), 0);
    // Tiempo prom. cierre (días) entre created_at y fecha_cierre_real para ganados
    const tiempos = filtrados
      .filter((o) => o.estado === "ganado" && o.fecha_cierre_real)
      .map((o) => {
        const a = new Date(o.created_at).getTime();
        const b = new Date(o.fecha_cierre_real!).getTime();
        return Math.max(0, (b - a) / 86400000);
      });
    const tiempoProm = tiempos.length ? Math.round(tiempos.reduce((s, t) => s + t, 0) / tiempos.length) : null;
    return { total, ganados, perdidos, conversion, pipelineValue, ganadosValor, tiempoProm };
  }, [filtrados]);

  function openNew() {
    setEditingId(null);
    setForm({ ...EMPTY_OP });
    setShowForm(true);
  }
  function openEdit(o: Oportunidad) {
    setEditingId(o.id);
    setForm({
      cliente_id: o.cliente_id,
      asesor_id: o.asesor_id ?? "",
      concesionario_id: o.concesionario_id ?? "",
      titulo: o.titulo,
      vehiculo_interes: o.vehiculo_interes ?? "",
      valor_estimado: Number(o.valor_estimado || 0),
      estado: o.estado,
      fuente: o.fuente ?? "",
      motivo_perdida: o.motivo_perdida ?? "",
      probabilidad: o.probabilidad,
      fecha_cierre_estimada: o.fecha_cierre_estimada ?? "",
      notas: o.notas ?? "",
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.cliente_id) return toast.error("Selecciona un cliente");
    if (!form.titulo.trim()) return toast.error("El título es obligatorio");
    setSaving(true);
    const payload = {
      cliente_id: form.cliente_id,
      asesor_id: form.asesor_id || null,
      concesionario_id: form.concesionario_id || null,
      titulo: form.titulo.trim(),
      vehiculo_interes: form.vehiculo_interes.trim() || null,
      valor_estimado: Number(form.valor_estimado) || 0,
      estado: form.estado,
      fuente: form.fuente || null,
      motivo_perdida: form.estado === "perdido" ? (form.motivo_perdida || null) : null,
      probabilidad: Number(form.probabilidad) || 0,
      fecha_cierre_estimada: form.fecha_cierre_estimada || null,
      fecha_cierre_real: form.estado === "ganado" || form.estado === "perdido"
        ? new Date().toISOString().slice(0, 10) : null,
      notas: form.notas.trim() || null,
    };
    const { data: userData } = await supabase.auth.getUser();
    const { error } = editingId
      ? await supabase.from("crm_oportunidades").update(payload).eq("id", editingId)
      : await supabase.from("crm_oportunidades").insert({ ...payload, created_by: userData.user?.id });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Oportunidad actualizada" : "Oportunidad creada");
    setShowForm(false);
    load();
  }

  async function cambiarEstado(o: Oportunidad, nuevo: EstadoOportunidad) {
    const update: Partial<Oportunidad> = { estado: nuevo };
    if ((nuevo === "ganado" || nuevo === "perdido") && !o.fecha_cierre_real) {
      update.fecha_cierre_real = new Date().toISOString().slice(0, 10);
    }
    const { error } = await supabase.from("crm_oportunidades").update(update).eq("id", o.id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.map((x) => (x.id === o.id ? { ...x, ...update } as Oportunidad : x)));
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar esta oportunidad?")) return;
    const { error } = await supabase.from("crm_oportunidades").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminada");
    load();
  }

  async function abrirDetalle(o: Oportunidad) {
    setDetalle(o);
    setIntForm({ ...EMPTY_INT });
    const { data } = await supabase
      .from("crm_interacciones")
      .select("*")
      .eq("oportunidad_id", o.id)
      .order("fecha", { ascending: false });
    setInteracciones((data ?? []) as Interaccion[]);
  }

  async function agregarInteraccion() {
    if (!detalle) return;
    if (!intForm.nota.trim()) return toast.error("Escribe una nota");
    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      oportunidad_id: detalle.id,
      cliente_id: detalle.cliente_id,
      asesor_id: detalle.asesor_id,
      tipo: intForm.tipo,
      fecha: new Date(intForm.fecha).toISOString(),
      nota: intForm.nota.trim(),
      proximo_seguimiento: intForm.proximo_seguimiento
        ? new Date(intForm.proximo_seguimiento).toISOString() : null,
      created_by: userData.user?.id,
    };
    const { error } = await supabase.from("crm_interacciones").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Interacción registrada");
    setIntForm({ ...EMPTY_INT });
    abrirDetalle(detalle);
    // refrescar ultima_interaccion del cliente
    await supabase
      .from("crm_clientes")
      .update({ ultima_interaccion: new Date().toISOString().slice(0, 10) })
      .eq("id", detalle.cliente_id);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Pipeline comercial</h1>
          <p className="text-sm text-muted-foreground">Prospectos, seguimiento y cierre de oportunidades.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filtroAsesor}
            onChange={(e) => setFiltroAsesor(e.target.value)}
            className={`${INPUT_CLS} max-w-[200px]`}
            aria-label="Filtrar por asesor"
          >
            <option value="todos">Todos los asesores</option>
            {asesores.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Nueva oportunidad
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <MetricCard label="Oportunidades" value={metrics.total} />
        <MetricCard label="Conversión" value={`${metrics.conversion}%`} icon={TrendingUp} />
        <MetricCard label="En pipeline" value={fmtCOP(metrics.pipelineValue)} />
        <MetricCard label="Ganado" value={fmtCOP(metrics.ganadosValor)} />
        <MetricCard label="T. prom. cierre" value={metrics.tiempoProm !== null ? `${metrics.tiempoProm} días` : "—"} icon={Calendar} />
      </div>

      {loading ? (
        <div className="text-muted-foreground">Cargando pipeline…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {ESTADOS.map((col) => {
            const cards = filtrados.filter((o) => o.estado === col.key);
            const total = cards.reduce((s, o) => s + Number(o.valor_estimado || 0), 0);
            return (
              <section key={col.key} className="rounded-lg border border-border bg-muted/30 min-h-[280px] flex flex-col">
                <header className="px-3 py-2 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: col.color }} />
                    <h2 className="text-sm font-semibold">{col.label}</h2>
                    <span className="text-xs text-muted-foreground">({cards.length})</span>
                  </div>
                </header>
                <div className="px-3 py-1 text-[10px] text-muted-foreground border-b border-border">
                  {fmtCOP(total)}
                </div>
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                  {cards.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-4">Sin oportunidades</p>
                  ) : cards.map((o) => (
                    <article
                      key={o.id}
                      className="rounded-md bg-card border border-border p-3 text-xs space-y-1.5 hover:border-primary/40 transition-colors"
                    >
                      <button onClick={() => abrirDetalle(o)} className="block w-full text-left">
                        <div className="font-semibold text-foreground text-sm">{o.titulo}</div>
                        <div className="text-muted-foreground truncate">{cliMap[o.cliente_id] ?? "—"}</div>
                      </button>
                      {o.vehiculo_interes && (
                        <div className="text-muted-foreground truncate">🚗 {o.vehiculo_interes}</div>
                      )}
                      <div className="font-medium text-primary">{fmtCOP(Number(o.valor_estimado || 0))}</div>
                      {o.asesor_id && (
                        <div className="text-[10px] text-muted-foreground truncate">👤 {aseMap[o.asesor_id]}</div>
                      )}
                      <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border">
                        <select
                          value={o.estado}
                          onChange={(e) => cambiarEstado(o, e.target.value as EstadoOportunidad)}
                          className="text-[10px] bg-transparent border border-input rounded px-1.5 py-0.5"
                          aria-label="Cambiar estado"
                        >
                          {ESTADOS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                        </select>
                        <div className="flex gap-1.5">
                          <button onClick={() => openEdit(o)} aria-label="Editar"
                            className="text-muted-foreground hover:text-foreground">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => remove(o.id)} aria-label="Eliminar"
                            className="text-destructive hover:opacity-80">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Modal crear/editar */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <header className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h2 className="font-semibold">{editingId ? "Editar oportunidad" : "Nueva oportunidad"}</h2>
              <button onClick={() => setShowForm(false)} aria-label="Cerrar"><X className="h-5 w-5" /></button>
            </header>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <F label="Cliente *" full>
                <select value={form.cliente_id}
                  onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
                  className={INPUT_CLS}>
                  <option value="">— Selecciona —</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </F>
              <F label="Título *" full>
                <input value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Venta camioneta familiar"
                  className={INPUT_CLS} />
              </F>
              <F label="Vehículo de interés">
                <input value={form.vehiculo_interes}
                  onChange={(e) => setForm({ ...form, vehiculo_interes: e.target.value })}
                  placeholder="Marca, línea, modelo"
                  className={INPUT_CLS} />
              </F>
              <F label="Valor estimado (COP)">
                <input type="number" min={0} value={form.valor_estimado}
                  onChange={(e) => setForm({ ...form, valor_estimado: Number(e.target.value) })}
                  className={INPUT_CLS} />
              </F>
              <F label="Asesor">
                <select value={form.asesor_id}
                  onChange={(e) => setForm({ ...form, asesor_id: e.target.value })}
                  className={INPUT_CLS}>
                  <option value="">— Sin asignar —</option>
                  {asesores.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </F>
              <F label="Concesionario">
                <select value={form.concesionario_id}
                  onChange={(e) => setForm({ ...form, concesionario_id: e.target.value })}
                  className={INPUT_CLS}>
                  <option value="">—</option>
                  {concesionarios.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </F>
              <F label="Estado">
                <select value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value as EstadoOportunidad })}
                  className={INPUT_CLS}>
                  {ESTADOS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </F>
              <F label="Probabilidad (%)">
                <input type="number" min={0} max={100} value={form.probabilidad}
                  onChange={(e) => setForm({ ...form, probabilidad: Number(e.target.value) })}
                  className={INPUT_CLS} />
              </F>
              <F label="Fuente del prospecto">
                <select value={form.fuente}
                  onChange={(e) => setForm({ ...form, fuente: e.target.value })}
                  className={INPUT_CLS}>
                  <option value="">—</option>
                  {FUENTES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </F>
              <F label="Fecha cierre estimada">
                <input type="date" value={form.fecha_cierre_estimada}
                  onChange={(e) => setForm({ ...form, fecha_cierre_estimada: e.target.value })}
                  className={INPUT_CLS} />
              </F>
              {form.estado === "perdido" && (
                <F label="Motivo de pérdida" full>
                  <input value={form.motivo_perdida}
                    onChange={(e) => setForm({ ...form, motivo_perdida: e.target.value })}
                    placeholder="Ej: precio, financiación rechazada, eligió otra marca"
                    className={INPUT_CLS} />
                </F>
              )}
              <F label="Notas" full>
                <textarea value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  className={TEXTAREA_CLS} />
              </F>
            </div>
            <footer className="flex justify-end gap-2 px-5 py-3 border-t border-border">
              <button onClick={() => setShowForm(false)} className="h-9 px-4 rounded-md border border-input text-sm">Cancelar</button>
              <button onClick={save} disabled={saving}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Modal detalle + interacciones */}
      {detalle && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <header className="flex items-start justify-between px-5 py-3 border-b border-border">
              <div>
                <h2 className="font-semibold text-lg">{detalle.titulo}</h2>
                <p className="text-sm text-muted-foreground">
                  {cliMap[detalle.cliente_id]} · {ESTADOS.find((s) => s.key === detalle.estado)?.label} · {fmtCOP(Number(detalle.valor_estimado || 0))}
                </p>
              </div>
              <button onClick={() => setDetalle(null)} aria-label="Cerrar"><X className="h-5 w-5" /></button>
            </header>

            <div className="p-5 space-y-4">
              <section className="rounded-md border border-border p-3 space-y-2">
                <h3 className="text-sm font-semibold">Nueva interacción</h3>
                <div className="grid grid-cols-2 gap-2">
                  <select value={intForm.tipo}
                    onChange={(e) => setIntForm({ ...intForm, tipo: e.target.value as Interaccion["tipo"] })}
                    className={INPUT_CLS}>
                    <option value="llamada">Llamada</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="visita">Visita</option>
                    <option value="reunion">Reunión</option>
                    <option value="cotizacion">Cotización</option>
                    <option value="otro">Otro</option>
                  </select>
                  <input type="datetime-local" value={intForm.fecha}
                    onChange={(e) => setIntForm({ ...intForm, fecha: e.target.value })}
                    className={INPUT_CLS} />
                </div>
                <textarea value={intForm.nota}
                  onChange={(e) => setIntForm({ ...intForm, nota: e.target.value })}
                  placeholder="¿Qué se conversó? Compromisos, objeciones…"
                  className={TEXTAREA_CLS} />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Próximo seguimiento:</label>
                  <input type="datetime-local" value={intForm.proximo_seguimiento}
                    onChange={(e) => setIntForm({ ...intForm, proximo_seguimiento: e.target.value })}
                    className={`${INPUT_CLS} flex-1`} />
                </div>
                <div className="flex justify-end">
                  <button onClick={agregarInteraccion}
                    className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">
                    Registrar
                  </button>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold mb-2">Historial</h3>
                {interacciones.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Sin interacciones aún.</p>
                ) : (
                  <ul className="space-y-2">
                    {interacciones.map((i) => {
                      const Icon = TIPO_ICON[i.tipo];
                      return (
                        <li key={i.id} className="flex gap-3 rounded-md border border-border p-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium capitalize">{i.tipo}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(i.fecha).toLocaleString("es-CO")}
                              </span>
                            </div>
                            {i.nota && <p className="text-sm mt-1 whitespace-pre-wrap">{i.nota}</p>}
                            {i.proximo_seguimiento && (
                              <p className="text-[10px] text-primary mt-1">
                                ⏰ Seguir el {new Date(i.proximo_seguimiento).toLocaleString("es-CO")}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string | number; icon?: typeof TrendingUp }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>
      <div className="mt-1 text-lg font-bold text-foreground truncate">{value}</div>
    </div>
  );
}

function F({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs font-medium text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}
