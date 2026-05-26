import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Search, Building2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/crm/concesionarios")({
  component: ConcesionariosPage,
});

type Concesionario = {
  id: string;
  nombre: string;
  empresa: string | null;
  nit: string | null;
  ciudad: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  activo: boolean;
  notas: string | null;
};

const EMPTY = {
  nombre: "",
  empresa: "",
  nit: "",
  ciudad: "",
  direccion: "",
  telefono: "",
  email: "",
  activo: true,
  notas: "",
};

function ConcesionariosPage() {
  const [items, setItems] = useState<Concesionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_concesionarios")
      .select("*")
      .order("nombre");
    if (error) toast.error("Error al cargar: " + error.message);
    setItems((data ?? []) as Concesionario[]);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.ciudad ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q),
    );
  }, [items, search]);

  function openNew() {
    setEditingId(null);
    setForm({ ...EMPTY });
    setShowForm(true);
  }
  function openEdit(c: Concesionario) {
    setEditingId(c.id);
    setForm({
      nombre: c.nombre,
      ciudad: c.ciudad ?? "",
      direccion: c.direccion ?? "",
      telefono: c.telefono ?? "",
      email: c.email ?? "",
      lat: c.lat?.toString() ?? "",
      lng: c.lng?.toString() ?? "",
      activo: c.activo,
      notas: c.notas ?? "",
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
      ciudad: form.ciudad.trim() || null,
      direccion: form.direccion.trim() || null,
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      lat: form.lat ? Number(form.lat) : null,
      lng: form.lng ? Number(form.lng) : null,
      activo: form.activo,
      notas: form.notas.trim() || null,
    };
    const { data: userData } = await supabase.auth.getUser();
    if (editingId) {
      const { error } = await supabase
        .from("crm_concesionarios")
        .update(payload)
        .eq("id", editingId);
      if (error) toast.error(error.message);
      else toast.success("Actualizado");
    } else {
      const { error } = await supabase
        .from("crm_concesionarios")
        .insert({ ...payload, created_by: userData.user?.id });
      if (error) toast.error(error.message);
      else toast.success("Concesionario creado");
    }
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este concesionario?")) return;
    const { error } = await supabase.from("crm_concesionarios").delete().eq("id", id);
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
            placeholder="Buscar por nombre, ciudad o email..."
            className="w-full pl-9 pr-3 h-9 rounded-md border border-input bg-background text-sm"
          />
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nuevo concesionario
        </button>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Cargando…</div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No hay concesionarios registrados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((c) => (
            <article
              key={c.id}
              className="rounded-lg border border-border bg-card p-4 space-y-2"
            >
              <header className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-foreground">{c.nombre}</h3>
                  {c.ciudad && (
                    <p className="text-xs text-muted-foreground">{c.ciudad}</p>
                  )}
                </div>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    c.activo
                      ? "bg-success/15 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {c.activo ? "Activo" : "Inactivo"}
                </span>
              </header>
              {c.direccion && (
                <p className="text-sm text-muted-foreground">{c.direccion}</p>
              )}
              <div className="text-sm space-y-0.5">
                {c.telefono && <p>📞 {c.telefono}</p>}
                {c.email && <p className="truncate">✉️ {c.email}</p>}
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => openEdit(c)}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
                <button
                  onClick={() => remove(c.id)}
                  className="inline-flex items-center gap-1 text-xs text-destructive hover:opacity-80"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <header className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h2 className="font-semibold">
                {editingId ? "Editar concesionario" : "Nuevo concesionario"}
              </h2>
              <button onClick={() => setShowForm(false)} aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre *" className="sm:col-span-2">
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                />
              </Field>
              <Field label="Ciudad">
                <input
                  value={form.ciudad}
                  onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                />
              </Field>
              <Field label="Teléfono">
                <input
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                />
              </Field>
              <Field label="Dirección" className="sm:col-span-2">
                <input
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                />
              </Field>
              <Field label="Email" className="sm:col-span-2">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                />
              </Field>
              <Field label="Latitud">
                <input
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  inputMode="decimal"
                />
              </Field>
              <Field label="Longitud">
                <input
                  value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                  inputMode="decimal"
                />
              </Field>
              <Field label="Notas" className="sm:col-span-2">
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[80px]"
                />
              </Field>
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

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}
