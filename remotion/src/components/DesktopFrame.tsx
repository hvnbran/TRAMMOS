import React from "react";

export const DesktopFrame: React.FC<{ children: React.ReactNode; glow?: string }> = ({
  children,
  glow = "rgba(0, 180, 216, 0.30)",
}) => (
  <div
    style={{
      width: 1520,
      height: 910,
      background: "linear-gradient(180deg, #1a1a1e 0%, #08080a 100%)",
      borderRadius: 20,
      padding: 10,
      boxShadow: `0 70px 160px ${glow}, 0 0 0 1.5px rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.04)`,
      position: "relative",
    }}
  >
    {/* Specular */}
    <div style={{
      position: "absolute", inset: 0, borderRadius: 20, pointerEvents: "none",
      background: "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 15%)",
    }} />
    <div style={{ display: "flex", gap: 6, marginBottom: 8, paddingLeft: 6 }}>
      <div style={{ width: 11, height: 11, borderRadius: 6, background: "#3a3a3d" }} />
      <div style={{ width: 11, height: 11, borderRadius: 6, background: "#3a3a3d" }} />
      <div style={{ width: 11, height: 11, borderRadius: 6, background: "#3a3a3d" }} />
    </div>
    <div style={{
      width: "100%", height: "calc(100% - 26px)", background: "#F5F7FA",
      borderRadius: 12, overflow: "hidden", position: "relative",
    }}>
      {children}
    </div>
  </div>
);
