import { Sidebar } from "./Sidebar";
import { useAuth } from "@/lib/auth-context";
import { NotificationsBell } from "@/components/NotificationsBell";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useLocation } from "@tanstack/react-router";
import { AccessibilityPanel } from "./AccessibilityPanel";
import { TramiAssistant } from "@/components/TramiAssistant";
import { SiteFooter } from "./SiteFooter";
import { TRAMI_ENABLED } from "@/lib/feature-flags";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { displayName, role } = useAuth();
  const location = useLocation();
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
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header
          role="banner"
          className="flex h-14 items-center justify-between border-b border-border bg-card px-6"
        >
          <div className="flex items-center gap-3 flex-1">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-4">
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
          className="page-transition flex-1 overflow-y-auto p-6 focus:outline-none"
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
