import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Building2,
  ShieldCheck,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import logo from "@/assets/logo-trammos.png";
import { useAuth } from "@/lib/auth-context";

type NavItem = { to: string; icon: typeof LayoutDashboard; label: string; exact?: boolean; adminOnly?: boolean };

const NAV: NavItem[] = [
  { to: "/crm", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/crm/clientes", icon: Users, label: "Clientes" },
  { to: "/crm/asesores", icon: UserCog, label: "Asesores" },
  { to: "/crm/concesionarios", icon: Building2, label: "Concesionarios" },
  { to: "/crm/equipo", icon: ShieldCheck, label: "Equipo CRM", adminOnly: true },
];

export function CrmSidebar() {
  const location = useLocation();
  const { role, signOut } = useAuth();
  const items = NAV.filter((i) => !i.adminOnly || role === "admin");

  return (
    <aside
      aria-label="Navegación CRM"
      className="flex flex-col bg-sidebar-bg border-r border-sidebar-border w-[240px]"
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <img
          src={logo}
          alt="Logo TRAMMOS"
          className="h-9 w-9 rounded-lg object-contain bg-white p-0.5 shrink-0"
        />
        <div className="overflow-hidden">
          <span className="text-base font-bold tracking-tight" style={{ color: "oklch(0.95 0.005 220)" }}>
            CRM
          </span>
          <p className="text-[10px] leading-none" style={{ color: "oklch(0.6 0.02 220)" }}>
            Portal comercial
          </p>
        </div>
      </div>

      <nav role="navigation" aria-label="Menú CRM" className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              preload="intent"
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon
                className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`}
                aria-hidden="true"
              />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>

      {role === "admin" && (
        <Link
          to="/"
          className="flex items-center gap-3 px-4 h-10 border-t border-sidebar-border text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors text-sm"
          title="Volver al panel principal"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Volver al panel</span>
        </Link>
      )}

      <button
        onClick={() => signOut()}
        aria-label="Cerrar sesión"
        className="flex items-center gap-3 px-4 h-10 border-t border-sidebar-border text-sidebar-foreground hover:text-destructive transition-colors text-sm"
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Cerrar sesión</span>
      </button>
    </aside>
  );
}
