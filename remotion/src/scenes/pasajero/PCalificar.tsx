import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { PhoneFrame } from "../../components/PhoneFrame";
import { FONT_BODY, FONT_DISPLAY } from "../../components/fonts";
import { COLORS } from "../../theme";
import { TypeText } from "../../components/TypeText";
import { Callout } from "../../components/Callout";

export const PCalificar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `translateY(${(1-s)*40}px)`, opacity: s, position: "relative" }}>
        <PhoneFrame>
          <div style={{ padding: "50px 26px", fontFamily: FONT_BODY, color: COLORS.text, textAlign: "center" }}>
            <div style={{ fontSize: 60, marginTop: 40 }}>✅</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700, marginTop: 16 }}>¡Llegaste!</div>
            <div style={{ fontSize: 14, color: COLORS.textMuted, marginTop: 6 }}>San Pío → Calatrava · 22 min</div>

            <div style={{ marginTop: 40, background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>¿Cómo estuvo Milton?</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
                {[1,2,3,4,5].map(i => {
                  const showAt = 20 + i*10;
                  const pop = spring({ frame: frame - showAt, fps, config: { damping: 10 } });
                  return (
                    <div key={i} style={{ transform: `scale(${pop})`, fontSize: 40 }}>⭐</div>
                  );
                })}
              </div>
              <div style={{ marginTop: 20, textAlign: "left", border: "1px solid #E5E7EB", borderRadius: 12, padding: 12, fontSize: 14, minHeight: 60, color: COLORS.text }}>
                <TypeText text="Muy amable, llegó puntual. Excelente servicio." startFrame={110} cps={22} />
              </div>
              <div style={{ marginTop: 16, background: COLORS.cyan, color: "#fff", padding: 14, borderRadius: 12, fontWeight: 700, fontSize: 16 }}>Enviar calificación</div>
            </div>
          </div>
        </PhoneFrame>
      </div>
      <Callout text="Al terminar el viaje se abre solo — 1 a 5 estrellas" x={1120} y={350} start={30} color={COLORS.cyan} />
    </AbsoluteFill>
  );
};
