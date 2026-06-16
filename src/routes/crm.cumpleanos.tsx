import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Cake, Users, Car, Phone, Plus, Bell, X, Trash2, UserPlus, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/crm/cumpleanos")({
  component: CumpleanosPage,
});

type Item = {
  id: string;
  nombre: string;
  fecha: string;
  telefono: string | null;
  origen: "cliente" | "conductor" | "manual";
  relacion?: string | null;
};

/**
 * Parsea "YYYY-MM-DD" como fecha LOCAL (no UTC).
 * Si usamos `new Date("2000-06-08")` JS lo lee como UTC medianoche, lo que
 * en zonas con offset negativo (Colombia UTC-5) se muestra como 7 de junio.
 */
function parseLocalDate(fecha: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(fecha);
}

function diasParaCumple(fecha: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = parseLocalDate(fecha);
  const c = new Date(hoy.getFullYear(), f.getMonth(), f.getDate());
  if (c < hoy) c.setFullYear(hoy.getFullYear() + 1);
  return Math.round((c.getTime() - hoy.getTime()) / 86400000);
}

function fmt(fecha: string): string {
  const f = parseLocalDate(fecha);
  return f.toLocaleDateString("es-CO", { day: "2-digit", month: "long" });
}

function edad(fecha: string): number {
  const hoy = new Date();
  const f = parseLocalDate(fecha);
  let e = hoy.getFullYear() - f.getFullYear();
  const m = hoy.getMonth() - f.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) e--;
  return e + 1;
}

function mensajeFelicitacion(nombre: string) {
  return `¡Feliz cumpleaños, ${nombre}! 🎉🎂 Todo el equipo de TRAMMOS te desea un día maravilloso lleno de bendiciones y éxitos.`;
}

function CumpleanosPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | "cliente" | "conductor" | "manual">("todos");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [form, setForm] = useState({ nombre: "", fecha_nacimiento: "", telefono: "", relacion: "", notas: "" });

  useEffect(() => {
    const raw = localStorage.getItem("crm_cumple_dismissed");
    if (raw) {
      try {
        const data = JSON.parse(raw) as { date: string; ids: string[] };
        const hoy = new Date().toISOString().slice(0, 10);
        if (data.date === hoy) setDismissed(data.ids);
      } catch {}
    }
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const [cli, con, man] = await Promise.all([
      supabase.from("crm_clientes").select("id,nombre,fecha_nacimiento,telefono"),
      supabase.from("conductores").select("id,nombre,fecha_nacimiento,telefono"),
      supabase.from("crm_cumpleanos_manual").select("id,nombre,fecha_nacimiento,telefono,relacion"),
    ]);
    const all: Item[] = [];
    (cli.data ?? []).forEach((c: any) => {
      if (c.fecha_nacimiento)
        all.push({ id: c.id, nombre: c.nombre, fecha: c.fecha_nacimiento, telefono: c.telefono, origen: "cliente" });
    });
    (con.data ?? []).forEach((c: any) => {
      if (c.fecha_nacimiento)
        all.push({ id: c.id, nombre: c.nombre, fecha: c.fecha_nacimiento, telefono: c.telefono, origen: "conductor" });
    });
    (man.data ?? []).forEach((c: any) =>
      all.push({
        id: c.id,
        nombre: c.nombre,
        fecha: c.fecha_nacimiento,
        telefono: c.telefono,
        relacion: c.relacion,
        origen: "manual",
      }),
    );
    setItems(all);
    setLoading(false);
  }

  function dismissReminder(id: string) {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem(
      "crm_cumple_dismissed",
      JSON.stringify({ date: new Date().toISOString().slice(0, 10), ids: next }),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre || !form.fecha_nacimiento) return;
    setSaving(true);
    const { error } = await supabase.from("crm_cumpleanos_manual").insert({
      nombre: form.nombre,
      fecha_nacimiento: form.fecha_nacimiento,
      telefono: form.telefono || null,
      relacion: form.relacion || null,
      notas: form.notas || null,
    });
    setSaving(false);
    if (error) {
      toast.error("No se pudo guardar: " + error.message);
      return;
    }
    toast.success("Cumpleaños agregado");
    setForm({ nombre: "", fecha_nacimiento: "", telefono: "", relacion: "", notas: "" });
    setShowForm(false);
    void load();
  }

  async function deleteManual(id: string) {
    if (!confirm("¿Eliminar este cumpleaños?")) return;
    const { error } = await supabase.from("crm_cumpleanos_manual").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Eliminado");
    void load();
  }

  const ordenados = useMemo(
    () =>
      items
        .filter((i) => filtro === "todos" || i.origen === filtro)
        .map((i) => ({ ...i, dias: diasParaCumple(i.fecha) }))
        .sort((a, b) => a.dias - b.dias),
    [items, filtro],
  );

  const reminders = useMemo(
    () =>
      items
        .map((i) => ({ ...i, dias: diasParaCumple(i.fecha) }))
        .filter((i) => i.dias <= 3 && !dismissed.includes(`${i.origen}-${i.id}`))
        .sort((a, b) => a.dias - b.dias),
    [items, dismissed],
  );

  const hoy = ordenados.filter((i) => i.dias === 0);
  const semana = ordenados.filter((i) => i.dias > 0 && i.dias <= 7);
  const mes = ordenados.filter((i) => i.dias > 7 && i.dias <= 30);
  const despues = ordenados.filter((i) => i.dias > 30);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Cake className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-bold">Cumpleaños</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-md border border-border bg-card p-1 text-xs">
            {([
              ["todos", "Todos"],
              ["cliente", "Clientes"],
              ["conductor", "Conductores"],
              ["manual", "Manuales"],
            ] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setFiltro(k)}
                className={`px-3 py-1.5 rounded ${filtro === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Agregar
          </button>
        </div>
      </header>

      {reminders.length > 0 && (
        <div className="space-y-2">
          {reminders.map((r) => (
            <div
              key={`rem-${r.origen}-${r.id}`}
              className={`rounded-lg border p-3 flex items-center justify-between gap-3 ${
                r.dias === 0
                  ? "border-primary/40 bg-primary/10"
                  : "border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Bell className={`h-5 w-5 shrink-0 ${r.dias === 0 ? "text-primary" : "text-amber-600"}`} />
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {r.dias === 0 ? "🎉 ¡Hoy es el cumpleaños de " : "🔔 Próximo cumpleaños: "}
                    {r.nombre}
                    {r.dias === 0 ? "!" : ""}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.dias === 0 ? "Cumple hoy" : `En ${r.dias} día${r.dias === 1 ? "" : "s"}`} ·{" "}
                    {fmt(r.fecha)} · cumple {edad(r.fecha)} años
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.telefono && (
                  <a
                    href={`https://wa.me/${r.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(mensajeFelicitacion(r.nombre))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-border bg-background hover:bg-muted"
                  >
                    <MessageCircle className="h-3 w-3" />
                    Felicitar
                  </a>
                )}
                <button
                  onClick={() => dismissReminder(`${r.origen}-${r.id}`)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                  title="Ocultar por hoy"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-border bg-card p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Agregar cumpleaños manualmente</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Nombre *</label>
              <input
                required
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Fecha de nacimiento *</label>
              <input
                type="date"
                required
                value={form.fecha_nacimiento}
                onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Teléfono / WhatsApp</label>
              <input
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="573001234567"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Relación</label>
              <input
                value={form.relacion}
                onChange={(e) => setForm({ ...form, relacion: e.target.value })}
                placeholder="Aliado, familiar, proveedor…"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground">Notas</label>
              <textarea
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-md text-sm text-muted-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-muted-foreground">Cargando…</div>
      ) : ordenados.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Aún no hay fechas de nacimiento registradas. Agrega una con el botón "Agregar" o desde la ficha del cliente/conductor.
        </div>
      ) : (
        <>
          <Seccion titulo="🎉 ¡Hoy!" items={hoy} highlight onDelete={deleteManual} />
          <Seccion titulo="Esta semana (próximos 7 días)" items={semana} onDelete={deleteManual} />
          <Seccion titulo="Este mes (8–30 días)" items={mes} onDelete={deleteManual} />
          <Seccion titulo="Más adelante" items={despues} onDelete={deleteManual} />
        </>
      )}
    </div>
  );
}

function Seccion({
  titulo,
  items,
  highlight,
  onDelete,
}: {
  titulo: string;
  items: (Item & { dias: number })[];
  highlight?: boolean;
  onDelete: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-lg border border-border bg-card overflow-hidden">
      <header
        className={`px-4 py-2.5 border-b border-border text-sm font-semibold ${highlight ? "bg-primary/10 text-primary" : ""}`}
      >
        {titulo} <span className="text-muted-foreground font-normal">({items.length})</span>
      </header>
      <ul className="divide-y divide-border">
        {items.map((i) => (
          <li key={`${i.origen}-${i.id}`} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${
                  i.origen === "cliente"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : i.origen === "conductor"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                }`}
              >
                {i.origen === "cliente" ? (
                  <Users className="h-3 w-3" />
                ) : i.origen === "conductor" ? (
                  <Car className="h-3 w-3" />
                ) : (
                  <UserPlus className="h-3 w-3" />
                )}
                {i.origen}
                {i.relacion ? ` · ${i.relacion}` : ""}
              </span>
              <span className="font-medium truncate">{i.nombre}</span>
              <span className="text-muted-foreground hidden sm:inline">
                · {fmt(i.fecha)} · cumple {edad(i.fecha)}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {i.telefono && (
                <a
                  href={`https://wa.me/${i.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(mensajeFelicitacion(i.nombre))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  title="Felicitar por WhatsApp"
                >
                  <Phone className="h-3 w-3" />
                  {i.telefono}
                </a>
              )}
              <span
                className={`text-xs font-medium ${i.dias === 0 ? "text-primary" : "text-muted-foreground"}`}
              >
                {i.dias === 0 ? "¡Hoy!" : `en ${i.dias} día${i.dias === 1 ? "" : "s"}`}
              </span>
              {i.origen === "manual" && (
                <button
                  onClick={() => onDelete(i.id)}
                  className="p-1 text-muted-foreground hover:text-destructive"
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
