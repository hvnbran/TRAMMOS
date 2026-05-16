import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";

const MEDELLIN: [number, number] = [6.2442, -75.5812];

export interface GpsLive {
  id: string;
  gpswox_device_id: number;
  nombre_dispositivo: string;
  vehiculo_id: string | null;
  last_lat: number | null;
  last_lon: number | null;
  last_speed_kmh: number | null;
  last_course: number | null;
  last_fix_at: string | null;
  online: string | null;
  direccion?: string | null;
  bateria_gps?: number | null;
  bateria_vehiculo?: number | null;
  sim_signal?: number | null;
  satelites?: number | null;
  kilometraje?: number | null;
  ignicion?: boolean | null;
  bloqueo?: boolean | null;
  novedad?: string | null;
  vehiculo?: { placa: string; conductor: string | null } | null;
}

export type GpsStatus = "online" | "idle" | "offline";

export function gpsStatus(g: Pick<GpsLive, "online" | "last_fix_at" | "last_speed_kmh">): GpsStatus {
  const liveOnline = g.online === "online" || g.online === "ack" || g.online === "engine";
  const recent = g.last_fix_at ? Date.now() - new Date(g.last_fix_at).getTime() < 5 * 60_000 : false;
  if (!liveOnline && !recent) return "offline";
  if ((g.last_speed_kmh ?? 0) < 3) return "idle";
  return "online";
}

const COLORS: Record<GpsStatus, string> = {
  online: "#10b981",
  idle: "#f59e0b",
  offline: "#9ca3af",
};

function arrowIcon(status: GpsStatus, course: number | null, focused: boolean) {
  const color = COLORS[status];
  const rot = course ?? 0;
  const ring = focused ? `<circle cx="14" cy="14" r="13" fill="none" stroke="${color}" stroke-width="2" opacity="0.6"/>` : "";
  // Si está moviéndose mostrar flecha, si no círculo
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

const userIcon = L.divIcon({
  className: "user-location-marker",
  html: `
    <div style="position: relative; width: 22px; height: 22px;">
      <div style="position:absolute;inset:0;background:rgba(37,99,235,0.25);border-radius:50%;animation:trammos-pulse 2s ease-out infinite;"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>
    </div>
    <style>@keyframes trammos-pulse{0%{transform:scale(0.6);opacity:0.9;}100%{transform:scale(2.4);opacity:0;}}</style>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

type GeoStatus = "idle" | "locating" | "active" | "denied" | "unsupported";

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
  const [devices, setDevices] = useState<GpsLive[]>([]);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");

  useEffect(() => {
    let cancel = false;
    async function load() {
      const { data } = await supabase
        .from("vehiculos_gps")
        .select("id, gpswox_device_id, nombre_dispositivo, vehiculo_id, last_lat, last_lon, last_speed_kmh, last_course, last_fix_at, online, last_synced_at, direccion, bateria_gps, bateria_vehiculo, sim_signal, satelites, kilometraje, ignicion, bloqueo, novedad, vehiculo:vehiculos(placa, conductor)");
      if (!cancel) setDevices(((data ?? []) as unknown) as GpsLive[]);
    }
    void load();

    const ch = supabase
      .channel("vehiculos_gps_map")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehiculos_gps" }, (payload) => {
        setDevices((prev) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as { id: string };
            return prev.filter((d) => d.id !== old.id);
          }
          const row = payload.new as GpsLive;
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

  useEffect(() => {
    if (!onCount) return;
    let online = 0, offline = 0;
    let lastSync: string | null = null;
    for (const d of devices) {
      const s = gpsStatus(d);
      if (s === "offline") offline++; else online++;
      if (d.last_fix_at && (!lastSync || d.last_fix_at > lastSync)) lastSync = d.last_fix_at;
    }
    onCount({ total: devices.length, online, offline, lastSync });
  }, [devices, onCount]);

  useEffect(() => {
    if (!("geolocation" in navigator)) { setStatus("unsupported"); return; }
    setStatus("locating");
    const watchId = navigator.geolocation.watchPosition(
      (pos) => { setUserPos([pos.coords.latitude, pos.coords.longitude]); setStatus("active"); },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unsupported"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const initialPoints: [number, number][] = devices
    .filter((d) => d.last_lat != null && d.last_lon != null)
    .map((d) => [d.last_lat as number, d.last_lon as number]);
  if (userPos) initialPoints.push(userPos);

  const focused = focusedId ? devices.find((d) => d.id === focusedId) : null;
  const focusTarget: [number, number] | null =
    focused && focused.last_lat != null && focused.last_lon != null
      ? [focused.last_lat, focused.last_lon]
      : null;

  const statusLabel: Record<GeoStatus, string> = {
    idle: "📍 Iniciando...", locating: "📍 Ubicando...", active: "📍 Ubicación activa",
    denied: "⚠️ Ubicación denegada", unsupported: "⚠️ GPS no disponible",
  };
  const statusBg: Record<GeoStatus, string> = {
    idle: "rgba(0,0,0,0.6)", locating: "rgba(37, 99, 235, 0.85)", active: "rgba(16, 185, 129, 0.9)",
    denied: "rgba(220, 38, 38, 0.9)", unsupported: "rgba(120, 120, 120, 0.9)",
  };

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <MapContainer center={MEDELLIN} zoom={12} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains={["a", "b", "c", "d"]}
          maxZoom={19}
        />
        {devices.map((d) => {
          if (d.last_lat == null || d.last_lon == null) return null;
          const s = gpsStatus(d);
          const placa = d.vehiculo?.placa ?? d.nombre_dispositivo;
          return (
            <Marker
              key={d.id}
              position={[d.last_lat, d.last_lon]}
              icon={arrowIcon(s, d.last_course, d.id === focusedId)}
            >
              <Popup>
                <div style={{ fontSize: 12, minWidth: 220 }}>
                  <strong style={{ fontSize: 13 }}>{placa}</strong>
                  <div style={{ color: "#666" }}>{d.nombre_dispositivo}</div>
                  {d.vehiculo?.conductor && <div>👤 {d.vehiculo.conductor}</div>}
                  {d.direccion && <div style={{ marginTop: 4, color: "#444" }}>📍 {d.direccion}</div>}
                  <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                    <div>🚗 {d.last_speed_kmh != null ? `${Math.round(d.last_speed_kmh)} km/h` : "—"}</div>
                    <div>{s === "online" ? "🟢 Moviéndose" : s === "idle" ? "🟡 Detenido" : "⚪ Sin señal"}</div>
                    {d.ignicion != null && <div>🔑 {d.ignicion ? "Encendido" : "Apagado"}</div>}
                    {d.bateria_vehiculo != null && <div>🔋 Veh: {Number(d.bateria_vehiculo).toFixed(1)}V</div>}
                    {d.bateria_gps != null && <div>🔋 GPS: {d.bateria_gps}%</div>}
                    {d.sim_signal != null && <div>📶 {d.sim_signal}</div>}
                    {d.satelites != null && <div>🛰️ {d.satelites}</div>}
                    {d.kilometraje != null && <div>🛣️ {Math.round(Number(d.kilometraje))} km</div>}
                  </div>
                  {d.bloqueo && <div style={{ marginTop: 4, color: "#dc2626", fontWeight: 600 }}>🔒 Bloqueado</div>}
                  {d.novedad && <div style={{ marginTop: 4, color: "#b45309" }}>⚠️ {d.novedad}</div>}
                  {d.last_fix_at && (
                    <div style={{ color: "#666", marginTop: 6, fontSize: 11 }}>Último: {new Date(d.last_fix_at).toLocaleString("es-CO")}</div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
        {userPos && (
          <Marker position={userPos} icon={userIcon}>
            <Popup>
              <div style={{ fontSize: 12 }}>
                <strong>Tu ubicación</strong><br />
                {userPos[0].toFixed(5)}, {userPos[1].toFixed(5)}
              </div>
            </Popup>
          </Marker>
        )}
        <FitOnce points={initialPoints} />
        <FocusOn target={focusTarget} />
      </MapContainer>
      <div
        style={{
          position: "absolute", top: 10, right: 10, zIndex: 1000,
          background: statusBg[status], color: "white",
          padding: "6px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)", pointerEvents: "none",
        }}
      >
        {statusLabel[status]} · {devices.length} GPS
      </div>
    </div>
  );
}
