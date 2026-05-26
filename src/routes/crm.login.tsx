import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Loader2, KeyRound, Mail, Briefcase, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo-trammos.png";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/crm/login")({
  component: CrmLoginPage,
  head: () => ({
    meta: [
      { title: "Acceso CRM — TRAMMOS" },
      { name: "description", content: "Inicia sesión en el portal CRM de TRAMMOS" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function CrmLoginPage() {
  const navigate = useNavigate();
  const { role, loading: authLoading, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Si ya hay sesión con acceso, redirige al portal CRM
  useEffect(() => {
    if (authLoading) return;
    if (user && (role === "admin" || role === "crm")) {
      navigate({ to: "/crm" });
    }
  }, [authLoading, user, role, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signErr) {
        setError("Credenciales inválidas.");
        setLoading(false);
        return;
      }

      // Verifica rol contra el servidor
      const { data: userResp } = await supabase.auth.getUser();
      const uid = userResp?.user?.id;
      if (!uid) {
        setError("No se pudo verificar la sesión.");
        setLoading(false);
        return;
      }
      const { data: roles, error: rErr } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      if (rErr) {
        setError("No se pudo verificar tus permisos.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      const list = (roles ?? []).map((r) => r.role as string);
      if (!list.includes("admin") && !list.includes("crm")) {
        setError("Esta cuenta no tiene acceso al CRM.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      navigate({ to: "/crm" });
    } catch (e) {
      setError("Error inesperado: " + (e instanceof Error ? e.message : String(e)));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-card border border-border mb-3">
              <img src={logo} alt="TRAMMOS" className="h-12 w-12 object-contain" />
            </div>
            <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              Portal CRM
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acceso comercial — TRAMMOS
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-card border border-border rounded-2xl p-6 shadow-lg space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Mail className="h-4 w-4" /> Correo
              </label>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <KeyRound className="h-4 w-4" /> Contraseña
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Iniciando..." : "Entrar al CRM"}
            </button>

            <p className="text-[11px] text-muted-foreground text-center">
              Solo administradores y usuarios con rol CRM pueden acceder.
            </p>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              Volver al login principal
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter variant="compact" />
    </div>
  );
}
