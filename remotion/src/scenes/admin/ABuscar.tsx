import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { DesktopFrame } from "../../components/DesktopFrame";
import { AdminShell } from "../../components/AdminShell";
import { TypeText } from "../../components/TypeText";
import { FONT_BODY, FONT_DISPLAY } from "../../components/fonts";
import { COLORS } from "../../theme";
import { Callout } from "../../components/Callout";

const Doc: React.FC<{ name: string; vence: string; ok: boolean; requiere?: boolean }> = ({ name, vence, ok, requiere }) => (
  <tr style={{ borderTop: "1px solid #F3F4F6" }}>
    <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 500 }}>{name}</td>
    <td style={{ padding: "10px 12px", fontSize: 13, color: COLORS.textMuted }}>{vence}</td>
    <td style={{ padding: "10px 12px", fontSize: 12, color: COLORS.cyan, fontWeight: 600 }}>⬇ Descargar</td>
    <td style={{ padding: "10px 12px" }}>
      <span style={{
        fontSize: 11, padding: "3px 10px", borderRadius: 999, fontWeight: 700,
        background: requiere ? `${COLORS.warning}22` : ok ? `${COLORS.success}22` : `${COLORS.danger}22`,
        color: requiere ? COLORS.warning : ok ? COLORS.success : COLORS.danger,
      }}>{requiere ? "Actualizar bajo pedido" : ok ? "Vigente" : "Vencido"}</span>
    </td>
  </tr>
);

export const ABuscar: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  const showModal = frame > 90;
  const modalS = spring({ frame: frame - 90, fps, config: { damping: 15 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${0.9 + s*0.1})`, opacity: s, position: "relative" }}>
        <DesktopFrame>
          <AdminShell active="Vehículos" searchValue={frame > 40 ? "QWN462" : undefined}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700 }}>Vehículos</div>
            <div style={{ marginTop: 10, fontSize: 13, color: COLORS.textMuted }}>18 vehículos activos · 3 empresas</div>

            {/* fake grid */}
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
              {["QWN462","ABC123","XYZ789","MNO456","PQR321","STU654","VWX987","YZA210"].map((p, i) => (
                <div key={p} style={{
                  background: "#fff", padding: 14, borderRadius: 10,
                  border: p === "QWN462" && frame > 40 ? `2px solid ${COLORS.cyan}` : "1px solid #E5E7EB",
                }}>
                  <div style={{ height: 60, background: "#F3F4F6", borderRadius: 6, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🚗</div>
                  <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "monospace" }}>{p}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{i%2===0 ? "Renault Duster" : "Chevrolet Sail"}</div>
                </div>
              ))}
            </div>

            {/* modal */}
            {showModal && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: modalS }}>
                <div style={{
                  background: "#fff", borderRadius: 16, width: 900, padding: 24,
                  transform: `scale(${0.9 + modalS*0.1})`,
                  boxShadow: "0 40px 80px rgba(0,0,0,0.3)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 700 }}>Renault Duster</div>
                      <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 6, background: "#111", color: "#fff", fontFamily: "monospace", fontSize: 16, fontWeight: 700, letterSpacing: 2, marginTop: 4 }}>QWN462</div>
                      <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 6 }}>Blanco · 2022 · Milton Ramírez · Hospital del Sur</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ padding: "8px 14px", background: COLORS.cyan, color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>✏ Editar</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 10, marginBottom: 8, color: COLORS.text }}>Documentos</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", background: "#F9FAFB", borderRadius: 10, overflow: "hidden" }}>
                    <thead>
                      <tr style={{ background: "#F3F4F6" }}>
                        <th style={{ padding: 10, textAlign: "left", fontSize: 11, color: COLORS.textMuted, fontWeight: 700, letterSpacing: 1 }}>DOCUMENTO</th>
                        <th style={{ padding: 10, textAlign: "left", fontSize: 11, color: COLORS.textMuted, fontWeight: 700, letterSpacing: 1 }}>VÁLIDO HASTA</th>
                        <th style={{ padding: 10, textAlign: "left", fontSize: 11, color: COLORS.textMuted, fontWeight: 700, letterSpacing: 1 }}>ARCHIVO</th>
                        <th style={{ padding: 10, textAlign: "left", fontSize: 11, color: COLORS.textMuted, fontWeight: 700, letterSpacing: 1 }}>ESTADO</th>
                      </tr>
                    </thead>
                    <tbody>
                      <Doc name="SOAT" vence="15 Dic 2026" ok />
                      <Doc name="Tecnomecánica" vence="03 Sep 2026" ok />
                      <Doc name="Tarjeta de propiedad" vence="—" ok />
                      <Doc name="Póliza contractual" vence="22 Feb 2026" ok={false} />
                      <Doc name="Revisión preventiva" vence="—" ok requiere />
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </AdminShell>
        </DesktopFrame>
      </div>
      <Callout text="Escribes la placa → la ficha se abre sola" x={140} y={80} start={30} end={200} color={COLORS.cyan} />
      <Callout text="Documentos en horizontal: nombre, vencimiento, descarga, estado" x={140} y={780} start={140} end={350} color={COLORS.lime} />
    </AbsoluteFill>
  );
};
