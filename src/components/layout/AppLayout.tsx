import { Sidebar } from "./Sidebar";
import { Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { NotificationsBell } from "@/components/NotificationsBell";
import logoCorona from "@/assets/logo-corona.png";
import logoSodimac from "@/assets/logo-sodimac-icon.png";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { displayName, role } = useAuth();
  const initials = (displayName || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const badge =
    role === "admin" ? "Administrador" : role === "corona" ? "Corona" : role === "sodimac" ? "Sodimac" : "";

  const headerBrand =
    role === "corona"
      ? { name: "CORONA", logo: logoCorona }
      : role === "sodimac"
      ? { name: "SODIMAC", logo: logoSodimac }
      : { name: "TRAMMOS", logo: null as string | null };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6 gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-border">
              {headerBrand.logo && (
                <img
                  src={headerBrand.logo}
                  alt={headerBrand.name}
                  className="h-8 w-auto object-contain"
                />
              )}
              <span className="text-sm font-bold tracking-wide text-foreground hidden sm:inline">
                {headerBrand.name}
              </span>
            </div>
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                className="h-9 w-full rounded-md bg-secondary pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationsBell />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {initials}
              </div>
              <div className="hidden md:block text-right leading-tight">
                <div className="text-sm text-foreground">{displayName || "Usuario"}</div>
                <div className="text-[10px] text-muted-foreground">{badge}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
