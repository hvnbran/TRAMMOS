import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { Plus, Trash2, Users, Pencil, AlertTriangle, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { TIPOS_CONDUCTOR } from "@/components/DocumentManager";
import { CardGridSkeleton } from "@/components/ui/loading-skeletons";
import { GenerarAccesoConductor } from "@/components/conductor/GenerarAccesoConductor";
import { ConductorProfileModal } from "@/components/ConductorProfileModal";
import { PersonaAvatar } from "@/components/PersonaAvatar";


export const Route = createFileRoute("/conductores")({
  component: Conductores,
  head: () => ({
    meta: [
      { title: "Conductores - TRAMMOS" },
      { name: "description", content: "Gestión de conductores y documentación" },
    ],
  }),
});

interface ConductorRow {
  id: string;
  cliente: "corona" | "sodimac" | null;
  clientes: ("corona" | "sodimac")[];
  nombre: string;
  cedula: string | null;
  telefono: string | null;
  licencia: string | null;
  categoria_lic: string | null;
  estado: string;
  vence_licencia: string | null;
  servicios: number | null;
  cumplimiento: number | null;
  foto_url: string | null;
}


const EMPTY_FORM = {
  clientes: [] as ("corona" | "sodimac")[],
  nombre: "", cedula: "", telefono: "", licencia: "", categoria_lic: "C1",
  estado: "Activo", vence_licencia: "", fecha_nacimiento: "",
};

function isVencido(fechaISO: string | null): boolean {
  if (!fechaISO) return false;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const f = new Date(fechaISO); f.setHours(0, 0, 0, 0);
  return f.getTime() < hoy.getTime();
}

function estadoEfectivo(c: ConductorRow): string {
  if (isVencido(c.vence_licencia)) return "Vencido";
  return c.estado;
}

function estadoStyle(e: string) {
  switch (e) {
    case "Activo": return "bg-success/15 text-success";
    case "Suspendido": return "bg-warning/15 text-warning";
    case "Vencido": return "bg-destructive/15 text-destructive";
    default: return "bg-muted text-muted-foreground";
  }
}

function Conductores() {
  const navigate = useNavigate();
  const { role, cliente, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ConductorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalConductorId, setModalConductorId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const initialClientes: ("corona" | "sodimac")[] = cliente ? [cliente as "corona" | "sodimac"] : [];
  const [form, setForm] = useState({ ...EMPTY_FORM, clientes: initialClientes });

  const [filtroCliente, setFiltroCliente] = useState<"todos" | "corona" | "sodimac" | "sin_asignar">("todos");

  useEffect(() => { if (!authLoading && !role) navigate({ to: "/login" }); }, [authLoading, role, navigate]);
  useEffect(() => { if (role) load(); /* eslint-disable-next-line */ }, [role]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("conductores").select("*").order("nombre");
    if (data) setItems(data as ConductorRow[]);
    setLoading(false);
  }

  function startCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, clientes: initialClientes });
    setShowForm(true);
  }

  function startEdit(c: ConductorRow) {
    setEditingId(c.id);
    setForm({
      clientes: (c.clientes && c.clientes.length > 0) ? c.clientes : (c.cliente ? [c.cliente] : []),
      nombre: c.nombre,
      cedula: c.cedula ?? "",
      telefono: c.telefono ?? "",
      licencia: c.licencia ?? "",
      categoria_lic: c.categoria_lic ?? "C1",
      estado: c.estado,
      vence_licencia: c.vence_licencia ?? "",
      fecha_nacimiento: (c as any).fecha_nacimiento ?? "",
    });
    setShowForm(true);
  }

  function toggleCliente(cl: "corona" | "sodimac") {
    setForm((f) => ({
      ...f,
      clientes: f.clientes.includes(cl) ? f.clientes.filter((x) => x !== cl) : [...f.clientes, cl],
    }));
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      nombre: form.nombre,
      cedula: form.cedula,
      telefono: form.telefono,
      licencia: form.licencia,
      categoria_lic: form.categoria_lic,
      vence_licencia: form.vence_licencia || null,
      fecha_nacimiento: form.fecha_nacimiento || null,
      estado: isVencido(form.vence_licencia || null) ? "Vencido" : form.estado,
      clientes: form.clientes,
      cliente: form.clientes[0] ?? null,
    };
    const { error } = editingId
      ? await supabase.from("conductores").update(payload as any).eq("id", editingId)
      : await supabase.from("conductores").insert(payload as any);
    setSaving(false);
    if (error) { alert(error.message); return; }
    cancelForm();
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este conductor?")) return;
    const { error } = await supabase.from("conductores").delete().eq("id", id);
    if (error) { alert(error.message); return; }
    load();
  }

  const itemsFiltrados = items.filter((c) => {
    const cs = (c.clientes && c.clientes.length > 0) ? c.clientes : (c.cliente ? [c.cliente] : []);
    if (filtroCliente === "todos") return true;
    if (filtroCliente === "sin_asignar") return cs.length === 0;
    return cs.includes(filtroCliente);
  });

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-5 w-5" /> Conductores</h1>
            <p className="text-sm text-muted-foreground">{role === "admin" ? "Todos los clientes" : `Cliente: ${cliente}`}</p>
          </div>
          <button onClick={() => showForm ? cancelForm() : startCreate()} className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Nuevo Conductor
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Filtrar:</span>
          {([
            { v: "todos", l: "Todos" },
            { v: "corona", l: "Corona" },
            { v: "sodimac", l: "Sodimac" },
            { v: "sin_asignar", l: "Sin asignar" },
          ] as const).map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setFiltroCliente(opt.v)}
              className={`px-2.5 py-1 rounded-full border ${filtroCliente === opt.v ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-secondary/40"}`}
            >
              {opt.l}
            </button>
          ))}
          <span className="text-muted-foreground ml-auto">{itemsFiltrados.length} de {items.length}</span>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-lg border border-primary/30 bg-card p-5 space-y-3">
            <p className="text-sm font-semibold">{editingId ? "Editar conductor" : "Nuevo conductor"}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3">
                <label className="text-xs text-muted-foreground">Cliente(s) — marca uno, ambos, o ninguno (sin asignar)</label>
                <div className="flex flex-wrap gap-3 mt-1">
                  {(["corona", "sodimac"] as const).map((cl) => (
                    <label key={cl} className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-secondary/30">
                      <input type="checkbox" checked={form.clientes.includes(cl)} onChange={() => toggleCliente(cl)} />
                      <span className="capitalize">{cl}</span>
                    </label>
                  ))}
                  {form.clientes.length === 0 && (
                    <span className="text-[11px] text-warning self-center">Sin asignar — visible para todos los administradores hasta que sea reclamado</span>
                  )}
                </div>
              </div>
              <div><label className="text-xs text-muted-foreground">Nombre completo</label><input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-muted-foreground">Cédula</label><input value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-muted-foreground">Teléfono</label><input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-muted-foreground">Licencia</label><input value={form.licencia} onChange={(e) => setForm({ ...form, licencia: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-muted-foreground">Categoría</label>
                <select value={form.categoria_lic} onChange={(e) => setForm({ ...form, categoria_lic: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {["C1", "C2", "C3", "B1", "B2"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="text-xs text-muted-foreground">Vence licencia</label><input type="date" value={form.vence_licencia} onChange={(e) => setForm({ ...form, vence_licencia: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-muted-foreground">Fecha de nacimiento</label><input type="date" value={form.fecha_nacimiento} onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
              <div><label className="text-xs text-muted-foreground">Estado</label>
                <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {["Activo", "Suspendido", "Vencido"].map((x) => <option key={x}>{x}</option>)}
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
        ) : itemsFiltrados.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No hay conductores que coincidan con el filtro.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {itemsFiltrados.map((c, i) => {
              const eff = estadoEfectivo(c);
              const vencido = eff === "Vencido";
              return (
                <div
                  key={c.id}
                  className={`stagger-item rounded-lg border bg-card p-4 ${vencido ? "border-destructive/40" : "border-border"}`}
                  style={{ ["--i" as string]: i } as React.CSSProperties}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => setModalConductorId(c.id)}
                      className="shrink-0 rounded-full ring-2 ring-transparent hover:ring-primary/40 transition"
                      title="Ver perfil y documentos"
                    >
                      <PersonaAvatar nombre={c.nombre} fotoUrl={c.foto_url} size="lg" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className={`min-w-0 ${vencido ? "opacity-70" : ""}`}>
                          <button
                            type="button"
                            onClick={() => setModalConductorId(c.id)}
                            className={`font-semibold text-left hover:text-primary truncate block ${vencido ? "line-through" : ""}`}
                          >
                            {c.nombre}
                          </button>
                          <p className="text-xs text-muted-foreground">{c.cedula || "Sin cédula"}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoStyle(eff)}`}>{eff}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1 flex-wrap">
                        <GenerarAccesoConductor conductorId={c.id} nombre={c.nombre} cedula={c.cedula} />
                        <button onClick={() => startEdit(c)} className="text-muted-foreground hover:text-primary p-1" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive p-1" title="Eliminar"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  </div>

                  {vencido && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-destructive">
                      <AlertTriangle className="h-3 w-3" /> Licencia vencida — actualice la fecha para reactivar
                    </div>
                  )}
                  <div className={`mt-3 grid grid-cols-2 gap-2 text-xs ${vencido ? "opacity-70" : ""}`}>
                    <div><span className="text-muted-foreground">Teléfono</span><p>{c.telefono || "—"}</p></div>
                    <div><span className="text-muted-foreground">Licencia</span><p>{c.licencia || "—"} · {c.categoria_lic}</p></div>
                    <div><span className="text-muted-foreground">Vence</span><p className={isVencido(c.vence_licencia) ? "text-destructive font-medium" : ""}>{c.vence_licencia || "—"}</p></div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {((c.clientes && c.clientes.length > 0) ? c.clientes : (c.cliente ? [c.cliente] : [])).length === 0 ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/15 text-warning border border-warning/30">Sin asignar</span>
                    ) : (
                      ((c.clientes && c.clientes.length > 0) ? c.clientes : [c.cliente!]).map((cl) => (
                        <span key={cl} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 capitalize">{cl}</span>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() => setModalConductorId(c.id)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:bg-primary/5 rounded-md py-1.5 border border-primary/20"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Ver perfil y documentos
                  </button>
                </div>
              );

            })}
          </div>
        )}
      </div>

      {modalConductorId && (
        <ConductorProfileModal
          conductorId={modalConductorId}
          onClose={() => { setModalConductorId(null); load(); }}
        />
      )}
    </AppLayout>
  );
}

