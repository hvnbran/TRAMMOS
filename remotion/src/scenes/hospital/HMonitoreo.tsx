import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { DesktopFrame } from "../../components/DesktopFrame";
import { AdminShell } from "../../components/AdminShell";
import { FONT_BODY, FONT_DISPLAY } from "../../components/fonts";
import { COLORS } from "../../theme";
import { Callout } from "../../components/Callout";

export const HMonitoreo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  const carX = interpolate(frame, [0, 340], [80, 780]);
  const carY = interpolate(frame, [0, 340], [380, 110]);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${0.9 + s*0.1})`, opacity: s, position: "relative" }}>
        <DesktopFrame>
          <AdminShell active="Monitoreo" hospital>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700 }}>Monitoreo en vivo</div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>Solo servicios del Hospital del Sur</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginTop: 20, height: 620 }}>
              {/* Map */}
              <div style={{ background: "linear-gradient(135deg,#DBEAFE 0%,#FEE2E2 100%)", borderRadius: 14, position: "relative", overflow: "hidden" }}>
                {/* streets */}
                <div style={{ position: "absolute", top: 120, left: 0, right: 0, height: 6, background: "#fff", opacity: 0.7 }} />
                <div style={{ position: "absolute", top: 260, left: 0, right: 0, height: 5, background: "#fff", opacity: 0.5 }} />
                <div style={{ position: "absolute", top: 420, left: 0, right: 0, height: 6, background: "#fff", opacity: 0.6 }} />
                <div style={{ position: "absolute", top: 0, bottom: 0, left: 240, width: 6, background: "#fff", opacity: 0.7 }} />
                <div style={{ position: "absolute", top: 0, bottom: 0, left: 520, width: 5, background: "#fff", opacity: 0.5 }} />
                <div style={{ position: "absolute", top: 0, bottom: 0, left: 760, width: 6, background: "#fff", opacity: 0.6 }} />

                <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 900 620">
                  <path d="M 80 400 Q 300 320 500 240 T 800 100" stroke={COLORS.hospital} strokeWidth="5" fill="none" strokeDasharray="10 8" />
                </svg>

                {/* origin marker San Pío */}
                <div style={{ position: "absolute", left: 60, top: 380, background: "#fff", padding: "6px 10px", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", fontSize: 12, fontWeight: 700, color: COLORS.hospital }}>
                  🏥 San Pío
                </div>
                {/* dest marker Calatrava */}
                <div style={{ position: "absolute", left: 780, top: 80, background: "#fff", padding: "6px 10px", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", fontSize: 12, fontWeight: 700, color: COLORS.hospital }}>
                  📍 Calatrava
                </div>

                {/* Car */}
                <div style={{ position: "absolute", left: carX, top: carY, transform: "translate(-50%,-50%)" }}>
                  <div style={{ background: "#111", color: "#fff", fontFamily: "monospace", fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 4, letterSpacing: 1, marginBottom: 4, textAlign: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}>QWN462</div>
                  <div style={{ fontSize: 40, textAlign: "center" }}>🚗</div>
                </div>

                {/* Legend */}
                <div style={{ position: "absolute", top: 14, left: 14, background: "rgba(255,255,255,0.95)", padding: 12, borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, letterSpacing: 1, fontWeight: 700 }}>EN CURSO · 1</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>María Restrepo</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Milton · QWN462</div>
                </div>
              </div>

              {/* Panel */}
              <div style={{ background: "#fff", borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>Servicio actual</div>

                <div style={{ marginTop: 12, padding: 12, background: COLORS.hospitalBg, borderRadius: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>María Restrepo</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>San Pío → Calatrava</div>
                </div>

                <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", fontSize: 12, padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <span style={{ color: COLORS.textMuted }}>Conductor</span>
                  <span style={{ fontWeight: 700 }}>Milton R.</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <span style={{ color: COLORS.textMuted }}>Placa</span>
                  <span style={{ fontWeight: 700, fontFamily: "monospace" }}>QWN462</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <span style={{ color: COLORS.textMuted }}>ETA</span>
                  <span style={{ fontWeight: 700, color: COLORS.success }}>{Math.max(1, 18 - Math.floor(frame/20))} min</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "8px 0" }}>
                  <span style={{ color: COLORS.textMuted }}>Sede origen</span>
                  <span style={{ fontWeight: 700 }}>San Pío</span>
                </div>

                <div style={{ marginTop: 20, padding: 12, background: COLORS.success+"10", borderRadius: 8, fontSize: 11, color: COLORS.success, textAlign: "center", fontWeight: 700 }}>
                  ● Ubicación GPS activa
                </div>
              </div>
            </div>
          </AdminShell>
        </DesktopFrame>
      </div>
      <Callout text="Traslado real: María, San Pío → Calatrava" x={140} y={200} start={30} end={220} color={COLORS.hospital} />
    </AbsoluteFill>
  );
};
