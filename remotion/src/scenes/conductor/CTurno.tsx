import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { PhoneFrame } from "../../components/PhoneFrame";
import { FONT_BODY, FONT_DISPLAY } from "../../components/fonts";
import { COLORS } from "../../theme";
import { Callout } from "../../components/Callout";

export const CTurno: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  const pulse = Math.sin(frame / 8) * 0.5 + 0.5;
  const hours = 3 + Math.floor(frame / 60);
  const minutes = String(Math.floor((frame % 60) * 60/60)).padStart(2, "0");
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `translateY(${(1-s)*40}px)`, opacity: s, position: "relative" }}>
        <PhoneFrame>
          <div style={{ padding: "50px 20px", fontFamily: FONT_BODY, color: COLORS.text }}>
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", background: COLORS.success, color: "#fff", borderRadius: 999, fontSize: 13, fontWeight: 700 }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: "#fff", opacity: 0.5 + pulse*0.5 }} />
                EN CURSO
              </div>
            </div>

            <div style={{
              marginTop: 30, background: "#fff", borderRadius: 20, padding: 24, textAlign: "center",
              border: `2px solid ${COLORS.success}44`,
            }}>
              <div style={{ fontSize: 12, color: COLORS.textMuted, letterSpacing: 2, textTransform: "uppercase" }}>Tiempo en jornada</div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 64, fontWeight: 700, color: COLORS.success, marginTop: 6, letterSpacing: 2 }}>
                {String(hours).padStart(2,"0")}:{minutes}
              </div>
              <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>Hospital del Sur Itagüí</div>
              <div style={{ marginTop: 14, display: "flex", justifyContent: "space-around", fontSize: 12 }}>
                <div>
                  <div style={{ color: COLORS.textMuted }}>Inicio real</div>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>05:58 a.m.</div>
                </div>
                <div>
                  <div style={{ color: COLORS.textMuted }}>Pasajeros hoy</div>
                  <div style={{ fontWeight: 700, marginTop: 2 }}>{Math.min(9, Math.floor(frame/40))}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, background: "#fff", borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Compartiendo en vivo</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 20, background: `${COLORS.cyan}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>📍</div>
                <div style={{ flex: 1, fontSize: 13 }}>
                  Ubicación GPS<br />
                  <span style={{ color: COLORS.textMuted, fontSize: 11 }}>Actualizada cada 10s</span>
                </div>
                <div style={{ width: 44, height: 26, borderRadius: 13, background: COLORS.success, position: "relative" }}>
                  <div style={{ position: "absolute", right: 3, top: 3, width: 20, height: 20, borderRadius: 10, background: "#fff" }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, background: COLORS.warning, color: "#fff", padding: 16, borderRadius: 14, textAlign: "center", fontWeight: 700, fontSize: 16, opacity: interpolate(frame, [200, 220], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }) }}>
              ✓ Finalizar jornada
            </div>
          </div>
        </PhoneFrame>
      </div>
      <Callout text="Cronómetro real: cuenta desde que tocaste 'Iniciar'" x={1120} y={280} start={20} end={200} color={COLORS.success} />
      <Callout text="Ubicación en vivo — el pasajero ve el vehículo llegar" x={1120} y={520} start={100} end={280} color={COLORS.cyan} />
    </AbsoluteFill>
  );
};
