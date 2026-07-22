import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { DesktopFrame } from "../../components/DesktopFrame";
import { AdminShell } from "../../components/AdminShell";
import { TypeText } from "../../components/TypeText";
import { FONT_BODY, FONT_DISPLAY } from "../../components/fonts";
import { COLORS } from "../../theme";
import { Callout } from "../../components/Callout";

export const HPasajero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${0.9 + s*0.1})`, opacity: s, position: "relative" }}>
        <DesktopFrame>
          <AdminShell active="Cuentas" hospital>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700 }}>Registrar pasajero</div>
                <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>Solo puedes crear cuentas tipo <b>Pasajero</b></div>
              </div>
              <div style={{ padding: "8px 16px", background: COLORS.hospital, color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>+ Nuevo pasajero</div>
            </div>

            <div style={{ marginTop: 20, background: "#fff", borderRadius: 14, padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Nombre completo</div>
                <div style={{ padding: 12, background: "#F9FAFB", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 14 }}>
                  <TypeText text="María Restrepo Álvarez" startFrame={20} cps={20} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Cédula</div>
                <div style={{ padding: 12, background: "#F9FAFB", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 14 }}>
                  <TypeText text="43.892.104" startFrame={70} cps={12} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Correo</div>
                <div style={{ padding: 12, background: "#F9FAFB", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 14 }}>
                  <TypeText text="maria.restrepo@hsur.co" startFrame={110} cps={22} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Teléfono</div>
                <div style={{ padding: 12, background: "#F9FAFB", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 14 }}>
                  <TypeText text="+57 314 552 0917" startFrame={160} cps={16} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Sede principal</div>
                <div style={{ padding: 12, background: `${COLORS.hospital}11`, borderRadius: 8, border: `1px solid ${COLORS.hospital}44`, fontSize: 14, color: COLORS.hospital, fontWeight: 700 }}>
                  🏥 San Pío — Calle 33 Nº 50a-25
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Contraseña temporal</div>
                <div style={{ padding: 12, background: "#F9FAFB", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 14, fontFamily: "monospace" }}>
                  <TypeText text="Hsur2026!" startFrame={210} cps={14} />
                </div>
              </div>
            </div>

            {frame > 280 && (
              <div style={{
                marginTop: 20, background: COLORS.success + "18", padding: 14, borderRadius: 10,
                display: "flex", alignItems: "center", gap: 10,
                opacity: spring({ frame: frame - 280, fps, config: { damping: 14 }}),
              }}>
                <div style={{ fontSize: 20 }}>✅</div>
                <div style={{ fontSize: 13, color: COLORS.success, fontWeight: 700 }}>Pasajera creada · Ya puede pedir servicios desde la app</div>
              </div>
            )}
          </AdminShell>
        </DesktopFrame>
      </div>
      <Callout text="El panel solo permite crear pasajeros — nunca conductores" x={140} y={100} start={30} end={220} color={COLORS.hospital} />
      <Callout text="3 sedes preconfiguradas: San Pío · Santamaría · Calatrava" x={140} y={600} start={200} end={370} color={COLORS.hospital} />
    </AbsoluteFill>
  );
};
