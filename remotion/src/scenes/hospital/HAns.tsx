import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { DesktopFrame } from "../../components/DesktopFrame";
import { AdminShell } from "../../components/AdminShell";
import { FONT_BODY, FONT_DISPLAY } from "../../components/fonts";
import { COLORS } from "../../theme";
import { Callout } from "../../components/Callout";

const Metric: React.FC<{ label: string; target: number; end: number; unit?: string; color: string; delay: number }> = ({ label, target, end, unit = "%", color, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const val = interpolate(frame - delay, [0, 40], [0, target], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 20, opacity: s, transform: `translateY(${(1-s)*10}px)` }}>
      <div style={{ fontSize: 11, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>{label}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 48, fontWeight: 700, color, marginTop: 8 }}>
        {val.toFixed(unit === "%" ? 1 : 0)}<span style={{ fontSize: 22, marginLeft: 4 }}>{unit}</span>
      </div>
      <div style={{ marginTop: 8, height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(val/end)*100}%`, background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
};

const ServiceRow: React.FC<{ time: string; passenger: string; route: string; status: "ok" | "delayed"; delay: number }> = ({ time, passenger, route, status, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
  return (
    <tr style={{ borderTop: "1px solid #F3F4F6", opacity: s }}>
      <td style={{ padding: "10px 12px", fontSize: 13, color: COLORS.textMuted, fontFamily: "monospace" }}>{time}</td>
      <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>{passenger}</td>
      <td style={{ padding: "10px 12px", fontSize: 13, color: COLORS.textMuted }}>{route}</td>
      <td style={{ padding: "10px 12px" }}>
        <span style={{
          fontSize: 11, padding: "3px 10px", borderRadius: 999, fontWeight: 700,
          background: status === "ok" ? `${COLORS.success}22` : `${COLORS.warning}22`,
          color: status === "ok" ? COLORS.success : COLORS.warning,
        }}>{status === "ok" ? "A tiempo" : "Con retraso"}</span>
      </td>
    </tr>
  );
};

export const HAns: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${0.9 + s*0.1})`, opacity: s, position: "relative" }}>
        <DesktopFrame>
          <AdminShell active="ANS" hospital>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700 }}>Cumplimiento ANS</div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>Julio 2026 · 142 servicios ejecutados</div>

            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
              <Metric label="Puntualidad" target={97.2} end={100} color={COLORS.success} delay={10} />
              <Metric label="Servicios completados" target={100} end={100} color={COLORS.cyan} delay={30} />
              <Metric label="Tiempo respuesta prom." target={6} end={15} unit=" min" color={COLORS.lime} delay={50} />
              <Metric label="Calificación pasajeros" target={4.8} end={5} unit="★" color={COLORS.warning} delay={70} />
            </div>

            <div style={{ marginTop: 20, background: "#fff", borderRadius: 14, padding: 20 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700 }}>Últimos servicios</div>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    <th style={{ padding: 10, textAlign: "left", fontSize: 11, color: COLORS.textMuted, fontWeight: 700, letterSpacing: 1 }}>HORA</th>
                    <th style={{ padding: 10, textAlign: "left", fontSize: 11, color: COLORS.textMuted, fontWeight: 700, letterSpacing: 1 }}>PASAJERO</th>
                    <th style={{ padding: 10, textAlign: "left", fontSize: 11, color: COLORS.textMuted, fontWeight: 700, letterSpacing: 1 }}>RUTA</th>
                    <th style={{ padding: 10, textAlign: "left", fontSize: 11, color: COLORS.textMuted, fontWeight: 700, letterSpacing: 1 }}>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  <ServiceRow time="08:20" passenger="María Restrepo" route="San Pío → Calatrava" status="ok" delay={130} />
                  <ServiceRow time="09:05" passenger="Carlos Vélez" route="Calatrava → Santamaría" status="ok" delay={150} />
                  <ServiceRow time="10:40" passenger="Laura Ortiz" route="San Pío → Domicilio" status="delayed" delay={170} />
                  <ServiceRow time="12:15" passenger="Andrés Toro" route="Santamaría → San Pío" status="ok" delay={190} />
                </tbody>
              </table>
            </div>
          </AdminShell>
        </DesktopFrame>
      </div>
      <Callout text="Métricas ANS del mes — solo tus servicios" x={140} y={200} start={40} end={230} color={COLORS.hospital} />
    </AbsoluteFill>
  );
};
