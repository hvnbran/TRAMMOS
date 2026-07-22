import React from "react";

export const DesktopFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    width: 1500, height: 900, background: "#0b0b0b", borderRadius: 18, padding: 12,
    boxShadow: "0 40px 80px rgba(0,0,0,0.35)",
  }}>
    <div style={{ display: "flex", gap: 6, marginBottom: 8, paddingLeft: 6 }}>
      <div style={{ width: 12, height: 12, borderRadius: 6, background: "#ff5f57" }} />
      <div style={{ width: 12, height: 12, borderRadius: 6, background: "#febc2e" }} />
      <div style={{ width: 12, height: 12, borderRadius: 6, background: "#28c840" }} />
    </div>
    <div style={{
      width: "100%", height: "calc(100% - 26px)", background: "#F5F7FA",
      borderRadius: 10, overflow: "hidden", position: "relative",
    }}>
      {children}
    </div>
  </div>
);
