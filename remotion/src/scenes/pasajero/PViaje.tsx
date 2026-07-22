import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, Img, staticFile, interpolate } from "remotion";
import { PhoneFrame } from "../../components/PhoneFrame";
import { FONT_BODY, FONT_DISPLAY } from "../../components/fonts";
import { COLORS } from "../../theme";
import { Callout } from "../../components/Callout";

const MiniMap: React.FC = () => {
  const frame = useCurrentFrame();
  const carX = interpolate(frame, [0, 300], [50, 260]);
  const carY = interpolate(frame, [0, 300], [200, 60]);
  return (
    <div style={{ position: "relative", width: "100%", height: 220, borderRadius: 14, overflow: "hidden", background: "linear-gradient(135deg,#DBEAFE 0%, #E0F2FE 100%)" }}>
      {/* streets */}
      <div style={{ position: "absolute", top: 80, left: 0, right: 0, height: 6, background: "#fff" }} />
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, height: 4, background: "#fff", opacity: 0.7 }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 120, width: 6, background: "#fff" }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 240, width: 4, background: "#fff", opacity: 0.7 }} />
      {/* route */}
      <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 380 220">
        <path d="M 50 200 Q 150 160 200 120 T 300 40" stroke={COLORS.cyan} strokeWidth="4" fill="none" strokeDasharray="8 6" />
      </svg>
      {/* origin */}
      <div style={{ position: "absolute", left: 44, top: 190, width: 20, height: 20, borderRadius: 10, background: COLORS.success, border: "3px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }} />
      {/* destination */}
      <div style={{ position: "absolute", left: 296, top: 30, fontSize: 22 }}>📍</div>
      {/* car */}
      <div style={{ position: "absolute", left: carX, top: carY, fontSize: 28, transform: "translate(-50%,-50%)" }}>🚗</div>
    </div>
  );
};

export const PViaje: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `translateY(${(1-s)*40}px)`, opacity: s, position: "relative" }}>
        <PhoneFrame>
          <div style={{ padding: "50px 20px", fontFamily: FONT_BODY, color: COLORS.text }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, marginTop: 20 }}>Conductor asignado</div>
            <div style={{ fontSize: 13, color: COLORS.success, fontWeight: 600, marginTop: 2 }}>● En camino</div>

            <div style={{
              marginTop: 16, background: "#fff", borderRadius: 16, padding: 14,
              display: "flex", gap: 12, alignItems: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
            }}>
              <div style={{
                width: 62, height: 62, borderRadius: 31,
                background: `linear-gradient(135deg, ${COLORS.cyan}, ${COLORS.lime})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 22,
              }}>M</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Milton Ramírez</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>Renault Duster · Blanco</div>
                <div style={{ display: "inline-block", marginTop: 4, padding: "2px 10px", borderRadius: 6, background: "#111", color: "#fff", fontFamily: "monospace", fontSize: 14, letterSpacing: 2, fontWeight: 700 }}>QWN462</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ width: 38, height: 38, borderRadius: 19, background: COLORS.success, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16 }}>📞</div>
                <div style={{ width: 38, height: 38, borderRadius: 19, background: COLORS.cyan, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16 }}>💬</div>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <MiniMap />
            </div>

            <div style={{ marginTop: 14, background: "#fff", borderRadius: 12, padding: 12, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <div><span style={{ color: COLORS.textMuted }}>Llega en</span> <b>4 min</b></div>
              <div><span style={{ color: COLORS.textMuted }}>Distancia</span> <b>1.8 km</b></div>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              <div style={{ flex: 1, padding: 12, borderRadius: 12, background: "#fff", border: `1px solid ${COLORS.warning}55`, textAlign: "center", fontSize: 13, color: COLORS.warning, fontWeight: 600 }}>⚠ Reportar incidente</div>
            </div>
          </div>
        </PhoneFrame>
      </div>
      <Callout text="Foto, nombre y placa reales del conductor" x={1120} y={220} start={20} end={190} color={COLORS.cyan} />
      <Callout text="Mini mapa en vivo con la ruta y el vehículo" x={1120} y={520} start={200} end={370} color={COLORS.lime} />
    </AbsoluteFill>
  );
};
