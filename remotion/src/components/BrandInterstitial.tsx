import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { FONT_DISPLAY } from "./fonts";
import { FilmGrain, Vignette } from "./FilmGrain";

// TRAMMOS wordmark with letters that appear one by one and the tracking (letter-spacing) collapses.
export const BrandInterstitial: React.FC<{ word?: string; accent?: string }> = ({
  word = "TRAMMOS",
  accent = "#00B4D8",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const letters = word.split("");

  // Track collapses from 60px → 4px
  const tracking = interpolate(frame, [8, 40], [60, 4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });

  const lineS = spring({ frame: frame - 20, fps, config: { damping: 200 }, durationInFrames: 20 });

  return (
    <AbsoluteFill style={{ background: "#050507", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {letters.map((l, i) => {
          const delay = 4 + i * 3;
          const op = interpolate(frame, [delay, delay + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <span
              key={i}
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 96,
                fontWeight: 400,
                color: "#ffffff",
                letterSpacing: `${tracking}px`,
                opacity: op,
                fontVariationSettings: "'opsz' 96",
              }}
            >
              {l}
            </span>
          );
        })}
      </div>
      <div style={{
        marginTop: 26,
        height: 1,
        width: 220 * lineS,
        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        boxShadow: `0 0 20px ${accent}`,
      }} />
      <Vignette intensity={0.7} />
      <FilmGrain opacity={0.08} />
    </AbsoluteFill>
  );
};
