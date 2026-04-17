import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { AppLayout } from "@/components/layout/AppLayout";
import { ShieldAlert } from "lucide-react";

/**
 * Wraps a page that only admin can access.
 * Redirects corona/sodimac users to "/" (dashboard).
 */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (role && role !== "admin") {
      navigate({ to: "/" });
    }
  }, [role, loading, navigate]);

  if (loading || !role) return null;
  if (role !== "admin") {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center max-w-md">
            <ShieldAlert className="h-10 w-10 text-warning mx-auto mb-3" />
            <h2 className="text-lg font-semibold">Acceso restringido</h2>
            <p className="text-sm text-muted-foreground">Este módulo sólo está disponible para administradores.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return <>{children}</>;
}
