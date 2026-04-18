import { Sidebar } from "./Sidebar";
import { useAuth } from "@/lib/auth-context";
import { NotificationsBell } from "@/components/NotificationsBell";
import { GlobalSearch } from "@/components/GlobalSearch";

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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-3 flex-1">
            <GlobalSearch />
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
