import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CrmLayout } from "@/components/crm/CrmLayout";
import { Plus, Pencil, Trash2, X, Car } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/crm/catalogo")({
  component: CatalogoPage,
  head: () => ({ meta: [{ title: "Catálogo de vehículos — CRM TRAMMOS" }] }),
});

type Vehiculo = {
  id: string;
  marca: string;
  linea: string;
  modelo: string | null;
  version: string | null;
  capacidad_pasajeros: number | null;
  precio_referencia: number;
  costo_referencia: number;
  activo: boolean;
  foto_url: string | null;
  notas: string | null;
};

const INPUT = "w-full h-9 px-3 rounded-md border border-input bg-background text-sm";
const TEXTAREA = "w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[60px]";
const EMPTY: Omit<Vehiculo, "id"> = {
  marca: "", linea: "", modelo: "", version: "", capacidad_pasajeros: null,
  precio_referencia: 0, costo_referencia: 0, activo: true, foto_url: "", notas: "",
};

const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

function CatalogoPage() {
  const [rows, setRows] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Vehiculo, "id">>(EMPTY);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_vehiculos_catalogo")
      .select("*")
      .order("marca").order("linea");
    if (error) toast.error(error.message);
    else setRows((data as Vehiculo[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditingId(null);
    setForm(EMPTY);
    setOpenForm(true);
  }
  function openEdit(v: Vehiculo) {
    setEditingId(v.id);
    const { id, ...rest } = v;
    setForm(rest);
    setOpenForm(true);
  }

  async function save() {
    if (!form.marca.trim() || !form.linea.trim()) {
      toast.error("Marca y línea son requeridos");
      return;
    }
    const payload = {
      ...form,
      modelo: form.modelo || null,
      version: form.version || null,
      foto_url: form.foto_url || null,
      notas: form.notas || null,
    };
    const op = editingId
      ? supabase.from("crm_vehiculos_catalogo").update(payload).eq("id", editingId)
      : supabase.from("crm_vehiculos_catalogo").insert([payload]);
    const { error } = await op;
    if (error) { toast.error(error.message); return; }
    toast.success(editingId ? "Vehículo actualizado" : "Vehículo creado");
    setOpenForm(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este vehículo del catálogo?")) return;
    const { error } = await supabase.from("crm_vehiculos_catalogo").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Eliminado");
    load();
  }

  return (
    <CrmLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" /> Catálogo de vehículos
          </h2>
          <p className="text-sm text-muted-foreground">Modelos disponibles con precios y costos de referencia.</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nuevo vehículo
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : rows.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground">
          Aún no hay vehículos. Crea el primero para usarlo en las ventas.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2">Marca / Línea</th>
                <th className="text-left px-3 py-2">Modelo</th>
                <th className="text-left px-3 py-2">Cap.</th>
                <th className="text-right px-3 py-2">Precio ref.</th>
                <th className="text-right px-3 py-2">Costo ref.</th>
                <th className="text-right px-3 py-2">Margen</th>
                <th className="text-center px-3 py-2">Activo</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => {
                const margen = (v.precio_referencia || 0) - (v.costo_referencia || 0);
                return (
                  <tr key={v.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-3 py-2 font-medium">{v.marca} {v.linea}</td>
                    <td className="px-3 py-2">{[v.modelo, v.version].filter(Boolean).join(" · ") || "—"}</td>
                    <td className="px-3 py-2">{v.capacidad_pasajeros ?? "—"}</td>
                    <td className="px-3 py-2 text-right">{cop(v.precio_referencia)}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{cop(v.costo_referencia)}</td>
                    <td className="px-3 py-2 text-right font-medium" style={{ color: margen >= 0 ? "oklch(0.6 0.15 145)" : "oklch(0.55 0.2 25)" }}>
                      {cop(margen)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-block h-2 w-2 rounded-full ${v.activo ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => openEdit(v)} className="p-1.5 rounded hover:bg-muted" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => remove(v.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {openForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
              <h3 className="font-semibold">{editingId ? "Editar vehículo" : "Nuevo vehículo"}</h3>
              <button onClick={() => setOpenForm(false)} className="p-1 hover:bg-muted rounded"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground">Marca *</label>
                <input className={INPUT} value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">Línea *</label>
                <input className={INPUT} value={form.linea} onChange={(e) => setForm({ ...form, linea: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">Modelo / Año</label>
                <input className={INPUT} value={form.modelo ?? ""} onChange={(e) => setForm({ ...form, modelo: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">Versión</label>
                <input className={INPUT} value={form.version ?? ""} onChange={(e) => setForm({ ...form, version: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">Capacidad pasajeros</label>
                <input type="number" className={INPUT} value={form.capacidad_pasajeros ?? ""} onChange={(e) => setForm({ ...form, capacidad_pasajeros: e.target.value ? Number(e.target.value) : null })} /></div>
              <div><label className="text-xs text-muted-foreground">Activo</label>
                <select className={INPUT} value={form.activo ? "1" : "0"} onChange={(e) => setForm({ ...form, activo: e.target.value === "1" })}>
                  <option value="1">Sí</option><option value="0">No</option>
                </select></div>
              <div><label className="text-xs text-muted-foreground">Precio referencia (COP)</label>
                <input type="number" className={INPUT} value={form.precio_referencia} onChange={(e) => setForm({ ...form, precio_referencia: Number(e.target.value) })} /></div>
              <div><label className="text-xs text-muted-foreground">Costo referencia (COP)</label>
                <input type="number" className={INPUT} value={form.costo_referencia} onChange={(e) => setForm({ ...form, costo_referencia: Number(e.target.value) })} /></div>
              <div className="sm:col-span-2"><label className="text-xs text-muted-foreground">Foto URL</label>
                <input className={INPUT} value={form.foto_url ?? ""} onChange={(e) => setForm({ ...form, foto_url: e.target.value })} /></div>
              <div className="sm:col-span-2"><label className="text-xs text-muted-foreground">Notas</label>
                <textarea className={TEXTAREA} value={form.notas ?? ""} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></div>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button onClick={() => setOpenForm(false)} className="h-9 px-4 rounded-md border border-input text-sm">Cancelar</button>
              <button onClick={save} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </CrmLayout>
  );
}
