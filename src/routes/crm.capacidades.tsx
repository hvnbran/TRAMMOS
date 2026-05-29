import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, Wallet, TrendingUp, FileWarning, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/crm/capacidades")({
  component: CapacidadesPage,
  head: () => ({ meta: [{ title: "Capacidades de crédito — CRM TRAMMOS" }] }),
});

type Capacidad = {
  id: string;
  cliente_id: string;
  entidad: string;
  cupo_total: number;
  cupo_asignado: number;
  estado: string;
  fecha_activacion: string | null;
  fecha_vencimiento: string | null;
  rentabilidad_pct: number | null;
  documentacion_pendiente: string | null;
  notas: string | null;
};

type Lite = { id: string; nombre: string };

const ESTADOS = ["Activa", "Suspendida", "Vencida", "En trámite"];
const INPUT = "w-full h-9 px-3 rounded-md border border-input bg-background text-sm";
const TEXTAREA = "w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[60px]";

const EMPTY = {
  cliente_id: "",
  entidad: "",
  cupo_total: 0,
  cupo_asignado: 0,
  estado: "Activa",
  fecha_activacion: "",
  fecha_vencimiento: "",
  rentabilidad_pct: 0,
  documentacion_pendiente: "",
  notas: "",
};

const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

function CapacidadesPage() {
  const [items, setItems] = useState<Capacidad[]>([]);
  const [clientes, setClientes] = useState<Lite[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);

  async function load() {
    setLoading(true);
    const [cap, cl] = await Promise.all([
      supabase.from("crm_capacidades").select("*").order("created_at", { ascending: false }),
      supabase.from("crm_clientes").select("id, nombre").order("nombre"),
    ]);
    if (cap.error) toast.error(cap.error.message);
    setItems((cap.data as Capacidad[]) || []);
    setClientes((cl.data as Lite[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const metrics = useMemo(() => {
    const total = items.reduce((s, c) => s + Number(c.cupo_total), 0);
    const asignado = items.reduce((s, c) => s + Number(c.cupo_asignado), 0);
    const disponible = total - asignado;
    const utilizacion = total > 0 ? (asignado / total) * 100 : 0;
    const activas = items.filter((c) => c.estado === "Activa").length;
    const conDocsPend = items.filter((c) => (c.documentacion_pendiente || "").trim().length > 0).length;
    const rentProm =
      items.filter((c) => c.rentabilidad_pct != null).reduce((s, c) => s + Number(c.rentabilidad_pct || 0), 0) /
      Math.max(1, items.filter((c) => c.rentabilidad_pct != null).length);
    return { total, asignado, disponible, utilizacion, activas, conDocsPend, rentProm };
  }, [items]);

  const clienteName = (id: string) => clientes.find((c) => c.id === id)?.nombre || "—";

  function openNew() {
    setEditingId(null);
    setForm(EMPTY);
    setOpenForm(true);
  }

  function openEdit(c: Capacidad) {
    setEditingId(c.id);
    setForm({
      cliente_id: c.cliente_id,
      entidad: c.entidad,
      cupo_total: c.cupo_total,
      cupo_asignado: c.cupo_asignado,
      estado: c.estado,
      fecha_activacion: c.fecha_activacion || "",
      fecha_vencimiento: c.fecha_vencimiento || "",
      rentabilidad_pct: Number(c.rentabilidad_pct) || 0,
      documentacion_pendiente: c.documentacion_pendiente || "",
      notas: c.notas || "",
    });
    setOpenForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente_id) return toast.error("Selecciona un cliente");
    if (!form.entidad) return toast.error("Indica la entidad");

    const payload = {
      cliente_id: form.cliente_id,
      entidad: form.entidad,
      cupo_total: Number(form.cupo_total),
      cupo_asignado: Number(form.cupo_asignado),
      estado: form.estado,
      fecha_activacion: form.fecha_activacion || null,
      fecha_vencimiento: form.fecha_vencimiento || null,
      rentabilidad_pct: Number(form.rentabilidad_pct) || null,
      documentacion_pendiente: form.documentacion_pendiente || null,
      notas: form.notas || null,
    };

    const { error } = editingId
      ? await supabase.from("crm_capacidades").update(payload).eq("id", editingId)
      : await supabase.from("crm_capacidades").insert(payload);

    if (error) return toast.error(error.message);
    toast.success(editingId ? "Capacidad actualizada" : "Capacidad creada");
    setOpenForm(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar esta capacidad?")) return;
    const { error } = await supabase.from("crm_capacidades").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminada");
    load();
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" /> Capacidades de crédito
          </h2>
          <p className="text-sm text-muted-foreground">Cupos aprobados por cliente, utilización, vencimientos y rentabilidad.</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Nueva capacidad
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={Wallet} label="Cupo total" value={cop(metrics.total)} sub={`${items.length} capacidades`} />
        <KPI icon={CheckCircle2} label="Disponible" value={cop(metrics.disponible)} sub={`${metrics.utilizacion.toFixed(1)}% utilizado`} />
        <KPI icon={TrendingUp} label="Rentabilidad promedio" value={`${(metrics.rentProm || 0).toFixed(2)}%`} sub={`${metrics.activas} activas`} />
        <KPI icon={FileWarning} label="Docs pendientes" value={`${metrics.conDocsPend}`} sub="capacidades con observaciones" tone={metrics.conDocsPend > 0 ? "warn" : undefined} />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Cliente</th>
                <th className="text-left px-3 py-2">Entidad</th>
                <th className="text-right px-3 py-2">Cupo total</th>
                <th className="text-right px-3 py-2">Asignado</th>
                <th className="text-right px-3 py-2">Disponible</th>
                <th className="text-center px-3 py-2">Util.</th>
                <th className="text-center px-3 py-2">Estado</th>
                <th className="text-left px-3 py-2">Docs pend.</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">Cargando…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">Sin capacidades registradas</td></tr>
              ) : (
                items.map((c) => {
                  const disp = Number(c.cupo_total) - Number(c.cupo_asignado);
                  const util = Number(c.cupo_total) > 0 ? (Number(c.cupo_asignado) / Number(c.cupo_total)) * 100 : 0;
                  return (
                    <tr key={c.id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium">{clienteName(c.cliente_id)}</td>
                      <td className="px-3 py-2">{c.entidad}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{cop(Number(c.cupo_total))}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{cop(Number(c.cupo_asignado))}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{cop(disp)}</td>
                      <td className="px-3 py-2 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${Math.min(100, util)}%` }} />
                          </div>
                          <span className="text-xs tabular-nums">{util.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-muted">{c.estado}</span>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground max-w-[200px] truncate">{c.documentacion_pendiente || "—"}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => openEdit(c)} className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => remove(c.id)} className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpenForm(false)}>
          <div className="bg-card rounded-xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
              <h3 className="font-semibold">{editingId ? "Editar capacidad" : "Nueva capacidad"}</h3>
              <button onClick={() => setOpenForm(false)} className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={save} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Cliente *">
                <select className={INPUT} value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })} required>
                  <option value="">Selecciona…</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </Field>
              <Field label="Entidad *">
                <input className={INPUT} value={form.entidad} onChange={(e) => setForm({ ...form, entidad: e.target.value })} required />
              </Field>
              <Field label="Cupo total">
                <input type="number" className={INPUT} value={form.cupo_total} onChange={(e) => setForm({ ...form, cupo_total: Number(e.target.value) })} />
              </Field>
              <Field label="Cupo asignado">
                <input type="number" className={INPUT} value={form.cupo_asignado} onChange={(e) => setForm({ ...form, cupo_asignado: Number(e.target.value) })} />
              </Field>
              <Field label="Estado">
                <select className={INPUT} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                  {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </Field>
              <Field label="Rentabilidad (%)">
                <input type="number" step="0.01" className={INPUT} value={form.rentabilidad_pct} onChange={(e) => setForm({ ...form, rentabilidad_pct: Number(e.target.value) })} />
              </Field>
              <Field label="Fecha activación">
                <input type="date" className={INPUT} value={form.fecha_activacion} onChange={(e) => setForm({ ...form, fecha_activacion: e.target.value })} />
              </Field>
              <Field label="Fecha vencimiento">
                <input type="date" className={INPUT} value={form.fecha_vencimiento} onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })} />
              </Field>
              <Field label="Documentación pendiente" full>
                <textarea className={TEXTAREA} value={form.documentacion_pendiente} onChange={(e) => setForm({ ...form, documentacion_pendiente: e.target.value })} placeholder="Ej: Cámara y comercio, RUT actualizado, declaración renta…" />
              </Field>
              <Field label="Notas" full>
                <textarea className={TEXTAREA} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
              </Field>
              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpenForm(false)} className="h-9 px-4 rounded-md border border-input text-sm">Cancelar</button>
                <button type="submit" className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ icon: Icon, label, value, sub, tone }: { icon: typeof Wallet; label: string; value: string; sub?: string; tone?: "warn" }) {
  return (
    <div className={`rounded-xl border p-4 ${tone === "warn" ? "border-yellow-500/40 bg-yellow-500/5" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="text-xl font-bold text-foreground tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}
