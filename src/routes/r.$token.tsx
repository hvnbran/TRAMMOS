import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  validarInvitacionRegistro,
  consumirInvitacionRegistro,
} from "@/lib/cuentas/invitaciones.functions";
import { Loader2, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/r/$token")({
  component: RegistroPage,
  head: () => ({
    meta: [
      { title: "Completar registro - TRAMMOS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type ValidState =
  | { state: "loading" }
  | { state: "invalid"; reason: string }
  | { state: "valid"; tipo: "empresa" | "pasajero"; cliente: string | null; rol: string | null; empresa_nombre: string | null; email_sugerido: string | null; display_name_sugerido: string | null };

function RegistroPage() {
  const { token } = Route.useParams();
  const validar = useServerFn(validarInvitacionRegistro);
  const consumir = useServerFn(consumirInvitacionRegistro);
  const [v, setV] = useState<ValidState>({ state: "loading" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  // Pasajero extra
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tipoDisc, setTipoDisc] = useState("ninguna");
  const [nivel, setNivel] = useState(0);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const r = await validar({ data: { token } });
        if (cancel) return;
        if (!r.ok) {
          const msg =
            r.reason === "ya_usado"
              ? "Este enlace ya fue usado y no puede reutilizarse."
              : r.reason === "expirado"
                ? "Este enlace expiró. Solicita uno nuevo a tu administrador."
                : "Este enlace no es válido.";
          setV({ state: "invalid", reason: msg });
        } else {
          setV({
            state: "valid",
            tipo: r.tipo,
            cliente: r.cliente,
            rol: r.rol,
            empresa_nombre: r.empresa_nombre,
            email_sugerido: r.email_sugerido,
            display_name_sugerido: r.display_name_sugerido,
          });
          if (r.email_sugerido) setEmail(r.email_sugerido);
          if (r.display_name_sugerido) {
            setDisplayName(r.display_name_sugerido);
            setNombre(r.display_name_sugerido);
          }
        }
      } catch (e) {
        setV({ state: "invalid", reason: e instanceof Error ? e.message : "Error validando el enlace" });
      }
    })();
    return () => { cancel = true; };
  }, [token, validar]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (v.state !== "valid") return;
    setError(null);
    if (password.length < 8) return setError("La contraseña debe tener mínimo 8 caracteres.");
    if (password !== password2) return setError("Las contraseñas no coinciden.");

    setSubmitting(true);
    try {
      await consumir({
        data: {
          token,
          email,
          password,
          display_name: displayName || undefined,
          pasajero: v.tipo === "pasajero"
            ? {
                nombre,
                cedula: cedula || undefined,
                telefono: telefono || undefined,
                tipo_discapacidad: tipoDisc,
                nivel_asistencia: nivel,
              }
            : undefined,
        },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Completa tu registro en TRAMMOS</h1>
        </div>

        {v.state === "loading" && (
          <div className="py-10 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Validando enlace…
          </div>
        )}

        {v.state === "invalid" && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm flex gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium text-destructive">{v.reason}</p>
              <p className="text-muted-foreground text-xs">
                Por seguridad, cada enlace solo puede abrirse y usarse una vez.
              </p>
              <Link to="/" className="text-xs text-primary underline">Volver al inicio</Link>
            </div>
          </div>
        )}

        {v.state === "valid" && done && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 font-medium">
              <CheckCircle2 className="h-5 w-5" /> Cuenta creada
            </div>
            <p className="text-muted-foreground">Ya puedes iniciar sesión con tu correo y la contraseña que definiste.</p>
            <Link to="/login" className="inline-block mt-2 text-sm px-3 py-1.5 rounded bg-primary text-primary-foreground">
              Ir al login
            </Link>
          </div>
        )}

        {v.state === "valid" && !done && (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Tipo de cuenta: <strong>{v.tipo === "empresa" ? "Empresa / Monitoreo" : "Pasajero"}</strong>
              {v.empresa_nombre && <> · Empresa: <strong>{v.empresa_nombre}</strong></>}
            </p>

            <Field label="Email (será tu usuario)">
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>

            {v.tipo === "empresa" && (
              <Field label="Nombre visible">
                <input className="input" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </Field>
            )}

            {v.tipo === "pasajero" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Nombre completo">
                    <input className="input" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
                  </Field>
                  <Field label="Cédula">
                    <input className="input" value={cedula} onChange={(e) => setCedula(e.target.value)} />
                  </Field>
                  <Field label="Teléfono">
                    <input className="input" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                  </Field>
                  <Field label="Tipo discapacidad">
                    <select className="input" value={tipoDisc} onChange={(e) => setTipoDisc(e.target.value)}>
                      <option value="ninguna">Ninguna</option>
                      <option value="visual">Visual</option>
                      <option value="auditiva">Auditiva</option>
                      <option value="motriz">Motriz</option>
                      <option value="cognitiva">Cognitiva</option>
                      <option value="multiple">Múltiple</option>
                    </select>
                  </Field>
                  <Field label="Nivel asistencia (0-3)">
                    <input className="input" type="number" min={0} max={3} value={nivel} onChange={(e) => setNivel(Number(e.target.value))} />
                  </Field>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Contraseña (mín. 8)">
                <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
              <Field label="Confirmar contraseña">
                <input className="input" type="password" required minLength={8} value={password2} onChange={(e) => setPassword2(e.target.value)} />
              </Field>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Crear mi cuenta
            </button>
            <p className="text-[11px] text-muted-foreground text-center">
              Este enlace es de un solo uso. Después de crear tu cuenta no podrá reutilizarse.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
