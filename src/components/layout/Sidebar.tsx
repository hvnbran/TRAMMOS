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
  UserCog,
  Briefcase,
  Repeat,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/logo-trammos.png";
import logoCorona from "@/assets/logo-corona.png";
import logoSodimac from "@/assets/logo-sodimac-icon.png";
import logoHospitalSur from "@/assets/logo-hospital-sur.png";
import { useAuth } from "@/lib/auth-context";

type NavItem = { to: string; icon: typeof LayoutDashboard; label: string; exact?: boolean };

const ADMIN_NAV: NavItem[] = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/conductores", icon: Users, label: "Conductores" },
  { to: "/vehiculos", icon: Car, label: "Vehículos" },
  { to: "/pasajeros-pcd", icon: Accessibility, label: "Pasajeros PCD" },
  { to: "/operacion", icon: MapPin, label: "Operación" },
  { to: "/servicios", icon: RouteIcon, label: "Servicios" },
  { to: "/servicios-fijos", icon: Repeat, label: "Servicios fijos" },
  { to: "/cumplimiento", icon: ClipboardCheck, label: "Cumplimiento ANS" },
  { to: "/monitoreo", icon: Radar, label: "Monitoreo" },
  { to: "/facturacion", icon: FileText, label: "Facturación" },
  { to: "/reportes", icon: BarChart3, label: "Reportes" },
  { to: "/tiempos-respuesta", icon: Timer, label: "Tiempos de respuesta" },
  { to: "/feedback", icon: Star, label: "Feedback" },
  { to: "/formatos", icon: FolderOpen, label: "Formatos" },
  { to: "/alertas", icon: Bell, label: "Alertas" },
  { to: "/cuentas", icon: UserCog, label: "Creación de cuentas" },
];

const CLIENT_NAV: NavItem[] = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/servicios", icon: RouteIcon, label: "Servicios" },
  { to: "/conductores", icon: Users, label: "Conductores" },
  { to: "/vehiculos", icon: Car, label: "Vehículos" },
  { to: "/pasajeros-pcd", icon: Accessibility, label: "Pasajeros PCD" },
  { to: "/feedback", icon: Star, label: "Feedback" },
];

const HOSPITAL_NAV: NavItem[] = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/servicios", icon: RouteIcon, label: "Servicios" },
  { to: "/conductores", icon: Users, label: "Conductores" },
  { to: "/vehiculos", icon: Car, label: "Vehículos" },
  { to: "/pasajeros-pcd", icon: Accessibility, label: "Pasajeros PCD" },
  { to: "/monitoreo", icon: Radar, label: "Monitoreo" },
  { to: "/cumplimiento", icon: ClipboardCheck, label: "Cumplimiento ANS" },
  { to: "/cuentas", icon: UserCog, label: "Crear pasajeros" },
  { to: "/feedback", icon: Star, label: "Feedback" },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { role, signOut } = useAuth();

  const navItems =
    role === "admin" ? ADMIN_NAV : role === "hospital_sur" ? HOSPITAL_NAV : CLIENT_NAV;

  const brand =
    role === "corona"
      ? { name: "CORONA", subtitle: "Cliente Corona", logo: logoCorona, rounded: "rounded-md" }
      : role === "sodimac"
      ? { name: "SODIMAC", subtitle: "Cliente Sodimac", logo: logoSodimac, rounded: "rounded-md" }
      : role === "hospital_sur"
      ? { name: "HOSPITAL DEL SUR", subtitle: "ESE Itagüí", logo: logoHospitalSur, rounded: "rounded-md" }
      : { name: "TRAMMOS", subtitle: "Admin General", logo, rounded: "rounded-lg" };

  // Cerrar drawer al cambiar de ruta
  useEffect(() => {
    if (mobileOpen) onMobileClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Cerrar con Escape + bloquear scroll del body
  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onMobileClose?.();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen, onMobileClose]);

  const isMobileDrawer = mobileOpen;

  // Cuando es drawer móvil, ignorar collapsed
  const showLabels = isMobileDrawer ? true : !collapsed;
  const widthClass = isMobileDrawer ? "w-[260px]" : collapsed ? "w-[68px]" : "w-[240px]";

  const asideClasses = isMobileDrawer
    ? `fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar-bg border-r border-sidebar-border ${widthClass} transition-transform duration-300 ease-out translate-x-0 md:hidden`
    : `hidden md:flex flex-col bg-sidebar-bg border-r border-sidebar-border transition-all duration-300 ${widthClass}`;

  return (
    <>
      {/* Backdrop sólo en modo drawer móvil */}
      {isMobileDrawer && (
        <div
          onClick={onMobileClose}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      <aside
        aria-label="Navegación principal"
        role={isMobileDrawer ? "dialog" : undefined}
        aria-modal={isMobileDrawer ? "true" : undefined}
        className={asideClasses}
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
          <img
            src={brand.logo}
            alt={`Logo ${brand.name}`}
            className={`h-9 w-9 ${brand.rounded} object-contain bg-white p-0.5 shrink-0`}
          />
          {showLabels && (
            <div className="overflow-hidden flex-1">
              <span className="text-base font-bold tracking-tight" style={{ color: "oklch(0.95 0.005 220)" }}>
                {brand.name}
              </span>
              <p className="text-[10px] leading-none" style={{ color: "oklch(0.6 0.02 220)" }}>
                {brand.subtitle}
              </p>
            </div>
          )}
          {isMobileDrawer && (
            <button
              onClick={onMobileClose}
              aria-label="Cerrar menú"
              className="md:hidden text-sidebar-foreground hover:text-sidebar-accent-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <nav role="navigation" aria-label="Menú principal" className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {/* Acceso CRM dentro del drawer móvil para admins */}
          {isMobileDrawer && role === "admin" && (
            <Link
              to="/crm"
              preload="intent"
              aria-label="Abrir CRM Comercial"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm bg-primary/15 text-primary font-medium hover:bg-primary/25 mb-2"
            >
              <Briefcase className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>CRM Comercial</span>
            </Link>
          )}

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
                title={!showLabels ? item.label : undefined}
              >
                <item.icon
                  className={`sidebar-icon h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`}
                  aria-hidden="true"
                />
                {showLabels && <span className="sidebar-label">{item.label}</span>}
                {isActive && showLabels && (
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
          {showLabels && <span>Cerrar sesión</span>}
        </button>

        {/* Toggle de colapsar sólo en desktop */}
        {!isMobileDrawer && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
            aria-expanded={!collapsed}
            className="hidden md:flex items-center justify-center h-10 border-t border-sidebar-border text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
      </aside>
    </>
  );
}
