import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, Img, staticFile } from "remotion";
import { PhoneFrame } from "../../components/PhoneFrame";
import { TypeText } from "../../components/TypeText";
import { FONT_BODY, FONT_DISPLAY } from "../../components/fonts";
import { COLORS } from "../../theme";
import { Callout } from "../../components/Callout";

export const PLogin: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `translateY(${(1-s)*40}px)`, opacity: s, position: "relative" }}>
        <PhoneFrame>
          <div style={{ padding: "50px 26px", fontFamily: FONT_BODY, color: COLORS.text }}>
            <Img src={staticFile("assets/logo.png")} style={{ height: 70, objectFit: "contain", marginTop: 40 }} />
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 700, marginTop: 30 }}>Ingresa a TRAMMOS</div>
            <div style={{ fontSize: 15, color: COLORS.textMuted, marginTop: 6 }}>Solicita tu servicio en segundos</div>

            <div style={{ marginTop: 40 }}>
              <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 8 }}>Correo</div>
              <div style={{ border: `2px solid ${COLORS.cyan}`, borderRadius: 12, padding: "14px 16px", fontSize: 16, background: "#fff" }}>
                <TypeText text="brantest2@trammos.test" startFrame={15} cps={22} />
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 8 }}>Contraseña</div>
              <div style={{ border: `2px solid #E5E7EB`, borderRadius: 12, padding: "14px 16px", fontSize: 22, background: "#fff", letterSpacing: 4 }}>
                <TypeText text="••••••••••" startFrame={90} cps={15} caret={false} />
              </div>
            </div>
            <div style={{
              marginTop: 30, background: COLORS.cyan, color: "#fff",
              padding: 16, borderRadius: 14, textAlign: "center",
              fontWeight: 700, fontSize: 18, boxShadow: `0 10px 24px ${COLORS.cyan}55`,
            }}>Iniciar sesión</div>
          </div>
        </PhoneFrame>
      </div>
      <Callout text="Cuenta creada desde el panel — María ya tiene acceso" x={1120} y={480} start={100} color={COLORS.cyan} />
    </AbsoluteFill>
  );
};
