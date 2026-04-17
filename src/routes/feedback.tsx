import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { Star, AlertTriangle, Plus, Loader2, Trash2, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/feedback")({
  component: Feedback,
  head: () => ({
    meta: [
      { title: "Feedback - TRAMMOS" },
      { name: "description", content: "Calificaciones e incidentalidad" },
    ],
  }),
});

const TIPOS_INCIDENTE = [
  "Choque / Colisión",
  "Multa de tránsito",
  "Infracción de velocidad",
  "Comparendo electrónico",
  "Incidente sin daños",
  "Daño a tercero",
  "Otro",
];

interface CalifRow {
  id: string; cliente: string; tipo: string; nombre: string; servicio: string | null;
  fecha: string; estrellas: number; mejoras: string | null;
}
interface IncRow {
  id: string; cliente: string; fecha: string; conductor: string | null; vehiculo: string | null;
  tipo_incidente: string; que_paso: string | null; cuando: string | null; por_que: string | null;
  soporte: string | null; solucion: string | null; plan_mejoramiento: string | null; estado: string;
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" disabled={readonly}
          onClick={() => onChange?.(i)}
          onMouseEnter={() => !readonly && setHover(i)}
          onMouseLeave={() => setHover(0)}
          className={readonly ? "cursor-default" : "cursor-pointer"}>
          <Star className={`h-5 w-5 ${i <= (hover || value) ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
        </button>
      ))}
    </div>
  );
}

function Feedback() {
  const navigate = useNavigate();
  const { role, cliente, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"calif" | "inc">("calif");
  const [loading, setLoading] = useState(true);
  const [califs, setCalifs] = useState<CalifRow[]>([]);
  const [incs, setIncs] = useState<IncRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [califForm, setCalifForm] = useState({
    cliente: (cliente ?? "corona") as "corona" | "sodimac",
    tipo: "conductor", nombre: "", servicio: "", estrellas: 5, mejoras: "",
  });
  const [incForm, setIncForm] = useState({
    cliente: (cliente ?? "corona") as "corona" | "sodimac",
    fecha: new Date().toISOString().slice(0, 10),
    conductor: "", vehiculo: "", tipo_incidente: TIPOS_INCIDENTE[0],
    que_paso: "", cuando: "", por_que: "", soporte: "", solucion: "", plan_mejoramiento: "",
    estado: "Abierto",
  });

  useEffect(() => { if (!authLoading && !role) navigate({ to: "/login" }); }, [authLoading, role, navigate]);
  useEffect(() => { if (role) load(); /* eslint-disable-next-line */ }, [role, tab]);

  async function load() {
    setLoading(true);
    if (tab === "calif") {
      const { data } = await supabase.from("calificaciones").select("*").order("fecha", { ascending: false });
      if (data) setCalifs(data as CalifRow[]);
    } else {
      const { data } = await supabase.from("incidentes").select("*").order("fecha", { ascending: false });
      if (data) setIncs(data as IncRow[]);
    }
    setLoading(false);
  }

  async function saveCalif(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from("calificaciones").insert({ ...califForm, cliente: cliente ?? califForm.cliente });
    setSaving(false);
    if (error) { alert(error.message); return; }
    setShowForm(false);
    setCalifForm({ ...califForm, nombre: "", servicio: "", mejoras: "", estrellas: 5 });
    load();
  }
  async function saveInc(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from("incidentes").insert({ ...incForm, cliente: cliente ?? incForm.cliente });
    setSaving(false);
    if (error) { alert(error.message); return; }
    setShowForm(false);
    setIncForm({ ...incForm, conductor: "", vehiculo: "", que_paso: "", cuando: "", por_que: "", soporte: "", solucion: "", plan_mejoramiento: "" });
    load();
  }
  async function remove(table: "calificaciones" | "incidentes", id: string) {
    if (!confirm("¿Eliminar?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { alert(error.message); return; }
    load();
  }

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Star className="h-5 w-5" /> Feedback</h1>
            <p className="text-sm text-muted-foreground">Calificaciones e incidentalidad · {role === "admin" ? "todos los clientes" : cliente}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> {tab === "calif" ? "Nueva Calificación" : "Nuevo Incidente"}
          </button>
        </div>

        <div className="flex items-center gap-1 border-b border-border">
          {([
            { k: "calif", label: "Calificaciones", icon: Star },
            { k: "inc", label: "Incidentalidad", icon: ShieldAlert },
          ] as const).map((t) => (
            <button key={t.k} onClick={() => { setTab(t.k); setShowForm(false); }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>

        {showForm && tab === "calif" && (
          <form onSubmit={saveCalif} className="rounded-lg border border-primary/30 bg-card p-5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {role === "admin" && (
                <div><label className="text-xs text-muted-foreground">Cliente</label>
                  <select value={califForm.cliente} onChange={(e) => setCalifForm({ ...califForm, cliente: e.target.value as "corona" | "sodimac" })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="corona">Corona</option><option value="sodimac">Sodimac</option>
                  </select>
                </div>
              )}
              <div><label className="text-xs text-muted-foreground">Tipo</label>
                <select value={califForm.tipo} onChange={(e) => setCalifForm({ ...califForm, tipo: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="conductor">Conductor</option><option value="usuario">Usuario</option>
                </select>
              </div>
              <div><label className="text-xs text-muted-foreground">Nombre</label>
                <input required value={califForm.nombre} onChange={(e) => setCalifForm({ ...califForm, nombre: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div><label className="text-xs text-muted-foreground">Servicio (opcional)</label>
                <input value={califForm.servicio} onChange={(e) => setCalifForm({ ...califForm, servicio: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">Calificación</label>
                <StarRating value={califForm.estrellas} onChange={(v) => setCalifForm({ ...califForm, estrellas: v })} />
              </div>
              <div className="md:col-span-2"><label className="text-xs text-muted-foreground">Qué se puede mejorar</label>
                <textarea rows={3} value={califForm.mejoras} onChange={(e) => setCalifForm({ ...califForm, mejoras: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md text-sm text-muted-foreground">Cancelar</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">{saving ? "Guardando..." : "Guardar"}</button>
            </div>
          </form>
        )}

        {showForm && tab === "inc" && (
          <form onSubmit={saveInc} className="rounded-lg border border-primary/30 bg-card p-5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {role === "admin" && (
                <div><label className="text-xs text-muted-foreground">Cliente</label>
                  <select value={incForm.cliente} onChange={(e) => setIncForm({ ...incForm, cliente: e.target.value as "corona" | "sodimac" })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="corona">Corona</option><option value="sodimac">Sodimac</option>
                  </select>
                </div>
              )}
              <div><label className="text-xs text-muted-foreground">Fecha</label>
                <input type="date" required value={incForm.fecha} onChange={(e) => setIncForm({ ...incForm, fecha: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div><label className="text-xs text-muted-foreground">Conductor</label>
                <input value={incForm.conductor} onChange={(e) => setIncForm({ ...incForm, conductor: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div><label className="text-xs text-muted-foreground">Vehículo (placa)</label>
                <input value={incForm.vehiculo} onChange={(e) => setIncForm({ ...incForm, vehiculo: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div><label className="text-xs text-muted-foreground">Tipo de incidente</label>
                <select value={incForm.tipo_incidente} onChange={(e) => setIncForm({ ...incForm, tipo_incidente: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {TIPOS_INCIDENTE.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-muted-foreground">Estado</label>
                <select value={incForm.estado} onChange={(e) => setIncForm({ ...incForm, estado: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {["Abierto", "En revisión", "Cerrado"].map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>
              <div className="md:col-span-2"><label className="text-xs text-muted-foreground">¿Qué pasó?</label>
                <textarea rows={2} value={incForm.que_paso} onChange={(e) => setIncForm({ ...incForm, que_paso: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div><label className="text-xs text-muted-foreground">¿Cuándo?</label>
                <input value={incForm.cuando} onChange={(e) => setIncForm({ ...incForm, cuando: e.target.value })} placeholder="Ej: 14:30, curva km 20" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div><label className="text-xs text-muted-foreground">¿Por qué?</label>
                <input value={incForm.por_que} onChange={(e) => setIncForm({ ...incForm, por_que: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2"><label className="text-xs text-muted-foreground">Soporte (descripción de evidencia)</label>
                <textarea rows={2} value={incForm.soporte} onChange={(e) => setIncForm({ ...incForm, soporte: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2"><label className="text-xs text-muted-foreground">Solución aplicada</label>
                <textarea rows={2} value={incForm.solucion} onChange={(e) => setIncForm({ ...incForm, solucion: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2"><label className="text-xs text-muted-foreground">Plan de mejoramiento</label>
                <textarea rows={2} value={incForm.plan_mejoramiento} onChange={(e) => setIncForm({ ...incForm, plan_mejoramiento: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md text-sm text-muted-foreground">Cancelar</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">{saving ? "Guardando..." : "Guardar"}</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : tab === "calif" ? (
          califs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Sin calificaciones.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {califs.map((c) => (
                <div key={c.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{c.nombre}</p>
                      <p className="text-xs text-muted-foreground capitalize">{c.tipo} · {c.servicio || "Sin servicio"} · {c.fecha}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating value={c.estrellas} readonly />
                      <button onClick={() => remove("calificaciones", c.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  {c.mejoras && <p className="mt-2 text-sm text-muted-foreground italic">"{c.mejoras}"</p>}
                  {role === "admin" && <p className="mt-2 text-xs text-muted-foreground capitalize">Cliente: {c.cliente}</p>}
                </div>
              ))}
            </div>
          )
        ) : (
          incs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Sin incidentes reportados.</div>
          ) : (
            <div className="space-y-3">
              {incs.map((i) => (
                <div key={i.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span className="font-semibold text-sm">{i.tipo_incidente}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">{i.estado}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {i.fecha}
                      <button onClick={() => remove("incidentes", i.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div><span className="text-muted-foreground">Conductor</span><p>{i.conductor || "—"}</p></div>
                    <div><span className="text-muted-foreground">Vehículo</span><p>{i.vehiculo || "—"}</p></div>
                    <div><span className="text-muted-foreground">Cuándo</span><p>{i.cuando || "—"}</p></div>
                    <div><span className="text-muted-foreground">Por qué</span><p>{i.por_que || "—"}</p></div>
                  </div>
                  {i.que_paso && <div className="mt-2 text-sm"><span className="text-xs text-muted-foreground">Qué pasó: </span>{i.que_paso}</div>}
                  {i.soporte && <div className="mt-1 text-sm"><span className="text-xs text-muted-foreground">Soporte: </span>{i.soporte}</div>}
                  {i.solucion && <div className="mt-1 text-sm"><span className="text-xs text-muted-foreground">Solución: </span>{i.solucion}</div>}
                  {i.plan_mejoramiento && <div className="mt-1 text-sm"><span className="text-xs text-muted-foreground">Plan mejoramiento: </span>{i.plan_mejoramiento}</div>}
                  {role === "admin" && <p className="mt-2 text-xs text-muted-foreground capitalize">Cliente: {i.cliente}</p>}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </AppLayout>
  );
}
