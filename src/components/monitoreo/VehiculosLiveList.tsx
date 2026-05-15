import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { gpsStatus } from "@/components/MonitoreoMap";
import { Search, Circle, Gauge, Clock, Car } from "lucide-react";

interface GpsRow {
  id: string;
  gpswox_device_id: number;
  nombre_dispositivo: string;
  vehiculo_id: string | null;
  last_lat: number | null;
  last_lon: number | null;
  last_speed_kmh: number | null;
  last_fix_at: string | null;
  online: string | null;
  vehiculo?: { placa: string; conductor: string | null; estado: string | null } | null;
}

function tiempoDesde(iso: string | null) {
  if (!iso) return "—";
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
  const [rows, setRows] = useState<GpsRow[]>([]);
  const [q, setQ] = useState("");
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [onlyEnServicio, setOnlyEnServicio] = useState(false);
  const [, force] = useState(0);

  // Re-render cada 30s para que "hace Xs" se actualice
  useEffect(() => {
    const i = setInterval(() => force((x) => x + 1), 30_000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    let cancel = false;
    async function load() {
      const { data } = await supabase
        .from("vehiculos_gps")
        .select("id, gpswox_device_id, nombre_dispositivo, vehiculo_id, last_lat, last_lon, last_speed_kmh, last_fix_at, online, vehiculo:vehiculos(placa, conductor, estado)");
      if (!cancel) setRows(((data ?? []) as unknown) as GpsRow[]);
    }
    void load();
    const ch = supabase
      .channel("vehiculos_gps_list")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehiculos_gps" }, (payload) => {
        setRows((prev) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as { id: string };
            return prev.filter((d) => d.id !== old.id);
          }
          const row = payload.new as GpsRow;
          const idx = prev.findIndex((d) => d.id === row.id);
          if (idx === -1) return [...prev, row];
          const copy = [...prev];
          copy[idx] = { ...copy[idx], ...row };
          return copy;
        });
      })
      .subscribe();
    return () => { cancel = true; supabase.removeChannel(ch); };
  }, []);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const arr = rows.filter((r) => {
      const s = gpsStatus(r);
      if (onlyOnline && s === "offline") return false;
      if (onlyEnServicio) {
        const est = r.vehiculo?.estado ?? "";
        if (!/servic|ruta|operac/i.test(est)) return false;
      }
      if (ql) {
        const hay = `${r.vehiculo?.placa ?? ""} ${r.nombre_dispositivo} ${r.vehiculo?.conductor ?? ""}`.toLowerCase();
        if (!hay.includes(ql)) return false;
      }
      return true;
    });
    arr.sort((a, b) => {
      const sa = gpsStatus(a), sb = gpsStatus(b);
      const rank = (s: string) => (s === "online" ? 0 : s === "idle" ? 1 : 2);
      if (rank(sa) !== rank(sb)) return rank(sa) - rank(sb);
      const ta = a.last_fix_at ? new Date(a.last_fix_at).getTime() : 0;
      const tb = b.last_fix_at ? new Date(b.last_fix_at).getTime() : 0;
      return tb - ta;
    });
    return arr;
  }, [rows, q, onlyOnline, onlyEnServicio]);

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-3 border-b border-border space-y-2">
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar placa, conductor…"
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
          <button
            onClick={() => setOnlyEnServicio((v) => !v)}
            className={`px-2 py-1 rounded-full border ${onlyEnServicio ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"}`}
          >
            En servicio
          </button>
          <span className="ml-auto self-center text-muted-foreground">{filtered.length}/{rows.length}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "Esperando primeros datos GPS…" : "Sin resultados con esos filtros."}
          </div>
        ) : (
          filtered.map((r) => {
            const s = gpsStatus(r);
            const color = s === "online" ? "text-emerald-500" : s === "idle" ? "text-amber-500" : "text-gray-400";
            const placa = r.vehiculo?.placa ?? r.nombre_dispositivo;
            const enSrv = /servic|ruta|operac/i.test(r.vehiculo?.estado ?? "");
            const sel = r.id === selectedId;
            return (
              <button
                key={r.id}
                onClick={() => onSelect(r.id)}
                className={`w-full text-left p-3 hover:bg-secondary/40 transition-colors ${sel ? "bg-secondary/60" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <Circle className={`h-2.5 w-2.5 fill-current ${color}`} />
                  <span className="font-semibold text-sm truncate">{placa}</span>
                  {enSrv && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
                      En servicio
                    </span>
                  )}
                </div>
                {r.vehiculo?.placa && (
                  <div className="text-[11px] text-muted-foreground ml-4 mt-0.5 flex items-center gap-1">
                    <Car className="h-3 w-3" /> {r.nombre_dispositivo}
                  </div>
                )}
                <div className="flex items-center gap-3 ml-4 mt-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3 w-3" />
                    {s === "offline" ? "—" : r.last_speed_kmh != null && r.last_speed_kmh >= 3 ? `${Math.round(r.last_speed_kmh)} km/h` : "detenido"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {tiempoDesde(r.last_fix_at)}
                  </span>
                </div>
                {r.vehiculo?.conductor && (
                  <div className="text-[11px] text-muted-foreground ml-4 mt-0.5 truncate">{r.vehiculo.conductor}</div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
