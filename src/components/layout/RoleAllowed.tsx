import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { AppLayout } from "@/components/layout/AppLayout";
import { ShieldAlert } from "lucide-react";

/**
 * Restricts access to the given roles. Admin is always allowed.
 * Redirects other roles to "/".
 */
export function RoleAllowed({
  roles,
  children,
}: {
  roles: AppRole[];
  children: React.ReactNode;
}) {
  const { role, loading } = useAuth();
  const navigate = useNavigate();
  const allowed: AppRole[] = Array.from(new Set<AppRole>(["admin", ...roles]));

  useEffect(() => {
    if (loading) return;
    if (role && !allowed.includes(role)) {
      navigate({ to: "/" });
    }
  }, [role, loading, navigate, allowed]);

  if (loading || !role) return null;
  if (!allowed.includes(role)) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center max-w-md">
            <ShieldAlert className="h-10 w-10 text-warning mx-auto mb-3" />
            <h2 className="text-lg font-semibold">Acceso restringido</h2>
            <p className="text-sm text-muted-foreground">
              Tu cuenta no tiene permisos para ver este módulo.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return <>{children}</>;
}
