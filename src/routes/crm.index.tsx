import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserCog, Building2, Cake, Snowflake, Thermometer, Flame } from "lucide-react";

export const Route = createFileRoute("/crm/")({
  component: CrmDashboard,
});

type ClienteLite = {
  id: string;
  nombre: string;
  temperatura: "frio" | "tibio" | "caliente";
  fecha_nacimiento: string | null;
  telefono: string | null;
};

type CumpleItem = {
  id: string;
  nombre: string;
  telefono: string | null;
  dias: number;
  origen: "cliente" | "conductor";
};

function diasParaCumple(fecha: string | null): number | null {
  if (!fecha) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fecha);
  const cumpleEsteAno = new Date(hoy.getFullYear(), f.getMonth(), f.getDate());
  if (cumpleEsteAno < hoy) cumpleEsteAno.setFullYear(hoy.getFullYear() + 1);
  return Math.round((cumpleEsteAno.getTime() - hoy.getTime()) / 86400000);
}

function CrmDashboard() {
  const [clientes, setClientes] = useState<ClienteLite[]>([]);
  const [conductoresCumple, setConductoresCumple] = useState<CumpleItem[]>([]);
  const [asesoresCount, setAsesoresCount] = useState(0);
  const [concesionariosCount, setConcesionariosCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [cli, ase, con, conductores] = await Promise.all([
        supabase.from("crm_clientes").select("id,nombre,temperatura,fecha_nacimiento,telefono"),
        supabase.from("crm_asesores").select("id", { count: "exact", head: true }),
        supabase.from("crm_concesionarios").select("id", { count: "exact", head: true }),
        supabase.from("conductores").select("id,nombre,fecha_nacimiento,telefono"),
      ]);
      setClientes((cli.data ?? []) as ClienteLite[]);
      const cd: CumpleItem[] = ((conductores.data ?? []) as any[])
        .filter((c) => c.fecha_nacimiento)
        .map((c) => ({
          id: c.id,
          nombre: c.nombre,
          telefono: c.telefono,
          dias: diasParaCumple(c.fecha_nacimiento) ?? 999,
          origen: "conductor" as const,
        }));
      setConductoresCumple(cd);
      setAsesoresCount(ase.count ?? 0);
      setConcesionariosCount(con.count ?? 0);
      setLoading(false);
    })();
  }, []);

  const counts = {
    frio: clientes.filter((c) => c.temperatura === "frio").length,
    tibio: clientes.filter((c) => c.temperatura === "tibio").length,
    caliente: clientes.filter((c) => c.temperatura === "caliente").length,
  };

  const cumpleProx = clientes
    .map((c) => ({ ...c, dias: diasParaCumple(c.fecha_nacimiento) }))
    .filter((c) => c.dias !== null && c.dias <= 7)
    .sort((a, b) => (a.dias ?? 0) - (b.dias ?? 0));

  if (loading) return <div className="text-muted-foreground">Cargando…</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Clientes" value={clientes.length} icon={Users} />
        <Stat label="Asesores" value={asesoresCount} icon={UserCog} />
        <Stat label="Concesionarios" value={concesionariosCount} icon={Building2} />
        <Stat label="Próx. cumpleaños (7 días)" value={cumpleProx.length} icon={Cake} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TempCard label="Fríos" value={counts.frio} icon={Snowflake} color="text-blue-600" />
        <TempCard label="Tibios" value={counts.tibio} icon={Thermometer} color="text-amber-600" />
        <TempCard label="Calientes" value={counts.caliente} icon={Flame} color="text-red-600" />
      </div>

      <section className="rounded-lg border border-border bg-card">
        <header className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Cake className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="font-semibold">Próximos cumpleaños</h2>
        </header>
        {cumpleProx.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No hay cumpleaños en los próximos 7 días.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {cumpleProx.map((c) => (
              <li key={c.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <span className="font-medium">{c.nombre}</span>
                <span className="text-muted-foreground">
                  {c.dias === 0 ? "¡Hoy!" : `en ${c.dias} día${c.dias === 1 ? "" : "s"}`}
                  {c.telefono ? ` · ${c.telefono}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="mt-2 text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}

function TempCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Snowflake;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
      <div className={`p-2 rounded-md bg-muted ${color}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
      </div>
    </div>
  );
}
