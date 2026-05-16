import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KeyRound, Loader2, Copy, Check, Eye, EyeOff, RefreshCw, MessageCircle } from "lucide-react";

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

  async function abrir() {
    setOpen(true);
    setView("edit");
    setError(null);
    setShow(false);
    setCopied(null);
    setCurrentPassword(null);
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
      `Hola ${nombre}, este es tu acceso a TRAMMOS Conductor:\n` +
      `Enlace: https://tramos.online/conductor/login\n` +
      `Cédula: ${cedula ?? "(tu cédula)"}\n` +
      `Contraseña: ${currentPassword}`;
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
                  Entra a <strong>tramos.online/conductor/login</strong> con la <strong>cédula</strong>{cedula ? ` (${cedula})` : ""} y esta contraseña.
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
                  <strong>tramos.online/conductor/login</strong> con su <strong>cédula</strong> y esta contraseña.
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
          </div>
        </div>
      )}
    </>
  );
}
