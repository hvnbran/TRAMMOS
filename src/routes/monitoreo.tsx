import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { AdminOnly } from "../components/layout/AdminOnly";
import { Car, Navigation } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";

const MonitoreoMap = lazy(() => import("../components/MonitoreoMap"));

export const Route = createFileRoute("/monitoreo")({
  component: () => <AdminOnly><Monitoreo /></AdminOnly>,
  head: () => ({
    meta: [
      { title: "Monitoreo - TRAMMOS" },
      { name: "description", content: "Monitoreo en tiempo real de vehículos" },
    ],
  }),
});

const vehiculosEnVivo = [
  { placa: "ABC-123", conductor: "Carlos Mejía", estado: "En ruta", velocidad: 62, ruta: "Bogotá → Sopó", progreso: 65 },
  { placa: "JKL-012", conductor: "María F. Díaz", estado: "En ruta", velocidad: 48, ruta: "Bogotá → Funza", progreso: 40 },
  { placa: "PQR-678", conductor: "Jorge A. Muñoz", estado: "En espera", velocidad: 0, ruta: "Madrid → Bogotá", progreso: 0 },
];

function Monitoreo() {
  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Monitoreo en Tiempo Real</h1>
          <p className="text-sm text-muted-foreground">Seguimiento GPS y estado de vehículos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map */}
          <div className="lg:col-span-2 rounded-lg border border-border bg-card overflow-hidden">
            <div className="h-[400px] w-full">
              <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
                <MonitoreoMap />
              </Suspense>
            </div>
          </div>

          {/* Live vehicles */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Vehículos en Vivo ({vehiculosEnVivo.length})</h3>
            {vehiculosEnVivo.map((v) => (
              <div key={v.placa} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold">{v.placa}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    v.estado === "En ruta" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                  }`}>
                    {v.estado}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{v.conductor}</p>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  <Navigation className="h-3 w-3 text-primary" />
                  <span>{v.ruta}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Velocidad: <span className="text-foreground font-medium">{v.velocidad} km/h</span></span>
                  {v.progreso > 0 && (
                    <span className="text-muted-foreground">{v.progreso}%</span>
                  )}
                </div>
                {v.progreso > 0 && (
                  <div className="mt-1.5 w-full h-1 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${v.progreso}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
