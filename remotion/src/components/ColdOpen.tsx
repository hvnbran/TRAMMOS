import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { FONT_UI } from "./fonts";
import { FilmGrain, Vignette } from "./FilmGrain";

// Chapter title / cold open: black frame, thin cyan line traces across, chip fades in centered.
export const ColdOpen: React.FC<{ label: string; sub?: string; accent?: string }> = ({
  label,
  sub,
  accent = "#00B4D8",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Line trace 0 → 100%
  const lineProgress = interpolate(frame, [4, 34], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });

  // Chip fade in
  const chipS = spring({ frame: frame - 18, fps, config: { damping: 200 }, durationInFrames: 20 });
  const subS = spring({ frame: frame - 26, fps, config: { damping: 200 }, durationInFrames: 20 });

  return (
    <AbsoluteFill style={{ background: "#050507", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {/* horizontal cyan line */}
      <div style={{
        position: "absolute", left: 0, top: "50%",
        height: 1, width: `${lineProgress}%`, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        boxShadow: `0 0 24px ${accent}`,
      }} />
      <div style={{ position: "relative", opacity: chipS, transform: `translateY(${(1 - chipS) * 8}px)` }}>
        <div style={{
          fontFamily: FONT_UI,
          color: "rgba(255,255,255,0.95)",
          fontSize: 15,
          letterSpacing: 8,
          fontWeight: 500,
          textTransform: "uppercase",
          padding: "14px 28px",
          border: `1px solid ${accent}55`,
          borderRadius: 4,
          background: "rgba(0,180,216,0.04)",
          backdropFilter: "blur(4px)",
        }}>{label}</div>
      </div>
      {sub && (
        <div style={{
          marginTop: 22,
          fontFamily: FONT_UI, color: "rgba(255,255,255,0.4)", fontSize: 13, letterSpacing: 4, fontWeight: 400,
          opacity: subS, transform: `translateY(${(1 - subS) * 6}px)`, textTransform: "uppercase",
        }}>{sub}</div>
      )}
      <Vignette intensity={0.7} />
      <FilmGrain opacity={0.10} />
    </AbsoluteFill>
  );
};
