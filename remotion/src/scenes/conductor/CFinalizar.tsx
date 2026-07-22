import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { PhoneFrame } from "../../components/PhoneFrame";
import { FONT_BODY, FONT_DISPLAY } from "../../components/fonts";
import { COLORS } from "../../theme";
import { TypeText } from "../../components/TypeText";
import { Callout } from "../../components/Callout";

export const CFinalizar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `translateY(${(1-s)*40}px)`, opacity: s, position: "relative" }}>
        <PhoneFrame>
          <div style={{ padding: "50px 26px", fontFamily: FONT_BODY, color: COLORS.text }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, marginTop: 30, textAlign: "center" }}>Finalizar jornada</div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, textAlign: "center" }}>Hospital del Sur · L–V</div>

            <div style={{ marginTop: 30, background: "#fff", borderRadius: 16, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ color: COLORS.textMuted, fontSize: 13 }}>Inicio</span>
                <span style={{ fontWeight: 700 }}>05:58 a.m.</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ color: COLORS.textMuted, fontSize: 13 }}>Fin</span>
                <span style={{ fontWeight: 700 }}>05:47 p.m.</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ color: COLORS.textMuted, fontSize: 13 }}>Total</span>
                <span style={{ fontWeight: 700, color: COLORS.success }}>11h 49min</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                <span style={{ color: COLORS.textMuted, fontSize: 13 }}>Traslados</span>
                <span style={{ fontWeight: 700 }}>9 pasajeros</span>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>NOTAS DEL TURNO (opcional)</div>
              <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 12, fontSize: 13, minHeight: 70 }}>
                <TypeText text="Sin novedades. Tráfico normal en Guayabal." startFrame={40} cps={22} />
              </div>
            </div>

            <div style={{ marginTop: 20, background: COLORS.warning, color: "#fff", padding: 16, borderRadius: 14, textAlign: "center", fontWeight: 700, fontSize: 16 }}>
              ✓ Cerrar jornada
            </div>

            {frame > 180 && (
              <div style={{
                marginTop: 20, background: COLORS.success + "22", padding: 12, borderRadius: 12, textAlign: "center",
                fontSize: 13, color: COLORS.success, fontWeight: 700,
                opacity: spring({ frame: frame - 180, fps, config: { damping: 15 }}),
              }}>
                ✅ Jornada registrada · Admin notificado
              </div>
            )}
          </div>
        </PhoneFrame>
      </div>
      <Callout text="Datos van directo al panel de monitoreo y cumplimiento ANS" x={1120} y={480} start={40} color={COLORS.lime} />
    </AbsoluteFill>
  );
};
