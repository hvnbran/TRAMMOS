import React from "react";
import { Img, staticFile } from "remotion";
import { FONT_BODY, FONT_DISPLAY } from "./fonts";
import { COLORS } from "../theme";

export const AdminShell: React.FC<{ children: React.ReactNode; active: string; hospital?: boolean; searchValue?: string }> = ({ children, active, hospital, searchValue }) => {
  const items = hospital
    ? ["Dashboard", "Vehículos", "Conductores", "Pasajeros", "Monitoreo", "ANS", "Servicios", "Cuentas"]
    : ["Dashboard", "Vehículos", "Conductores", "Operación", "Monitoreo", "Servicios fijos", "Cuentas", "CRM", "Reportes"];
  const sidebarBg = hospital ? "#7F1D1D" : COLORS.sidebar;
  const accent = hospital ? "#FCA5A5" : COLORS.cyan;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", fontFamily: FONT_BODY, background: COLORS.bg }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: sidebarBg, color: COLORS.sidebarText, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <Img src={staticFile(hospital ? "assets/logo-hospital.png" : "assets/logo.png")} style={{ height: 30, objectFit: "contain", background: "#fff", padding: 4, borderRadius: 6 }} />
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, color: "#fff" }}>{hospital ? "H. del Sur" : "TRAMMOS"}</div>
        </div>
        {items.map(it => (
          <div key={it} style={{
            padding: "9px 12px", borderRadius: 8,
            background: it === active ? accent : "transparent",
            color: it === active ? "#fff" : COLORS.sidebarText,
            fontWeight: it === active ? 700 : 500,
            fontSize: 13,
          }}>{it}</div>
        ))}
      </div>
      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <div style={{ height: 60, background: "#fff", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", padding: "0 24px", gap: 20 }}>
          <div style={{
            flex: 1, maxWidth: 460, height: 38, borderRadius: 10, background: COLORS.bg,
            border: `1px solid ${searchValue ? accent : "#E5E7EB"}`,
            display: "flex", alignItems: "center", padding: "0 14px", gap: 10, fontSize: 14,
          }}>
            🔍 <span style={{ color: searchValue ? COLORS.text : COLORS.textMuted, fontWeight: searchValue ? 600 : 400 }}>{searchValue || "Buscar por placa, conductor, servicio…"}</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 14, alignItems: "center", fontSize: 13, color: COLORS.textMuted }}>
            <span>🔔</span>
            <span>🌙</span>
            <div style={{ width: 34, height: 34, borderRadius: 17, background: `linear-gradient(135deg,${COLORS.cyan},${COLORS.lime})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>A</div>
          </div>
        </div>
        {/* Body */}
        <div style={{ flex: 1, padding: 24, overflow: "hidden", position: "relative" }}>
          {children}
        </div>
      </div>
    </div>
  );
};
