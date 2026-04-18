import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Medellín center
const MEDELLIN: [number, number] = [6.2442, -75.5812];

// Custom TRAMMOS-branded marker (cyan circle with white border)
const trammosIcon = L.divIcon({
  className: "trammos-marker",
  html: `<div style="
    width: 18px;
    height: 18px;
    background: oklch(0.72 0.15 210);
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// User location marker (blue pulsing dot, Google/Uber style)
const userIcon = L.divIcon({
  className: "user-location-marker",
  html: `
    <div style="position: relative; width: 22px; height: 22px;">
      <div style="
        position: absolute;
        inset: 0;
        background: rgba(37, 99, 235, 0.25);
        border-radius: 50%;
        animation: trammos-pulse 2s ease-out infinite;
      "></div>
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 14px;
        height: 14px;
        background: #2563eb;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      "></div>
    </div>
    <style>
      @keyframes trammos-pulse {
        0%   { transform: scale(0.6); opacity: 0.9; }
        100% { transform: scale(2.4); opacity: 0; }
      }
    </style>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

type GeoStatus = "idle" | "locating" | "active" | "denied" | "unsupported";

function RecenterOnFirstFix({
  position,
  hasRecentered,
  onRecenter,
}: {
  position: [number, number] | null;
  hasRecentered: boolean;
  onRecenter: () => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (position && !hasRecentered) {
      map.setView(position, 15, { animate: true });
      onRecenter();
    }
  }, [position, hasRecentered, map, onRecenter]);
  return null;
}

export default function MonitoreoMap() {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [hasRecentered, setHasRecentered] = useState(false);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("locating");
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setStatus("active");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
        } else {
          setStatus("unsupported");
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

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
      <MapContainer
        center={MEDELLIN}
        zoom={13}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains={["a", "b", "c", "d"]}
          maxZoom={19}
        />
        <Marker position={MEDELLIN} icon={trammosIcon}>
          <Popup>
            <div style={{ fontSize: "12px" }}>
              <strong>Vehículo de ejemplo</strong>
              <br />
              Medellín — Centro
            </div>
          </Popup>
        </Marker>
        {userPos && (
          <>
            <Marker position={userPos} icon={userIcon}>
              <Popup>
                <div style={{ fontSize: "12px" }}>
                  <strong>Tu ubicación</strong>
                  <br />
                  {userPos[0].toFixed(5)}, {userPos[1].toFixed(5)}
                </div>
              </Popup>
            </Marker>
            <RecenterOnFirstFix
              position={userPos}
              hasRecentered={hasRecentered}
              onRecenter={() => setHasRecentered(true)}
            />
          </>
        )}
      </MapContainer>
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1000,
          background: statusBg[status],
          color: "white",
          padding: "6px 10px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 500,
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          pointerEvents: "none",
        }}
      >
        {statusLabel[status]}
      </div>
    </div>
  );
}
