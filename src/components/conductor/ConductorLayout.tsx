import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Home } from "lucide-react";
import logo from "@/assets/logo-trammos.png";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProfilePhotoUploader } from "@/components/ProfilePhotoUploader";
import { PersonaAvatar } from "@/components/PersonaAvatar";

interface ConductorMe {
  id: string;
  nombre: string;
  foto_url: string | null;
}

export function ConductorLayout({ children, title }: { children: ReactNode; title?: string }) {
  const { user, displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState<ConductorMe | null>(null);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("conductores")
        .select("id, nombre, foto_url")
        .eq("auth_user_id", user.id)
        .maybeSingle<ConductorMe>();
      if (mounted && data) setMe(data);
    })();
    return () => { mounted = false; };
  }, [user]);

  async function handleLogout() {
    await signOut();
    navigate({ to: "/conductor/login" });
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-background to-secondary/20"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <header
        className="sticky z-30 bg-card/95 backdrop-blur border-b border-border"
        style={{ top: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-5 h-14 flex items-center gap-2.5">
          <Link to="/conductor" className="flex items-center gap-2 flex-1 min-w-0">
            <img src={logo} alt="TRAMMOS" className="h-8 w-8 rounded-md object-contain" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground leading-none">TRAMMOS · Conductor</p>
              <p className="text-sm font-semibold truncate">
                {displayName || me?.nombre || "Conductor"}
              </p>
            </div>
          </Link>

          {me ? (
            <div className="scale-90 -my-2">
              <ProfilePhotoUploader
                entity="conductor"
                rowId={me.id}
                nombre={me.nombre}
                fotoUrl={me.foto_url}
                size="md"
                label=""
                onChange={(url) => setMe({ ...me, foto_url: url })}
              />
            </div>
          ) : (
            <PersonaAvatar nombre={displayName} size="sm" />
          )}

          <button
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        {title && (
          <div className="max-w-2xl mx-auto px-4 pb-3 flex items-center gap-2">
            <Link
              to="/conductor"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <Home className="h-3 w-3" /> Inicio
            </Link>
            <span className="text-muted-foreground">·</span>
            <h1 className="text-base font-semibold">{title}</h1>
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 pb-12">{children}</main>
      <SiteFooter variant="compact" />
    </div>
  );
}
