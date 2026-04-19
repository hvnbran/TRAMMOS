import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import banner from "@/assets/banner-trammos.png";
import bannerCorona from "@/assets/banner-corona.png";
import bannerSodimac from "@/assets/banner-sodimac.png";
import { LogIn, Loader2, Check } from "lucide-react";

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

function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [splashName, setSplashName] = useState("");
  const [splashClient, setSplashClient] = useState<"corona" | "sodimac" | "admin" | null>(null);
  const [progress, setProgress] = useState(0);
  const [splashFadeOut, setSplashFadeOut] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  if (!loading && user && !showSplash) {
    navigate({ to: "/" });
  }

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

  const startSplashSequence = (displayName: string, clientKey: "corona" | "sodimac" | "admin" | null) => {
    setSplashName(displayName);
    setSplashClient(clientKey);
    setShowSplash(true);

    // Animate progress bar after a tiny delay so the transition kicks in
    timersRef.current.push(setTimeout(() => setProgress(100), 200));

    // Begin fade-out near the end
    timersRef.current.push(setTimeout(() => setSplashFadeOut(true), 1800));

    // Navigate at ~2s
    timersRef.current.push(setTimeout(() => navigate({ to: "/" }), 2050));
  };

  const handleSubmit = async (e: FormEvent) => {
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

    // Success: trigger splash sequence
    const displayName = preset ? preset.display_name : email.split("@")[0];
    const clientKey = preset ? preset.role : null;
    startSplashSequence(displayName, clientKey);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center">
            <img src={banner} alt="TRAMMOS - Transportes Especiales" className="w-64 md:w-72 mx-auto h-auto drop-shadow-sm" />
          </div>

          <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6 space-y-4 shadow-sm">
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

        </div>
      </div>

      {showSplash && (
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
