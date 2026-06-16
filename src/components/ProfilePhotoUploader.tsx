import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Loader2 } from "lucide-react";
import { PersonaAvatar } from "@/components/PersonaAvatar";

interface Props {
  entity: "conductor" | "pasajero";
  /** ID en la tabla `conductores` o `pasajeros_pcd`. */
  rowId: string;
  nombre?: string | null;
  fotoUrl?: string | null;
  size?: "md" | "lg" | "xl";
  onChange?: (newUrl: string) => void;
  /** Texto opcional debajo del avatar (ej: "Cambiar foto"). */
  label?: string;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Avatar clickeable que permite subir / cambiar la foto de perfil.
 * Sube al bucket público `vehiculos-fotos/{conductores|pasajeros}/{rowId}.{ext}`
 * y actualiza la columna `foto_url` de la tabla correspondiente.
 */
export function ProfilePhotoUploader({
  entity,
  rowId,
  nombre,
  fotoUrl,
  size = "lg",
  onChange,
  label = "Cambiar foto",
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [localUrl, setLocalUrl] = useState<string | null>(fotoUrl ?? null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      alert("Formato no soportado. Usa JPG, PNG o WEBP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      alert("La imagen es muy grande. Máximo 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const folder = entity === "conductor" ? "conductores" : "pasajeros";
      const path = `${folder}/${rowId}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("vehiculos-fotos")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("vehiculos-fotos").getPublicUrl(path);
      // Cache-buster para forzar refresh inmediato del CDN
      const publicUrl = `${pub.publicUrl}?t=${Date.now()}`;

      const table = entity === "conductor" ? "conductores" : "pasajeros_pcd";
      const { error: dbErr } = await supabase
        .from(table)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ foto_url: publicUrl } as any)
        .eq("id", rowId);
      if (dbErr) throw dbErr;

      setLocalUrl(publicUrl);
      onChange?.(publicUrl);
    } catch (e) {
      console.error("[ProfilePhotoUploader]", e);
      alert("No se pudo subir la foto. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative group rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label={localUrl ? "Cambiar foto de perfil" : "Subir foto de perfil"}
      >
        <PersonaAvatar nombre={nombre} fotoUrl={localUrl} size={size} />
        <span className="absolute inset-0 rounded-full bg-foreground/45 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
        </span>
      </button>
      {label && (
        <span className="text-[11px] text-muted-foreground">{uploading ? "Subiendo…" : label}</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
