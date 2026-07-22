import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, Img, staticFile, interpolate } from "remotion";
import { PhoneFrame } from "../../components/PhoneFrame";
import { TypeText } from "../../components/TypeText";
import { FONT_BODY, FONT_DISPLAY } from "../../components/fonts";
import { COLORS } from "../../theme";
import { Callout } from "../../components/Callout";

const Suggestion: React.FC<{ title: string; addr: string; show: number }> = ({ title, addr, show }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - show, fps, config: { damping: 18 } });
  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "center",
      padding: "12px 14px", borderRadius: 10, background: "#fff",
      opacity: s, transform: `translateY(${(1-s)*10}px)`,
      border: "1px solid #E5E7EB", marginBottom: 8,
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.cyan+"22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📍</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{title}</div>
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>{addr}</div>
      </div>
    </div>
  );
};

export const PPedir: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  const buttonPulse = frame > 320 ? spring({ frame: frame - 320, fps, config: { damping: 8 } }) : 0;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `translateY(${(1-s)*40}px)`, opacity: s, position: "relative" }}>
        <PhoneFrame>
          <div style={{ padding: "50px 22px", fontFamily: FONT_BODY, color: COLORS.text }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, marginTop: 20 }}>Hola, María 👋</div>
            <div style={{ fontSize: 14, color: COLORS.textMuted }}>¿A dónde vamos hoy?</div>

            <div style={{ marginTop: 20, background: "#fff", borderRadius: 16, padding: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>SALES DE</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #F3F4F6", paddingBottom: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 5, background: COLORS.success }} />
                <div style={{ flex: 1, fontSize: 15 }}>
                  <TypeText text="San Pío" startFrame={20} cps={12} />
                </div>
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 12, marginBottom: 4 }}>VAS A</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.cyan }} />
                <div style={{ flex: 1, fontSize: 15, color: COLORS.textMuted }}>
                  <TypeText text="Calatrava" startFrame={200} cps={12} />
                </div>
              </div>
            </div>

            {frame > 80 && frame < 190 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6, marginLeft: 4 }}>SUGERENCIAS</div>
                <Suggestion title="Hospital del Sur - San Pío" addr="Calle 33 Nº 50a-25, Itagüí" show={90} />
                <Suggestion title="Parque de San Pío" addr="Itagüí, Antioquia" show={115} />
              </div>
            )}

            {frame > 140 && (
              <div style={{ marginTop: 16, opacity: interpolate(frame, [140, 160], [0, 1], { extrapolateRight: "clamp" }) }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8, marginLeft: 4 }}>❤ MIS DESTINOS FAVORITOS</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["Casa", "Calatrava", "Santamaría"].map((t, i) => (
                    <div key={t} style={{
                      padding: "8px 14px", borderRadius: 20,
                      background: t==="Calatrava" && frame > 180 ? COLORS.cyan : "#fff",
                      color: t==="Calatrava" && frame > 180 ? "#fff" : COLORS.text,
                      border: `1px solid ${COLORS.cyan}55`,
                      fontSize: 13, fontWeight: 600,
                    }}>{t}</div>
                  ))}
                </div>
              </div>
            )}

            <div style={{
              marginTop: 30, background: COLORS.cyan, color: "#fff",
              padding: 16, borderRadius: 14, textAlign: "center",
              fontWeight: 700, fontSize: 17,
              transform: `scale(${1 + buttonPulse*0.05})`,
              boxShadow: `0 ${10 + buttonPulse*10}px 30px ${COLORS.cyan}55`,
            }}>🚗 Solicitar servicio</div>
          </div>
        </PhoneFrame>
      </div>
      <Callout text="Autocompletado con Google Places — dirección real de la sede" x={1120} y={280} start={95} end={230} color={COLORS.cyan} />
      <Callout text="Chips favoritos para no volver a escribir" x={1120} y={520} start={170} end={310} color={COLORS.lime} />
    </AbsoluteFill>
  );
};
