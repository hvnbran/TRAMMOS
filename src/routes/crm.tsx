import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { CrmLayout } from "@/components/crm/CrmLayout";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

export const Route = createFileRoute("/crm")({
  component: CrmRoot,
  head: () => ({
    meta: [
      { title: "CRM — TRAMMOS" },
      { name: "description", content: "Portal CRM: clientes, asesores y concesionarios" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function CrmRoot() {
  const { role, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    // Sin sesión → login del CRM
    if (!user) {
      navigate({ to: "/crm/login" });
      return;
    }
    // Sesión pero sin acceso → login del CRM con sesión cerrada
    if (role && role !== "admin" && role !== "crm") {
      navigate({ to: "/crm/login" });
    }
  }, [loading, user, role, navigate]);

  if (loading || !user || (role !== "admin" && role !== "crm")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Cargando portal CRM…</div>
      </div>
    );
  }

  return (
    <CrmLayout>
      <Outlet />
    </CrmLayout>
  );
}
