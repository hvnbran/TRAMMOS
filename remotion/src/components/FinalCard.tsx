import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, staticFile, Img, Easing } from "remotion";
import { FONT_DISPLAY, FONT_UI } from "./fonts";
import { FilmGrain, Vignette } from "./FilmGrain";

export const FinalCard: React.FC<{ tagline: string; accent?: string; logo?: string }> = ({
  tagline,
  accent = "#00B4D8",
  logo = "assets/logo.png",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoS = spring({ frame: frame - 6, fps, config: { damping: 200 }, durationInFrames: 30 });
  const tagP = interpolate(frame, [22, 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  const urlS = spring({ frame: frame - 50, fps, config: { damping: 200 }, durationInFrames: 20 });
  const lineP = interpolate(frame, [12, 42], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });

  return (
    <AbsoluteFill style={{ background: "#050507", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {/* Ambient cyan halo */}
      <div style={{
        position: "absolute", left: "50%", top: "50%",
        width: 1200, height: 1200, borderRadius: 600,
        background: `radial-gradient(circle, ${accent}18 0%, transparent 55%)`,
        transform: "translate(-50%, -50%)", filter: "blur(30px)",
      }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40, position: "relative" }}>
        <Img
          src={staticFile(logo)}
          style={{
            height: 110, objectFit: "contain",
            opacity: logoS, transform: `translateY(${(1 - logoS) * 20}px) scale(${0.94 + logoS * 0.06})`,
            filter: "drop-shadow(0 8px 30px rgba(0,180,216,0.35))",
          }}
        />

        <div style={{
          height: 1, width: 360 * lineP,
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          boxShadow: `0 0 24px ${accent}`,
        }} />

        <div style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 56,
          fontWeight: 300,
          color: "#ffffff",
          textAlign: "center",
          maxWidth: 1400,
          letterSpacing: -1.5,
          lineHeight: 1.1,
          clipPath: `inset(0 ${(1 - tagP) * 100}% 0 0)`,
          fontVariationSettings: "'opsz' 72",
        }}>
          {tagline}
        </div>

        <div style={{
          fontFamily: FONT_UI, fontSize: 13, color: "rgba(255,255,255,0.5)",
          letterSpacing: 6, textTransform: "uppercase", marginTop: 20,
          opacity: urlS, transform: `translateY(${(1 - urlS) * 6}px)`,
        }}>
          trammos.online
        </div>
      </div>

      <Vignette intensity={0.7} />
      <FilmGrain opacity={0.09} />
    </AbsoluteFill>
  );
};
