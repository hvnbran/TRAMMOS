import { CrmSidebar } from "./CrmSidebar";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "@tanstack/react-router";

export function CrmLayout({ children }: { children: React.ReactNode }) {
  const { displayName, role } = useAuth();
  const location = useLocation();
  const initials = (displayName || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const badge = role === "admin" ? "Administrador" : role === "crm" ? "Equipo CRM" : "";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <CrmSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header
          role="banner"
          className="flex h-14 items-center justify-between border-b border-border bg-card px-6"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              TRAMMOS · CRM Comercial
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
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
        </main>
      </div>
    </div>
  );
}
