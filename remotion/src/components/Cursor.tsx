import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

export const Cursor: React.FC<{
  from: [number, number];
  to: [number, number];
  startFrame: number;
  duration?: number;
  click?: boolean;
}> = ({ from, to, startFrame, duration = 25, click = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = Math.max(0, Math.min(1, (frame - startFrame) / duration));
  const eased = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2;
  const x = from[0] + (to[0]-from[0]) * eased;
  const y = from[1] + (to[1]-from[1]) * eased;
  const clickFrame = startFrame + duration;
  const clickPulse = spring({ frame: frame - clickFrame, fps, config: { damping: 12 } });
  const pulseSize = click ? interpolate(clickPulse, [0, 1], [0, 60], { extrapolateRight: "clamp" }) : 0;
  const pulseOpacity = click ? interpolate(clickPulse, [0, 1], [0.6, 0], { extrapolateRight: "clamp" }) : 0;
  if (frame < startFrame - 5) return null;
  return (
    <>
      {click && (
        <div style={{
          position: "absolute", left: to[0]-pulseSize/2, top: to[1]-pulseSize/2,
          width: pulseSize, height: pulseSize, borderRadius: "50%",
          background: "rgba(0,180,216,0.5)", pointerEvents: "none", zIndex: 999,
        }} />
      )}
      <svg style={{ position: "absolute", left: x-6, top: y-6, zIndex: 1000, pointerEvents: "none" }} width="28" height="34" viewBox="0 0 28 34">
        <path d="M2 2 L2 26 L9 20 L13 30 L17 28 L13 18 L22 18 Z" fill="#111" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </>
  );
};
