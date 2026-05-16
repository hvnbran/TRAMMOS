import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  validarInvitacionRegistro,
  consumirInvitacionRegistro,
  listarEmpresasParaRegistro,
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
  | {
      state: "valid";
      tipo: "empresa" | "pasajero";
      cliente: string | null;
      rol: string | null;
      empresa_id: string | null;
      empresa_nombre: string | null;
      email_sugerido: string | null;
      display_name_sugerido: string | null;
    };

type EmpresaOption = { id: string; nombre: string; cliente_legacy: string | null };

const AYUDAS = [
  "silla_ruedas_manual",
  "silla_ruedas_electrica",
  "baston",
  "muletas",
  "caminador",
  "perro_guia",
  "audifonos",
  "comunicador",
];

function RegistroPage() {
  const { token } = Route.useParams();
  const validar = useServerFn(validarInvitacionRegistro);
  const consumir = useServerFn(consumirInvitacionRegistro);
  const listarEmpresas = useServerFn(listarEmpresasParaRegistro);

  const [v, setV] = useState<ValidState>({ state: "loading" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form base
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [empresaNombre, setEmpresaNombre] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  // Pasajero
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);
  const [empresaIdElegida, setEmpresaIdElegida] = useState("");
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [esPcd, setEsPcd] = useState(false);
  const [tipoDisc, setTipoDisc] = useState("ninguna");
  const [nivel, setNivel] = useState(0);
  const [comunicacion, setComunicacion] = useState("voz");
  const [ayudas, setAyudas] = useState<string[]>([]);
  const [silla, setSilla] = useState("");
  const [condiciones, setCondiciones] = useState("");
  const [alergias, setAlergias] = useState("");
  const [medicamentos, setMedicamentos] = useState("");
  const [emerNombre, setEmerNombre] = useState("");
  const [emerTel, setEmerTel] = useState("");
  const [emerRel, setEmerRel] = useState("");
  const [notasConductor, setNotasConductor] = useState("");
  const [permiteAcomp, setPermiteAcomp] = useState(true);
  const [requiereAdaptado, setRequiereAdaptado] = useState(false);

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
            empresa_id: r.empresa_id,
            empresa_nombre: r.empresa_nombre,
            email_sugerido: r.email_sugerido,
            display_name_sugerido: r.display_name_sugerido,
          });
          if (r.email_sugerido) setEmail(r.email_sugerido);
          if (r.display_name_sugerido) {
            setDisplayName(r.display_name_sugerido);
            setNombre(r.display_name_sugerido);
          }
          // Si es pasajero sin empresa fija, cargar lista pública
          if (r.tipo === "pasajero" && !r.empresa_id) {
            try {
              const e = await listarEmpresas();
              if (!cancel) setEmpresas(e.empresas);
            } catch {
              /* ignore */
            }
          }
        }
      } catch (e) {
        setV({ state: "invalid", reason: e instanceof Error ? e.message : "Error validando el enlace" });
      }
    })();
    return () => { cancel = true; };
  }, [token, validar, listarEmpresas]);

  function toggleAyuda(a: string) {
    setAyudas((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (v.state !== "valid") return;
    setError(null);

    if (v.tipo === "empresa" && !v.empresa_nombre && empresaNombre.trim().length < 2) {
      return setError("Indica el nombre de la empresa.");
    }
    if (v.tipo === "pasajero" && !v.empresa_id && !empresaIdElegida) {
      return setError("Selecciona tu empresa.");
    }
    if (password.length < 8) return setError("La contraseña debe tener mínimo 8 caracteres.");
    if (password !== password2) return setError("Las contraseñas no coinciden.");

    setSubmitting(true);
    try {
      await consumir({
        data: {
          token,
          email,
          password,
          display_name: displayName || nombre || undefined,
          empresa_nombre: v.tipo === "empresa" && !v.empresa_nombre ? empresaNombre.trim() : undefined,
          empresa_id_elegida: v.tipo === "pasajero" && !v.empresa_id ? empresaIdElegida : undefined,
          pasajero: v.tipo === "pasajero"
            ? {
                nombre,
                cedula: cedula || undefined,
                telefono: telefono || undefined,
                direccion_habitual: direccion || undefined,
                es_pcd: esPcd,
                tipo_discapacidad: tipoDisc,
                nivel_asistencia: nivel,
                comunicacion_preferida: comunicacion,
                ayudas_tecnicas: ayudas,
                silla_ruedas_medidas: silla || undefined,
                condiciones_medicas: condiciones || undefined,
                alergias: alergias || undefined,
                medicamentos: medicamentos || undefined,
                contacto_emergencia_nombre: emerNombre || undefined,
                contacto_emergencia_telefono: emerTel || undefined,
                contacto_emergencia_relacion: emerRel || undefined,
                notas_conductor: notasConductor || undefined,
                permite_acompanante: permiteAcomp,
                requiere_vehiculo_adaptado: requiereAdaptado,
                consentimiento_datos: true,
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
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-sm p-6 space-y-4">
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
          <form onSubmit={submit} className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Tipo de cuenta: <strong>{v.tipo === "empresa" ? "Empresa / Monitoreo" : "Pasajero"}</strong>
              {v.empresa_nombre && <> · Empresa: <strong>{v.empresa_nombre}</strong></>}
            </p>

            {/* Empresa: nombre cuando no está fijada */}
            {v.tipo === "empresa" && !v.empresa_nombre && (
              <Field label="Nombre de tu empresa">
                <input
                  className="input"
                  required
                  minLength={2}
                  maxLength={120}
                  value={empresaNombre}
                  onChange={(e) => setEmpresaNombre(e.target.value)}
                  placeholder="Ej: Bavaria SAS"
                />
              </Field>
            )}

            {/* Pasajero: selector de empresa cuando no está fijada */}
            {v.tipo === "pasajero" && !v.empresa_id && (
              <Field label="Tu empresa">
                <select
                  className="input"
                  required
                  value={empresaIdElegida}
                  onChange={(e) => setEmpresaIdElegida(e.target.value)}
                >
                  <option value="">— Selecciona tu empresa —</option>
                  {empresas.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}{e.cliente_legacy ? ` · ${e.cliente_legacy}` : ""}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {/* Bloque pasajero */}
            {v.tipo === "pasajero" && (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <h2 className="text-sm font-semibold">Datos del pasajero</h2>
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
                  <Field label="Dirección habitual">
                    <input className="input" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
                  </Field>
                </div>

                <label className="flex items-center gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={esPcd}
                    onChange={(e) => setEsPcd(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">Soy persona con discapacidad (PcD)</span>
                </label>

                {esPcd && (
                  <div className="space-y-3 rounded-lg bg-muted/30 p-3 border border-border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Tipo de discapacidad">
                        <select className="input" value={tipoDisc} onChange={(e) => setTipoDisc(e.target.value)}>
                          <option value="ninguna">Ninguna</option>
                          <option value="visual">Visual</option>
                          <option value="auditiva">Auditiva</option>
                          <option value="motriz">Motriz</option>
                          <option value="cognitiva">Cognitiva</option>
                          <option value="multiple">Múltiple</option>
                        </select>
                      </Field>
                      <Field label="Nivel de asistencia (0-3)">
                        <input className="input" type="number" min={0} max={3} value={nivel} onChange={(e) => setNivel(Number(e.target.value))} />
                      </Field>
                      <Field label="Comunicación preferida">
                        <select className="input" value={comunicacion} onChange={(e) => setComunicacion(e.target.value)}>
                          <option value="voz">Voz</option>
                          <option value="texto_grande">Texto grande</option>
                          <option value="pictogramas">Pictogramas</option>
                          <option value="lengua_senas">Lengua de señas</option>
                          <option value="escrita_simple">Escrita simple</option>
                        </select>
                      </Field>
                      <Field label="Medidas silla de ruedas (opcional)">
                        <input className="input" value={silla} onChange={(e) => setSilla(e.target.value)} placeholder="Ancho x largo (cm)" />
                      </Field>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Ayudas técnicas</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                        {AYUDAS.map((a) => (
                          <label key={a} className="flex items-center gap-2 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={ayudas.includes(a)}
                              onChange={() => toggleAyuda(a)}
                              className="h-3.5 w-3.5"
                            />
                            <span className="capitalize">{a.replace(/_/g, " ")}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <Field label="Condiciones médicas">
                      <textarea className="input min-h-[60px]" value={condiciones} onChange={(e) => setCondiciones(e.target.value)} />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Alergias">
                        <textarea className="input min-h-[50px]" value={alergias} onChange={(e) => setAlergias(e.target.value)} />
                      </Field>
                      <Field label="Medicamentos">
                        <textarea className="input min-h-[50px]" value={medicamentos} onChange={(e) => setMedicamentos(e.target.value)} />
                      </Field>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={requiereAdaptado}
                        onChange={(e) => setRequiereAdaptado(e.target.checked)}
                        className="h-4 w-4"
                      />
                      Requiere vehículo adaptado
                    </label>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Contacto emergencia (nombre)">
                    <input className="input" value={emerNombre} onChange={(e) => setEmerNombre(e.target.value)} />
                  </Field>
                  <Field label="Teléfono emergencia">
                    <input className="input" value={emerTel} onChange={(e) => setEmerTel(e.target.value)} />
                  </Field>
                  <Field label="Relación">
                    <input className="input" value={emerRel} onChange={(e) => setEmerRel(e.target.value)} placeholder="Madre, hijo, …" />
                  </Field>
                </div>

                <Field label="Notas para el conductor">
                  <textarea className="input min-h-[50px]" value={notasConductor} onChange={(e) => setNotasConductor(e.target.value)} />
                </Field>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={permiteAcomp}
                    onChange={(e) => setPermiteAcomp(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Permito viajar con acompañante
                </label>
              </div>
            )}

            {v.tipo === "empresa" && (
              <Field label="Tu nombre (responsable)">
                <input className="input" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </Field>
            )}

            {/* Credenciales */}
            <div className="space-y-3 rounded-lg border border-border p-3">
              <h2 className="text-sm font-semibold">Acceso</h2>
              <Field label="Email (será tu usuario)">
                <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Contraseña (mín. 8)">
                  <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
                </Field>
                <Field label="Confirmar contraseña">
                  <input className="input" type="password" required minLength={8} value={password2} onChange={(e) => setPassword2(e.target.value)} />
                </Field>
              </div>
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
