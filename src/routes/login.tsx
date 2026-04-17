import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/logo-trammos.jpeg";
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

const USER_MAP: Record<string, string> = {
  corona: "corona@trammos.app",
  sodimac: "sodimac@trammos.app",
  admin: "admin@trammos.app",
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const key = username.trim().toLowerCase();
    const email = USER_MAP[key] ?? username.trim();
    const { error: err } = await signIn(email, password);
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
        <div className="text-center space-y-3">
          <img src={logo} alt="TRAMMOS" className="h-16 w-16 rounded-xl object-cover mx-auto" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">TRAMMOS</h1>
            <p className="text-sm text-muted-foreground">Sistema de Transporte Especial</p>
          </div>
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

        <p className="text-center text-xs text-muted-foreground">
          ¿Primera vez? Los usuarios deben sembrarse una vez desde <code>/api/seed</code>.
        </p>
      </div>
    </div>
  );
}
