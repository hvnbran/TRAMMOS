import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Car,
  MapPin,
  Route as RouteIcon,
  ClipboardCheck,
  FileText,
  BarChart3,
  Bell,
  Radar,
  Star,
  Timer,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  LogOut,
  Accessibility,
} from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo-trammos.png";
import logoCorona from "@/assets/logo-corona.png";
import logoSodimac from "@/assets/logo-sodimac-icon.png";
import { useAuth } from "@/lib/auth-context";

type NavItem = { to: string; icon: typeof LayoutDashboard; label: string; exact?: boolean };

const ADMIN_NAV: NavItem[] = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/conductores", icon: Users, label: "Conductores" },
  { to: "/vehiculos", icon: Car, label: "Vehículos" },
  { to: "/pasajeros-pcd", icon: Accessibility, label: "Pasajeros PCD" },
  { to: "/operacion", icon: MapPin, label: "Operación" },
  { to: "/servicios", icon: RouteIcon, label: "Servicios" },
  { to: "/cumplimiento", icon: ClipboardCheck, label: "Cumplimiento ANS" },
  { to: "/monitoreo", icon: Radar, label: "Monitoreo" },
  { to: "/facturacion", icon: FileText, label: "Facturación" },
  { to: "/reportes", icon: BarChart3, label: "Reportes" },
  { to: "/tiempos-respuesta", icon: Timer, label: "Tiempos de respuesta" },
  { to: "/feedback", icon: Star, label: "Feedback" },
  { to: "/formatos", icon: FolderOpen, label: "Formatos" },
  { to: "/alertas", icon: Bell, label: "Alertas" },
];

// Corona y Sodimac sólo ven estas
const CLIENT_NAV: NavItem[] = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/servicios", icon: RouteIcon, label: "Servicios" },
  { to: "/conductores", icon: Users, label: "Conductores" },
  { to: "/vehiculos", icon: Car, label: "Vehículos" },
  { to: "/pasajeros-pcd", icon: Accessibility, label: "Pasajeros PCD" },
  { to: "/feedback", icon: Star, label: "Feedback" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { role, signOut, displayName } = useAuth();

  const navItems = role === "admin" ? ADMIN_NAV : CLIENT_NAV;

  const brand =
    role === "corona"
      ? { name: "CORONA", subtitle: "Cliente Corona", logo: logoCorona, rounded: "rounded-md" }
      : role === "sodimac"
      ? { name: "SODIMAC", subtitle: "Cliente Sodimac", logo: logoSodimac, rounded: "rounded-md" }
      : { name: "TRAMMOS", subtitle: "Admin General", logo, rounded: "rounded-lg" };

  return (
    <aside
      aria-label="Navegación principal"
      className={`flex flex-col bg-sidebar-bg border-r border-sidebar-border transition-all duration-300 ${collapsed ? "w-[68px]" : "w-[240px]"}`}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <img
          src={brand.logo}
          alt={`Logo ${brand.name}`}
          className={`h-9 w-9 ${brand.rounded} object-contain bg-white p-0.5 shrink-0`}
        />
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="text-base font-bold tracking-tight" style={{ color: "oklch(0.95 0.005 220)" }}>
              {brand.name}
            </span>
            <p className="text-[10px] leading-none" style={{ color: "oklch(0.6 0.02 220)" }}>
              {brand.subtitle}
            </p>
          </div>
        )}
      </div>

      <nav role="navigation" aria-label="Menú principal" className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              preload="intent"
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className={`sidebar-item ${isActive ? "sidebar-item-active" : ""} flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon
                className={`sidebar-icon h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`}
                aria-hidden="true"
              />
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
              {isActive && !collapsed && (
                <div className="sidebar-dot ml-auto h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => signOut()}
        aria-label="Cerrar sesión"
        className="flex items-center gap-3 px-4 h-10 border-t border-sidebar-border text-sidebar-foreground hover:text-destructive transition-colors text-sm"
        title="Cerrar sesión"
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
        {!collapsed && <span>Cerrar sesión</span>}
      </button>

      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
        aria-expanded={!collapsed}
        className="flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </aside>
  );
}
