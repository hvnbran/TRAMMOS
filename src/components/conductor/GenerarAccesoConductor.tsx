import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { KeyRound, Loader2, Copy, Check } from "lucide-react";

/**
 * Botón para que el admin genere/restablezca la contraseña de acceso
 * a la app del conductor. Muestra la contraseña una sola vez.
 */
export function GenerarAccesoConductor({ conductorId, nombre }: { conductorId: string; nombre: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [generated, setGenerated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
    setGenerated(password);
  }

  function cerrar() {
    setOpen(false);
    setPassword("");
    setGenerated(null);
    setError(null);
    setCopied(false);
  }

  async function copiar() {
    if (!generated) return;
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[11px] inline-flex items-center gap-1 text-primary hover:underline"
        title="Generar contraseña para la app del conductor"
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
                <KeyRound className="h-5 w-5 text-primary" /> Generar acceso
              </h3>
              <p className="text-sm text-muted-foreground">{nombre}</p>
            </div>

            {!generated ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Contraseña</label>
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
                  El conductor entrará a <strong>tramos.online/conductor/login</strong> con su <strong>cédula</strong> y esta contraseña.
                  Comparte el enlace por WhatsApp.
                </p>
                {error && <div className="text-sm text-destructive">{error}</div>}
                <div className="flex gap-2 justify-end">
                  <button onClick={cerrar} className="text-sm px-3 py-1.5 rounded text-muted-foreground">
                    Cancelar
                  </button>
                  <button
                    onClick={guardar}
                    disabled={loading || password.length < 6}
                    className="text-sm px-3 py-1.5 rounded bg-primary text-primary-foreground disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Guardar y habilitar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-lg border-2 border-success bg-success/5 p-4 text-center space-y-2">
                  <p className="text-xs text-muted-foreground">Contraseña creada (cópiala ahora, no se mostrará otra vez):</p>
                  <p className="text-2xl font-mono font-bold tracking-wider">{generated}</p>
                  <button
                    onClick={copiar}
                    className="inline-flex items-center gap-1 text-sm text-primary font-semibold hover:underline"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Comparte: <strong>tramos.online/conductor/login</strong> · Usuario: cédula · Contraseña: la de arriba
                </p>
                <div className="flex justify-end">
                  <button onClick={cerrar} className="text-sm px-3 py-1.5 rounded bg-primary text-primary-foreground">
                    Listo
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
