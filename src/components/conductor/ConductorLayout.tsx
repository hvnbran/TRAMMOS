import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { LogOut, Truck, Home } from "lucide-react";
import logo from "@/assets/logo-trammos.png";
import { SiteFooter } from "@/components/layout/SiteFooter";

export function ConductorLayout({ children, title }: { children: ReactNode; title?: string }) {
  const { displayName, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate({ to: "/conductor/login" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/conductor" className="flex items-center gap-2 flex-1 min-w-0">
            <img src={logo} alt="TRAMMOS" className="h-8 w-8 rounded-md object-contain" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground leading-none">TRAMMOS · Conductor</p>
              <p className="text-sm font-semibold truncate flex items-center gap-1">
                <Truck className="h-3.5 w-3.5 text-primary" />
                {displayName || "Conductor"}
              </p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        {title && (
          <div className="max-w-2xl mx-auto px-4 pb-3 flex items-center gap-2">
            <Link
              to="/conductor"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <Home className="h-3 w-3" /> Inicio
            </Link>
            <span className="text-muted-foreground">·</span>
            <h1 className="text-base font-semibold">{title}</h1>
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 pb-12">{children}</main>
      <SiteFooter variant="compact" />
    </div>
  );
}
