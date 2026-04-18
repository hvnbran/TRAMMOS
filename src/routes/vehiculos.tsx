import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { Plus, Loader2, Trash2, Car, FileText, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { DocumentManager, TIPOS_VEHICULO } from "@/components/DocumentManager";
import { CardGridSkeleton } from "@/components/ui/loading-skeletons";

export const Route = createFileRoute("/vehiculos")({
  component: Vehiculos,
  head: () => ({
    meta: [
      { title: "Vehículos - TRAMMOS" },
      { name: "description", content: "Administración de flota vehicular" },
    ],
  }),
});

interface VehiculoRow {
  id: string;
  cliente: "corona" | "sodimac";
  placa: string;
  marca: string | null;
  linea: string | null;
  modelo: number | null;
  color: string | null;
  num_interno: string | null;
  estado: string;
  vence_soat: string | null;
  vence_rtm: string | null;
  conductor: string | null;
}

function estadoStyle(e: string) {
  switch (e) {
    case "Disponible": return "bg-success/15 text-success";
    case "En servicio": return "bg-primary/15 text-primary";
    case "En mantenimiento": return "bg-warning/15 text-warning";
    default: return "bg-muted text-muted-foreground";
  }
}

function Vehiculos() {
  const navigate = useNavigate();
  const { role, cliente, loading: authLoading } = useAuth();
  const [items, setItems] = useState<VehiculoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    cliente: (cliente ?? "corona") as "corona" | "sodimac",
    placa: "", marca: "", linea: "", modelo: new Date().getFullYear(), color: "",
    num_interno: "", estado: "Disponible", vence_soat: "", vence_rtm: "", conductor: "",
  });

  useEffect(() => { if (!authLoading && !role) navigate({ to: "/login" }); }, [authLoading, role, navigate]);
  useEffect(() => { if (role) load(); /* eslint-disable-next-line */ }, [role]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("vehiculos").select("*").order("placa");
    if (data) setItems(data as VehiculoRow[]);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      cliente: cliente ?? form.cliente,
      modelo: Number(form.modelo) || null,
      vence_soat: form.vence_soat || null,
      vence_rtm: form.vence_rtm || null,
    };
    const { error } = await supabase.from("vehiculos").insert(payload);
    setSaving(false);
    if (error) { alert(error.message); return; }
    setShowForm(false);
    setForm({ ...form, placa: "", marca: "", linea: "", color: "", num_interno: "", vence_soat: "", vence_rtm: "", conductor: "" });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este vehículo?")) return;
    const { error } = await supabase.from("vehiculos").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    load();
  }

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Car className="h-5 w-5" /> Vehículos</h1>
            <p className="text-sm text-muted-foreground">{role === "admin" ? "Todos los clientes" : `Cliente: ${cliente}`}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Nuevo Vehículo
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="rounded-lg border border-primary/30 bg-card p-5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {role === "admin" && (
                <div>
                  <label className="text-xs text-muted-foreground">Cliente</label>
                  <select value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value as "corona" | "sodimac" })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="corona">Corona</option>
                    <option value="sodimac">Sodimac</option>
                  </select>
                </div>
              )}
              <div><label className="text-xs text-muted-foreground">Placa</label><input required value={form.placa} onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-muted-foreground">Marca</label><input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-muted-foreground">Línea</label><input value={form.linea} onChange={(e) => setForm({ ...form, linea: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-muted-foreground">Modelo (año)</label><input type="number" value={form.modelo} onChange={(e) => setForm({ ...form, modelo: Number(e.target.value) })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-muted-foreground">Color</label><input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-muted-foreground">N° interno</label><input value={form.num_interno} onChange={(e) => setForm({ ...form, num_interno: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-muted-foreground">Vence SOAT</label><input type="date" value={form.vence_soat} onChange={(e) => setForm({ ...form, vence_soat: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-muted-foreground">Vence RTM</label><input type="date" value={form.vence_rtm} onChange={(e) => setForm({ ...form, vence_rtm: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-muted-foreground">Conductor asignado</label><input value={form.conductor} onChange={(e) => setForm({ ...form, conductor: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-muted-foreground">Estado</label>
                <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {["Disponible", "En servicio", "En mantenimiento"].map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md text-sm text-muted-foreground">Cancelar</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">{saving ? "Guardando..." : "Guardar"}</button>
            </div>
          </form>
        )}

        {loading ? (
          <CardGridSkeleton count={6} />
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No hay vehículos registrados.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((v) => (
              <div key={v.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-lg">{v.placa}</p>
                    <p className="text-xs text-muted-foreground">{v.marca} {v.linea} {v.modelo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoStyle(v.estado)}`}>{v.estado}</span>
                    <button onClick={() => handleDelete(v.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Color</span><p>{v.color || "—"}</p></div>
                  <div><span className="text-muted-foreground">N° interno</span><p>{v.num_interno || "—"}</p></div>
                  <div><span className="text-muted-foreground">SOAT</span><p>{v.vence_soat || "—"}</p></div>
                  <div><span className="text-muted-foreground">RTM</span><p>{v.vence_rtm || "—"}</p></div>
                  <div className="col-span-2"><span className="text-muted-foreground">Conductor</span><p>{v.conductor || "Sin asignar"}</p></div>
                  {role === "admin" && <div className="col-span-2"><span className="text-muted-foreground">Cliente</span><p className="capitalize">{v.cliente}</p></div>}
                </div>
                <button
                  onClick={() => setExpanded(expanded === v.id ? null : v.id)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:bg-primary/5 rounded-md py-1.5 border border-primary/20"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Documentos
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded === v.id ? "rotate-180" : ""}`} />
                </button>
                {expanded === v.id && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <DocumentManager
                      kind="vehiculo"
                      entityId={v.id}
                      cliente={v.cliente}
                      tipos={TIPOS_VEHICULO}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
