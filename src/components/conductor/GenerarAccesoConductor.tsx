import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  KeyRound,
  Loader2,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  MessageCircle,
  Smartphone,
  Upload,
  Download,
} from "lucide-react";

const BUCKET = "app-conductor";
const APK_FILE = "trammos-conductor.apk";

/**
 * Botón para que el admin genere/consulte/restablezca la contraseña de acceso
 * a la app del conductor. La contraseña queda guardada y visible para admins.
 */
export function GenerarAccesoConductor({
  conductorId,
  nombre,
  cedula,
}: {
  conductorId: string;
  nombre: string;
  cedula?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"loading" | "view" | "edit">("loading");
  const [currentPassword, setCurrentPassword] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"pwd" | "msg" | null>(null);

  const { role } = useAuth();
  const esAdmin = role === "admin";
  const fileRef = useRef<HTMLInputElement>(null);
  const [apk, setApk] = useState<{ size: number | null; updated: string | null } | null>(null);
  const [apkLoading, setApkLoading] = useState(false);
  const [apkError, setApkError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function cargarApk() {
    setApkLoading(true);
    const { data } = await supabase.storage.from(BUCKET).list("", { limit: 100 });
    const f = data?.find((x) => x.name === APK_FILE);
    setApk(
      f
        ? {
            size: (f.metadata as { size?: number } | null)?.size ?? null,
            updated: f.updated_at ?? f.created_at ?? null,
          }
        : null,
    );
    setApkLoading(false);
  }

  useEffect(() => {
    if (open && esAdmin) cargarApk();
  }, [open, esAdmin]);

  async function subirApk(file: File) {
    setApkError(null);
    if (!file.name.toLowerCase().endsWith(".apk")) {
      setApkError("El archivo debe terminar en .apk");
      return;
    }
    setSubiendo(true);
    const { error: err } = await supabase.storage
      .from(BUCKET)
      .upload(APK_FILE, file, { upsert: true, contentType: "application/vnd.android.package-archive" });
    setSubiendo(false);
    if (err) {
      setApkError(err.message);
      return;
    }
    await cargarApk();
  }

  async function descargarApk() {
    const { data, error: err } = await supabase.storage.from(BUCKET).createSignedUrl(APK_FILE, 300, {
      download: "TRAMMOS-Conductor.apk",
    });
    if (err || !data?.signedUrl) {
      setApkError(err?.message ?? "No se pudo generar la descarga");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }


  async function abrir() {
    setOpen(true);
    setView("loading");
    setError(null);
    setShow(false);
    setCopied(null);
    setCurrentPassword(null);

    const { data, error: err } = await supabase
      .from("conductores")
      .select("password_plain, password_hash, acceso_habilitado")
      .eq("id", conductorId)
      .maybeSingle();

    if (err) {
      setError(err.message);
      setView("edit");
      return;
    }

    if (data?.password_plain) {
      setCurrentPassword(data.password_plain);
      setView("view");
    } else {
      // Sin contraseña guardada (o creada antes de habilitar el guardado en claro)
      setView("edit");
    }
  }

  function generarRandom() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let p = "";
    for (let i = 0; i < 8; i++) p += chars[Math.floor(Math.random() * chars.length)];
    setPassword(p);
  }

  async function guardar() {
    if (password.length < 6) {
      setError("Mínimo 6 caracteres");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.rpc("set_conductor_password", {
      _conductor_id: conductorId,
      _password: password,
    });
    setLoading(false);
    if (err) {
      setError(err.message || "Error al guardar");
      return;
    }
    setCurrentPassword(password);
    setPassword("");
    setShow(true);
    setView("view");
  }

  function cerrar() {
    setOpen(false);
    setPassword("");
    setError(null);
    setCopied(null);
    setShow(false);
    setCurrentPassword(null);
  }

  async function copiarPwd() {
    if (!currentPassword) return;
    await navigator.clipboard.writeText(currentPassword);
    setCopied("pwd");
    setTimeout(() => setCopied(null), 2000);
  }

  async function copiarMensaje() {
    if (!currentPassword) return;
    const msg =
      `Hola ${nombre}, este es tu acceso a TRAMMOS Conductor:\n\n` +
      `Cédula: ${cedula ?? "(tu cédula)"}\n` +
      `Contraseña: ${currentPassword}\n\n` +
      `1) Instala la app: https://trammos.online/app\n` +
      `2) Ábrela y entra con tu cédula y contraseña.\n\n` +
      `Si prefieres no instalar nada, entra desde el navegador:\n` +
      `https://trammos.online/conductor/login`;
    await navigator.clipboard.writeText(msg);
    setCopied("msg");
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <>
      <button
        onClick={abrir}
        className="text-[11px] inline-flex items-center gap-1 text-primary hover:underline"
        title="Ver / generar contraseña para la app del conductor"
      >
        <KeyRound className="h-3 w-3" /> Acceso app
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={cerrar}>
          <div
            className="bg-card border border-border rounded-xl max-w-md w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" /> Acceso del conductor
              </h3>
              <p className="text-sm text-muted-foreground">{nombre}</p>
            </div>

            {view === "loading" && (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}

            {view === "view" && currentPassword && (
              <>
                <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 text-center space-y-3">
                  <p className="text-xs text-muted-foreground">Contraseña actual del conductor:</p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-2xl font-mono font-bold tracking-wider">
                      {show ? currentPassword : "•".repeat(currentPassword.length)}
                    </p>
                    <button
                      onClick={() => setShow((s) => !s)}
                      className="text-muted-foreground hover:text-primary p-1"
                      title={show ? "Ocultar" : "Mostrar"}
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={copiarPwd}
                      className="inline-flex items-center gap-1 text-sm text-primary font-semibold hover:underline"
                    >
                      {copied === "pwd" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied === "pwd" ? "Copiada" : "Copiar contraseña"}
                    </button>
                  </div>
                </div>

                <button
                  onClick={copiarMensaje}
                  className="w-full inline-flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-md border border-border hover:bg-secondary"
                >
                  {copied === "msg" ? <Check className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                  {copied === "msg" ? "Mensaje copiado" : "Copiar mensaje para WhatsApp"}
                </button>

                <p className="text-[11px] text-muted-foreground">
                  Entra a <strong>trammos.online/conductor/login</strong> con la <strong>cédula</strong>{cedula ? ` (${cedula})` : ""} y esta contraseña.
                </p>

                <div className="flex gap-2 justify-between items-center pt-2 border-t border-border">
                  <button
                    onClick={() => {
                      setView("edit");
                      setPassword("");
                      setError(null);
                    }}
                    className="text-xs inline-flex items-center gap-1 text-muted-foreground hover:text-destructive"
                  >
                    <RefreshCw className="h-3 w-3" /> Regenerar contraseña
                  </button>
                  <button onClick={cerrar} className="text-sm px-3 py-1.5 rounded bg-primary text-primary-foreground">
                    Listo
                  </button>
                </div>
              </>
            )}

            {view === "edit" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    {currentPassword ? "Nueva contraseña" : "Contraseña"}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={generarRandom}
                      className="text-xs px-2 py-2 rounded-md border border-border hover:bg-secondary"
                    >
                      Aleatoria
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground bg-secondary/50 rounded p-2">
                  Quedará guardada y la podrás consultar aquí cuando la necesites. El conductor entra a{" "}
                  <strong>trammos.online/conductor/login</strong> con su <strong>cédula</strong> y esta contraseña.
                </p>
                {error && <div className="text-sm text-destructive">{error}</div>}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={currentPassword ? () => setView("view") : cerrar}
                    className="text-sm px-3 py-1.5 rounded text-muted-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={guardar}
                    disabled={loading || password.length < 6}
                    className="text-sm px-3 py-1.5 rounded bg-primary text-primary-foreground disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Guardar
                  </button>
                </div>
              </>
            )}

            {esAdmin && (
              <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-primary" /> Instalable Android
                </p>

                {apkLoading ? (
                  <p className="text-[11px] text-muted-foreground">Consultando…</p>
                ) : apk ? (
                  <p className="text-[11px] text-muted-foreground">
                    Versión actual
                    {apk.size ? ` · ${(apk.size / 1024 / 1024).toFixed(1)} MB` : ""}
                    {apk.updated ? ` · subida el ${new Date(apk.updated).toLocaleDateString("es-CO")}` : ""}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">Todavía no has subido el instalable.</p>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept=".apk,application/vnd.android.package-archive"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) subirApk(f);
                    e.target.value = "";
                  }}
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={subiendo}
                    className="text-xs inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border bg-card hover:bg-secondary disabled:opacity-50"
                  >
                    {subiendo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {apk ? "Subir versión nueva" : "Subir archivo .apk"}
                  </button>
                  {apk && (
                    <button
                      onClick={descargarApk}
                      className="text-xs inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border bg-card hover:bg-secondary"
                    >
                      <Download className="h-3.5 w-3.5" /> Descargar y comprobar
                    </button>
                  )}
                </div>

                {apkError && <p className="text-[11px] text-destructive">{apkError}</p>}
                <p className="text-[11px] text-muted-foreground">
                  Los conductores lo instalan desde <strong>trammos.online/app</strong> (ese enlace va incluido en
                  el mensaje de WhatsApp).
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
