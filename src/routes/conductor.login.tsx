import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, KeyRound, IdCard, Truck } from "lucide-react";
import logo from "@/assets/logo-trammos.png";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const Route = createFileRoute("/conductor/login")({
  component: ConductorLoginPage,
  head: () => ({
    meta: [
      { title: "Acceso conductor — TRAMMOS" },
      { name: "description", content: "Inicia sesión en la app de conductor TRAMMOS" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function ConductorLoginPage() {
  const navigate = useNavigate();
  const [cedula, setCedula] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // 1. Validar credenciales en el backend, obtener token mágico
      const resp = await fetch("/api/public/conductor-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula: cedula.trim(), password }),
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) {
        const msg =
          json.error === "no_encontrado"
            ? "No encontramos un conductor con esa cédula."
            : json.error === "sin_acceso"
              ? "Tu acceso a la app aún no está habilitado. Contacta al administrador."
              : json.error === "credenciales"
                ? "Cédula o contraseña incorrectas."
                : "No se pudo iniciar sesión. Intenta de nuevo.";
        setError(msg);
        setLoading(false);
        return;
      }

      // 2. Verificar el token (inicia sesión en Supabase)
      const { error: otpErr } = await supabase.auth.verifyOtp({
        type: "magiclink",
        token_hash: json.token_hash,
      });
      if (otpErr) {
        setError("Error al iniciar sesión: " + otpErr.message);
        setLoading(false);
        return;
      }

      // 3. Vincular conductor con auth user (asigna rol)
      const { data: linkResp, error: linkErr } = await supabase.rpc("link_conductor_to_auth", {
        _cedula: json.cedula,
      });
      if (linkErr) {
        setError("Error al vincular cuenta: " + linkErr.message);
        setLoading(false);
        return;
      }
      const link = linkResp as { ok?: boolean; error?: string } | null;
      if (!link?.ok) {
        setError("No se pudo vincular tu cuenta. Contacta al administrador.");
        setLoading(false);
        return;
      }

      navigate({ to: "/conductor" });
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
            <Truck className="h-6 w-6 text-primary" />
            App Conductor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Acceso privado para conductores TRAMMOS</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-lg space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <IdCard className="h-4 w-4" /> Cédula
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="username"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Ej. 1023456789"
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
            disabled={loading || !cedula || !password}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Iniciando..." : "Iniciar sesión"}
          </button>

          <p className="text-[11px] text-muted-foreground text-center">
            Si no tienes acceso, pídele al administrador que lo habilite desde el panel de Conductores.
          </p>
        </form>
      </div>
      </div>
      <SiteFooter variant="compact" />
    </div>
  );
}
