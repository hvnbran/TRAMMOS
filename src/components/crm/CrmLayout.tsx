import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useRef } from "react";
import {
  LogOut,
  ArrowLeft,
  LayoutDashboard,
  GitBranch,
  TrendingUp,
  Package,
  CreditCard,
  Wrench,
  Users,
  Cake,
  UserCog,
  Building2,
  UsersRound,
} from "lucide-react";
import logo from "@/assets/logo-trammos.png";
import { useAuth } from "@/lib/auth-context";
import { CrmIntro } from "./CrmIntro";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const navItems: NavItem[] = [
  { to: "/crm", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/crm/pipeline", label: "Pipeline", icon: GitBranch },
  { to: "/crm/ventas", label: "Ventas", icon: TrendingUp },
  { to: "/crm/catalogo", label: "Catálogo", icon: Package },
  { to: "/crm/creditos", label: "Créditos", icon: CreditCard },
  { to: "/crm/capacidades", label: "Capacidades", icon: Wrench },
  { to: "/crm/clientes", label: "Clientes", icon: Users },
  { to: "/crm/cumpleanos", label: "Cumpleaños", icon: Cake },
  { to: "/crm/asesores", label: "Asesores", icon: UserCog },
  { to: "/crm/concesionarios", label: "Concesionarios", icon: Building2 },
  { to: "/crm/equipo", label: "Equipo", icon: UsersRound },
];

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

  // Drag-to-scroll for the nav bar
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ active: boolean; startX: number; startScroll: number; moved: boolean; pointerId: number }>(
    { active: false, startX: 0, startScroll: 0, moved: false, pointerId: -1 }
  );
  const suppressClickRef = useRef(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    // Solo botón izquierdo
    if (e.button !== 0) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
      pointerId: e.pointerId,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const el = scrollerRef.current;
    if (!d.active || !el) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      // Capturamos el puntero recién al detectar arrastre real,
      // así los clicks simples siguen llegando a los Link.
      try {
        el.setPointerCapture(d.pointerId);
      } catch {
        // ignore
      }
      el.style.cursor = "grabbing";
    }
    if (d.moved) {
      el.scrollLeft = d.startScroll - dx;
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const el = scrollerRef.current;
    if (!d.active) return;
    if (el) {
      if (el.hasPointerCapture(d.pointerId)) el.releasePointerCapture(d.pointerId);
      el.style.cursor = "grab";
    }
    if (d.moved) {
      suppressClickRef.current = true;
      window.setTimeout(() => (suppressClickRef.current = false), 50);
    }
    dragRef.current = { ...d, active: false };
    void e;
  };

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

        {/* Fila 2 — navegación con drag-to-scroll (sin scrollbar visible) */}
        <nav
          aria-label="Secciones del CRM"
          className="max-w-7xl mx-auto px-4 md:px-8"
        >
          <div
            ref={scrollerRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={endDrag}
            className="flex items-center gap-1.5 py-2 overflow-x-auto select-none cursor-grab [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]"
            title="Arrastra para desplazar"
          >
            {navItems.map(({ to, label, icon: Icon, exact }) => {
              const active = exact
                ? location.pathname === to
                : location.pathname === to || location.pathname.startsWith(to + "/");
              return (
                <Link
                  key={to}
                  to={to as string}
                  onClick={(e) => {
                    if (suppressClickRef.current) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  draggable={false}
                  className={
                    "inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm whitespace-nowrap shrink-0 border transition-colors " +
                    (active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-foreground border-border hover:bg-muted")
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

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
