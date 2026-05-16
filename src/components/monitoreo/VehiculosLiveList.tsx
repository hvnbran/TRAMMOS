import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { liveStatus } from "@/components/MonitoreoMap";
import { Search, Circle, Gauge, Clock, User } from "lucide-react";

interface Row {
  conductor_id: string;
  lat: number;
  lng: number;
  speed_kmh: number | null;
  heading: number | null;
  online: boolean;
  updated_at: string;
  conductor?: { nombre: string; telefono: string | null } | null;
}

function tiempoDesde(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(iso).toLocaleDateString("es-CO");
}

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function VehiculosLiveList({ selectedId, onSelect }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [onlyOnline, setOnlyOnline] = useState(true);
  const [, force] = useState(0);

  useEffect(() => {
    const i = setInterval(() => force((x) => x + 1), 15_000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    let cancel = false;
    async function load() {
      const { data } = await supabase
        .from("conductor_ubicaciones")
        .select("conductor_id, lat, lng, speed_kmh, heading, online, updated_at, conductor:conductores(nombre, telefono)")
        .order("updated_at", { ascending: false });
      if (!cancel) setRows(((data ?? []) as unknown) as Row[]);
    }
    void load();
    const ch = supabase
      .channel("conductor_ubicaciones_list")
      .on("postgres_changes", { event: "*", schema: "public", table: "conductor_ubicaciones" }, async (payload) => {
        if (payload.eventType === "DELETE") {
          const old = payload.old as { conductor_id: string };
          setRows((prev) => prev.filter((d) => d.conductor_id !== old.conductor_id));
          return;
        }
        const r = payload.new as { conductor_id: string };
        const { data } = await supabase
          .from("conductor_ubicaciones")
          .select("conductor_id, lat, lng, speed_kmh, heading, online, updated_at, conductor:conductores(nombre, telefono)")
          .eq("conductor_id", r.conductor_id)
          .maybeSingle();
        if (!data) return;
        const fresh = (data as unknown) as Row;
        setRows((prev) => {
          const idx = prev.findIndex((d) => d.conductor_id === fresh.conductor_id);
          if (idx === -1) return [...prev, fresh];
          const copy = [...prev];
          copy[idx] = fresh;
          return copy;
        });
      })
      .subscribe();
    return () => { cancel = true; supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const arr = rows.filter((r) => {
      const s = liveStatus(r);
      if (onlyOnline && s === "offline") return false;
      if (ql) {
        const hay = `${r.conductor?.nombre ?? ""} ${r.conductor?.telefono ?? ""}`.toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
    arr.sort((a, b) => {
      const sa = liveStatus(a), sb = liveStatus(b);
      const rank = (s: string) => (s === "online" ? 0 : s === "idle" ? 1 : 2);
      if (rank(sa) !== rank(sb)) return rank(sa) - rank(sb);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return arr;
  }, [rows, q, onlyOnline]);

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-3 border-b border-border space-y-2">
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar conductor…"
            className="w-full pl-8 pr-2 py-1.5 text-sm rounded-md border border-input bg-background"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <button
            onClick={() => setOnlyOnline((v) => !v)}
            className={`px-2 py-1 rounded-full border ${onlyOnline ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"}`}
          >
            Solo en línea
          </button>
          <span className="ml-auto self-center text-muted-foreground">{filtered.length}/{rows.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {rows.length === 0
              ? "Ningún conductor ha conectado su ubicación todavía."
              : "Ningún conductor está en línea ahora mismo."}
          </div>
        ) : (
          filtered.map((r) => {
            const s = liveStatus(r);
            const color = s === "online" ? "text-emerald-500" : s === "idle" ? "text-amber-500" : "text-gray-400";
            const sel = r.conductor_id === selectedId;
            return (
              <button
                key={r.conductor_id}
                onClick={() => onSelect(r.conductor_id)}
                className={`w-full text-left p-3 hover:bg-secondary/40 transition-colors ${sel ? "bg-secondary/60" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <Circle className={`h-2.5 w-2.5 fill-current ${color}`} />
                  <span className="font-semibold text-sm truncate flex items-center gap-1">
                    <User className="h-3 w-3" /> {r.conductor?.nombre ?? "Conductor"}
                  </span>
                </div>
                <div className="flex items-center gap-3 ml-4 mt-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3 w-3" />
                    {s === "offline" ? "—" : r.speed_kmh != null && r.speed_kmh >= 3 ? `${Math.round(r.speed_kmh)} km/h` : "detenido"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {tiempoDesde(r.updated_at)}
                  </span>
                </div>
                {r.conductor?.telefono && (
                  <div className="text-[11px] text-muted-foreground ml-4 mt-0.5 truncate">{r.conductor.telefono}</div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
