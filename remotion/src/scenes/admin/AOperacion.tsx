import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { DesktopFrame } from "../../components/DesktopFrame";
import { AdminShell } from "../../components/AdminShell";
import { TypeText } from "../../components/TypeText";
import { FONT_BODY, FONT_DISPLAY } from "../../components/fonts";
import { COLORS } from "../../theme";
import { Callout } from "../../components/Callout";

const Row: React.FC<{ label: string; value: React.ReactNode; delay: number }> = ({ label, value, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
  return (
    <div style={{ opacity: s, transform: `translateY(${(1-s)*10}px)` }}>
      <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ padding: "10px 12px", background: "#F9FAFB", borderRadius: 8, fontSize: 14, fontWeight: 500, border: "1px solid #E5E7EB" }}>{value}</div>
    </div>
  );
};

export const AOperacion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${0.9 + s*0.1})`, opacity: s, position: "relative" }}>
        <DesktopFrame>
          <AdminShell active="Operación">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700 }}>Nuevo servicio</div>
                <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>Solicitud entrante · Hospital del Sur</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ padding: "8px 14px", background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13 }}>📄 Importar Excel</div>
                <div style={{ padding: "8px 14px", background: COLORS.cyan, color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>+ Crear</div>
              </div>
            </div>

            <div style={{ marginTop: 20, background: "#fff", borderRadius: 14, padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Row label="Cliente" value={<><TypeText text="Hospital del Sur Itagüí" startFrame={20} cps={20} /></>} delay={10} />
              <Row label="Tipo de servicio" value={<><TypeText text="Salud" startFrame={70} cps={15} /></>} delay={60} />
              <Row label="Pasajero" value={<><TypeText text="María Restrepo" startFrame={110} cps={20} /></>} delay={100} />
              <Row label="Centro de costo" value={<><TypeText text="Sede San Pío · Enfermería" startFrame={150} cps={22} /></>} delay={140} />
              <Row label="Origen" value={<><TypeText text="San Pío — Calle 33 Nº 50a-25" startFrame={190} cps={26} /></>} delay={180} />
              <Row label="Destino" value={<><TypeText text="Calatrava — Calle 63 Nº 58FF-11" startFrame={230} cps={26} /></>} delay={220} />
              <Row label="Conductor asignado" value={<span style={{ color: COLORS.text }}>Milton Ramírez <span style={{ fontFamily: "monospace", background: "#111", color: "#fff", padding: "2px 8px", borderRadius: 4, marginLeft: 6, fontSize: 12 }}>QWN462</span></span>} delay={270} />
              <Row label="Tarifa" value={<span style={{ color: COLORS.success, fontWeight: 700 }}>$ 38.000</span>} delay={300} />
            </div>

            {frame > 340 && (
              <div style={{
                marginTop: 20, padding: 16, background: COLORS.success + "18", borderRadius: 12,
                display: "flex", alignItems: "center", gap: 12, opacity: spring({ frame: frame - 340, fps, config: { damping: 15 }}),
              }}>
                <div style={{ fontSize: 22 }}>✅</div>
                <div>
                  <div style={{ fontWeight: 700, color: COLORS.success }}>Servicio creado y asignado</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>Milton recibirá una notificación en su app</div>
                </div>
              </div>
            )}
          </AdminShell>
        </DesktopFrame>
      </div>
      <Callout text="Tipos: Empresarial, Turismo, Salud, Escolar u Otro" x={140} y={280} start={80} end={220} color={COLORS.cyan} />
      <Callout text="Al elegir conductor se autocompleta la placa" x={140} y={640} start={280} end={380} color={COLORS.lime} />
    </AbsoluteFill>
  );
};
