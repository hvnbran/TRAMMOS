import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { COLORS } from "../theme";
import { DesktopFrame } from "./DesktopFrame";
import { PhoneFrame } from "./PhoneFrame";

export type Cursor = { x: number; y: number; delay?: number; click?: boolean };

// A polished scene: device frame containing a real screenshot, animated cursor,
// slow Ken-Burns zoom, and kinetic caption chip.
export const RealScene: React.FC<{
  device: "desktop" | "phone";
  src: string;              // e.g. "real/admin/02-vehiculos.png"
  caption: string;
  subtitle?: string;
  duration: number;         // frames (for kenburns endpoint)
  zoom?: number;            // final scale (default 1.06)
  panX?: number;            // final translate X px (default 0)
  panY?: number;            // final translate Y px (default -20)
  cursors?: Cursor[];       // 0..N cursor stops in device coordinates
  brand?: "trammos" | "hospital";
}> = ({ device, src, caption, subtitle, duration, zoom = 1.06, panX = 0, panY = -20, cursors, brand = "trammos" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene enter: fade + slight scale
  const enter = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 20 });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const enterScale = interpolate(enter, [0, 1], [0.98, 1]);

  // Ken-Burns on the screenshot
  const kb = interpolate(frame, [0, duration], [0, 1], { extrapolateRight: "clamp" });
  const kbScale = interpolate(kb, [0, 1], [1, zoom]);
  const kbX = interpolate(kb, [0, 1], [0, panX]);
  const kbY = interpolate(kb, [0, 1], [0, panY]);

  // Caption chip
  const capIn = spring({ frame: frame - 8, fps, config: { damping: 20, stiffness: 180 } });
  const capY = interpolate(capIn, [0, 1], [30, 0]);
  const capOp = interpolate(capIn, [0, 1], [0, 1]);

  // Underline growth
  const underline = interpolate(frame - 20, [0, 40], [0, 100], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const accent = brand === "hospital" ? "#B91C1C" : COLORS.cyan;
  const accent2 = brand === "hospital" ? "#22C55E" : COLORS.lime;

  const screenshot = (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top center",
          transform: `scale(${kbScale}) translate(${kbX}px, ${kbY}px)`,
          transformOrigin: "center top",
        }}
      />
      {cursors?.map((c, i) => (
        <AnimatedCursor key={i} cursor={c} />
      ))}
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1200px 800px at 20% 10%, ${accent}18, transparent 60%),
                     radial-gradient(1000px 700px at 85% 90%, ${accent2}22, transparent 55%),
                     linear-gradient(180deg, #0F172A 0%, #1E293B 100%)`,
        opacity,
      }}
    >
      {/* Grid backdrop */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
      }} />

      {/* Caption */}
      <div style={{
        position: "absolute", top: 60, left: 80, right: 80,
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        transform: `translateY(${capY}px)`, opacity: capOp,
      }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 16px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: `1px solid ${accent}55`, color: accent, fontSize: 18, fontWeight: 600, letterSpacing: 0.5, marginBottom: 16 }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: accent }} />
            {brand === "hospital" ? "HOSPITAL DEL SUR ITAGÜÍ" : "TRAMMOS"}
          </div>
          <div style={{ color: "white", fontSize: 62, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5, maxWidth: 1200 }}>
            {caption}
          </div>
          <div style={{ marginTop: 12, height: 4, background: `linear-gradient(90deg, ${accent}, ${accent2})`, width: `${underline * 4}px`, maxWidth: 280, borderRadius: 3 }} />
          {subtitle ? (
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 22, marginTop: 18, maxWidth: 900, fontWeight: 400 }}>{subtitle}</div>
          ) : null}
        </div>
      </div>

      {/* Device */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: device === "phone" ? "52%" : "58%",
        transform: `translate(-50%, -50%) scale(${enterScale})`,
      }}>
        {device === "desktop" ? (
          <DesktopFrame>{screenshot}</DesktopFrame>
        ) : (
          <PhoneFrame scale={0.95}>{screenshot}</PhoneFrame>
        )}
      </div>
    </AbsoluteFill>
  );
};

const AnimatedCursor: React.FC<{ cursor: Cursor }> = ({ cursor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = cursor.delay ?? 0;
  const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 90, mass: 1.1 } });
  const x = interpolate(s, [0, 1], [cursor.x - 180, cursor.x]);
  const y = interpolate(s, [0, 1], [cursor.y + 80, cursor.y]);
  const clickPulse = cursor.click
    ? interpolate(frame - delay - 25, [0, 8, 20], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;
  return (
    <>
      {cursor.click && (
        <div style={{
          position: "absolute", left: x - 30, top: y - 30, width: 60, height: 60, borderRadius: 30,
          border: "3px solid #00B4D8", opacity: clickPulse, transform: `scale(${0.6 + clickPulse * 0.8})`,
        }} />
      )}
      <svg width={32} height={40} viewBox="0 0 24 32" style={{ position: "absolute", left: x, top: y, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))" }}>
        <path d="M2 2 L2 24 L8 20 L11 28 L14 27 L11 19 L20 19 Z" fill="white" stroke="black" strokeWidth={1.5} strokeLinejoin="round" />
      </svg>
    </>
  );
};
