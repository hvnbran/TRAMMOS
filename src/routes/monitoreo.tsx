import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { AdminOnly } from "../components/layout/AdminOnly";
import { Skeleton } from "../components/ui/skeleton";
import VehiculosLiveList from "../components/monitoreo/VehiculosLiveList";
import { Activity, WifiOff } from "lucide-react";

const MonitoreoMap = lazy(() => import("../components/MonitoreoMap"));

export const Route = createFileRoute("/monitoreo")({
  component: () => (
    <AdminOnly>
      <Monitoreo />
    </AdminOnly>
  ),
  head: () => ({
    meta: [
      { title: "Monitoreo - TRAMMOS" },
      { name: "description", content: "Monitoreo en tiempo real de vehículos" },
    ],
  }),
});

function Monitoreo() {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total: number; online: number; offline: number; lastSync: string | null }>({
    total: 0, online: 0, offline: 0, lastSync: null,
  });
  const onCount = useCallback(
    (info: { total: number; online: number; offline: number; lastSync: string | null }) => setStats(info),
    [],
  );

  const lastSyncTxt = stats.lastSync
    ? `${Math.max(0, Math.floor((Date.now() - new Date(stats.lastSync).getTime()) / 1000))}s`
    : "—";

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Monitoreo en Tiempo Real</h1>
            <p className="text-sm text-muted-foreground">
              Ubicación en vivo de los conductores conectados desde su celular
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700">
              <Activity className="h-3 w-3" /> {stats.online} en línea
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              <WifiOff className="h-3 w-3" /> {stats.offline} offline
            </span>
            <span className="text-muted-foreground">Última sync: {lastSyncTxt}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-260px)] min-h-[500px]">
          <VehiculosLiveList selectedId={focusedId} onSelect={setFocusedId} />
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
              <MonitoreoMap focusedId={focusedId} onCount={onCount} />
            </Suspense>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
