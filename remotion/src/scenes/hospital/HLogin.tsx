import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, Img, staticFile } from "remotion";
import { DesktopFrame } from "../../components/DesktopFrame";
import { TypeText } from "../../components/TypeText";
import { FONT_BODY, FONT_DISPLAY } from "../../components/fonts";
import { COLORS } from "../../theme";
import { Callout } from "../../components/Callout";

export const HLogin: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${0.9 + s*0.1})`, opacity: s, position: "relative" }}>
        <DesktopFrame>
          <div style={{ width: "100%", height: "100%", display: "flex", fontFamily: FONT_BODY }}>
            <div style={{ flex: 1, background: `linear-gradient(135deg, ${COLORS.hospitalBg} 0%, #fff 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <Img src={staticFile("assets/logo-hospital.png")} style={{ height: 150, objectFit: "contain" }} />
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 700, marginTop: 20, color: COLORS.hospital }}>Hospital del Sur</div>
                <div style={{ fontSize: 16, color: COLORS.textMuted, marginTop: 4 }}>Panel de transporte · Itagüí</div>
              </div>
            </div>
            <div style={{ flex: 1, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
              <div style={{ width: "100%", maxWidth: 400 }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700 }}>Ingresa a tu panel</div>
                <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>Solo tu operación · Solo tus datos</div>

                <div style={{ marginTop: 30 }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Correo</div>
                  <div style={{ border: `2px solid ${COLORS.hospital}`, borderRadius: 10, padding: "12px 14px", fontSize: 15 }}>
                    <TypeText text="hospitalsur@trammos.test" startFrame={15} cps={22} />
                  </div>
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Contraseña</div>
                  <div style={{ border: `2px solid #E5E7EB`, borderRadius: 10, padding: "12px 14px", fontSize: 22, letterSpacing: 4 }}>
                    <TypeText text="••••••••••" startFrame={100} cps={15} caret={false} />
                  </div>
                </div>
                <div style={{
                  marginTop: 24, background: COLORS.hospital, color: "#fff", padding: 14,
                  borderRadius: 10, textAlign: "center", fontWeight: 700, fontSize: 15,
                }}>Ingresar</div>
              </div>
            </div>
          </div>
        </DesktopFrame>
      </div>
      <Callout text="Panel exclusivo — filtrado por empresa" x={140} y={720} start={30} color={COLORS.hospital} />
    </AbsoluteFill>
  );
};
