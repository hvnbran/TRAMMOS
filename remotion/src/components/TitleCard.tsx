import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, staticFile, Img, interpolate } from "remotion";
import { FONT_DISPLAY, FONT_BODY } from "./fonts";
import { COLORS } from "../theme";

export const TitleCard: React.FC<{
  eyebrow: string;
  title: string;
  subtitle: string;
  accent?: string;
  logo?: string;
}> = ({ eyebrow, title, subtitle, accent = COLORS.cyan, logo = "assets/logo.png" }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const inLogo = spring({ frame, fps, config: { damping: 14 } });
  const inTitle = spring({ frame: frame - 12, fps, config: { damping: 18 } });
  const inSub = spring({ frame: frame - 24, fps, config: { damping: 18 } });
  const fadeOut = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: fadeOut }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ transform: `scale(${inLogo}) rotate(${(1-inLogo)*10}deg)`, opacity: inLogo }}>
          <Img src={staticFile(logo)} style={{ height: 130, objectFit: "contain" }} />
        </div>
        <div style={{
          transform: `translateY(${(1-inTitle)*30}px)`, opacity: inTitle,
          fontFamily: FONT_BODY, fontSize: 22, color: accent,
          letterSpacing: 4, textTransform: "uppercase", fontWeight: 600, marginTop: 20,
        }}>{eyebrow}</div>
        <div style={{
          transform: `translateY(${(1-inTitle)*30}px)`, opacity: inTitle,
          fontFamily: FONT_DISPLAY, fontSize: 96, color: COLORS.text,
          fontWeight: 700, lineHeight: 1, textAlign: "center",
        }}>{title}</div>
        <div style={{
          transform: `translateY(${(1-inSub)*20}px)`, opacity: inSub,
          fontFamily: FONT_BODY, fontSize: 30, color: COLORS.textMuted,
          maxWidth: 1100, textAlign: "center", lineHeight: 1.4, marginTop: 10,
        }}>{subtitle}</div>
        <div style={{
          transform: `scaleX(${inSub})`, transformOrigin: "left",
          width: 200, height: 4, background: accent, marginTop: 20, borderRadius: 2,
        }} />
      </div>
    </AbsoluteFill>
  );
};
