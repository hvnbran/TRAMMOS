import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

export default function MonitoreoMap() {
  return (
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
    </MapContainer>
  );
}
