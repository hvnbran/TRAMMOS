import React from "react";
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, staticFile, Img } from "remotion";
import { FONT_DISPLAY, FONT_BODY } from "./fonts";
import { COLORS } from "../theme";

export const OutroCard: React.FC<{ tip: string; accent?: string }> = ({ tip, accent = COLORS.cyan }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inS = spring({ frame, fps, config: { damping: 16 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32, transform: `scale(${0.9 + inS*0.1})`, opacity: inS }}>
        <div style={{
          fontFamily: FONT_BODY, fontSize: 22, color: accent, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600,
        }}>💡 Tip</div>
        <div style={{
          fontFamily: FONT_DISPLAY, fontSize: 68, color: COLORS.text, fontWeight: 700,
          textAlign: "center", maxWidth: 1400, lineHeight: 1.15,
        }}>{tip}</div>
        <Img src={staticFile("assets/logo.png")} style={{ height: 90, marginTop: 40, objectFit: "contain" }} />
        <div style={{ fontFamily: FONT_BODY, fontSize: 22, color: COLORS.textMuted }}>trammos.online</div>
      </div>
    </AbsoluteFill>
  );
};
