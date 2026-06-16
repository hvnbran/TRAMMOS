import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Building2,
  ShieldCheck,
  LogOut,
  ArrowLeft,
  Kanban,
  DollarSign,
  Car,
  CreditCard,
  Wallet,
  Cake,
} from "lucide-react";
import logo from "@/assets/logo-trammos.png";
import { useAuth } from "@/lib/auth-context";
import { CrmIntro } from "./CrmIntro";


type NavItem = {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  exact?: boolean;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { to: "/crm", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { to: "/crm/pipeline", icon: Kanban, label: "Pipeline" },
  { to: "/crm/ventas", icon: DollarSign, label: "Ventas" },
  { to: "/crm/catalogo", icon: Car, label: "Catálogo" },
  { to: "/crm/creditos", icon: CreditCard, label: "Créditos" },
  { to: "/crm/capacidades", icon: Wallet, label: "Capacidades" },
  { to: "/crm/clientes", icon: Users, label: "Clientes" },
  { to: "/crm/cumpleanos", icon: Cake, label: "Cumpleaños" },
  { to: "/crm/asesores", icon: UserCog, label: "Asesores" },
  { to: "/crm/concesionarios", icon: Building2, label: "Concesionarios" },
  { to: "/crm/equipo", icon: ShieldCheck, label: "Equipo", adminOnly: true },
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
  const items = NAV.filter((i) => !i.adminOnly || role === "admin");

  // ---- Drag-to-scroll en la barra de pills ----
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startScroll: number;
  }>({ active: false, moved: false, startX: 0, startScroll: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    // No interferir con clics sobre links: solo iniciamos drag con botón principal
    if (e.button !== 0) return;
    dragRef.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startScroll: el.scrollLeft,
    };
    el.setPointerCapture(e.pointerId);
    el.style.cursor = "grabbing";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    const d = dragRef.current;
    if (!el || !d.active) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 4) d.moved = true;
    el.scrollLeft = d.startScroll - dx;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    const d = dragRef.current;
    if (!el || !d.active) return;
    d.active = false;
    el.releasePointerCapture?.(e.pointerId);
    el.style.cursor = "grab";
    // Si se movió, suprime el click siguiente para que no navegue por accidente
    if (d.moved) {
      const block = (ev: MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        document.removeEventListener("click", block, true);
      };
      document.addEventListener("click", block, true);
    }
  };

  // ---- Atajos de teclado: Alt + 1..9 para saltar de pestaña ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > 9) return;
      const target = items[n - 1];
      if (!target) return;
      e.preventDefault();
      navigate({ to: target.to });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [items, navigate]);

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

        {/* Fila 2 — pills de navegación */}
        <nav
          role="navigation"
          aria-label="Navegación CRM"
          className="max-w-7xl mx-auto px-4 md:px-8 pb-3"
        >
          <div
            ref={scrollerRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={endDrag}
            className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-1 px-1 select-none cursor-grab"
            title="Arrastra para desplazar · Alt+1..9 para saltar"
          >
            {items.map((item, idx) => {
              const isActive = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              const shortcut = idx < 9 ? `Alt+${idx + 1}` : undefined;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  preload="intent"
                  aria-current={isActive ? "page" : undefined}
                  title={shortcut ? `${item.label} (${shortcut})` : item.label}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                  className={`group inline-flex items-center gap-2 h-9 px-4 rounded-full text-sm whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium shadow-sm"
                      : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 bg-background"
                  }`}
                >
                  <item.icon
                    className={`h-4 w-4 ${isActive ? "text-primary-foreground" : ""}`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <span
                      className="ml-1 h-1.5 w-1.5 rounded-full bg-[oklch(0.85_0.18_125)]"
                      aria-hidden="true"
                    />
                  )}
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
