import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ConductorLayout } from "@/components/conductor/ConductorLayout";
import { Calendar, MapPin, Clock, ChevronRight, Loader2, Inbox } from "lucide-react";

const InstallAppBanner = lazy(() =>
  import("@/components/conductor/InstallAppBanner").then((m) => ({ default: m.InstallAppBanner })),
);
const PushNotificationsToggle = lazy(() =>
  import("@/components/conductor/PushNotificationsToggle").then((m) => ({ default: m.PushNotificationsToggle })),
);
const ShareLocationToggle = lazy(() =>
  import("@/components/conductor/ShareLocationToggle").then((m) => ({ default: m.ShareLocationToggle })),
);

export const Route = createFileRoute("/conductor/")({
  component: ConductorHome,
  head: () => ({
    meta: [
      { title: "Mis servicios — Conductor TRAMMOS" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

interface Servicio {
  id: string;
  fecha: string;
  hora: string | null;
  origen: string | null;
  destino: string | null;
  pasajero: string | null;
  estado: string;
  numero_orden: string | null;
  vehiculo: string | null;
  centro_costo: string | null;
}

function badgeEstado(estado: string) {
  const map: Record<string, string> = {
    Programado: "bg-blue-500/15 text-blue-700 border-blue-500/30",
    "En curso": "bg-warning/15 text-warning border-warning/30",
    Finalizado: "bg-success/15 text-success border-success/30",
    Cancelado: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return map[estado] || "bg-secondary text-foreground border-border";
}

function ConductorHome() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    setUserId(u.user?.id ?? null);
    // RLS ya filtra a los servicios del conductor autenticado.
    const { data } = await supabase
      .from("servicios")
      .select("id, fecha, hora, origen, destino, pasajero, estado, numero_orden, vehiculo, centro_costo")
      .order("fecha", { ascending: true })
      .order("hora", { ascending: true });
    setServicios((data ?? []) as Servicio[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // realtime: si el admin cambia algo, refresca
    const ch = supabase
      .channel("conductor-servicios")
      .on("postgres_changes", { event: "*", schema: "public", table: "servicios" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const hoy = servicios.filter((s) => s.fecha === today);
  const proximos = servicios.filter((s) => s.fecha > today);
  const pasados = servicios.filter((s) => s.fecha < today).slice(-5);

  return (
    <ConductorLayout title="Mis servicios">
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <Suspense fallback={null}>
            <ShareLocationToggle />
            {userId && <PushNotificationsToggle userId={userId} />}
            <InstallAppBanner />
          </Suspense>
          <Section title={`Hoy (${hoy.length})`} servicios={hoy} empty="No tienes servicios hoy." />
          <Section title={`Próximos (${proximos.length})`} servicios={proximos} empty="Sin servicios programados." />
          {pasados.length > 0 && (
            <Section title="Recientes" servicios={pasados} empty="" muted />
          )}
        </div>
      )}
    </ConductorLayout>
  );
}

function Section({
  title,
  servicios,
  empty,
  muted = false,
}: {
  title: string;
  servicios: Servicio[];
  empty: string;
  muted?: boolean;
}) {
  return (
    <section>
      <h2 className={`text-xs font-bold uppercase tracking-wide mb-2 ${muted ? "text-muted-foreground" : "text-foreground"}`}>
        {title}
      </h2>
      {servicios.length === 0 ? (
        empty ? (
          <div className="rounded-lg border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            <Inbox className="h-5 w-5 mx-auto mb-1 opacity-50" />
            {empty}
          </div>
        ) : null
      ) : (
        <ul className="space-y-2">
          {servicios.map((s) => (
            <li key={s.id}>
              <Link
                to="/conductor/servicio/$id"
                params={{ id: s.id }}
                className="block bg-card border border-border rounded-lg p-3 hover:border-primary/50 hover:shadow transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${badgeEstado(s.estado)}`}>
                    {s.estado}
                  </span>
                  {s.numero_orden && (
                    <span className="text-[11px] text-muted-foreground">#{s.numero_orden}</span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                </div>
                <div className="text-sm font-semibold truncate">
                  {s.pasajero || "Pasajero sin asignar"}
                </div>
                <div className="mt-1 grid grid-cols-1 gap-0.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {s.fecha}
                    {s.hora && (
                      <>
                        <Clock className="h-3 w-3 ml-2" /> {s.hora}
                      </>
                    )}
                  </p>
                  {s.origen && (
                    <p className="flex items-start gap-1 truncate">
                      <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                      <span className="truncate">
                        <span className="text-success">{s.origen}</span>
                        {s.destino && <> → <span className="text-primary">{s.destino}</span></>}
                      </span>
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
