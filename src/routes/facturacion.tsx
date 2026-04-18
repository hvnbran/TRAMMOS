import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { AdminOnly } from "../components/layout/AdminOnly";
import { FileText, DollarSign, Calendar, Inbox, Loader2, Trash2, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { TableSkeleton } from "@/components/ui/loading-skeletons";

export const Route = createFileRoute("/facturacion")({
  component: () => (
    <AdminOnly>
      <Facturacion />
    </AdminOnly>
  ),
  head: () => ({
    meta: [
      { title: "Facturación - TRAMMOS" },
      { name: "description", content: "Gestión de facturación y reportes financieros" },
    ],
  }),
});

interface Factura {
  id: string;
  cliente: "corona" | "sodimac";
  numero: string;
  periodo: string;
  fecha_emision: string;
  fecha_pago: string | null;
  servicios_incluidos: number;
  monto: number;
  estado: string;
  notas: string | null;
}

const ESTADOS = ["Pendiente", "Pagada", "Anulada"];

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function Facturacion() {
  const { cliente } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Factura[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    numero: "",
    periodo: new Date().toLocaleDateString("es-CO", { month: "long", year: "numeric" }),
    fecha_emision: new Date().toISOString().slice(0, 10),
    servicios_incluidos: "",
    monto: "",
    estado: "Pendiente",
    notas: "",
    cliente: (cliente ?? "corona") as "corona" | "sodimac",
  });

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente]);

  async function load() {
    setLoading(true);
    let q = supabase.from("facturas").select("*").order("fecha_emision", { ascending: false });
    if (cliente) q = q.eq("cliente", cliente);
    const { data } = await q;
    setRows((data as Factura[]) ?? []);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.numero || !form.periodo) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("facturas").insert({
        cliente: form.cliente,
        numero: form.numero.trim(),
        periodo: form.periodo.trim(),
        fecha_emision: form.fecha_emision,
        servicios_incluidos: parseInt(form.servicios_incluidos || "0", 10),
        monto: parseFloat(form.monto || "0"),
        estado: form.estado,
        notas: form.notas.trim() || null,
        fecha_pago: form.estado === "Pagada" ? new Date().toISOString().slice(0, 10) : null,
      });
      if (error) {
        alert("Error: " + error.message);
        return;
      }
      setShowForm(false);
      setForm({
        numero: "",
        periodo: new Date().toLocaleDateString("es-CO", { month: "long", year: "numeric" }),
        fecha_emision: new Date().toISOString().slice(0, 10),
        servicios_incluidos: "",
        monto: "",
        estado: "Pendiente",
        notas: "",
        cliente: (cliente ?? "corona") as "corona" | "sodimac",
      });
      void load();
    } finally {
      setSaving(false);
    }
  }

  async function marcarPagada(id: string) {
    const { error } = await supabase
      .from("facturas")
      .update({ estado: "Pagada", fecha_pago: new Date().toISOString().slice(0, 10) })
      .eq("id", id);
    if (error) {
      alert("Error: " + error.message);
      return;
    }
    void load();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta factura?")) return;
    const { error } = await supabase.from("facturas").delete().eq("id", id);
    if (error) {
      alert("Error: " + error.message);
      return;
    }
    void load();
  }

  const yearStart = new Date();
  yearStart.setMonth(0, 1);
  const totalAnio = rows
    .filter((r) => new Date(r.fecha_emision) >= yearStart && r.estado !== "Anulada")
    .reduce((a, r) => a + Number(r.monto), 0);
  const pendiente = rows.filter((r) => r.estado === "Pendiente").reduce((a, r) => a + Number(r.monto), 0);
  const emitidas = rows.length;

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Facturación</h1>
            <p className="text-sm text-muted-foreground">Gestión de facturas y control financiero</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <FileText className="h-4 w-4" />
            Nueva Factura
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              Facturado (Año)
            </div>
            <span className="text-xl font-bold">{loading ? "—" : formatCOP(totalAnio)}</span>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              Pendiente
            </div>
            <span className="text-xl font-bold text-accent">{loading ? "—" : formatCOP(pendiente)}</span>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              Facturas Emitidas
            </div>
            <span className="text-xl font-bold">{loading ? "—" : emitidas}</span>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {rows.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center text-muted-foreground px-4">
              <Inbox className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm text-foreground font-medium">Aún no hay facturas generadas</p>
              <p className="text-xs mt-1">Genera la primera factura con el botón "Nueva Factura"</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Número</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Período</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Servicios</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Monto</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((f, i) => (
                    <tr
                      key={f.id}
                      className="stagger-item border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                      style={{ ["--i" as string]: i } as React.CSSProperties}
                    >
                      <td className="px-4 py-3 font-medium">{f.numero}</td>
                      <td className="px-4 py-3">{f.periodo}</td>
                      <td className="px-4 py-3 capitalize">{f.cliente}</td>
                      <td className="px-4 py-3 text-right">{f.servicios_incluidos}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCOP(Number(f.monto))}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            f.estado === "Pagada"
                              ? "bg-success/15 text-success"
                              : f.estado === "Anulada"
                                ? "bg-muted text-muted-foreground"
                                : "bg-warning/15 text-warning"
                          }`}
                        >
                          {f.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {f.estado === "Pendiente" && (
                            <button
                              onClick={() => marcarPagada(f.id)}
                              className="p-1.5 rounded hover:bg-success/10 text-muted-foreground hover:text-success transition-colors"
                              title="Marcar pagada"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(f.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Modal: Nueva factura */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !saving && setShowForm(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
            className="w-full max-w-lg rounded-lg border border-border bg-card shadow-xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-lg font-semibold">Nueva Factura</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Número *</label>
                  <input
                    type="text"
                    required
                    value={form.numero}
                    onChange={(e) => setForm({ ...form, numero: e.target.value })}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="FAC-2025-001"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Cliente *</label>
                  <select
                    value={form.cliente}
                    disabled={!!cliente}
                    onChange={(e) => setForm({ ...form, cliente: e.target.value as "corona" | "sodimac" })}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm capitalize"
                  >
                    <option value="corona">Corona</option>
                    <option value="sodimac">Sodimac</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Período *</label>
                  <input
                    type="text"
                    required
                    value={form.periodo}
                    onChange={(e) => setForm({ ...form, periodo: e.target.value })}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Abril 2025"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Fecha emisión *</label>
                  <input
                    type="date"
                    required
                    value={form.fecha_emision}
                    onChange={(e) => setForm({ ...form, fecha_emision: e.target.value })}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Servicios incluidos</label>
                  <input
                    type="number"
                    min="0"
                    value={form.servicios_incluidos}
                    onChange={(e) => setForm({ ...form, servicios_incluidos: e.target.value })}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Monto (COP)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.monto}
                    onChange={(e) => setForm({ ...form, monto: e.target.value })}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {ESTADOS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Notas</label>
                <textarea
                  rows={2}
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-secondary/30">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="px-4 py-2 text-sm rounded-md hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </AppLayout>
  );
}
