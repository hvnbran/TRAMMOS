import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { DesktopFrame } from "../../components/DesktopFrame";
import { AdminShell } from "../../components/AdminShell";
import { TypeText } from "../../components/TypeText";
import { FONT_BODY, FONT_DISPLAY } from "../../components/fonts";
import { COLORS } from "../../theme";
import { Callout } from "../../components/Callout";

const DayChip: React.FC<{ d: string; on: boolean; delay: number }> = ({ d, on, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 12 } });
  return (
    <div style={{
      width: 46, height: 46, borderRadius: 10,
      background: on ? COLORS.cyan : "#fff",
      color: on ? "#fff" : COLORS.textMuted,
      border: `1px solid ${on ? COLORS.cyan : "#E5E7EB"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: 14,
      transform: `scale(${on ? s : 1})`,
    }}>{d}</div>
  );
};

const Check: React.FC<{ on: boolean; label: string }> = ({ on, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{
      width: 20, height: 20, borderRadius: 4,
      background: on ? COLORS.cyan : "#fff",
      border: `2px solid ${on ? COLORS.cyan : "#D1D5DB"}`,
      color: "#fff", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
    }}>{on ? "✓" : ""}</div>
    <div style={{ fontSize: 13, color: COLORS.text }}>{label}</div>
  </div>
);

export const AFijo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${0.9 + s*0.1})`, opacity: s, position: "relative" }}>
        <DesktopFrame>
          <AdminShell active="Servicios fijos">
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700 }}>Servicios fijos</div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>Contratos recurrentes por conductor + días de la semana</div>

            <div style={{ marginTop: 20, background: "#fff", borderRadius: 14, padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Conductor</div>
                  <div style={{ padding: 12, background: "#F9FAFB", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 14, fontWeight: 600 }}>
                    <TypeText text="Milton Ramírez" startFrame={10} cps={18} /> <span style={{ fontFamily: "monospace", background: "#111", color: "#fff", padding: "2px 8px", borderRadius: 4, marginLeft: 6, fontSize: 12 }}>QWN462</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Empresa</div>
                  <div style={{ padding: 12, background: "#F9FAFB", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 14, fontWeight: 600 }}>
                    <TypeText text="Hospital del Sur Itagüí" startFrame={60} cps={22} />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Días de la semana</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <DayChip d="L" on delay={110} />
                  <DayChip d="M" on delay={120} />
                  <DayChip d="X" on delay={130} />
                  <DayChip d="J" on delay={140} />
                  <DayChip d="V" on delay={150} />
                  <DayChip d="S" on={false} delay={160} />
                  <DayChip d="D" on={false} delay={170} />
                </div>
              </div>

              <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Horario</div>
                  <Check on label="🕐 Horario a decisión del conductor" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Origen / Destino</div>
                  <Check on label="🏥 Es servicio del Hospital del Sur (sin origen/destino fijo)" />
                </div>
              </div>

              {frame > 260 && (
                <div style={{
                  marginTop: 24, background: COLORS.success, color: "#fff", padding: 14, borderRadius: 10,
                  textAlign: "center", fontWeight: 700, fontSize: 15,
                  transform: `scale(${spring({ frame: frame - 260, fps, config: { damping: 10 }})})`,
                }}>✓ Guardar servicio fijo</div>
              )}
            </div>
          </AdminShell>
        </DesktopFrame>
      </div>
      <Callout text="Un solo registro → aparece cada día en la app del conductor" x={140} y={220} start={30} end={200} color={COLORS.cyan} />
      <Callout text="Checkbox Hospital del Sur = no pide dirección" x={140} y={720} start={180} end={340} color={COLORS.hospital} />
    </AbsoluteFill>
  );
};
