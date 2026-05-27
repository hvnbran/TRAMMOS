import { Sidebar } from "./Sidebar";
import { useAuth } from "@/lib/auth-context";
import { NotificationsBell } from "@/components/NotificationsBell";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Link, useLocation } from "@tanstack/react-router";
import { AccessibilityPanel } from "./AccessibilityPanel";
import { TramiAssistant } from "@/components/TramiAssistant";
import { SiteFooter } from "./SiteFooter";
import { TRAMI_ENABLED } from "@/lib/feature-flags";
import { Briefcase, Menu } from "lucide-react";
import { useState } from "react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { displayName, role } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const initials = (displayName || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const badge =
    role === "admin" ? "Administrador" : role === "corona" ? "Corona" : role === "sodimac" ? "Sodimac" : "";

  return (
    <div className="flex h-screen overflow-hidden">
      <a href="#main-content" className="skip-link">
        Saltar al contenido principal
      </a>

      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <header
          role="banner"
          className="flex h-14 items-center justify-between border-b border-border bg-card px-3 md:px-6 gap-2"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Hamburguesa sólo en móvil */}
            <button
              onClick={() => setMobileNavOpen(true)}
              aria-label="Abrir menú de navegación"
              aria-expanded={mobileNavOpen}
              className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md border border-border text-foreground hover:bg-muted shrink-0"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="flex-1 min-w-0">
              <GlobalSearch />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {role === "admin" && (
              <Link
                to="/crm"
                preload="intent"
                className="hidden sm:inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                aria-label="Abrir CRM Comercial"
              >
                <Briefcase className="h-4 w-4" aria-hidden="true" />
                CRM
              </Link>
            )}
            <NotificationsBell />
            <div className="flex items-center gap-2" aria-label={`Sesión de ${displayName || "usuario"}`}>
              <div
                className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary"
                aria-hidden="true"
              >
                {initials}
              </div>
              <div className="hidden md:block text-right leading-tight">
                <div className="text-sm text-foreground">{displayName || "Usuario"}</div>
                <div className="text-[10px] text-muted-foreground">{badge}</div>
              </div>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          role="main"
          tabIndex={-1}
          key={location.pathname}
          className="page-transition flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 focus:outline-none"
        >
          {children}
          <SiteFooter variant="full" />
        </main>
      </div>

      <AccessibilityPanel />
      {TRAMI_ENABLED && <TramiAssistant />}
    </div>
  );
}
