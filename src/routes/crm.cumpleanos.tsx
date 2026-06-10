import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Cake, Users, Car, Phone } from "lucide-react";

export const Route = createFileRoute("/crm/cumpleanos")({
  component: CumpleanosPage,
});

type Item = {
  id: string;
  nombre: string;
  fecha: string;
  telefono: string | null;
  origen: "cliente" | "conductor";
};

function diasParaCumple(fecha: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fecha);
  const c = new Date(hoy.getFullYear(), f.getMonth(), f.getDate());
  if (c < hoy) c.setFullYear(hoy.getFullYear() + 1);
  return Math.round((c.getTime() - hoy.getTime()) / 86400000);
}

function fmt(fecha: string): string {
  const f = new Date(fecha);
  return f.toLocaleDateString("es-CO", { day: "2-digit", month: "long" });
}

function edad(fecha: string): number {
  const hoy = new Date();
  const f = new Date(fecha);
  let e = hoy.getFullYear() - f.getFullYear();
  const m = hoy.getMonth() - f.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) e--;
  return e + 1; // edad que cumplirá
}

function CumpleanosPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | "cliente" | "conductor">("todos");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [cli, con] = await Promise.all([
        supabase.from("crm_clientes").select("id,nombre,fecha_nacimiento,telefono"),
        supabase.from("conductores").select("id,nombre,fecha_nacimiento,telefono"),
      ]);
      const all: Item[] = [];
      (cli.data ?? []).forEach((c: any) => {
        if (c.fecha_nacimiento)
          all.push({ id: c.id, nombre: c.nombre, fecha: c.fecha_nacimiento, telefono: c.telefono, origen: "cliente" });
      });
      (con.data ?? []).forEach((c: any) => {
        if (c.fecha_nacimiento)
          all.push({ id: c.id, nombre: c.nombre, fecha: c.fecha_nacimiento, telefono: c.telefono, origen: "conductor" });
      });
      setItems(all);
      setLoading(false);
    })();
  }, []);

  const ordenados = useMemo(
    () =>
      items
        .filter((i) => filtro === "todos" || i.origen === filtro)
        .map((i) => ({ ...i, dias: diasParaCumple(i.fecha) }))
        .sort((a, b) => a.dias - b.dias),
    [items, filtro],
  );

  const hoy = ordenados.filter((i) => i.dias === 0);
  const semana = ordenados.filter((i) => i.dias > 0 && i.dias <= 7);
  const mes = ordenados.filter((i) => i.dias > 7 && i.dias <= 30);
  const despues = ordenados.filter((i) => i.dias > 30);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Cake className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-bold">Cumpleaños</h1>
        </div>
        <div className="flex gap-1 rounded-md border border-border bg-card p-1 text-xs">
          {([
            ["todos", "Todos"],
            ["cliente", "Clientes"],
            ["conductor", "Conductores"],
          ] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFiltro(k)}
              className={`px-3 py-1.5 rounded ${filtro === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="text-muted-foreground">Cargando…</div>
      ) : ordenados.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Aún no hay fechas de nacimiento registradas. Agrégalas desde la ficha del cliente o conductor.
        </div>
      ) : (
        <>
          <Seccion titulo="🎉 ¡Hoy!" items={hoy} highlight />
          <Seccion titulo="Esta semana (próximos 7 días)" items={semana} />
          <Seccion titulo="Este mes (8–30 días)" items={mes} />
          <Seccion titulo="Más adelante" items={despues} />
        </>
      )}
    </div>
  );
}

function Seccion({
  titulo,
  items,
  highlight,
}: {
  titulo: string;
  items: (Item & { dias: number })[];
  highlight?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-lg border border-border bg-card overflow-hidden">
      <header className={`px-4 py-2.5 border-b border-border text-sm font-semibold ${highlight ? "bg-primary/10 text-primary" : ""}`}>
        {titulo} <span className="text-muted-foreground font-normal">({items.length})</span>
      </header>
      <ul className="divide-y divide-border">
        {items.map((i) => (
          <li key={`${i.origen}-${i.id}`} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${
                  i.origen === "cliente"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                }`}
              >
                {i.origen === "cliente" ? <Users className="h-3 w-3" /> : <Car className="h-3 w-3" />}
                {i.origen}
              </span>
              <span className="font-medium truncate">{i.nombre}</span>
              <span className="text-muted-foreground hidden sm:inline">· {fmt(i.fecha)} · cumple {edad(i.fecha)}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {i.telefono && (
                <a
                  href={`https://wa.me/${i.telefono.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Phone className="h-3 w-3" />
                  {i.telefono}
                </a>
              )}
              <span className={`text-xs font-medium ${i.dias === 0 ? "text-primary" : "text-muted-foreground"}`}>
                {i.dias === 0 ? "¡Hoy!" : `en ${i.dias} día${i.dias === 1 ? "" : "s"}`}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
