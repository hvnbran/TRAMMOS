import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { AdminOnly } from "../components/layout/AdminOnly";
import { FileText, Plus, Upload, Trash2, Download, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/formatos")({
  component: () => <AdminOnly><Formatos /></AdminOnly>,
  head: () => ({
    meta: [
      { title: "Formatos de Auditoría - TRAMMOS" },
      { name: "description", content: "Formatos de auditoría de vehículos por cliente y vendedor" },
    ],
  }),
});

type TipoFormato = "cliente" | "vendedor";
type EstadoFormato = "Pendiente" | "En revisión" | "Completado";

interface Formato {
  id: string;
  cliente: "corona" | "sodimac";
  codigo: string;
  nombre: string;
  tipo: TipoFormato;
  entidad: string;
  fecha: string;
  estado: EstadoFormato;
  vehiculos_auditados: number;
  storage_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
}

function getEstadoFormato(estado: string) {
  switch (estado) {
    case "Pendiente": return "bg-warning/15 text-warning";
    case "En revisión": return "bg-primary/15 text-primary";
    case "Completado": return "bg-success/15 text-success";
    default: return "bg-muted text-muted-foreground";
  }
}

function Formatos() {
  const { cliente: userCliente, role } = useAuth();
  const [filtroFormato, setFiltroFormato] = useState<"todos" | TipoFormato>("todos");
  const [showNuevoFmt, setShowNuevoFmt] = useState(false);
  const [formatos, setFormatos] = useState<Formato[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [fTipo, setFTipo] = useState<TipoFormato>("cliente");
  const [fNombre, setFNombre] = useState("");
  const [fEntidad, setFEntidad] = useState("");
  const [fVehiculos, setFVehiculos] = useState<number | "">("");
  const [fEstado, setFEstado] = useState<EstadoFormato>("Pendiente");
  const [fCliente, setFCliente] = useState<"corona" | "sodimac">(userCliente ?? "corona");
  const [fFile, setFFile] = useState<File | null>(null);

  useEffect(() => {
    if (userCliente) setFCliente(userCliente);
  }, [userCliente]);

  async function loadFormatos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("formatos_auditoria")
      .select("*")
      .order("fecha", { ascending: false });
    if (error) {
      toast.error("Error cargando formatos: " + error.message);
    } else {
      setFormatos((data ?? []) as Formato[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadFormatos();
  }, []);

  function resetForm() {
    setFTipo("cliente");
    setFNombre("");
    setFEntidad("");
    setFVehiculos("");
    setFEstado("Pendiente");
    setFFile(null);
    setFCliente(userCliente ?? "corona");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleGuardar() {
    if (!fNombre.trim() || !fEntidad.trim()) {
      toast.error("Completa nombre y entidad auditada");
      return;
    }
    setSaving(true);
    try {
      const targetCliente = role === "admin" ? fCliente : (userCliente ?? "corona");
      const codigo = `FMT-${Date.now().toString().slice(-8)}`;

      let storage_path: string | null = null;
      let file_name: string | null = null;
      let mime_type: string | null = null;
      let size_bytes: number | null = null;

      if (fFile) {
        const path = `formatos/${targetCliente}/${codigo}-${fFile.name}`;
        const { error: upErr } = await supabase.storage
          .from("documentos")
          .upload(path, fFile, { upsert: false });
        if (upErr) throw upErr;
        storage_path = path;
        file_name = fFile.name;
        mime_type = fFile.type || null;
        size_bytes = fFile.size;
      }

      const { error } = await supabase.from("formatos_auditoria").insert({
        cliente: targetCliente,
        codigo,
        nombre: fNombre.trim(),
        tipo: fTipo,
        entidad: fEntidad.trim(),
        estado: fEstado,
        vehiculos_auditados: typeof fVehiculos === "number" ? fVehiculos : 0,
        storage_path,
        file_name,
        mime_type,
        size_bytes,
      });
      if (error) throw error;
      toast.success("Formato creado");
      resetForm();
      setShowNuevoFmt(false);
      loadFormatos();
    } catch (err: any) {
      toast.error("Error guardando: " + (err.message ?? err));
    } finally {
      setSaving(false);
    }
  }

  async function handleEliminar(f: Formato) {
    if (!confirm(`¿Eliminar el formato ${f.codigo}?`)) return;
    if (f.storage_path) {
      await supabase.storage.from("documentos").remove([f.storage_path]);
    }
    const { error } = await supabase.from("formatos_auditoria").delete().eq("id", f.id);
    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success("Formato eliminado");
      loadFormatos();
    }
  }

  async function handleDescargar(f: Formato) {
    if (!f.storage_path) {
      toast.error("Este formato no tiene archivo adjunto");
      return;
    }
    const { data, error } = await supabase.storage
      .from("documentos")
      .createSignedUrl(f.storage_path, 60);
    if (error || !data) {
      toast.error("No se pudo generar enlace");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  const fmtFiltrados = formatos.filter((f) => filtroFormato === "todos" || f.tipo === filtroFormato);

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Formatos de Auditoría</h1>
            <p className="text-sm text-muted-foreground">Auditoría de vehículos por cliente y por vendedor</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {(["todos", "cliente", "vendedor"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltroFormato(f)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filtroFormato === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "todos" ? "Todos" : f === "cliente" ? "Por Cliente" : "Por Vendedor"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowNuevoFmt(!showNuevoFmt)}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Nuevo Formato
          </button>
        </div>

        {showNuevoFmt && (
          <div className="rounded-lg border border-primary/30 bg-card p-5 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Cargar Formato de Auditoría</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tipo de Auditoría</label>
                <select value={fTipo} onChange={(e) => setFTipo(e.target.value as TipoFormato)} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                  <option value="cliente">Auditoría de vehículos por cliente</option>
                  <option value="vendedor">Auditoría de vehículos por vendedor</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nombre del formato</label>
                <input value={fNombre} onChange={(e) => setFNombre(e.target.value)} placeholder="Ej: Auditoría Q2 2025" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{fTipo === "cliente" ? "Cliente auditado" : "Vendedor auditado"}</label>
                <input value={fEntidad} onChange={(e) => setFEntidad(e.target.value)} placeholder={fTipo === "cliente" ? "Ej: Corona - Planta Sogamoso" : "Ej: Renault Bogotá Norte"} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Vehículos auditados</label>
                <input type="number" min={0} value={fVehiculos} onChange={(e) => setFVehiculos(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Cantidad" className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Estado</label>
                <select value={fEstado} onChange={(e) => setFEstado(e.target.value as EstadoFormato)} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                  <option value="Pendiente">Pendiente</option>
                  <option value="En revisión">En revisión</option>
                  <option value="Completado">Completado</option>
                </select>
              </div>
              {role === "admin" && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Cliente (empresa)</label>
                  <select value={fCliente} onChange={(e) => setFCliente(e.target.value as "corona" | "sodimac")} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
                    <option value="corona">Corona</option>
                    <option value="sodimac">Sodimac</option>
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Archivo del formato (opcional)</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                {fFile ? (
                  <p className="text-sm font-medium">{fFile.name} ({Math.round(fFile.size / 1024)} KB)</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Haz clic para seleccionar archivo</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, Excel, Word (máx 10MB)</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.xls,.xlsx,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.size > 10 * 1024 * 1024) {
                    toast.error("El archivo supera 10MB");
                    return;
                  }
                  setFFile(file ?? null);
                }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button disabled={saving} onClick={() => { resetForm(); setShowNuevoFmt(false); }} className="px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
              <button disabled={saving} onClick={handleGuardar} className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar Formato
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando formatos...
          </div>
        ) : fmtFiltrados.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No hay formatos registrados</p>
            <p className="text-xs text-muted-foreground mt-1">Crea tu primer formato de auditoría con el botón "Nuevo Formato"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fmtFiltrados.map((f) => (
              <div key={f.id} className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold">{f.codigo}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getEstadoFormato(f.estado)}`}>{f.estado}</span>
                </div>
                <p className="mt-2 text-sm font-medium">{f.nombre}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">{f.tipo === "cliente" ? "Cliente" : "Vendedor"}</span>
                    <p className="font-medium">{f.entidad}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vehículos auditados</span>
                    <p className="font-medium">{f.vehiculos_auditados}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fecha</span>
                    <p className="font-medium">{f.fecha}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tipo</span>
                    <p className="font-medium capitalize">{f.tipo === "cliente" ? "Por cliente" : "Por vendedor"}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleDescargar(f)}
                    disabled={!f.storage_path}
                    className="flex-1 flex items-center justify-center gap-1 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-3 w-3" /> {f.storage_path ? "Descargar" : "Sin archivo"}
                  </button>
                  <button
                    onClick={() => handleEliminar(f)}
                    className="rounded-md bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
