import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { FONT_DISPLAY, FONT_UI } from "./fonts";
import { FilmGrain, Vignette } from "./FilmGrain";

// Big serif manifesto card. Lines reveal one by one via clip-path.
export const Manifesto: React.FC<{
  lines: string[];
  kicker?: string;
  accent?: string;
}> = ({ lines, kicker, accent = "#00B4D8" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const kickerS = spring({ frame: frame - 4, fps, config: { damping: 200 }, durationInFrames: 18 });

  return (
    <AbsoluteFill style={{ background: "#050507", overflow: "hidden" }}>
      {/* Soft cyan glow orb, slow drift */}
      <div style={{
        position: "absolute", left: "60%", top: "20%", width: 900, height: 900, borderRadius: 500,
        background: `radial-gradient(circle, ${accent}22 0%, transparent 60%)`, filter: "blur(40px)",
        transform: `translate(${interpolate(frame, [0, 100], [0, -30])}px, ${interpolate(frame, [0, 100], [0, 20])}px)`,
      }} />

      <div style={{
        position: "absolute", left: 140, top: "50%", transform: "translateY(-50%)",
        maxWidth: 1500,
      }}>
        {kicker && (
          <div style={{
            fontFamily: FONT_UI, fontSize: 14, letterSpacing: 6, color: accent,
            fontWeight: 500, textTransform: "uppercase", marginBottom: 40,
            opacity: kickerS, transform: `translateX(${(1 - kickerS) * -12}px)`,
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <span style={{ width: 28, height: 1, background: accent }} />
            {kicker}
          </div>
        )}

        {lines.map((line, i) => {
          const delay = 14 + i * 10;
          const p = interpolate(frame, [delay, delay + 26], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.65, 0, 0.35, 1),
          });
          // clip-path reveal from left
          const clip = `inset(0 ${(1 - p) * 100}% 0 0)`;
          return (
            <div
              key={i}
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 148,
                fontWeight: 300,
                letterSpacing: -4,
                lineHeight: 1.0,
                color: "#ffffff",
                clipPath: clip,
                marginBottom: 8,
                fontVariationSettings: "'opsz' 144",
              }}
            >
              {line}
            </div>
          );
        })}
      </div>

      <Vignette intensity={0.65} />
      <FilmGrain opacity={0.09} />
    </AbsoluteFill>
  );
};
