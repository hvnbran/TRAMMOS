import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, ShieldOff, Mail, KeyRound, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  pasajeroId: string;
  email: string | null;
  autorizado: boolean;
  passwordBackup: string | null;
  primerLoginAt: string | null;
  onChange: () => void;
}

/**
 * Panel admin de acceso del pasajero:
 *  - Toggle "Autorizado" para habilitar/inhabilitar el login del pasajero.
 *  - Reenviar código OTP al correo registrado.
 *  - Mostrar contraseña backup ("Nombreapellidotrammos") para que el operador
 *    pueda dictarla cuando el pasajero no acceda a su correo.
 */
export function AccesoPasajeroPanel({
  pasajeroId, email, autorizado, passwordBackup, primerLoginAt, onChange,
}: Props) {
  const [busy, setBusy] = useState<null | "toggle" | "otp">(null);
  const [showPwd, setShowPwd] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function flash(setter: (v: string | null) => void, text: string) {
    setter(text);
    setTimeout(() => setter(null), 3500);
  }

  async function toggleAutorizado() {
    setBusy("toggle"); setErr(null); setMsg(null);
    const { error } = await supabase
      .from("pasajeros_pcd")
      .update({ autorizado: !autorizado })
      .eq("id", pasajeroId);
    setBusy(null);
    if (error) { flash(setErr, error.message); return; }
    flash(setMsg, !autorizado ? "Pasajero autorizado para iniciar sesión." : "Acceso revocado.");
    onChange();
  }

  async function reenviarOTP() {
    if (!email) { flash(setErr, "Este pasajero no tiene correo registrado."); return; }
    setBusy("otp"); setErr(null); setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setBusy(null);
    if (error) { flash(setErr, error.message); return; }
    flash(setMsg, `Código enviado a ${email}.`);
  }

  async function copiarPwd() {
    if (!passwordBackup) return;
    try {
      await navigator.clipboard.writeText(passwordBackup);
      flash(setMsg, "Contraseña copiada al portapapeles.");
    } catch {
      flash(setErr, "No se pudo copiar.");
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-border bg-secondary/30 p-3">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          {autorizado ? (
            <ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />
          ) : (
            <ShieldOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
          Acceso a la app del pasajero
        </div>
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full border ${
            autorizado
              ? "bg-success/10 text-success border-success/30"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {autorizado ? "Autorizado" : "Sin acceso"}
        </span>
      </div>

      {msg && (
        <div role="status" className="mb-2 flex items-center gap-1 text-[11px] text-success">
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> {msg}
        </div>
      )}
      {err && (
        <div role="alert" className="mb-2 text-[11px] text-destructive">{err}</div>
      )}

      <div className="grid sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={toggleAutorizado}
          disabled={busy !== null}
          className={`inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md text-xs font-medium border transition-colors disabled:opacity-50 ${
            autorizado
              ? "border-destructive/30 text-destructive hover:bg-destructive/10"
              : "border-success/30 text-success hover:bg-success/10"
          }`}
        >
          {busy === "toggle" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : autorizado ? (
            <ShieldOff className="h-3.5 w-3.5" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5" />
          )}
          {autorizado ? "Revocar acceso" : "Autorizar pasajero"}
        </button>

        <button
          type="button"
          onClick={reenviarOTP}
          disabled={busy !== null || !email || !autorizado}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md text-xs font-medium border border-border hover:bg-muted disabled:opacity-50"
          title={!email ? "Sin correo registrado" : !autorizado ? "Autoriza primero al pasajero" : "Enviar código OTP al correo"}
        >
          {busy === "otp" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
          Reenviar código al correo
        </button>
      </div>

      {passwordBackup && (
        <div className="mt-2 flex items-center gap-2 rounded-md bg-warning/10 border border-warning/30 px-2 py-1.5">
          <KeyRound className="h-3.5 w-3.5 text-warning shrink-0" aria-hidden="true" />
          <div className="text-[11px] text-foreground flex-1 min-w-0">
            <div className="text-muted-foreground">Contraseña de respaldo (dictar al pasajero)</div>
            <code className="font-mono text-xs select-all break-all">
              {showPwd ? passwordBackup : "•".repeat(Math.min(passwordBackup.length, 14))}
            </code>
          </div>
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center"
            aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={copiarPwd}
            className="text-[11px] px-2 h-7 rounded border border-border hover:bg-background"
          >
            Copiar
          </button>
        </div>
      )}

      {primerLoginAt && (
        <div className="mt-2 text-[11px] text-muted-foreground">
          Primer ingreso: {new Date(primerLoginAt).toLocaleString("es-CO")}
        </div>
      )}
    </div>
  );
}
