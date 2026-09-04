import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";

const MEDELLIN: [number, number] = [6.2442, -75.5812];
const STALE_MS = 180_000; // 3 min sin update => offline (el latido llega cada 30s)

export interface ConductorLive {
  conductor_id: string;
  lat: number;
  lng: number;
  speed_kmh: number | null;
  heading: number | null;
  accuracy: number | null;
  online: boolean;
  updated_at: string;
  conductor?: { nombre: string; telefono: string | null } | null;
}

export type LiveStatus = "online" | "idle" | "offline";

export function liveStatus(c: Pick<ConductorLive, "online" | "updated_at" | "speed_kmh">): LiveStatus {
  const age = Date.now() - new Date(c.updated_at).getTime();
  if (!c.online || age > STALE_MS) return "offline";
  if ((c.speed_kmh ?? 0) < 3) return "idle";
  return "online";
}

const COLORS: Record<LiveStatus, string> = {
  online: "#10b981",
  idle: "#f59e0b",
  offline: "#9ca3af",
};

function arrowIcon(status: LiveStatus, heading: number | null, focused: boolean) {
  const color = COLORS[status];
  const rot = heading ?? 0;
  const ring = focused ? `<circle cx="14" cy="14" r="13" fill="none" stroke="${color}" stroke-width="2" opacity="0.6"/>` : "";
  const shape = status === "online"
    ? `<path d="M14 3 L22 22 L14 18 L6 22 Z" fill="${color}" stroke="white" stroke-width="1.5" stroke-linejoin="round" transform="rotate(${rot} 14 14)"/>`
    : `<circle cx="14" cy="14" r="7" fill="${color}" stroke="white" stroke-width="2.5"/>`;
  return L.divIcon({
    className: "trammos-marker",
    html: `<svg width="28" height="28" viewBox="0 0 28 28" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))">${ring}${shape}</svg>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function FitOnce({ points }: { points: [number, number][] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || points.length === 0) return;
    if (points.length === 1) map.setView(points[0], 14);
    else map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    done.current = true;
  }, [points, map]);
  return null;
}

function FocusOn({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo(target, Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [target, map]);
  return null;
}

interface Props {
  focusedId?: string | null;
  onCount?: (info: { total: number; online: number; offline: number; lastSync: string | null }) => void;
}

export default function MonitoreoMap({ focusedId, onCount }: Props) {
  const [rows, setRows] = useState<ConductorLive[]>([]);
  const [, force] = useState(0);

  // Forzar recálculo de "offline por inactividad" cada 15s
  useEffect(() => {
    const i = setInterval(() => force((x) => x + 1), 15_000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    let cancel = false;
    async function load() {
      const { data } = await supabase
        .from("conductor_ubicaciones")
        .select("conductor_id, lat, lng, speed_kmh, heading, accuracy, online, updated_at, conductor:conductores(nombre, telefono)");
      if (!cancel) setRows(((data ?? []) as unknown) as ConductorLive[]);
    }
    void load();

    const ch = supabase
      .channel("conductor_ubicaciones_map")
      .on("postgres_changes", { event: "*", schema: "public", table: "conductor_ubicaciones" }, async (payload) => {
        if (payload.eventType === "DELETE") {
          const old = payload.old as { conductor_id: string };
          setRows((prev) => prev.filter((d) => d.conductor_id !== old.conductor_id));
          return;
        }
        // Refetch a la fila afectada para traer el join al conductor
        const row = payload.new as { conductor_id: string };
        const { data } = await supabase
          .from("conductor_ubicaciones")
          .select("conductor_id, lat, lng, speed_kmh, heading, accuracy, online, updated_at, conductor:conductores(nombre, telefono)")
          .eq("conductor_id", row.conductor_id)
          .maybeSingle();
        if (!data) return;
        const fresh = (data as unknown) as ConductorLive;
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

  useEffect(() => {
    if (!onCount) return;
    let online = 0, offline = 0;
    let lastSync: string | null = null;
    for (const d of rows) {
      const s = liveStatus(d);
      if (s === "offline") offline++; else online++;
      if (!lastSync || d.updated_at > lastSync) lastSync = d.updated_at;
    }
    onCount({ total: rows.length, online, offline, lastSync });
  }, [rows, onCount]);

  const initialPoints: [number, number][] = rows
    .filter((d) => liveStatus(d) !== "offline")
    .map((d) => [d.lat, d.lng]);

  const focused = focusedId ? rows.find((d) => d.conductor_id === focusedId) : null;
  const focusTarget: [number, number] | null = focused ? [focused.lat, focused.lng] : null;

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <MapContainer center={MEDELLIN} zoom={12} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {rows.map((d) => {
          const s = liveStatus(d);
          if (s === "offline") return null; // ocultos del mapa
          return (
            <Marker
              key={d.conductor_id}
              position={[d.lat, d.lng]}
              icon={arrowIcon(s, d.heading, d.conductor_id === focusedId)}
            >
              <Popup>
                <div style={{ fontSize: 12, minWidth: 200 }}>
                  <strong style={{ fontSize: 13 }}>{d.conductor?.nombre ?? "Conductor"}</strong>
                  {d.conductor?.telefono && <div>📞 {d.conductor.telefono}</div>}
                  <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    <div>🚗 {d.speed_kmh != null ? `${Math.round(d.speed_kmh)} km/h` : "—"}</div>
                    <div>{s === "online" ? "🟢 Moviéndose" : "🟡 Detenido"}</div>
                    {d.accuracy != null && <div>🎯 ±{Math.round(d.accuracy)}m</div>}
                  </div>
                  <div style={{ color: "#666", marginTop: 6, fontSize: 11 }}>
                    Actualizado: {new Date(d.updated_at).toLocaleTimeString("es-CO")}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        <FitOnce points={initialPoints} />
        <FocusOn target={focusTarget} />
      </MapContainer>
    </div>
  );
}
