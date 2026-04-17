import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Download, Trash2, FileText, Loader2, Eye } from "lucide-react";

export type DocKind = "conductor" | "vehiculo";

interface DocItem {
  id: string;
  tipo: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

interface Props {
  kind: DocKind;
  entityId: string;
  cliente: "corona" | "sodimac";
  /** [{value,label}] tipos permitidos */
  tipos: { value: string; label: string }[];
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

export function DocumentManager({ kind, entityId, cliente, tipos }: Props) {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

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

  async function handleUpload(tipo: string, file: File) {
    if (file.size > 20 * 1024 * 1024) {
      alert("El archivo no debe superar 20MB");
      return;
    }
    setUploading(tipo);
    const ext = file.name.split(".").pop() || "bin";
    const ts = Date.now();
    const path = `${cliente}/${FOLDER[kind]}/${entityId}/${tipo}-${ts}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("documentos")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (upErr) {
      setUploading(null);
      alert("Error subiendo: " + upErr.message);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const insertPayload: Record<string, unknown> = {
      cliente,
      tipo,
      storage_path: path,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: userData.user?.id ?? null,
      [FK[kind]]: entityId,
    };

    const { error: insErr } = await (supabase.from(TABLE[kind]) as any).insert(insertPayload);
    setUploading(null);
    if (insErr) {
      await supabase.storage.from("documentos").remove([path]);
      alert("Error registrando: " + insErr.message);
      return;
    }
    load();
  }

  async function handleView(d: DocItem) {
    const { data, error } = await supabase.storage
      .from("documentos")
      .createSignedUrl(d.storage_path, 60 * 5);
    if (error || !data) return alert("No se pudo abrir el archivo");
    window.open(data.signedUrl, "_blank");
  }

  async function handleDownload(d: DocItem) {
    const { data, error } = await supabase.storage
      .from("documentos")
      .download(d.storage_path);
    if (error || !data) return alert("No se pudo descargar");
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = d.file_name;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(d: DocItem) {
    if (!confirm(`¿Eliminar "${d.file_name}"?`)) return;
    await supabase.storage.from("documentos").remove([d.storage_path]);
    await (supabase.from(TABLE[kind]) as any).delete().eq("id", d.id);
    load();
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {tipos.map((t) => (
          <label
            key={t.value}
            className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input bg-background px-3 py-3 text-xs cursor-pointer hover:bg-secondary/40 transition-colors"
          >
            {uploading === t.value ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Upload className="h-4 w-4 text-primary" />
            )}
            <span className="font-medium">{t.label}</span>
            <span className="text-muted-foreground">Click para subir</span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(t.value, f);
                e.target.value = "";
              }}
              disabled={!!uploading}
            />
          </label>
        ))}
      </div>

      <div className="rounded-md border border-border">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-4">
            Sin documentos cargados.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {docs.map((d) => {
              const label = tipos.find((t) => t.value === d.tipo)?.label ?? d.tipo;
              return (
                <li key={d.id} className="flex items-center gap-3 px-3 py-2 text-xs">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{d.file_name}</p>
                    <p className="text-muted-foreground">
                      {label} · {formatSize(d.size_bytes)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleView(d)}
                    className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-primary"
                    title="Ver"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDownload(d)}
                    className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-primary"
                    title="Descargar"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(d)}
                    className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-destructive"
                    title="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export const TIPOS_CONDUCTOR = [
  { value: "poliza_arl", label: "Pólizas ARL/SST" },
  { value: "licencia_conduccion", label: "Licencia conducción" },
  { value: "tarjeta_operacion", label: "Tarjeta operación" },
];

export const TIPOS_VEHICULO = [
  { value: "tarjeta_operacion", label: "Tarjeta operación" },
  { value: "soat", label: "SOAT" },
  { value: "tecnico_mecanica", label: "Técnico mecánica" },
];
