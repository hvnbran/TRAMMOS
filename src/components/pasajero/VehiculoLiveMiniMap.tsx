import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  /** Placa del vehículo asignado (se busca en vehiculos_gps por nombre_dispositivo o vehiculo.placa). */
  placa: string;
  height?: number;
}

interface LivePos {
  lat: number;
  lon: number;
  speed: number | null;
  fixAt: string | null;
  online: string | null;
}

const carIcon = L.divIcon({
  className: "trammos-live-car",
  html: `<div style="
    width: 22px; height: 22px;
    background: oklch(0.72 0.15 210);
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function Recenter({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.setView(pos, map.getZoom() < 14 ? 15 : map.getZoom(), { animate: true });
  }, [pos, map]);
  return null;
}

function norm(s: string) {
  return s.toUpperCase().replace(/[\s-]/g, "").trim();
}

export function VehiculoLiveMiniMap({ placa, height = 200 }: Props) {
  const [pos, setPos] = useState<LivePos | null>(null);
  const [gpsId, setGpsId] = useState<string | null>(null);

  // Resolver gps_id por placa (match por nombre_dispositivo o por vehiculo vinculado)
  useEffect(() => {
    let cancel = false;
    async function find() {
      const placaN = norm(placa);
      // 1) intento directo por nombre_dispositivo
      const { data: directos } = await supabase
        .from("vehiculos_gps")
        .select("id, nombre_dispositivo, last_lat, last_lon, last_speed_kmh, last_fix_at, online, vehiculo_id");
      if (cancel || !directos) return;
      const match = directos.find(
        (g) => norm(g.nombre_dispositivo ?? "") === placaN,
      );
      if (match) {
        setGpsId(match.id);
        if (match.last_lat != null && match.last_lon != null) {
          setPos({
            lat: match.last_lat,
            lon: match.last_lon,
            speed: match.last_speed_kmh,
            fixAt: match.last_fix_at,
            online: match.online,
          });
        }
        return;
      }
      // 2) buscar por vehiculo.placa → vehiculo_id → vehiculos_gps
      const { data: veh } = await supabase
        .from("vehiculos")
        .select("id, placa")
        .ilike("placa", placa.trim())
        .maybeSingle();
      if (cancel || !veh) return;
      const linked = directos.find((g) => g.vehiculo_id === veh.id);
      if (linked) {
        setGpsId(linked.id);
        if (linked.last_lat != null && linked.last_lon != null) {
          setPos({
            lat: linked.last_lat,
            lon: linked.last_lon,
            speed: linked.last_speed_kmh,
            fixAt: linked.last_fix_at,
            online: linked.online,
          });
        }
      }
    }
    void find();
    return () => { cancel = true; };
  }, [placa]);

  // Realtime: escuchar updates a esta fila
  useEffect(() => {
    if (!gpsId) return;
    const ch = supabase
      .channel(`gps-mini-${gpsId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "vehiculos_gps", filter: `id=eq.${gpsId}` },
        (payload) => {
          const r = payload.new as Record<string, unknown>;
          const lat = r.last_lat as number | null;
          const lon = r.last_lon as number | null;
          if (lat != null && lon != null) {
            setPos({
              lat,
              lon,
              speed: (r.last_speed_kmh as number | null) ?? null,
              fixAt: (r.last_fix_at as string | null) ?? null,
              online: (r.online as string | null) ?? null,
            });
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [gpsId]);

  if (!pos) {
    return (
      <div
        style={{ height }}
        className="rounded-2xl border-2 border-border bg-muted/40 flex items-center justify-center text-xs text-muted-foreground"
      >
        Esperando señal GPS del vehículo…
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-border" style={{ height }}>
      <MapContainer
        center={[pos.lat, pos.lon]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains={["a", "b", "c", "d"]}
          maxZoom={19}
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        <Marker position={[pos.lat, pos.lon]} icon={carIcon}>
          <Popup>
            <div style={{ fontSize: 12 }}>
              <strong>{placa}</strong>
              <br />
              {pos.speed != null ? `${Math.round(pos.speed)} km/h` : "—"}
            </div>
          </Popup>
        </Marker>
        <Recenter pos={[pos.lat, pos.lon]} />
      </MapContainer>
    </div>
  );
}

export default VehiculoLiveMiniMap;
