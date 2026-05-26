import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Search, UserCog, X, Cake } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/crm/asesores")({
  component: AsesoresPage,
});

type Asesor = {
  id: string;
  nombre: string;
  cedula: string | null;
  telefono: string | null;
  email: string | null;
  fecha_nacimiento: string | null;
  cargo: string | null;
  concesionario_id: string | null;
  activo: boolean;
  notas: string | null;
};

type ConcesionarioLite = { id: string; nombre: string };

const INPUT_CLS = "w-full h-9 px-3 rounded-md border border-input bg-background text-sm";
const TEXTAREA_CLS = "w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[80px]";

const EMPTY = {
  nombre: "",
  cedula: "",
  telefono: "",
  email: "",
  fecha_nacimiento: "",
  cargo: "",
  concesionario_id: "",
  activo: true,
  notas: "",
};

function diasParaCumple(fecha: string | null): number | null {
  if (!fecha) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fecha);
  const cumple = new Date(hoy.getFullYear(), f.getMonth(), f.getDate());
  if (cumple < hoy) cumple.setFullYear(hoy.getFullYear() + 1);
  return Math.round((cumple.getTime() - hoy.getTime()) / 86400000);
}

function AsesoresPage() {
  const [items, setItems] = useState<Asesor[]>([]);
  const [concesionarios, setConcesionarios] = useState<ConcesionarioLite[]>([]);
  const [clientesPorAsesor, setClientesPorAsesor] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [a, c, cli] = await Promise.all([
      supabase.from("crm_asesores").select("*").order("nombre"),
      supabase.from("crm_concesionarios").select("id,nombre").order("nombre"),
      supabase.from("crm_clientes").select("asesor_id"),
    ]);
    if (a.error) toast.error(a.error.message);
    setItems((a.data ?? []) as Asesor[]);
    setConcesionarios((c.data ?? []) as ConcesionarioLite[]);
    const counts: Record<string, number> = {};
    (cli.data ?? []).forEach((r: { asesor_id: string | null }) => {
      if (r.asesor_id) counts[r.asesor_id] = (counts[r.asesor_id] ?? 0) + 1;
    });
    setClientesPorAsesor(counts);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const concNombre = useMemo(() => {
    const m: Record<string, string> = {};
    concesionarios.forEach((c) => (m[c.id] = c.nombre));
    return m;
  }, [concesionarios]);

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (a) =>
        a.nombre.toLowerCase().includes(q) ||
        (a.cedula ?? "").toLowerCase().includes(q) ||
        (a.email ?? "").toLowerCase().includes(q) ||
        (a.telefono ?? "").includes(q),
    );
  }, [items, search]);

  function openNew() {
    setEditingId(null);
    setForm({ ...EMPTY });
    setShowForm(true);
  }
  function openEdit(a: Asesor) {
    setEditingId(a.id);
    setForm({
      nombre: a.nombre,
      cedula: a.cedula ?? "",
      telefono: a.telefono ?? "",
      email: a.email ?? "",
      fecha_nacimiento: a.fecha_nacimiento ?? "",
      cargo: a.cargo ?? "",
      concesionario_id: a.concesionario_id ?? "",
      activo: a.activo,
      notas: a.notas ?? "",
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    const payload = {
      nombre: form.nombre.trim(),
      cedula: form.cedula.trim() || null,
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
      cargo: form.cargo.trim() || null,
      concesionario_id: form.concesionario_id || null,
      activo: form.activo,
      notas: form.notas.trim() || null,
    };
    const { data: userData } = await supabase.auth.getUser();
    const { error } = editingId
      ? await supabase.from("crm_asesores").update(payload).eq("id", editingId)
      : await supabase.from("crm_asesores").insert({ ...payload, created_by: userData.user?.id });
    if (error) toast.error(error.message);
    else toast.success(editingId ? "Actualizado" : "Asesor creado");
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este asesor?")) return;
    const { error } = await supabase.from("crm_asesores").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Eliminado");
      load();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, cédula, teléfono..."
            className="w-full pl-9 pr-3 h-9 rounded-md border border-input bg-background text-sm"
          />
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nuevo asesor
        </button>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Cargando…</div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <UserCog className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No hay asesores registrados.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">Nombre</th>
                <th className="p-3 font-medium">Cargo</th>
                <th className="p-3 font-medium">Concesionario</th>
                <th className="p-3 font-medium">Teléfono</th>
                <th className="p-3 font-medium">Cumpleaños</th>
                <th className="p-3 font-medium text-right">Clientes</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((a) => {
                const d = diasParaCumple(a.fecha_nacimiento);
                const proxCumple = d !== null && d <= 7;
                return (
                  <tr key={a.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3">
                      <div className="font-medium">{a.nombre}</div>
                      {a.email && (
                        <div className="text-xs text-muted-foreground">{a.email}</div>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">{a.cargo ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">
                      {a.concesionario_id ? concNombre[a.concesionario_id] ?? "—" : "—"}
                    </td>
                    <td className="p-3 text-muted-foreground">{a.telefono ?? "—"}</td>
                    <td className="p-3">
                      {a.fecha_nacimiento ? (
                        <span
                          className={`inline-flex items-center gap-1 ${
                            proxCumple ? "text-primary font-medium" : "text-muted-foreground"
                          }`}
                        >
                          {proxCumple && <Cake className="h-3 w-3" />}
                          {new Date(a.fecha_nacimiento).toLocaleDateString("es-CO", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {clientesPorAsesor[a.id] ?? 0}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEdit(a)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mr-3"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => remove(a.id)}
                        className="inline-flex items-center gap-1 text-xs text-destructive hover:opacity-80"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <header className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h2 className="font-semibold">{editingId ? "Editar asesor" : "Nuevo asesor"}</h2>
              <button onClick={() => setShowForm(false)} aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <F label="Nombre *" full>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className={INPUT_CLS}
                />
              </F>
              <F label="Cédula">
                <input
                  value={form.cedula}
                  onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                  className={INPUT_CLS}
                />
              </F>
              <F label="Cargo">
                <input
                  value={form.cargo}
                  onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                  placeholder="Ej: Asesor comercial"
                  className={INPUT_CLS}
                />
              </F>
              <F label="Teléfono">
                <input
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className={INPUT_CLS}
                />
              </F>
              <F label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={INPUT_CLS}
                />
              </F>
              <F label="Fecha de nacimiento">
                <input
                  type="date"
                  value={form.fecha_nacimiento}
                  onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
                  className={INPUT_CLS}
                />
              </F>
              <F label="Concesionario">
                <select
                  value={form.concesionario_id}
                  onChange={(e) => setForm({ ...form, concesionario_id: e.target.value })}
                  className={INPUT_CLS}
                >
                  <option value="">— Sin asignar —</option>
                  {concesionarios.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </F>
              <F label="Notas" full>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  className={TEXTAREA_CLS}
                />
              </F>
              <label className="sm:col-span-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                />
                Activo
              </label>
            </div>
            <footer className="flex justify-end gap-2 px-5 py-3 border-t border-border">
              <button
                onClick={() => setShowForm(false)}
                className="h-9 px-4 rounded-md border border-input text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

function F({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs font-medium text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}
