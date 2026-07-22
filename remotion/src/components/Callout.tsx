import React from "react";
import { useCurrentFrame, spring, useVideoConfig, interpolate } from "remotion";
import { COLORS } from "../theme";
import { FONT_BODY } from "./fonts";

export const Callout: React.FC<{
  text: string;
  x: number; y: number;
  start: number; end?: number;
  color?: string;
  align?: "left" | "right";
}> = ({ text, x, y, start, end, color = COLORS.cyan, align = "left" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - start, fps, config: { damping: 15 } });
  const outEnd = end ?? start + 999;
  const fadeOut = interpolate(frame, [outEnd - 10, outEnd], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (frame < start - 2 || frame > outEnd + 2) return null;
  return (
    <div style={{
      position: "absolute", left: x, top: y,
      transform: `translateY(${(1-s)*10}px) scale(${0.9 + s*0.1})`,
      opacity: s * fadeOut,
      background: color, color: "#fff",
      padding: "10px 18px", borderRadius: 12,
      fontFamily: FONT_BODY, fontWeight: 600, fontSize: 20,
      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      textAlign: align,
      maxWidth: 380,
      lineHeight: 1.3,
      zIndex: 500,
    }}>
      {text}
    </div>
  );
};
