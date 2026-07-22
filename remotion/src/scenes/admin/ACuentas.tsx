import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { DesktopFrame } from "../../components/DesktopFrame";
import { AdminShell } from "../../components/AdminShell";
import { TypeText } from "../../components/TypeText";
import { FONT_BODY, FONT_DISPLAY } from "../../components/fonts";
import { COLORS } from "../../theme";
import { Callout } from "../../components/Callout";

export const ACuentas: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${0.9 + s*0.1})`, opacity: s, position: "relative" }}>
        <DesktopFrame>
          <AdminShell active="Cuentas">
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700 }}>Acceso conductores</div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>Contraseña sincronizada con el perfil del conductor</div>

            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: "#fff", borderRadius: 14, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 24, background: `linear-gradient(135deg,${COLORS.cyan},${COLORS.lime})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18 }}>M</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Milton Ramírez</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>QWN462 · Hospital del Sur</div>
                  </div>
                </div>
                <div style={{ marginTop: 16, fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Contraseña actual</div>
                <div style={{ marginTop: 6, padding: "10px 12px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, fontFamily: "monospace", fontSize: 15, letterSpacing: 2 }}>
                  <TypeText text="Milton2024!" startFrame={20} cps={12} />
                </div>
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, padding: "10px 12px", background: COLORS.cyan, color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700, textAlign: "center" }}>💾 Guardar cambios</div>
                  <div style={{ padding: "10px 12px", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13 }}>🔄 Regenerar</div>
                </div>
              </div>

              <div style={{ background: COLORS.success + "10", borderRadius: 14, padding: 20, border: `1px solid ${COLORS.success}44` }}>
                <div style={{ fontSize: 12, color: COLORS.success, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Compartir por WhatsApp</div>
                <div style={{ marginTop: 12, background: "#fff", borderRadius: 12, padding: 14, fontSize: 13, lineHeight: 1.6, color: COLORS.text }}>
                  Hola Milton 👋<br />
                  Ya tienes acceso a TRAMMOS Conductor:<br /><br />
                  🔗 <b>trammos.online/conductor</b><br />
                  👤 Usuario: <b>QWN462</b><br />
                  🔒 Clave: <b>Milton2024!</b><br /><br />
                  Instala la app desde tu navegador.
                </div>
                <div style={{ marginTop: 12, background: "#25D366", color: "#fff", padding: 12, borderRadius: 10, textAlign: "center", fontWeight: 700, fontSize: 14 }}>
                  📱 Copiar mensaje para WhatsApp
                </div>
              </div>
            </div>

            {frame > 240 && (
              <div style={{
                marginTop: 20, padding: 14, background: COLORS.success + "18", borderRadius: 10,
                display: "flex", alignItems: "center", gap: 10,
                opacity: spring({ frame: frame - 240, fps, config: { damping: 14 }}),
              }}>
                <div style={{ fontSize: 20 }}>✅</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.success }}>
                  Contraseña actualizada · Milton puede iniciar sesión con la nueva clave
                </div>
              </div>
            )}
          </AdminShell>
        </DesktopFrame>
      </div>
      <Callout text="Contraseña sincronizada con el perfil del conductor" x={140} y={220} start={30} end={220} color={COLORS.cyan} />
      <Callout text="Enlace correcto: trammos.online (no 'tramos')" x={140} y={640} start={140} end={320} color={COLORS.lime} />
    </AbsoluteFill>
  );
};
