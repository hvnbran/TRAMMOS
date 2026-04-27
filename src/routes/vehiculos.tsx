import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { Plus, Trash2, Car, FileText, ChevronDown, Pencil, AlertTriangle, Camera, Loader2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { DocumentManager, TIPOS_VEHICULO } from "@/components/DocumentManager";
import { VehiculoConductores } from "@/components/VehiculoConductores";
import { ChecklistANS } from "@/components/ChecklistANS";
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
  cliente: "corona" | "sodimac" | null;
  clientes: ("corona" | "sodimac")[];
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
  foto_url: string | null;
}

const EMPTY_FORM = {
  clientes: [] as ("corona" | "sodimac")[],
  placa: "", marca: "", linea: "", modelo: new Date().getFullYear(), color: "",
  num_interno: "", estado: "Disponible", conductor: "",
};

interface ConductorOpt { id: string; nombre: string; cedula: string | null; }

function isVencido(fechaISO: string | null): boolean {
  if (!fechaISO) return false;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const f = new Date(fechaISO); f.setHours(0, 0, 0, 0);
  return f.getTime() < hoy.getTime();
}

function estadoEfectivo(v: VehiculoRow): { estado: string; vencido: boolean; motivos: string[] } {
  const motivos: string[] = [];
  if (isVencido(v.vence_soat)) motivos.push("SOAT");
  if (isVencido(v.vence_rtm)) motivos.push("Técnico mecánica");
  if (motivos.length > 0) return { estado: "Inactivo", vencido: true, motivos };
  return { estado: v.estado, vencido: false, motivos };
}

function estadoStyle(e: string) {
  switch (e) {
    case "Disponible": return "bg-success/15 text-success";
    case "En servicio": return "bg-primary/15 text-primary";
    case "En mantenimiento": return "bg-warning/15 text-warning";
    case "Inactivo": return "bg-destructive/15 text-destructive";
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const initialClientes: ("corona" | "sodimac")[] = cliente ? [cliente as "corona" | "sodimac"] : [];
  const [form, setForm] = useState({ ...EMPTY_FORM, clientes: initialClientes });
  const [filtroCliente, setFiltroCliente] = useState<"todos" | "corona" | "sodimac" | "sin_asignar">("todos");
  const [conductoresOpts, setConductoresOpts] = useState<ConductorOpt[]>([]);
  const [nuevoConductor, setNuevoConductor] = useState(false);
  const [asignacionesPorVehiculo, setAsignacionesPorVehiculo] = useState<Record<string, number>>({});

  useEffect(() => { if (!authLoading && !role) navigate({ to: "/login" }); }, [authLoading, role, navigate]);
  useEffect(() => { if (role) { load(); loadConductores(); } /* eslint-disable-next-line */ }, [role]);

  async function loadConductores() {
    const { data } = await supabase.from("conductores").select("id, nombre, cedula").order("nombre");
    if (data) setConductoresOpts(data as ConductorOpt[]);
  }

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("vehiculos").select("*").order("placa");
    if (data) setItems(data as VehiculoRow[]);
    // Conteo de conductores asignados por vehículo
    const { data: asign } = await (supabase.from("vehiculo_conductores") as any)
      .select("vehiculo_id");
    const counts: Record<string, number> = {};
    (asign ?? []).forEach((a: { vehiculo_id: string }) => {
      counts[a.vehiculo_id] = (counts[a.vehiculo_id] ?? 0) + 1;
    });
    setAsignacionesPorVehiculo(counts);
    setLoading(false);
  }

  const [uploadingId, setUploadingId] = useState<string | null>(null);

  async function handleFotoUpload(v: VehiculoRow, file: File) {
    if (!file.type.startsWith("image/")) { alert("Selecciona una imagen"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Máximo 5 MB"); return; }
    setUploadingId(v.id);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${(v.clientes?.[0] ?? v.cliente ?? "general")}/${v.id}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("vehiculos-fotos")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { alert(upErr.message); setUploadingId(null); return; }
    const { data: pub } = supabase.storage.from("vehiculos-fotos").getPublicUrl(path);
    const url = pub.publicUrl;
    await supabase.from("vehiculos").update({ foto_url: url } as any).eq("id", v.id);
    setUploadingId(null);
    load();
  }

  function startCreate() {
    setEditingId(null);
    setNuevoConductor(false);
    setForm({ ...EMPTY_FORM, clientes: initialClientes });
    setShowForm(true);
  }

  function startEdit(v: VehiculoRow) {
    setEditingId(v.id);
    setNuevoConductor(false);
    setForm({
      clientes: (v.clientes && v.clientes.length > 0) ? v.clientes : (v.cliente ? [v.cliente] : []),
      placa: v.placa,
      marca: v.marca ?? "",
      linea: v.linea ?? "",
      modelo: v.modelo ?? new Date().getFullYear(),
      color: v.color ?? "",
      num_interno: v.num_interno ?? "",
      estado: v.estado,
      conductor: v.conductor ?? "",
    });
    setShowForm(true);
  }

  function toggleCliente(c: "corona" | "sodimac") {
    setForm((f) => ({
      ...f,
      clientes: f.clientes.includes(c) ? f.clientes.filter((x) => x !== c) : [...f.clientes, c],
    }));
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setNuevoConductor(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      placa: form.placa,
      marca: form.marca,
      linea: form.linea,
      modelo: Number(form.modelo) || null,
      color: form.color,
      num_interno: form.num_interno,
      estado: form.estado,
      conductor: form.conductor.trim() || null,
      // Multi-cliente: array + columna legacy en NULL si está vacío o el primero del array
      clientes: form.clientes,
      cliente: form.clientes[0] ?? null,
    };
    const { error } = editingId
      ? await supabase.from("vehiculos").update(payload as any).eq("id", editingId)
      : await supabase.from("vehiculos").insert(payload as any);
    setSaving(false);
    if (error) { alert(error.message); return; }
    cancelForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este vehículo?")) return;
    const { error } = await supabase.from("vehiculos").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    load();
  }

  const itemsFiltrados = items.filter((v) => {
    const cs = (v.clientes && v.clientes.length > 0) ? v.clientes : (v.cliente ? [v.cliente] : []);
    if (filtroCliente === "todos") return true;
    if (filtroCliente === "sin_asignar") return cs.length === 0;
    return cs.includes(filtroCliente);
  });

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Car className="h-5 w-5" /> Vehículos</h1>
            <p className="text-sm text-muted-foreground">{role === "admin" ? "Todos los clientes" : `Cliente: ${cliente}`}</p>
          </div>
          <button onClick={() => showForm ? cancelForm() : startCreate()} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Nuevo Vehículo
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-lg border border-primary/30 bg-card p-5 space-y-3">
            <p className="text-sm font-semibold">{editingId ? "Editar vehículo" : "Nuevo vehículo"}</p>
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
              <div className="md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-muted-foreground">Conductor asignado (opcional)</label>
                  <button
                    type="button"
                    onClick={() => { setNuevoConductor(!nuevoConductor); setForm({ ...form, conductor: "" }); }}
                    className="text-[11px] text-primary hover:underline"
                  >
                    {nuevoConductor ? "← Elegir existente" : "+ Escribir nuevo"}
                  </button>
                </div>
                {nuevoConductor ? (
                  <input
                    value={form.conductor}
                    onChange={(e) => setForm({ ...form, conductor: e.target.value })}
                    placeholder="Nombre del conductor"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                ) : (
                  <select
                    value={form.conductor}
                    onChange={(e) => setForm({ ...form, conductor: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">— Sin asignar —</option>
                    {conductoresOpts.map((c) => (
                      <option key={c.id} value={c.nombre}>
                        {c.nombre}{c.cedula ? ` (${c.cedula})` : ""}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">Para asignar varios conductores, usa el panel de "Documentos" del vehículo después de guardarlo.</p>
              </div>
              <div><label className="text-xs text-muted-foreground">Estado</label>
                <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {["Disponible", "En servicio", "En mantenimiento", "Inactivo"].map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={cancelForm} className="px-4 py-2 rounded-md text-sm text-muted-foreground">Cancelar</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60">{saving ? "Guardando..." : editingId ? "Actualizar" : "Guardar"}</button>
            </div>
          </form>
        )}

        {loading ? (
          <CardGridSkeleton count={6} />
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No hay vehículos registrados.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((v, i) => {
              const { estado: eff, vencido, motivos } = estadoEfectivo(v);
              return (
                <div
                  key={v.id}
                  className={`stagger-item rounded-lg border bg-card overflow-hidden flex flex-col ${vencido ? "border-destructive/40" : "border-border"}`}
                  style={{ ["--i" as string]: i } as React.CSSProperties}
                >
                  {/* Foto del vehículo - aspect ratio fijo para homogeneidad */}
                  <div className="relative aspect-[16/9] bg-secondary/40 group">
                    {v.foto_url ? (
                      <img
                        src={v.foto_url}
                        alt={`Vehículo ${v.placa}`}
                        className={`w-full h-full object-cover ${vencido ? "opacity-60 grayscale" : ""}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                        <Car className="h-12 w-12" />
                      </div>
                    )}
                    <label
                      htmlFor={`foto-${v.id}`}
                      className="absolute bottom-2 right-2 bg-background/90 hover:bg-background border border-border rounded-md px-2 py-1 text-[11px] font-medium flex items-center gap-1 cursor-pointer shadow-sm transition-opacity opacity-0 group-hover:opacity-100"
                      title={v.foto_url ? "Cambiar foto" : "Subir foto"}
                    >
                      {uploadingId === v.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Camera className="h-3 w-3" />
                      )}
                      {v.foto_url ? "Cambiar" : "Subir foto"}
                    </label>
                    <input
                      id={`foto-${v.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFotoUpload(v, file);
                        e.target.value = "";
                      }}
                    />
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between">
                      <div className={vencido ? "opacity-70" : ""}>
                        <p className={`font-bold text-lg ${vencido ? "line-through" : ""}`}>{v.placa}</p>
                        <p className="text-xs text-muted-foreground">{v.marca} {v.linea} {v.modelo}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoStyle(eff)}`}>{eff}</span>
                        <button onClick={() => startEdit(v)} className="text-muted-foreground hover:text-primary" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(v.id)} className="text-muted-foreground hover:text-destructive" title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    {vencido && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-destructive">
                        <AlertTriangle className="h-3 w-3" /> {motivos.join(" y ")} vencido — actualice la fecha para reactivar
                      </div>
                    )}
                    <div className={`mt-3 grid grid-cols-2 gap-2 text-xs ${vencido ? "opacity-70" : ""}`}>
                      <div><span className="text-muted-foreground">Color</span><p>{v.color || "—"}</p></div>
                      <div><span className="text-muted-foreground">N° interno</span><p>{v.num_interno || "—"}</p></div>
                    </div>
                    {(asignacionesPorVehiculo[v.id] ?? 0) === 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setExpanded(v.id);
                          // Scroll suave al panel después de expandir
                          setTimeout(() => {
                            document.getElementById(`conductores-${v.id}`)?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                          }, 100);
                        }}
                        className="mt-3 w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-warning/40 bg-warning/10 hover:bg-warning/15 text-left transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-warning">Sin conductores asignados</p>
                            <p className="text-[10px] text-muted-foreground truncate">Asignar uno o más conductores</p>
                          </div>
                        </div>
                        <UserPlus className="h-3.5 w-3.5 text-warning shrink-0" />
                      </button>
                    )}
                  <button
                    onClick={() => setExpanded(expanded === v.id ? null : v.id)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:bg-primary/5 rounded-md py-1.5 border border-primary/20"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Documentos
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded === v.id ? "rotate-180" : ""}`} />
                  </button>
                  {expanded === v.id && (
                    <div className="mt-3 pt-3 border-t border-border space-y-4">
                      <ChecklistANS vehiculoId={v.id} />
                      <div id={`conductores-${v.id}`} className="pt-3 border-t border-border scroll-mt-20">
                        <VehiculoConductores vehiculoId={v.id} cliente={v.cliente} />
                      </div>
                      <div className="pt-3 border-t border-border">
                        <DocumentManager
                          kind="vehiculo"
                          entityId={v.id}
                          cliente={v.cliente}
                          tipos={TIPOS_VEHICULO}
                        />
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
