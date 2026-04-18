import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import banner from "@/assets/banner-trammos.png";
import { LogIn, Loader2 } from "lucide-react";

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

  if (!loading && user) {
    navigate({ to: "/" });
  }

  async function ensureUserBootstrapped(key: SeedKey, expectedPassword: string) {
    // If the password matches our preset, attempt signup (ignored if exists)
    if (expectedPassword !== SEED_USERS[key].password) return;
    const u = SEED_USERS[key];
    const { data: signUp, error: signUpErr } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: { data: { display_name: u.display_name }, emailRedirectTo: window.location.origin },
    });
    // If signUp succeeded and returned a user, ensure the role row exists.
    // This only works because role insert allows the authenticated session
    // briefly when user_roles RLS is checked. If policy blocks, we'll still
    // be able to login; but role won't be set. We then retry role assignment
    // from the newly authed session.
    if (!signUpErr && signUp.user) {
      await supabase.from("user_roles").insert({ user_id: signUp.user.id, role: u.role });
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const key = username.trim().toLowerCase() as SeedKey;
    const preset = SEED_USERS[key];
    const email = preset ? preset.email : username.trim();

    // First, try sign-in
    let { error: err } = await signIn(email, password);

    // If fails & is a preset user → try bootstrapping and retry
    if (err && preset && password === preset.password) {
      await ensureUserBootstrapped(key, password);
      const r = await signIn(email, password);
      err = r.error;

      // Ensure role row exists after sign in (fallback path)
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

    setSubmitting(false);
    if (err) {
      setError("Credenciales inválidas. Verifica usuario y contraseña.");
      return;
    }
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img src={banner} alt="TRAMMOS - Transportes Especiales" className="w-full max-w-sm mx-auto h-auto" />
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Usuario</label>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Corona, Sodimac o Admin"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Contraseña</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Iniciar sesión
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p><strong>Usuarios demo:</strong></p>
          <p>Corona / CoronaAdmin123</p>
          <p>Sodimac / SodimacAdmin123</p>
          <p>Admin / AdministrativosTrammos123</p>
        </div>
      </div>
    </div>
  );
}
