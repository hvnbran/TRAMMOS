import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Users, UserCog, Building2, LayoutDashboard } from "lucide-react";

export const Route = createFileRoute("/crm")({
  component: CrmLayout,
  head: () => ({
    meta: [
      { title: "CRM - TRAMMOS" },
      { name: "description", content: "Gestión de clientes, asesores y concesionarios" },
    ],
  }),
});

const TABS = [
  { to: "/crm", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/crm/clientes", label: "Clientes", icon: Users },
  { to: "/crm/asesores", label: "Asesores", icon: UserCog },
  { to: "/crm/concesionarios", label: "Concesionarios", icon: Building2 },
];

function CrmLayout() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && role !== "admin") navigate({ to: "/" });
  }, [loading, role, navigate]);

  if (loading || role !== "admin") return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">CRM Comercial</h1>
            <p className="text-sm text-muted-foreground">
              Gestión de clientes, asesores y concesionarios
            </p>
          </div>
        </header>

        <nav className="flex flex-wrap gap-1 border-b border-border" aria-label="Secciones del CRM">
          {TABS.map((t) => {
            const active = t.exact
              ? location.pathname === t.to
              : location.pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                preload="intent"
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="h-4 w-4" aria-hidden="true" />
                {t.label}
              </Link>
            );
          })}
        </nav>

        <Outlet />
      </div>
    </AppLayout>
  );
}
