import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, Img, staticFile } from "remotion";
import { PhoneFrame } from "../../components/PhoneFrame";
import { TypeText } from "../../components/TypeText";
import { FONT_BODY, FONT_DISPLAY } from "../../components/fonts";
import { COLORS } from "../../theme";
import { Callout } from "../../components/Callout";

export const CLogin: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `translateY(${(1-s)*40}px)`, opacity: s, position: "relative" }}>
        <PhoneFrame>
          <div style={{ padding: "50px 26px", fontFamily: FONT_BODY, color: COLORS.text }}>
            <Img src={staticFile("assets/logo.png")} style={{ height: 60, objectFit: "contain", marginTop: 40 }} />
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700, marginTop: 24 }}>Acceso Conductor</div>
            <div style={{ fontSize: 14, color: COLORS.textMuted, marginTop: 4 }}>trammos.online/conductor</div>

            <div style={{ marginTop: 40 }}>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>USUARIO O PLACA</div>
              <div style={{ border: `2px solid ${COLORS.lime}`, borderRadius: 12, padding: "14px 16px", fontSize: 18, background: "#fff", fontWeight: 700, letterSpacing: 3 }}>
                <TypeText text="QWN462" startFrame={15} cps={12} />
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>CONTRASEÑA</div>
              <div style={{ border: `2px solid #E5E7EB`, borderRadius: 12, padding: "14px 16px", fontSize: 22, background: "#fff", letterSpacing: 4 }}>
                <TypeText text="••••••••" startFrame={70} cps={15} caret={false} />
              </div>
            </div>
            <div style={{
              marginTop: 30, background: COLORS.gray, color: "#fff",
              padding: 16, borderRadius: 14, textAlign: "center",
              fontWeight: 700, fontSize: 17,
            }}>Iniciar jornada</div>

            <div style={{ marginTop: 24, fontSize: 12, color: COLORS.textMuted, textAlign: "center" }}>
              Enlace recibido por WhatsApp del despacho
            </div>
          </div>
        </PhoneFrame>
      </div>
      <Callout text="Link único enviado por el admin — sin registro manual" x={1120} y={500} start={30} color={COLORS.lime} />
    </AbsoluteFill>
  );
};
