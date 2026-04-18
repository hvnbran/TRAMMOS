import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { Plus, Filter, Clock, MapPin, Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

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
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("Todos");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // If client user, force cliente value; admin can pick
  const [form, setForm] = useState({
    cliente: (cliente ?? "corona") as "corona" | "sodimac",
    numero_orden: "",
    fecha: new Date().toISOString().slice(0, 10),
    hora: "08:00",
    origen: "",
    destino: "",
    pasajero: "",
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
    const { data, error } = await supabase
      .from("servicios")
      .select("*")
      .order("fecha", { ascending: false })
      .order("hora", { ascending: false });
    if (!error && data) setItems(data as ServicioRow[]);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, cliente: cliente ?? form.cliente };
    const { error } = await supabase.from("servicios").insert(payload);
    setSaving(false);
    if (error) {
      alert("Error: " + error.message);
      return;
    }
    setShowForm(false);
    setForm({ ...form, numero_orden: "", origen: "", destino: "", pasajero: "", conductor: "", vehiculo: "" });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este servicio?")) return;
    const { error } = await supabase.from("servicios").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    load();
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
              <div>
                <label className="text-xs text-muted-foreground">Pasajero</label>
                <input value={form.pasajero} onChange={(e) => setForm({ ...form, pasajero: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Centro de costo</label>
                <input value={form.centro_costo} onChange={(e) => setForm({ ...form, centro_costo: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Conductor</label>
                <input value={form.conductor} onChange={(e) => setForm({ ...form, conductor: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Vehículo (placa)</label>
                <input value={form.vehiculo} onChange={(e) => setForm({ ...form, vehiculo: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
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
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No hay servicios. Crea el primero con "Nuevo Servicio".
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <div key={s.id} className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors">
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
                      <Clock className="h-3 w-3" />{s.fecha} · {s.hora}
                    </div>
                    <button onClick={() => handleDelete(s.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
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
                  <div><span className="text-muted-foreground">Conductor</span><p className="font-medium">{s.conductor || "—"}</p></div>
                  <div><span className="text-muted-foreground">Vehículo</span><p className="font-medium">{s.vehiculo || "—"}</p></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
