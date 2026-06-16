import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  LogOut,
  ArrowLeft,
} from "lucide-react";
import logo from "@/assets/logo-trammos.png";
import { useAuth } from "@/lib/auth-context";
import { CrmIntro } from "./CrmIntro";

export function CrmLayout({ children }: { children: React.ReactNode }) {
  const { displayName, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const initials = (displayName || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const badge = role === "admin" ? "Administrador" : role === "crm" ? "Equipo CRM" : "";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <CrmIntro />
      <header role="banner" className="bg-card border-b border-border crm-intro-content">

        {/* Fila 1 — branding + sesión */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={logo}
              alt="Logo TRAMMOS"
              className="h-10 w-10 rounded-lg object-contain bg-white border border-border p-0.5 shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-bold tracking-tight text-foreground truncate">
                TRAMMOS CRM Comercial
              </h1>
              <p className="hidden sm:block text-xs text-muted-foreground">
                Gestión de clientes, asesores y concesionarios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="flex items-center gap-2" aria-label={`Sesión de ${displayName || "usuario"}`}>
              <div
                className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary"
                aria-hidden="true"
              >
                {initials}
              </div>
              <div className="hidden md:block text-right leading-tight">
                <div className="text-sm text-foreground">{displayName || "Usuario"}</div>
                <div className="text-[10px] text-muted-foreground">{badge}</div>
              </div>
            </div>

            {role === "admin" ? (
              <button
                onClick={() => navigate({ to: "/" })}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-input text-sm text-foreground hover:bg-muted transition-colors"
                title="Volver al panel principal"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Panel admin</span>
              </button>
            ) : (
              <button
                onClick={() => signOut()}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-input text-sm text-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            )}
          </div>
        </div>

        {/* Firma visual: degradado cyan → lime */}
        <div
          className="h-[3px] w-full"
          style={{
            background:
              "linear-gradient(90deg, oklch(0.72 0.14 215) 0%, oklch(0.85 0.18 125) 100%)",
          }}
          aria-hidden="true"
        />
      </header>

      <main
        id="main-content"
        role="main"
        tabIndex={-1}
        key={location.pathname}
        className="page-transition flex-1 focus:outline-none"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">{children}</div>
      </main>
    </div>
  );
}
