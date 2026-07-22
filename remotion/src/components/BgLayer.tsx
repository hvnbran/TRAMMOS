import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COLORS } from "../theme";

export const BgLayer: React.FC<{ hospital?: boolean }> = ({ hospital }) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 3000], [0, 100]);
  const c1 = hospital ? "#FEE2E2" : "#E0F2FE";
  const c2 = hospital ? "#FFF7ED" : "#ECFCCB";
  return (
    <AbsoluteFill style={{
      background: `linear-gradient(135deg, ${c1} 0%, #F8FAFC 50%, ${c2} 100%)`,
    }}>
      <div style={{
        position: "absolute", left: -200 + drift, top: -100,
        width: 800, height: 800, borderRadius: "50%",
        background: hospital ? "rgba(220,38,38,0.05)" : "rgba(0,180,216,0.08)",
        filter: "blur(60px)",
      }} />
      <div style={{
        position: "absolute", right: -300 + drift * 0.5, bottom: -200,
        width: 900, height: 900, borderRadius: "50%",
        background: hospital ? "rgba(251,146,60,0.06)" : "rgba(183,212,51,0.09)",
        filter: "blur(80px)",
      }} />
    </AbsoluteFill>
  );
};
