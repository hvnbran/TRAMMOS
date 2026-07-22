import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

// A slow diagonal volumetric light beam that sweeps across the scene.
export const LightSweep: React.FC<{ color?: string; opacity?: number; duration?: number }> = ({
  color = "#7dd3fc",
  opacity = 0.06,
  duration,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const total = duration ?? durationInFrames;
  const x = interpolate(frame, [0, total], [-40, 140], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden", zIndex: 2 }}>
      <div
        style={{
          position: "absolute",
          top: "-30%",
          left: `${x}%`,
          width: "40%",
          height: "160%",
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          filter: "blur(60px)",
          opacity,
          transform: "rotate(18deg)",
        }}
      />
    </AbsoluteFill>
  );
};
