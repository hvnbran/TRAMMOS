import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, lazy, Suspense, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import banner from "@/assets/banner-trammos.png";
import bannerCorona from "@/assets/banner-corona.png";
import bannerSodimac from "@/assets/banner-sodimac.png";
import { LogIn, Loader2, Check, Mail, KeyRound, Briefcase, Accessibility, ArrowLeft } from "lucide-react";

const PasajeroWelcomeSplash = lazy(() =>
  import("@/components/pasajero/PasajeroWelcomeSplash").then((m) => ({ default: m.PasajeroWelcomeSplash })),
);

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Iniciar sesión - TRAMMOS" },
      { name: "description", content: "Acceso al sistema TRAMMOS" },
    ],
  }),
});

type SeedKey = "corona" | "sodimac" | "admin";

const SEED_USERS: Record<SeedKey, { email: string; password: string; display_name: string; role: "admin" | "corona" | "sodimac" }> = {
  corona: { email: "corona@trammos.app", password: "CoronaAdmin123", display_name: "Corona", role: "corona" },
  sodimac: { email: "sodimac@trammos.app", password: "SodimacAdmin123", display_name: "Sodimac", role: "sodimac" },
  admin: { email: "admin@trammos.app", password: "AdministrativosTrammos123", display_name: "Admin General", role: "admin" },
};

type Tab = "operador" | "pasajero";
type PasajeroStep = "email" | "otp";

function LoginPage() {
  const { signIn, user, loading, role } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("operador");

  // Operador
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pasajero
  const [pStep, setPStep] = useState<PasajeroStep>("email");
  const [pEmail, setPEmail] = useState("");
  const [pCode, setPCode] = useState("");
  const [pInfo, setPInfo] = useState<string | null>(null);
  const [pError, setPError] = useState<string | null>(null);
  const [pLoading, setPLoading] = useState(false);

  // Splash
  const [showSplash, setShowSplash] = useState(false);
  const [splashName, setSplashName] = useState("");
  const [splashClient, setSplashClient] = useState<"corona" | "sodimac" | "admin" | "pasajero" | null>(null);
  const [progress, setProgress] = useState(0);
  const [splashFadeOut, setSplashFadeOut] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  // Auto-redirect once authenticated and role known
  useEffect(() => {
    if (loading || showSplash || !user) return;
    if (role === "pasajero") {
      navigate({ to: "/pasajero" });
    } else if (role) {
      navigate({ to: "/" });
    }
  }, [user, role, loading, showSplash, navigate]);

  async function ensureUserBootstrapped(key: SeedKey, expectedPassword: string) {
    if (expectedPassword !== SEED_USERS[key].password) return;
    const u = SEED_USERS[key];
    const { data: signUp, error: signUpErr } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: { data: { display_name: u.display_name }, emailRedirectTo: window.location.origin },
    });
    if (!signUpErr && signUp.user) {
      await supabase.from("user_roles").insert({ user_id: signUp.user.id, role: u.role });
    }
  }

  const startSplashSequence = (
    displayName: string,
    clientKey: "corona" | "sodimac" | "admin" | "pasajero" | null,
    target: "/" | "/pasajero",
  ) => {
    setSplashName(displayName);
    setSplashClient(clientKey);
    setShowSplash(true);
    // El splash de pasajero maneja su propio temporizador y dispara la navegación
    // vía onDone. Para los demás roles seguimos con el flujo de barra de progreso.
    if (clientKey === "pasajero") return;
    timersRef.current.push(setTimeout(() => setProgress(100), 200));
    timersRef.current.push(setTimeout(() => setSplashFadeOut(true), 1800));
    timersRef.current.push(setTimeout(() => navigate({ to: target }), 2050));
  };

  const handleSubmitOperador = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const key = username.trim().toLowerCase() as SeedKey;
    const preset = SEED_USERS[key];
    const email = preset ? preset.email : username.trim();

    let { error: err } = await signIn(email, password);

    if (err && preset && password === preset.password) {
      await ensureUserBootstrapped(key, password);
      const r = await signIn(email, password);
      err = r.error;

      if (!err) {
        const { data: s } = await supabase.auth.getUser();
        if (s.user) {
          const { data: existingRoles } = await supabase
            .from("user_roles").select("role").eq("user_id", s.user.id);
          if (!existingRoles || existingRoles.length === 0) {
            await supabase.from("user_roles").insert({ user_id: s.user.id, role: preset.role });
          }
        }
      }
    }

    if (err) {
      setSubmitting(false);
      setError("Credenciales inválidas. Verifica usuario y contraseña.");
      return;
    }

    const displayName = preset ? preset.display_name : email.split("@")[0];
    const clientKey = preset ? preset.role : null;
    startSplashSequence(displayName, clientKey, "/");
  };

  const TEST_EMAIL = "trammos@admin.com";
  const TEST_CODE = "123456";

  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault();
    setPError(null);
    setPInfo(null);
    setPLoading(true);
    const email = pEmail.trim();
    if (!email) {
      setPError("Escribe tu correo.");
      setPLoading(false);
      return;
    }

    // Testing shortcut: skip Supabase OTP entirely.
    if (email.toLowerCase() === TEST_EMAIL) {
      setPInfo(`Modo testing: usa el código ${TEST_CODE} para entrar.`);
      setPStep("otp");
      setPLoading(false);
      return;
    }

    // 1) Validate authorization
    const { data: authorized, error: rpcErr } = await supabase.rpc("is_pasajero_email_authorized", { _email: email });
    if (rpcErr) {
      setPError("No pudimos verificar tu correo. Intenta de nuevo.");
      setPLoading(false);
      return;
    }
    if (!authorized) {
      setPError("Este correo no está autorizado. Contacta al equipo TRAMMOS.");
      setPLoading(false);
      return;
    }
    // 2) Send OTP (6-digit code, NO magic link)
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (otpErr) {
      setPError("No pudimos enviar el código. Intenta de nuevo en unos segundos.");
      setPLoading(false);
      return;
    }
    setPInfo(`Te enviamos un código de 6 dígitos a ${email}. Revisa tu correo.`);
    setPStep("otp");
    setPLoading(false);
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setPError(null);
    setPLoading(true);
    const code = pCode.trim();
    const email = pEmail.trim();
    if (code.length < 4) {
      setPError("Ingresa el código que llegó a tu correo.");
      setPLoading(false);
      return;
    }

    // Testing shortcut: validate against the test backend route.
    if (email.toLowerCase() === TEST_EMAIL) {
      if (code !== TEST_CODE) {
        setPError("Código de testing incorrecto. Usa 123456.");
        setPLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/test-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });
        const json = await res.json();
        if (!res.ok || !json.token_hash) {
          setPError(`No pudimos entrar en modo testing (${json.error ?? res.status}).`);
          setPLoading(false);
          return;
        }
        const { error: vErr } = await supabase.auth.verifyOtp({
          token_hash: json.token_hash,
          type: "magiclink",
        });
        if (vErr) {
          setPError(`Verificación fallida: ${vErr.message}`);
          setPLoading(false);
          return;
        }
        await supabase.rpc("link_pasajero_to_auth");
        setPLoading(false);
        startSplashSequence("Pasajero Testing", "pasajero", "/pasajero");
        return;
      } catch (err) {
        setPError("Error de red en modo testing.");
        setPLoading(false);
        return;
      }
    }

    const { error: vErr } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    if (vErr) {
      setPError("Código incorrecto o vencido. Pide uno nuevo.");
      setPLoading(false);
      return;
    }
    // Link to pasajero profile + assign role
    await supabase.rpc("link_pasajero_to_auth");
    setPLoading(false);
    startSplashSequence(pEmail.split("@")[0], "pasajero", "/pasajero");
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center -mb-6">
            <img src={banner} alt="TRAMMOS - Transportes Especiales" className="w-72 md:w-80 mx-auto h-auto drop-shadow-sm" />
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/40 border border-border mb-3">
            <button
              type="button"
              onClick={() => setTab("operador")}
              className={`flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-all ${
                tab === "operador"
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={tab === "operador"}
            >
              <Briefcase className="h-4 w-4" />
              Soy operador
            </button>
            <button
              type="button"
              onClick={() => setTab("pasajero")}
              className={`flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-all ${
                tab === "pasajero"
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={tab === "pasajero"}
            >
              <Accessibility className="h-4 w-4" />
              Soy pasajero
            </button>
          </div>

          {tab === "operador" ? (
            <form onSubmit={handleSubmitOperador} className="rounded-lg border border-border bg-card p-6 space-y-4 shadow-sm">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Usuario</label>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Contraseña</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  required
                  disabled={submitting}
                />
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive animate-fade-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-80 hover:shadow-md"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Iniciar sesión
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="rounded-lg border border-border bg-card p-6 space-y-4 shadow-sm">
              {pStep === "email" ? (
                <form onSubmit={handleRequestCode} className="space-y-4">
                  <div className="text-center space-y-1">
                    <h2 className="text-base font-semibold text-foreground">Pide tu carro con TRAMMOS</h2>
                    <p className="text-xs text-muted-foreground">
                      Te enviaremos un código a tu correo. Sin contraseñas que recordar.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> Tu correo
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      value={pEmail}
                      onChange={(e) => setPEmail(e.target.value)}
                      placeholder="tunombre@correo.com"
                      className="w-full h-12 rounded-md border border-input bg-background px-3 text-base focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                      required
                      disabled={pLoading}
                    />
                  </div>
                  {pError && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
                      {pError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={pLoading}
                    className="w-full h-12 rounded-md bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-80"
                  >
                    {pLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Enviando código...</>
                    ) : (
                      <><Mail className="h-4 w-4" /> Enviarme el código</>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <button
                    type="button"
                    onClick={() => { setPStep("email"); setPCode(""); setPError(null); }}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-3 w-3" /> Cambiar correo
                  </button>
                  {pInfo && (
                    <div className="rounded-md bg-primary/10 border border-primary/30 px-3 py-2 text-xs text-foreground">
                      {pInfo}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5" /> Código de 6 dígitos
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={pCode}
                      onChange={(e) => setPCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="••••••"
                      className="w-full h-14 rounded-md border border-input bg-background px-3 text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                      disabled={pLoading}
                    />
                  </div>
                  {pError && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
                      {pError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={pLoading || pCode.length < 4}
                    className="w-full h-12 rounded-md bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {pLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Verificando...</>
                    ) : (
                      <><Check className="h-4 w-4" /> Entrar</>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {showSplash && splashClient === "pasajero" && (
        <Suspense fallback={<div className="fixed inset-0 z-[60]" style={{ background: "#C6FF00" }} />}>
          <PasajeroWelcomeSplash
            nombre={splashName}
            onDone={() => navigate({ to: "/pasajero" })}
          />
        </Suspense>
      )}

      {showSplash && splashClient !== "pasajero" && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-300 ${
            splashFadeOut ? "opacity-0" : "opacity-100 animate-fade-in"
          }`}
        >
          <div className="w-full max-w-md px-6 flex flex-col items-center gap-6">
            <img
              src={banner}
              alt="TRAMMOS"
              className="w-full max-w-sm h-auto animate-scale-in"
            />

            {(splashClient === "corona" || splashClient === "sodimac") && (
              <img
                src={splashClient === "corona" ? bannerCorona : bannerSodimac}
                alt={splashClient === "corona" ? "Corona" : "Sodimac"}
                className="w-full max-w-xs h-auto object-contain animate-fade-in"
                style={{ animationDelay: "300ms", animationFillMode: "backwards" }}
              />
            )}

            <div
              className="flex items-center gap-2 text-sm font-medium text-foreground animate-fade-in"
              style={{ animationDelay: "500ms", animationFillMode: "backwards" }}
            >
              <Check className="h-4 w-4 text-primary" />
              <span>¡Bienvenido{splashName ? `, ${splashName}` : ""}!</span>
            </div>
            <div className="w-full max-w-xs h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-[1500ms] ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p
              className="text-xs text-muted-foreground animate-fade-in"
              style={{ animationDelay: "800ms", animationFillMode: "backwards" }}
            >
              Cargando tu panel de control...
            </p>
          </div>
        </div>
      )}
    </>
  );
}
