import React from "react";

export const PhoneFrame: React.FC<{ children: React.ReactNode; scale?: number }> = ({ children, scale = 1 }) => (
  <div
    style={{
      width: 420 * scale,
      height: 860 * scale,
      background: "#0b0b0b",
      borderRadius: 60 * scale,
      padding: 14 * scale,
      boxShadow: "0 40px 80px rgba(0,0,0,0.25), 0 0 0 2px #222",
    }}
  >
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 46 * scale,
        overflow: "hidden",
        background: "#F5F7FA",
        position: "relative",
      }}
    >
      <div style={{
        position: "absolute", top: 8*scale, left: "50%", transform: "translateX(-50%)",
        width: 130*scale, height: 26*scale, background: "#0b0b0b", borderRadius: 20*scale, zIndex: 20,
      }} />
      {children}
    </div>
  </div>
);
