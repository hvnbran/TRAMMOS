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
  ChevronLeft,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo-trammos.jpeg";

const navItems: Array<{ to: string; icon: typeof LayoutDashboard; label: string; exact?: boolean }> = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/conductores", icon: Users, label: "Conductores" },
  { to: "/vehiculos", icon: Car, label: "Vehículos" },
  { to: "/operacion", icon: MapPin, label: "Operación" },
  { to: "/servicios", icon: RouteIcon, label: "Servicios" },
  { to: "/cumplimiento", icon: ClipboardCheck, label: "Cumplimiento ANS" },
  { to: "/monitoreo", icon: Radar, label: "Monitoreo" },
  { to: "/facturacion", icon: FileText, label: "Facturación" },
  { to: "/reportes", icon: BarChart3, label: "Reportes" },
  { to: "/feedback", icon: Star, label: "Feedback" },
  { to: "/formatos", icon: FolderOpen, label: "Formatos" },
  { to: "/alertas", icon: Bell, label: "Alertas" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={`flex flex-col bg-sidebar-bg border-r border-sidebar-border transition-all duration-300 ${collapsed ? "w-[68px]" : "w-[240px]"}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <img src={logo} alt="TRAMMOS" className="h-9 w-9 rounded-lg object-cover shrink-0" />
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="text-base font-bold text-foreground tracking-tight" style={{ color: "oklch(0.95 0.005 220)" }}>
              TRAMMOS
            </span>
            <p className="text-[10px] leading-none" style={{ color: "oklch(0.6 0.02 220)" }}>
              Transporte Especial
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
