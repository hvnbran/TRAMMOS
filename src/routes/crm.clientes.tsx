import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Search, Users, X, Cake } from "lucide-react";
import { toast } from "sonner";
import { TemperaturaBadge, TEMPERATURAS, type Temperatura } from "@/components/crm/TemperaturaBadge";

export const Route = createFileRoute("/crm/clientes")({
  component: ClientesPage,
});

type Cliente = {
  id: string;
  nombre: string;
  cedula: string | null;
  telefono: string | null;
  email: string | null;
  fecha_nacimiento: string | null;
  direccion: string | null;
  ciudad: string | null;
  temperatura: Temperatura;
  asesor_id: string | null;
  concesionario_id: string | null;
  origen: string | null;
  notas: string | null;
  ultima_interaccion: string | null;
};

type Lite = { id: string; nombre: string };

const INPUT_CLS = "w-full h-9 px-3 rounded-md border border-input bg-background text-sm";
const TEXTAREA_CLS = "w-full px-3 py-2 rounded-md border border-input bg-background text-sm min-h-[80px]";

const EMPTY = {
  nombre: "",
  cedula: "",
  telefono: "",
  email: "",
  fecha_nacimiento: "",
  direccion: "",
  ciudad: "",
  temperatura: "frio" as Temperatura,
  asesor_id: "",
  concesionario_id: "",
  origen: "",
  notas: "",
  ultima_interaccion: "",
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

function ClientesPage() {
  const [items, setItems] = useState<Cliente[]>([]);
  const [asesores, setAsesores] = useState<Lite[]>([]);
  const [concesionarios, setConcesionarios] = useState<Lite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroTemp, setFiltroTemp] = useState<"todos" | Temperatura>("todos");
  const [filtroConc, setFiltroConc] = useState<string>("todos");
  const [filtroAsesor, setFiltroAsesor] = useState<string>("todos");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [cli, ase, con] = await Promise.all([
      supabase.from("crm_clientes").select("*").order("nombre"),
      supabase.from("crm_asesores").select("id,nombre").order("nombre"),
      supabase.from("crm_concesionarios").select("id,nombre").order("nombre"),
    ]);
    if (cli.error) toast.error(cli.error.message);
    setItems((cli.data ?? []) as Cliente[]);
    setAsesores((ase.data ?? []) as Lite[]);
    setConcesionarios((con.data ?? []) as Lite[]);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const aseMap = useMemo(() => Object.fromEntries(asesores.map((a) => [a.id, a.nombre])), [asesores]);
  const conMap = useMemo(
    () => Object.fromEntries(concesionarios.map((c) => [c.id, c.nombre])),
    [concesionarios],
  );

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((c) => {
      if (filtroTemp !== "todos" && c.temperatura !== filtroTemp) return false;
      if (filtroConc !== "todos" && c.concesionario_id !== filtroConc) return false;
      if (filtroAsesor !== "todos" && c.asesor_id !== filtroAsesor) return false;
      if (!q) return true;
      return (
        c.nombre.toLowerCase().includes(q) ||
        (c.cedula ?? "").toLowerCase().includes(q) ||
        (c.telefono ?? "").includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, search, filtroTemp, filtroConc, filtroAsesor]);

  function openNew() {
    setEditingId(null);
    setForm({ ...EMPTY });
    setShowForm(true);
  }
  function openEdit(c: Cliente) {
    setEditingId(c.id);
    setForm({
      nombre: c.nombre,
      cedula: c.cedula ?? "",
      telefono: c.telefono ?? "",
      email: c.email ?? "",
      fecha_nacimiento: c.fecha_nacimiento ?? "",
      direccion: c.direccion ?? "",
      ciudad: c.ciudad ?? "",
      temperatura: c.temperatura,
      asesor_id: c.asesor_id ?? "",
      concesionario_id: c.concesionario_id ?? "",
      origen: c.origen ?? "",
      notas: c.notas ?? "",
      ultima_interaccion: c.ultima_interaccion ?? "",
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
      direccion: form.direccion.trim() || null,
      ciudad: form.ciudad.trim() || null,
      temperatura: form.temperatura,
      asesor_id: form.asesor_id || null,
      concesionario_id: form.concesionario_id || null,
      origen: form.origen.trim() || null,
      notas: form.notas.trim() || null,
      ultima_interaccion: form.ultima_interaccion || null,
    };
    const { data: userData } = await supabase.auth.getUser();
    const { error } = editingId
      ? await supabase.from("crm_clientes").update(payload).eq("id", editingId)
      : await supabase.from("crm_clientes").insert({ ...payload, created_by: userData.user?.id });
    if (error) toast.error(error.message);
    else toast.success(editingId ? "Actualizado" : "Cliente creado");
    setSaving(false);
    setShowForm(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este cliente?")) return;
    const { error } = await supabase.from("crm_clientes").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Eliminado");
      load();
    }
  }

  async function cambiarTemperatura(id: string, t: Temperatura) {
    const { error } = await supabase
      .from("crm_clientes")
      .update({ temperatura: t })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, temperatura: t } : c)));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, cédula, teléfono, email..."
            className="w-full pl-9 pr-3 h-9 rounded-md border border-input bg-background text-sm"
          />
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nuevo cliente
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={filtroTemp}
          onChange={(e) => setFiltroTemp(e.target.value as "todos" | Temperatura)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="todos">Toda temperatura</option>
          <option value="frio">Frío</option>
          <option value="tibio">Tibio</option>
          <option value="caliente">Caliente</option>
        </select>
        <select
          value={filtroConc}
          onChange={(e) => setFiltroConc(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="todos">Todos los concesionarios</option>
          {concesionarios.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select
          value={filtroAsesor}
          onChange={(e) => setFiltroAsesor(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="todos">Todos los asesores</option>
          {asesores.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Cargando…</div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No hay clientes que coincidan.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">Nombre</th>
                <th className="p-3 font-medium">Temperatura</th>
                <th className="p-3 font-medium">Asesor</th>
                <th className="p-3 font-medium">Concesionario</th>
                <th className="p-3 font-medium">Teléfono</th>
                <th className="p-3 font-medium">Cumpleaños</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => {
                const d = diasParaCumple(c.fecha_nacimiento);
                const proxCumple = d !== null && d <= 7;
                return (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3">
                      <div className="font-medium">{c.nombre}</div>
                      {c.cedula && (
                        <div className="text-xs text-muted-foreground">CC {c.cedula}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <select
                        value={c.temperatura}
                        onChange={(e) =>
                          cambiarTemperatura(c.id, e.target.value as Temperatura)
                        }
                        className="bg-transparent border-0 p-0 cursor-pointer text-xs"
                        aria-label={`Cambiar temperatura de ${c.nombre}`}
                      >
                        {TEMPERATURAS.map((t) => (
                          <option key={t} value={t}>
                            {t === "frio" ? "Frío" : t === "tibio" ? "Tibio" : "Caliente"}
                          </option>
                        ))}
                      </select>
                      <div className="mt-1">
                        <TemperaturaBadge value={c.temperatura} />
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {c.asesor_id ? aseMap[c.asesor_id] ?? "—" : "—"}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {c.concesionario_id ? conMap[c.concesionario_id] ?? "—" : "—"}
                    </td>
                    <td className="p-3 text-muted-foreground">{c.telefono ?? "—"}</td>
                    <td className="p-3">
                      {c.fecha_nacimiento ? (
                        <span
                          className={`inline-flex items-center gap-1 ${
                            proxCumple ? "text-primary font-medium" : "text-muted-foreground"
                          }`}
                        >
                          {proxCumple && <Cake className="h-3 w-3" />}
                          {new Date(c.fecha_nacimiento).toLocaleDateString("es-CO", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEdit(c)}
                        className="text-muted-foreground hover:text-foreground mr-3"
                        aria-label="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => remove(c.id)}
                        className="text-destructive hover:opacity-80"
                        aria-label="Eliminar"
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
          <div className="bg-card rounded-lg border border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <header className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h2 className="font-semibold">{editingId ? "Editar cliente" : "Nuevo cliente"}</h2>
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
              <F label="Ciudad">
                <input
                  value={form.ciudad}
                  onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                  className={INPUT_CLS}
                />
              </F>
              <F label="Dirección">
                <input
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  className={INPUT_CLS}
                />
              </F>
              <F label="Temperatura">
                <select
                  value={form.temperatura}
                  onChange={(e) =>
                    setForm({ ...form, temperatura: e.target.value as Temperatura })
                  }
                  className={INPUT_CLS}
                >
                  <option value="frio">Frío</option>
                  <option value="tibio">Tibio</option>
                  <option value="caliente">Caliente</option>
                </select>
              </F>
              <F label="Asesor">
                <select
                  value={form.asesor_id}
                  onChange={(e) => setForm({ ...form, asesor_id: e.target.value })}
                  className={INPUT_CLS}
                >
                  <option value="">— Sin asignar —</option>
                  {asesores.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
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
              <F label="Origen">
                <input
                  value={form.origen}
                  onChange={(e) => setForm({ ...form, origen: e.target.value })}
                  placeholder="Ej: Referido, Web, Visita..."
                  className={INPUT_CLS}
                />
              </F>
              <F label="Última interacción">
                <input
                  type="date"
                  value={form.ultima_interaccion}
                  onChange={(e) => setForm({ ...form, ultima_interaccion: e.target.value })}
                  className={INPUT_CLS}
                />
              </F>
              <F label="Notas" full>
                <textarea
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  className={TEXTAREA_CLS}
                />
              </F>
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
