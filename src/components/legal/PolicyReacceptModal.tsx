import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, ShieldCheck } from "lucide-react";
import { useRecordAcceptance } from "@/lib/legal/record-acceptance";

interface Props {
  /** Email del usuario actual, para registrar snapshot. */
  email: string | null;
  /** Callback cuando el usuario acepta. */
  onAccepted: () => void;
}

/**
 * Modal bloqueante mostrado cuando la versión de la política ha cambiado y
 * el usuario aún no ha aceptado la versión vigente.
 */
export function PolicyReacceptModal({ email, onAccepted }: Props) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const record = useRecordAcceptance();

  async function handleAccept() {
    if (!checked || loading) return;
    setLoading(true);
    setErr(null);
    try {
      await record({
        types: ["terminos", "privacidad"],
        contexto: "reaceptacion",
        email,
      });
      onAccepted();
    } catch (e) {
      setErr("No pudimos registrar tu aceptación. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reaccept-title"
    >
      <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-2xl p-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 id="reaccept-title" className="text-lg font-semibold text-foreground">
            Actualizamos nuestras políticas
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Hemos actualizado los Términos y la Política de Privacidad. Para
          continuar usando TRAMMOS, por favor acepta la nueva versión.
        </p>

        <label className="flex items-start gap-2 text-xs text-foreground/90 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded accent-primary"
          />
          <span className="leading-snug">
            He leído y acepto los{" "}
            <Link
              to="/legal/terminos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Términos
            </Link>{" "}
            y la{" "}
            <Link
              to="/legal/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Política de Privacidad
            </Link>{" "}
            actualizados.
          </span>
        </label>

        {err && (
          <div className="mb-3 rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
            {err}
          </div>
        )}

        <button
          type="button"
          disabled={!checked || loading}
          onClick={handleAccept}
          className="w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Registrando...
            </>
          ) : (
            "Aceptar y continuar"
          )}
        </button>
      </div>
    </div>
  );
}
