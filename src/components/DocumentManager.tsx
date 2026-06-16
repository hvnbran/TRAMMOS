import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Upload, Download, Trash2, FileText, Loader2, Eye, X, Sparkles,
  AlertTriangle, CheckCircle2, Clock, Calendar,
} from "lucide-react";

// Tipos MIME permitidos por el bucket "documentos"
const ALLOWED_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
const ALLOWED_EXTS = ["pdf", "jpg", "jpeg", "png", "webp", "heic", "heif"];
const MAX_BYTES = 20 * 1024 * 1024;

// Traduce errores de Supabase Storage / Postgres a español claro
function traducirErrorSubida(err: { message?: string; statusCode?: string | number; error?: string } | null | undefined): string {
  if (!err) return "Error desconocido al subir el archivo.";
  const raw = (err.message || err.error || "").toLowerCase();
  const code = String(err.statusCode ?? "");

  if (raw.includes("payload too large") || raw.includes("exceeded") || code === "413") {
    return "El archivo es demasiado grande. El máximo permitido es 20 MB.";
  }
  if (raw.includes("mime") || raw.includes("invalid_mime_type") || raw.includes("not allowed")) {
    return "Tipo de archivo no permitido. Solo se aceptan PDF, JPG, PNG o WEBP.";
  }
  if (raw.includes("duplicate") || raw.includes("already exists") || code === "409") {
    return "Ya existe un archivo con ese nombre. Intenta de nuevo (se generará un nombre único).";
  }
  if (raw.includes("row-level security") || raw.includes("rls") || raw.includes("policy") || raw.includes("permission") || code === "403") {
    return "No tienes permisos para subir documentos a este cliente. Verifica que tu usuario tenga el rol correcto (corona/sodimac/admin).";
  }
  if (raw.includes("bucket") && raw.includes("not found")) {
    return "El almacenamiento de documentos no está disponible. Contacta al administrador.";
  }
  if (raw.includes("network") || raw.includes("failed to fetch")) {
    return "Falla de conexión. Revisa tu internet e intenta nuevamente.";
  }
  if (raw.includes("jwt") || raw.includes("unauthorized") || code === "401") {
    return "Tu sesión expiró. Cierra sesión e inicia de nuevo.";
  }
  if (raw.includes("check constraint") && raw.includes("tipo")) {
    return "Tipo de documento no permitido por la base de datos. Recarga la página e intenta de nuevo; si el problema persiste, contacta al administrador.";
  }
  if (raw.includes("check constraint")) {
    return "Uno de los datos del documento no cumple las reglas de la base de datos. Verifica los campos e intenta de nuevo.";
  }
  if (raw.includes("violates not-null") || raw.includes("null value in column")) {
    return "Falta información obligatoria del documento. Verifica los campos requeridos.";
  }
  if (raw.includes("foreign key")) {
    return "El conductor o vehículo asociado ya no existe. Recarga la página e intenta de nuevo.";
  }
  if (raw.includes("timeout") || raw.includes("timed out")) {
    return "La operación tardó demasiado. Verifica tu conexión e intenta de nuevo.";
  }
  // Fallback: nunca mostrar el mensaje técnico crudo en inglés al usuario final.
  return "No se pudo subir el documento. Intenta de nuevo o contacta al administrador si el problema persiste.";
}

export type DocKind = "conductor" | "vehiculo";

interface DocItem {
  id: string;
  tipo: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  fecha_vencimiento: string | null;
  fecha_emision: string | null;
  numero_documento: string | null;
  verificado: boolean;
  requiere_actualizacion: boolean;
}


interface TipoDef {
  value: string;
  label: string;
  obligatorio?: boolean;
  sinVencimiento?: boolean;
}

interface Props {
  kind: DocKind;
  entityId: string;
  cliente: "corona" | "sodimac";
  tipos: TipoDef[];
}

const TABLE = {
  conductor: "conductor_documentos",
  vehiculo: "vehiculo_documentos",
} as const;

const FK = {
  conductor: "conductor_id",
  vehiculo: "vehiculo_id",
} as const;

const FOLDER = {
  conductor: "conductores",
  vehiculo: "vehiculos",
} as const;

function formatSize(b: number | null) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

type EstadoVenc = "vigente" | "por_vencer" | "vencido" | "sin_fecha";

function estadoVencimiento(fechaISO: string | null): { estado: EstadoVenc; dias: number | null } {
  if (!fechaISO) return { estado: "sin_fecha", dias: null };
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fechaISO);
  f.setHours(0, 0, 0, 0);
  const diffMs = f.getTime() - hoy.getTime();
  const dias = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (dias < 0) return { estado: "vencido", dias };
  if (dias <= 30) return { estado: "por_vencer", dias };
  return { estado: "vigente", dias };
}

function VencimientoBadge({ fecha }: { fecha: string | null }) {
  const { estado, dias } = estadoVencimiento(fecha);
  if (estado === "sin_fecha") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
        <Calendar className="h-2.5 w-2.5" /> Sin fecha
      </span>
    );
  }
  if (estado === "vencido") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive font-medium">
        <AlertTriangle className="h-2.5 w-2.5" /> Vencido hace {Math.abs(dias!)}d
      </span>
    );
  }
  if (estado === "por_vencer") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-warning/15 text-warning font-medium">
        <Clock className="h-2.5 w-2.5" /> Vence en {dias}d
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-success/15 text-success font-medium">
      <CheckCircle2 className="h-2.5 w-2.5" /> Vigente · {dias}d
    </span>
  );
}

export function DocumentManager({ kind, entityId, cliente, tipos }: Props) {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ url: string; mime: string; name: string } | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [dateValue, setDateValue] = useState<string>("");

  async function load() {
    setLoading(true);
    const { data, error } = await (supabase
      .from(TABLE[kind]) as any)
      .select("*")
      .eq(FK[kind], entityId)
      .order("created_at", { ascending: false });
    if (!error && data) setDocs(data as DocItem[]);
    setLoading(false);
  }

  useEffect(() => {
    if (entityId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId]);

  async function tryExtractDate(docId: string, storagePath: string, mime: string, tipo: string) {
    setAnalyzing(docId);
    try {
      const { data: signed } = await supabase.storage
        .from("documentos")
        .createSignedUrl(storagePath, 60 * 5);
      if (!signed?.signedUrl) {
        setAnalyzing(null);
        return;
      }
      const { data, error } = await supabase.functions.invoke("extract-doc-date", {
        body: { signedUrl: signed.signedUrl, mimeType: mime, tipo },
      });
      if (error) {
        console.error("OCR error:", error);
        setAnalyzing(null);
        return;
      }
      const updates: Record<string, unknown> = {};
      if (data?.fecha_vencimiento) updates.fecha_vencimiento = data.fecha_vencimiento;
      if (data?.fecha_emision) updates.fecha_emision = data.fecha_emision;
      if (data?.numero_documento) updates.numero_documento = data.numero_documento;
      if (Object.keys(updates).length > 0) {
        updates.verificado = true;
        await (supabase.from(TABLE[kind]) as any).update(updates).eq("id", docId);
        load();
      }
    } catch (e) {
      console.error(e);
    }
    setAnalyzing(null);
  }

  async function handleUpload(tipo: string, file: File) {
    // Validación tamaño
    if (file.size > MAX_BYTES) {
      toast.error("Archivo demasiado grande", {
        description: `"${file.name}" pesa ${formatSize(file.size)}. El máximo permitido es 20 MB.`,
      });
      return;
    }
    if (file.size === 0) {
      toast.error("Archivo vacío", {
        description: "El archivo no contiene datos. Verifica e intenta de nuevo.",
      });
      return;
    }

    // Validación tipo MIME / extensión
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const mime = (file.type || "").toLowerCase();
    const mimeOk = ALLOWED_MIMES.includes(mime);
    const extOk = ALLOWED_EXTS.includes(ext);
    if (!mimeOk && !extOk) {
      toast.error("Tipo de archivo no permitido", {
        description: `"${file.name}" (${mime || "tipo desconocido"}). Solo se aceptan PDF, JPG, PNG, WEBP, HEIC o HEIF.`,
      });
      return;
    }

    setUploading(tipo);
    const ts = Date.now();
    const safeExt = extOk ? ext : "pdf";
    const path = `${cliente}/${FOLDER[kind]}/${entityId}/${tipo}-${ts}.${safeExt}`;
    // Forzar contentType correcto cuando el navegador lo deja vacío (frecuente en HEIC/PDF en iOS)
    function inferContentType(e: string): string {
      switch (e) {
        case "pdf": return "application/pdf";
        case "jpg":
        case "jpeg": return "image/jpeg";
        case "png": return "image/png";
        case "webp": return "image/webp";
        case "heic": return "image/heic";
        case "heif": return "image/heif";
        default: return "application/octet-stream";
      }
    }
    const contentType = mimeOk ? mime : inferContentType(safeExt);

    const { error: upErr } = await supabase.storage
      .from("documentos")
      .upload(path, file, { contentType, upsert: false });

    if (upErr) {
      setUploading(null);
      console.error("[Upload doc] Storage error:", upErr);
      toast.error("No se pudo subir el documento", {
        description: traducirErrorSubida(upErr as any),
      });
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const insertPayload: Record<string, unknown> = {
      cliente,
      tipo,
      storage_path: path,
      file_name: file.name,
      mime_type: contentType,
      size_bytes: file.size,
      uploaded_by: userData.user?.id ?? null,
      [FK[kind]]: entityId,
    };

    const { data: inserted, error: insErr } = await (supabase
      .from(TABLE[kind]) as any)
      .insert(insertPayload)
      .select()
      .single();
    setUploading(null);
    if (insErr) {
      await supabase.storage.from("documentos").remove([path]);
      console.error("[Upload doc] DB insert error:", insErr);
      toast.error("No se pudo registrar el documento", {
        description: traducirErrorSubida(insErr as any),
      });
      return;
    }
    toast.success("Documento subido", {
      description: `"${file.name}" se cargó correctamente.`,
    });
    await load();
    // OCR automático en background si es imagen o PDF
    if (inserted?.id && (file.type.startsWith("image/") || file.type === "application/pdf")) {
      tryExtractDate(inserted.id, path, file.type, tipo);
    }
  }

  async function openViewer(d: DocItem) {
    const { data, error } = await supabase.storage
      .from("documentos")
      .createSignedUrl(d.storage_path, 60 * 10);
    if (error || !data) {
      console.error("[Viewer] error:", error);
      toast.error("No se pudo abrir el archivo", {
        description: traducirErrorSubida(error as any),
      });
      return;
    }
    setViewer({ url: data.signedUrl, mime: d.mime_type ?? "application/octet-stream", name: d.file_name });
  }

  async function handleDownload(d: DocItem) {
    const { data, error } = await supabase.storage
      .from("documentos")
      .download(d.storage_path);
    if (error || !data) {
      console.error("[Download] error:", error);
      toast.error("No se pudo descargar", {
        description: traducirErrorSubida(error as any),
      });
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = d.file_name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(d: DocItem) {
    if (!confirm(`¿Eliminar "${d.file_name}"?`)) return;
    const { error: stErr } = await supabase.storage.from("documentos").remove([d.storage_path]);
    if (stErr) console.warn("[Delete storage] aviso:", stErr.message);
    const { error: dbErr } = await (supabase.from(TABLE[kind]) as any).delete().eq("id", d.id);
    if (dbErr) {
      toast.error("No se pudo eliminar", { description: traducirErrorSubida(dbErr as any) });
      return;
    }
    toast.success("Documento eliminado");
    load();
  }

  async function saveDate(docId: string) {
    await (supabase.from(TABLE[kind]) as any)
      .update({ fecha_vencimiento: dateValue || null })
      .eq("id", docId);
    setEditingDate(null);
    setDateValue("");
    load();
  }

  async function toggleRequiereActualizacion(d: DocItem) {
    const nuevo = !d.requiere_actualizacion;
    const { error } = await (supabase.from(TABLE[kind]) as any)
      .update({
        requiere_actualizacion: nuevo,
        requiere_actualizacion_at: nuevo ? new Date().toISOString() : null,
      })
      .eq("id", d.id);
    if (error) {
      toast.error("No se pudo actualizar", { description: error.message });
      return;
    }
    toast.success(nuevo ? "Marcado para actualizar" : "Marca quitada");
    load();
  }


  // Resumen de cumplimiento
  const tiposSinVenc = useMemo(
    () => new Set(tipos.filter((t) => t.sinVencimiento).map((t) => t.value)),
    [tipos],
  );
  const resumen = useMemo(() => {
    const obligatorios = tipos.filter((t) => t.obligatorio);
    const cargados = obligatorios.filter((t) => docs.some((d) => d.tipo === t.value));
    const docsConVenc = docs.filter((d) => !tiposSinVenc.has(d.tipo));
    const vencidos = docsConVenc.filter((d) => estadoVencimiento(d.fecha_vencimiento).estado === "vencido").length;
    const porVencer = docsConVenc.filter((d) => estadoVencimiento(d.fecha_vencimiento).estado === "por_vencer").length;
    const requierenActualizacion = docs.filter((d) => d.requiere_actualizacion).length;
    return {
      obligatoriosTotal: obligatorios.length,
      obligatoriosCargados: cargados.length,
      vencidos,
      porVencer,
      requierenActualizacion,
    };
  }, [docs, tipos, tiposSinVenc]);


  return (
    <div className="space-y-3">
      {/* Resumen */}
      {tipos.some((t) => t.obligatorio) && (
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className={`px-2 py-1 rounded-md font-medium ${
            resumen.obligatoriosCargados === resumen.obligatoriosTotal
              ? "bg-success/15 text-success"
              : "bg-warning/15 text-warning"
          }`}>
            Obligatorios: {resumen.obligatoriosCargados}/{resumen.obligatoriosTotal}
          </span>
          {resumen.vencidos > 0 && (
            <span className="px-2 py-1 rounded-md bg-destructive/15 text-destructive font-medium">
              {resumen.vencidos} vencido{resumen.vencidos > 1 ? "s" : ""}
            </span>
          )}
          {resumen.porVencer > 0 && (
            <span className="px-2 py-1 rounded-md bg-warning/15 text-warning font-medium">
              {resumen.porVencer} por vencer (30 días)
            </span>
          )}
          {resumen.requierenActualizacion > 0 && (
            <span className="px-2 py-1 rounded-md bg-warning/15 text-warning font-medium">
              {resumen.requierenActualizacion} pendiente{resumen.requierenActualizacion > 1 ? "s" : ""} de actualizar
            </span>
          )}

        </div>
      )}

      {/* Botones de subida por tipo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {tipos.map((t) => {
          const doc = docs.find((d) => d.tipo === t.value);
          const cargado = !!doc;
          return (
            <label
              key={t.value}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-md border border-dashed px-3 py-3 text-xs cursor-pointer transition-colors ${
                cargado
                  ? "border-success/50 bg-success/5 hover:bg-success/10"
                  : t.obligatorio
                    ? "border-warning/50 bg-warning/5 hover:bg-warning/10"
                    : "border-input bg-background hover:bg-secondary/40"
              }`}
            >
              {uploading === t.value ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : cargado ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <Upload className="h-4 w-4 text-primary" />
              )}
              <span className="font-medium text-center leading-tight">
                {t.label}
                {t.obligatorio && <span className="text-destructive">*</span>}
              </span>
              <span className="text-muted-foreground text-[10px]">
                {cargado ? "Reemplazar" : "Click para subir"}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(t.value, f);
                  e.target.value = "";
                }}
                disabled={!!uploading}
              />
            </label>
          );
        })}
      </div>

      {/* Lista de documentos - tabla horizontal */}
      <div className="rounded-md border border-border overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-4">
            Sin documentos cargados.
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr className="text-left">
                <th className="px-2 py-2 font-medium w-10">#</th>
                <th className="px-2 py-2 font-medium w-10">Detalle</th>
                <th className="px-2 py-2 font-medium">Nombre de Documento</th>
                <th className="px-2 py-2 font-medium whitespace-nowrap">Válido hasta</th>
                <th className="px-2 py-2 font-medium">Descarga</th>
                <th className="px-2 py-2 font-medium">Estado</th>
                <th className="px-2 py-2 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {docs.map((d, idx) => {
                const tipoDef = tipos.find((t) => t.value === d.tipo);
                const label = tipoDef?.label ?? d.tipo;
                const sinVenc = tiposSinVenc.has(d.tipo);
                return (
                  <tr key={d.id} className="hover:bg-muted/30 align-middle">
                    <td className="px-2 py-2 text-muted-foreground">{idx + 1}</td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => openViewer(d)}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-primary"
                        title="Ver"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{label}</p>
                          <p className="text-muted-foreground truncate text-[10px]">
                            {d.file_name} · {formatSize(d.size_bytes)}
                            {d.numero_documento ? ` · N° ${d.numero_documento}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      {sinVenc ? (
                        <span className="text-muted-foreground">—</span>
                      ) : editingDate === d.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="date"
                            value={dateValue}
                            onChange={(e) => setDateValue(e.target.value)}
                            className="text-[10px] px-1 py-0.5 rounded border border-input bg-background"
                          />
                          <button
                            onClick={() => saveDate(d.id)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => { setEditingDate(null); setDateValue(""); }}
                            className="text-[10px] px-1.5 py-0.5 rounded text-muted-foreground"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingDate(d.id);
                            setDateValue(d.fecha_vencimiento ?? "");
                          }}
                          className="text-primary hover:underline"
                          title="Editar fecha"
                        >
                          {d.fecha_vencimiento
                            ? new Date(d.fecha_vencimiento).toLocaleDateString("es-CO")
                            : "Agregar"}
                        </button>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => handleDownload(d)}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <Download className="h-3 w-3" /> Descargar
                      </button>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center flex-wrap gap-1">
                          {sinVenc ? (
                            d.requiere_actualizacion ? (
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-warning/15 text-warning font-medium">
                                <AlertTriangle className="h-2.5 w-2.5" /> Requiere actualizar
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                <Calendar className="h-2.5 w-2.5" /> No vence
                              </span>
                            )
                          ) : (
                            <VencimientoBadge fecha={d.fecha_vencimiento} />
                          )}
                          {d.verificado && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/15 text-success inline-flex items-center gap-0.5">
                              <Sparkles className="h-2.5 w-2.5" /> Verificado
                            </span>
                          )}
                        </div>
                        {sinVenc && (
                          <label className="inline-flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer hover:text-foreground">
                            <input
                              type="checkbox"
                              checked={d.requiere_actualizacion}
                              onChange={() => toggleRequiereActualizacion(d)}
                              className="h-3 w-3 accent-warning"
                            />
                            Pedir actualización
                          </label>
                        )}
                      </div>
                    </td>

                    <td className="px-2 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => tryExtractDate(d.id, d.storage_path, d.mime_type ?? "", d.tipo)}
                          disabled={analyzing === d.id}
                          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-primary disabled:opacity-50"
                          title="Detectar fecha automáticamente"
                        >
                          {analyzing === d.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(d)}
                          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-destructive"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Visor inline */}
      {viewer && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setViewer(null)}
        >
          <div
            className="bg-card rounded-lg w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <p className="text-sm font-medium truncate">{viewer.name}</p>
              <button
                onClick={() => setViewer(null)}
                className="p-1 rounded hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 bg-muted/20 overflow-auto">
              {viewer.mime.startsWith("image/") ? (
                <img src={viewer.url} alt={viewer.name} className="max-w-full max-h-full mx-auto" />
              ) : viewer.mime === "application/pdf" ? (
                <iframe src={viewer.url} className="w-full h-full" title={viewer.name} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-sm text-muted-foreground text-center">
                  <FileText className="h-8 w-8" />
                  <p>Este tipo de archivo no se puede previsualizar.</p>
                  <a
                    href={viewer.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs"
                  >
                    Abrir en nueva pestaña
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tipos completos de documentos para conductores
export const TIPOS_CONDUCTOR: TipoDef[] = [
  { value: "cedula", label: "Cédula de ciudadanía", obligatorio: true, sinVencimiento: true },
  { value: "licencia_conduccion", label: "Licencia de conductor", obligatorio: true },
  { value: "seguridad_social", label: "Planilla seguridad social", obligatorio: true, sinVencimiento: true },
  { value: "examenes_medicos", label: "Exámenes médicos", obligatorio: true, sinVencimiento: true },
  { value: "antecedentes", label: "Antecedentes", obligatorio: true, sinVencimiento: true },
  { value: "simit", label: "SIMIT", obligatorio: true, sinVencimiento: true },
  { value: "curso_defensivo", label: "Curso manejo defensivo", obligatorio: true },
  { value: "curso_teorico_practico", label: "Curso teórico-práctico", obligatorio: true },
  { value: "hoja_vida", label: "Hoja de vida", obligatorio: true, sinVencimiento: true },
];


// Tipos completos de documentos para vehículos
export const TIPOS_VEHICULO: TipoDef[] = [
  { value: "tarjeta_propiedad", label: "Tarjeta de propiedad", obligatorio: true },
  { value: "cedula_propietario", label: "Cédula del propietario", obligatorio: true },
  { value: "seguro_rc", label: "Seguro responsabilidad civil", obligatorio: true },
  { value: "soat", label: "SOAT", obligatorio: true },
  { value: "tecnico_mecanica", label: "Revisión técnico-mecánica", obligatorio: true },
  { value: "revision_preventiva", label: "Revisión preventiva", obligatorio: true },
  { value: "tarjeta_operacion", label: "Tarjeta de operación", obligatorio: true },
  { value: "certificado_gps", label: "Certificado GPS", obligatorio: false },
  { value: "antecedentes_propietario", label: "Antecedentes propietario", obligatorio: true },
  { value: "simit_vehiculo", label: "SIMIT", obligatorio: true },
];
