import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";

const MEDELLIN: [number, number] = [6.2442, -75.5812];

interface GpsLive {
  id: string;
  gpswox_device_id: number;
  nombre_dispositivo: string;
  vehiculo_id: string | null;
  last_lat: number | null;
  last_lon: number | null;
  last_speed_kmh: number | null;
  last_fix_at: string | null;
  online: string | null;
  vehiculo?: { placa: string; conductor: string | null } | null;
}

function isOnline(g: GpsLive): boolean {
  if (g.online === "online" || g.online === "ack" || g.online === "engine") return true;
  if (!g.last_fix_at) return false;
  return Date.now() - new Date(g.last_fix_at).getTime() < 5 * 60_000;
}

function makeIcon(online: boolean) {
  const color = online ? "oklch(0.72 0.15 210)" : "#9ca3af";
  return L.divIcon({
    className: "trammos-marker",
    html: `<div style="
      width: 18px; height: 18px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
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

function FitOnLoad({ points }: { points: [number, number][] }) {
  const map = useMap();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (done || points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    }
    setDone(true);
  }, [points, map, done]);
  return null;
}

export default function MonitoreoMap() {
  const [devices, setDevices] = useState<GpsLive[]>([]);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");

  // Carga inicial + realtime
  useEffect(() => {
    let cancel = false;
    async function load() {
      const { data } = await supabase
        .from("vehiculos_gps")
        .select("id, gpswox_device_id, nombre_dispositivo, vehiculo_id, last_lat, last_lon, last_speed_kmh, last_fix_at, online, vehiculo:vehiculos(placa, conductor)")
        .not("last_lat", "is", null)
        .not("last_lon", "is", null);
      if (!cancel) setDevices(((data ?? []) as unknown) as GpsLive[]);
    }
    void load();

    const ch = supabase
      .channel("vehiculos_gps_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vehiculos_gps" },
        (payload) => {
          setDevices((prev) => {
            const row = payload.new as GpsLive;
            if (payload.eventType === "DELETE") {
              const old = payload.old as { id: string };
              return prev.filter((d) => d.id !== old.id);
            }
            const idx = prev.findIndex((d) => d.id === row.id);
            if (idx === -1) return [...prev, row];
            const copy = [...prev];
            // preservar el join vehiculo del fetch inicial
            copy[idx] = { ...copy[idx], ...row };
            return copy;
          });
        },
      )
      .subscribe();
    return () => { cancel = true; supabase.removeChannel(ch); };
  }, []);

  // Geolocalización del usuario
  useEffect(() => {
    if (!("geolocation" in navigator)) { setStatus("unsupported"); return; }
    setStatus("locating");
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setStatus("active");
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unsupported"),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const points: [number, number][] = devices
    .filter((d) => d.last_lat != null && d.last_lon != null)
    .map((d) => [d.last_lat as number, d.last_lon as number]);
  if (userPos) points.push(userPos);

  const statusLabel: Record<GeoStatus, string> = {
    idle: "📍 Iniciando...",
    locating: "📍 Ubicando...",
    active: "📍 Ubicación activa",
    denied: "⚠️ Ubicación denegada",
    unsupported: "⚠️ GPS no disponible",
  };
  const statusBg: Record<GeoStatus, string> = {
    idle: "rgba(0,0,0,0.6)",
    locating: "rgba(37, 99, 235, 0.85)",
    active: "rgba(16, 185, 129, 0.9)",
    denied: "rgba(220, 38, 38, 0.9)",
    unsupported: "rgba(120, 120, 120, 0.9)",
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
          const online = isOnline(d);
          const placa = d.vehiculo?.placa ?? d.nombre_dispositivo;
          return (
            <Marker key={d.id} position={[d.last_lat, d.last_lon]} icon={makeIcon(online)}>
              <Popup>
                <div style={{ fontSize: 12, minWidth: 160 }}>
                  <strong>{placa}</strong>
                  {d.vehiculo?.conductor && <div>Conductor: {d.vehiculo.conductor}</div>}
                  <div>Velocidad: {d.last_speed_kmh != null ? `${Math.round(d.last_speed_kmh)} km/h` : "—"}</div>
                  <div>Estado: {online ? "En línea" : "Sin reportar"}</div>
                  {d.last_fix_at && (
                    <div style={{ color: "#666" }}>Último: {new Date(d.last_fix_at).toLocaleString("es-CO")}</div>
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
                <strong>Tu ubicación</strong>
                <br />
                {userPos[0].toFixed(5)}, {userPos[1].toFixed(5)}
              </div>
            </Popup>
          </Marker>
        )}
        <FitOnLoad points={points} />
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
