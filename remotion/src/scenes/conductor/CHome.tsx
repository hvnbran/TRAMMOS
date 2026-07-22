import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { PhoneFrame } from "../../components/PhoneFrame";
import { FONT_BODY, FONT_DISPLAY } from "../../components/fonts";
import { COLORS } from "../../theme";
import { Callout } from "../../components/Callout";

export const CHome: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `translateY(${(1-s)*40}px)`, opacity: s, position: "relative" }}>
        <PhoneFrame>
          <div style={{ padding: "50px 20px", fontFamily: FONT_BODY, color: COLORS.text }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
              <div style={{ width: 52, height: 52, borderRadius: 26, background: `linear-gradient(135deg,${COLORS.cyan},${COLORS.lime})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 20 }}>M</div>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700 }}>Hola, Milton</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>Martes 22 Jul · QWN462</div>
              </div>
            </div>

            <div style={{ marginTop: 20, background: "#fff", borderRadius: 14, padding: 12, display: "flex", gap: 10, justifyContent: "space-around" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20 }}>📍</div>
                <div style={{ fontSize: 10, color: COLORS.success, fontWeight: 700 }}>UBICACIÓN</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted }}>Activa</div>
              </div>
              <div style={{ width: 1, background: "#E5E7EB" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20 }}>🔔</div>
                <div style={{ fontSize: 10, color: COLORS.success, fontWeight: 700 }}>PUSH</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted }}>Activas</div>
              </div>
            </div>

            <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: COLORS.text, textTransform: "uppercase", letterSpacing: 1 }}>
              🔁 Servicio fijo de hoy (1)
            </div>

            <div style={{
              marginTop: 10, background: "#fff", borderRadius: 16, padding: 14,
              border: `2px solid ${COLORS.warning}44`,
              boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ padding: "3px 10px", borderRadius: 999, background: `${COLORS.warning}22`, color: COLORS.warning, fontSize: 11, fontWeight: 700 }}>Pendiente</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>🕐 06:00 → 18:00 (a decisión)</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Hospital del Sur Itagüí</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>Contrato fijo · L–V · Salud</div>

              {frame > 240 && (
                <div style={{
                  marginTop: 14,
                  background: COLORS.success, color: "#fff",
                  padding: 12, borderRadius: 12, textAlign: "center",
                  fontWeight: 700, fontSize: 15,
                  transform: `scale(${1 + spring({ frame: frame - 240, fps, config: { damping: 8 }})*0.03})`,
                }}>▶ Iniciar jornada</div>
              )}
            </div>

            <div style={{ marginTop: 18, fontSize: 12, color: COLORS.textMuted, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>Servicios puntuales</div>
            <div style={{ marginTop: 6, background: "#fff", borderRadius: 12, padding: 10, fontSize: 13 }}>
              10:30 · Corona → Centro
            </div>
          </div>
        </PhoneFrame>
      </div>
      <Callout text="Servicio fijo L–V del Hospital del Sur — aparece solo" x={1120} y={340} start={40} end={220} color={COLORS.lime} />
      <Callout text="Horario a decisión del conductor: tú marcas inicio y fin" x={1120} y={520} start={230} end={370} color={COLORS.cyan} />
    </AbsoluteFill>
  );
};
