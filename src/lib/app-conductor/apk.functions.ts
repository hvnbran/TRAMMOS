import { createServerFn } from "@tanstack/react-start";

const BUCKET = "app-conductor";
const FILE = "trammos-conductor.apk";

export interface ApkInfo {
  disponible: boolean;
  url: string | null;
  /** bytes */
  tamano: number | null;
  actualizado: string | null;
}

/**
 * Info pública del instalable: genera un enlace temporal de descarga.
 * El bucket es privado, así que el enlace se firma en el servidor.
 */
export const getApkInfo = createServerFn({ method: "GET" }).handler(async (): Promise<ApkInfo> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: files } = await supabaseAdmin.storage.from(BUCKET).list("", { limit: 100 });
  const file = files?.find((f) => f.name === FILE);
  if (!file) return { disponible: false, url: null, tamano: null, actualizado: null };

  const { data: signed } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(FILE, 60 * 60 * 6, { download: "TRAMMOS-Conductor.apk" });

  return {
    disponible: true,
    url: signed?.signedUrl ?? null,
    tamano: (file.metadata as { size?: number } | null)?.size ?? null,
    actualizado: file.updated_at ?? file.created_at ?? null,
  };
});
