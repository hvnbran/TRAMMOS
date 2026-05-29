import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, CreditCard, CheckCircle2, Clock, AlertTriangle, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/crm/creditos")({
  component: CreditosPage,
  head: () => ({ meta: [{ title: "Créditos y financiación — CRM TRAMMOS" }] }),
});

type Credito = {
  id: string;
  cliente_id: string;
  asesor_id: string | null;
  entidad: string;
  valor_financiado: number;
  cuota_inicial: number;
  plazo_meses: number | null;
  tasa_mensual: number | null;
  cuota_mensual: number | null;
  estado: string;
  fecha_solicitud: string;
  fecha_aprobacion: string | null;
  fecha_desembolso: string | null;
  dias_mora: number;
  saldo_pendiente: number | null;
  motivo_rechazo: string | null;
  notas: string | null;
};

type Lite = { id: string; nombre: string };

const ESTADOS = ["Solicitado", "En estudio", "Aprobado", "Desembolsado", "Rechazado", "Pagado"];
const ENTIDADES_SUG = ["Bancolombia", "Banco de Bogotá", "Sufi", "Coltefinanciera", "Crediservir", "Davivienda", "BBVA", "Otra"];

const INPUT = "w-full h-9 px-3 rounded-md border border-input bg-background text-sm";
const TEXTAREA = "w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[60px]";

const EMPTY = {
  cliente_id: "",
  asesor_id: "",
  entidad: "",
  valor_financiado: 0,
  cuota_inicial: 0,
  plazo_meses: 60,
  tasa_mensual: 1.5,
  cuota_mensual: 0,
  estado: "Solicitado",
  fecha_solicitud: new Date().toISOString().slice(0, 10),
  fecha_aprobacion: "",
  fecha_desembolso: "",
  dias_mora: 0,
  saldo_pendiente: 0,
  motivo_rechazo: "",
  notas: "",
};

const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

function badge(estado: string) {
  const map: Record<string, string> = {
    Solicitado: "bg-muted text-foreground",
    "En estudio": "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
    Aprobado: "bg-green-500/15 text-green-700 dark:text-green-400",
    Desembolsado: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
    Rechazado: "bg-destructive/15 text-destructive",
    Pagado: "bg-primary/15 text-primary",
  };
  return map[estado] || "bg-muted text-foreground";
}

function CreditosPage() {
  const [creditos, setCreditos] = useState<Credito[]>([]);
  const [clientes, setClientes] = useState<Lite[]>([]);
  const [asesores, setAsesores] = useState<Lite[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [filterEstado, setFilterEstado] = useState<string>("");

  async function load() {
    setLoading(true);
    const [cr, cl, ase] = await Promise.all([
      supabase.from("crm_creditos").select("*").order("fecha_solicitud", { ascending: false }),
      supabase.from("crm_clientes").select("id, nombre").order("nombre"),
      supabase.from("crm_asesores").select("id, nombre").eq("activo", true).order("nombre"),
    ]);
    if (cr.error) toast.error(cr.error.message);
    setCreditos((cr.data as Credito[]) || []);
    setClientes((cl.data as Lite[]) || []);
    setAsesores((ase.data as Lite[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const metrics = useMemo(() => {
    const total = creditos.length;
    const aprobados = creditos.filter((c) => ["Aprobado", "Desembolsado", "Pagado"].includes(c.estado)).length;
    const rechazados = creditos.filter((c) => c.estado === "Rechazado").length;
    const decididos = aprobados + rechazados;
    const tasaAprob = decididos > 0 ? (aprobados / decididos) * 100 : 0;
    const valorTotal = creditos.reduce((s, c) => s + (Number(c.valor_financiado) || 0), 0);
    const enMora = creditos.filter((c) => (c.dias_mora || 0) > 0).length;
    const saldoMora = creditos
      .filter((c) => (c.dias_mora || 0) > 0)
      .reduce((s, c) => s + (Number(c.saldo_pendiente) || 0), 0);

    // Tiempo prom aprobación (días)
    const tiempos = creditos
      .filter((c) => c.fecha_aprobacion && c.fecha_solicitud)
      .map(
        (c) =>
          (new Date(c.fecha_aprobacion!).getTime() - new Date(c.fecha_solicitud).getTime()) / 86400000,
      );
    const tiempoProm = tiempos.length ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length : 0;

    // Entidad más usada
    const porEntidad: Record<string, number> = {};
    creditos.forEach((c) => {
      porEntidad[c.entidad] = (porEntidad[c.entidad] || 0) + 1;
    });
    const topEntidad = Object.entries(porEntidad).sort((a, b) => b[1] - a[1])[0];

    return { total, aprobados, tasaAprob, valorTotal, enMora, saldoMora, tiempoProm, topEntidad };
  }, [creditos]);

  const filtered = useMemo(
    () => (filterEstado ? creditos.filter((c) => c.estado === filterEstado) : creditos),
    [creditos, filterEstado],
  );

  const clienteName = (id: string) => clientes.find((c) => c.id === id)?.nombre || "—";
  const asesorName = (id: string | null) => (id ? asesores.find((a) => a.id === id)?.nombre || "—" : "—");

  function openNew() {
    setEditingId(null);
    setForm(EMPTY);
    setOpenForm(true);
  }

  function openEdit(c: Credito) {
    setEditingId(c.id);
    setForm({
      cliente_id: c.cliente_id,
      asesor_id: c.asesor_id || "",
      entidad: c.entidad,
      valor_financiado: c.valor_financiado,
      cuota_inicial: c.cuota_inicial,
      plazo_meses: c.plazo_meses || 60,
      tasa_mensual: c.tasa_mensual || 0,
      cuota_mensual: c.cuota_mensual || 0,
      estado: c.estado,
      fecha_solicitud: c.fecha_solicitud,
      fecha_aprobacion: c.fecha_aprobacion || "",
      fecha_desembolso: c.fecha_desembolso || "",
      dias_mora: c.dias_mora || 0,
      saldo_pendiente: Number(c.saldo_pendiente) || 0,
      motivo_rechazo: c.motivo_rechazo || "",
      notas: c.notas || "",
    });
    setOpenForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente_id) return toast.error("Selecciona un cliente");
    if (!form.entidad) return toast.error("Indica la entidad financiera");

    const payload = {
      cliente_id: form.cliente_id,
      asesor_id: form.asesor_id || null,
      entidad: form.entidad,
      valor_financiado: Number(form.valor_financiado),
      cuota_inicial: Number(form.cuota_inicial),
      plazo_meses: Number(form.plazo_meses) || null,
      tasa_mensual: Number(form.tasa_mensual) || null,
      cuota_mensual: Number(form.cuota_mensual) || null,
      estado: form.estado,
      fecha_solicitud: form.fecha_solicitud,
      fecha_aprobacion: form.fecha_aprobacion || null,
      fecha_desembolso: form.fecha_desembolso || null,
      dias_mora: Number(form.dias_mora) || 0,
      saldo_pendiente: Number(form.saldo_pendiente) || null,
      motivo_rechazo: form.motivo_rechazo || null,
      notas: form.notas || null,
    };

    const { error } = editingId
      ? await supabase.from("crm_creditos").update(payload).eq("id", editingId)
      : await supabase.from("crm_creditos").insert(payload);

    if (error) return toast.error(error.message);
    toast.success(editingId ? "Crédito actualizado" : "Crédito creado");
    setOpenForm(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este crédito?")) return;
    const { error } = await supabase.from("crm_creditos").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Crédito eliminado");
    load();
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" /> Créditos y financiación
          </h2>
          <p className="text-sm text-muted-foreground">Solicitudes, aprobación, mora y rentabilidad de la cartera financiada.</p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Nuevo crédito
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={CheckCircle2} label="Tasa de aprobación" value={`${metrics.tasaAprob.toFixed(1)}%`} sub={`${metrics.aprobados} aprobados`} />
        <KPI icon={Clock} label="Tiempo prom. aprobación" value={`${metrics.tiempoProm.toFixed(1)} d`} sub={`${metrics.total} solicitudes`} />
        <KPI icon={TrendingUp} label="Valor financiado total" value={cop(metrics.valorTotal)} sub={metrics.topEntidad ? `Top: ${metrics.topEntidad[0]}` : "—"} />
        <KPI icon={AlertTriangle} label="Cartera en mora" value={`${metrics.enMora}`} sub={cop(metrics.saldoMora)} tone="warn" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Filtrar:</span>
        <button onClick={() => setFilterEstado("")} className={`h-7 px-3 rounded-full text-xs border ${!filterEstado ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>
          Todos
        </button>
        {ESTADOS.map((e) => (
          <button key={e} onClick={() => setFilterEstado(e)} className={`h-7 px-3 rounded-full text-xs border ${filterEstado === e ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>
            {e}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Cliente</th>
                <th className="text-left px-3 py-2">Entidad</th>
                <th className="text-right px-3 py-2">Valor</th>
                <th className="text-right px-3 py-2">Cuota inicial</th>
                <th className="text-center px-3 py-2">Plazo</th>
                <th className="text-center px-3 py-2">Estado</th>
                <th className="text-center px-3 py-2">Mora</th>
                <th className="text-left px-3 py-2">Asesor</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">Cargando…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">Sin créditos registrados</td></tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-2 font-medium text-foreground">{clienteName(c.cliente_id)}</td>
                    <td className="px-3 py-2">{c.entidad}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{cop(Number(c.valor_financiado))}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{cop(Number(c.cuota_inicial))}</td>
                    <td className="px-3 py-2 text-center">{c.plazo_meses ? `${c.plazo_meses}m` : "—"}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${badge(c.estado)}`}>{c.estado}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {c.dias_mora > 0 ? (
                        <span className="text-destructive font-semibold">{c.dias_mora}d</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{asesorName(c.asesor_id)}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => openEdit(c)} className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-muted" title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => remove(c.id)} className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-destructive/10 text-destructive" title="Eliminar">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpenForm(false)}>
          <div className="bg-card rounded-xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
              <h3 className="font-semibold">{editingId ? "Editar crédito" : "Nuevo crédito"}</h3>
              <button onClick={() => setOpenForm(false)} className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={save} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Cliente *">
                <select className={INPUT} value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })} required>
                  <option value="">Selecciona…</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </Field>
              <Field label="Asesor">
                <select className={INPUT} value={form.asesor_id} onChange={(e) => setForm({ ...form, asesor_id: e.target.value })}>
                  <option value="">—</option>
                  {asesores.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </Field>
              <Field label="Entidad financiera *">
                <input list="entidades-list" className={INPUT} value={form.entidad} onChange={(e) => setForm({ ...form, entidad: e.target.value })} required />
                <datalist id="entidades-list">
                  {ENTIDADES_SUG.map((e) => <option key={e} value={e} />)}
                </datalist>
              </Field>
              <Field label="Estado">
                <select className={INPUT} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                  {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </Field>
              <Field label="Valor financiado">
                <input type="number" className={INPUT} value={form.valor_financiado} onChange={(e) => setForm({ ...form, valor_financiado: Number(e.target.value) })} />
              </Field>
              <Field label="Cuota inicial">
                <input type="number" className={INPUT} value={form.cuota_inicial} onChange={(e) => setForm({ ...form, cuota_inicial: Number(e.target.value) })} />
              </Field>
              <Field label="Plazo (meses)">
                <input type="number" className={INPUT} value={form.plazo_meses} onChange={(e) => setForm({ ...form, plazo_meses: Number(e.target.value) })} />
              </Field>
              <Field label="Tasa mensual (%)">
                <input type="number" step="0.01" className={INPUT} value={form.tasa_mensual} onChange={(e) => setForm({ ...form, tasa_mensual: Number(e.target.value) })} />
              </Field>
              <Field label="Cuota mensual">
                <input type="number" className={INPUT} value={form.cuota_mensual} onChange={(e) => setForm({ ...form, cuota_mensual: Number(e.target.value) })} />
              </Field>
              <Field label="Saldo pendiente">
                <input type="number" className={INPUT} value={form.saldo_pendiente} onChange={(e) => setForm({ ...form, saldo_pendiente: Number(e.target.value) })} />
              </Field>
              <Field label="Fecha solicitud">
                <input type="date" className={INPUT} value={form.fecha_solicitud} onChange={(e) => setForm({ ...form, fecha_solicitud: e.target.value })} />
              </Field>
              <Field label="Fecha aprobación">
                <input type="date" className={INPUT} value={form.fecha_aprobacion} onChange={(e) => setForm({ ...form, fecha_aprobacion: e.target.value })} />
              </Field>
              <Field label="Fecha desembolso">
                <input type="date" className={INPUT} value={form.fecha_desembolso} onChange={(e) => setForm({ ...form, fecha_desembolso: e.target.value })} />
              </Field>
              <Field label="Días en mora">
                <input type="number" className={INPUT} value={form.dias_mora} onChange={(e) => setForm({ ...form, dias_mora: Number(e.target.value) })} />
              </Field>
              {form.estado === "Rechazado" && (
                <Field label="Motivo rechazo" full>
                  <input className={INPUT} value={form.motivo_rechazo} onChange={(e) => setForm({ ...form, motivo_rechazo: e.target.value })} />
                </Field>
              )}
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

function KPI({ icon: Icon, label, value, sub, tone }: { icon: typeof CreditCard; label: string; value: string; sub?: string; tone?: "warn" }) {
  return (
    <div className={`rounded-xl border p-4 ${tone === "warn" ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"}`}>
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
