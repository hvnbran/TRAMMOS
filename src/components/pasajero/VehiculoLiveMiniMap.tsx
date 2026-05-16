import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  /** Nombre del conductor asignado (se usa para resolver su ubicación vía función segura). */
  conductorNombre: string;
  height?: number;
}

interface LivePos {
  lat: number;
  lng: number;
  speed_kmh: number | null;
  heading: number | null;
  online: boolean;
  updated_at: string;
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

export function VehiculoLiveMiniMap({ conductorNombre, height = 200 }: Props) {
  const [pos, setPos] = useState<LivePos | null>(null);

  // Polling de la ubicación vía RPC segura (RLS no permite SELECT directo al pasajero,
  // así que usamos la función SECURITY DEFINER que valida que tiene un servicio activo).
  useEffect(() => {
    let cancel = false;
    async function fetchPos() {
      const { data, error } = await supabase.rpc("get_ubicacion_conductor_para_pasajero", {
        _nombre_conductor: conductorNombre,
      });
      if (cancel || error || !data || data.length === 0) return;
      const row = data[0] as {
        lat: number;
        lng: number;
        speed_kmh: number | null;
        heading: number | null;
        online: boolean;
        updated_at: string;
      };
      setPos(row);
    }
    void fetchPos();
    const i = setInterval(fetchPos, 5_000);
    return () => { cancel = true; clearInterval(i); };
  }, [conductorNombre]);

  if (!pos) {
    return (
      <div
        style={{ height }}
        className="rounded-2xl border-2 border-border bg-muted/40 flex items-center justify-center text-xs text-muted-foreground"
      >
        Esperando ubicación del conductor…
      </div>
    );
  }

  const stale = Date.now() - new Date(pos.updated_at).getTime() > 60_000;

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-border relative" style={{ height }}>
      <MapContainer
        center={[pos.lat, pos.lng]}
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
        <Marker position={[pos.lat, pos.lng]} icon={carIcon}>
          <Popup>
            <div style={{ fontSize: 12 }}>
              <strong>{conductorNombre}</strong>
              <br />
              {pos.speed_kmh != null ? `${Math.round(pos.speed_kmh)} km/h` : "—"}
            </div>
          </Popup>
        </Marker>
        <Recenter pos={[pos.lat, pos.lng]} />
      </MapContainer>
      {(stale || !pos.online) && (
        <div className="absolute top-2 left-2 z-[1000] text-[11px] px-2 py-1 rounded bg-amber-500/90 text-white font-medium shadow">
          Conductor sin señal · {new Date(pos.updated_at).toLocaleTimeString("es-CO")}
        </div>
      )}
    </div>
  );
}

export default VehiculoLiveMiniMap;
