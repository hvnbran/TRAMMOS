import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { AdminOnly } from "../components/layout/AdminOnly";
import { Car, Inbox } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

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

interface VehiculoLive {
  id: string;
  placa: string;
  conductor: string | null;
  estado: string;
  marca: string | null;
  linea: string | null;
}

function Monitoreo() {
  const { cliente } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vehiculos, setVehiculos] = useState<VehiculoLive[]>([]);

  useEffect(() => {
    void load();
    const i = setInterval(load, 30_000);
    return () => clearInterval(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente]);

  async function load() {
    let q = supabase.from("vehiculos").select("id,placa,conductor,estado,marca,linea").order("placa");
    if (cliente) q = q.eq("cliente", cliente);
    const { data } = await q;
    setVehiculos((data as VehiculoLive[]) ?? []);
    setLoading(false);
  }

  const enOperacion = vehiculos.filter((v) => /servic|ruta|operac/i.test(v.estado));

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
            <h3 className="text-sm font-semibold">
              Vehículos en Operación ({loading ? "—" : enOperacion.length})
            </h3>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : enOperacion.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-6 flex flex-col items-center text-center text-muted-foreground">
                <Inbox className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm text-foreground">Sin vehículos en operación</p>
                <p className="text-xs mt-1">
                  Marca un vehículo como "En servicio" o "En ruta" para verlo aquí.
                </p>
              </div>
            ) : (
              enOperacion.map((v) => (
                <div key={v.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold">{v.placa}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-success/15 text-success">
                      {v.estado}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {v.conductor ?? "Sin conductor asignado"}
                  </p>
                  {(v.marca || v.linea) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[v.marca, v.linea].filter(Boolean).join(" ")}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
