import React from "react";

// A more refined phone frame: thinner bezel, subtle inner ring, wide soft cyan glow.
export const PhoneFrame: React.FC<{ children: React.ReactNode; scale?: number; glow?: string }> = ({
  children,
  scale = 1,
  glow = "rgba(0, 180, 216, 0.35)",
}) => (
  <div
    style={{
      width: 420 * scale,
      height: 860 * scale,
      background: "linear-gradient(180deg, #1a1a1e 0%, #08080a 100%)",
      borderRadius: 62 * scale,
      padding: 10 * scale,
      boxShadow: `0 60px 140px ${glow}, 0 0 0 1.5px rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.04)`,
      position: "relative",
    }}
  >
    {/* Specular top highlight */}
    <div style={{
      position: "absolute", inset: 0, borderRadius: 62 * scale, pointerEvents: "none",
      background: "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 20%)",
    }} />
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 52 * scale,
        overflow: "hidden",
        background: "#F5F7FA",
        position: "relative",
      }}
    >
      <div style={{
        position: "absolute", top: 10 * scale, left: "50%", transform: "translateX(-50%)",
        width: 120 * scale, height: 26 * scale, background: "#050507", borderRadius: 20 * scale, zIndex: 20,
      }} />
      {children}
    </div>
  </div>
);
