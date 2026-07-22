import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img, staticFile } from "remotion";
import { COLORS } from "../theme";

export const IntroCard: React.FC<{
  title: string;
  subtitle: string;
  chip: string;
  brand?: "trammos" | "hospital";
}> = ({ title, subtitle, chip, brand = "trammos" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s1 = spring({ frame: frame - 5, fps, config: { damping: 20, stiffness: 120 } });
  const s2 = spring({ frame: frame - 20, fps, config: { damping: 20, stiffness: 120 } });
  const s3 = spring({ frame: frame - 35, fps, config: { damping: 20, stiffness: 120 } });

  const accent = brand === "hospital" ? "#B91C1C" : COLORS.cyan;
  const accent2 = brand === "hospital" ? "#22C55E" : COLORS.lime;

  // Slow drift
  const drift = interpolate(frame, [0, 90], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{
      background: `radial-gradient(1400px 900px at ${20 + drift * 10}% 20%, ${accent}30, transparent 60%),
                   radial-gradient(1200px 800px at ${80 - drift * 10}% 80%, ${accent2}25, transparent 60%),
                   linear-gradient(135deg, #0B1120 0%, #111827 50%, #0B1120 100%)`,
    }}>
      {/* particles */}
      {Array.from({ length: 40 }).map((_, i) => {
        const seed = (i * 9301 + 49297) % 233280;
        const x = (seed % 1920);
        const y = ((seed * 7) % 1080);
        const sz = 2 + ((seed * 3) % 4);
        const op = 0.15 + ((seed * 11) % 40) / 100;
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: sz, height: sz, borderRadius: sz, background: i % 2 ? accent : accent2, opacity: op }} />;
      })}

      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 100 }}>
        <div style={{ opacity: s1, transform: `translateY(${(1 - s1) * 20}px) scale(${0.9 + s1 * 0.1})` }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "10px 22px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: `1px solid ${accent}66`, color: accent, fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: accent, boxShadow: `0 0 20px ${accent}` }} />
            {chip}
          </div>
        </div>
        <div style={{ height: 40 }} />
        <div style={{
          opacity: s2,
          transform: `translateY(${(1 - s2) * 30}px)`,
          color: "white", fontSize: 130, fontWeight: 900, letterSpacing: -4, lineHeight: 0.95, textAlign: "center",
          background: `linear-gradient(135deg, #fff 0%, ${accent} 60%, ${accent2} 100%)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          {title}
        </div>
        <div style={{ height: 24 }} />
        <div style={{
          opacity: s3,
          transform: `translateY(${(1 - s3) * 20}px)`,
          color: "rgba(255,255,255,0.75)", fontSize: 32, fontWeight: 400, textAlign: "center", maxWidth: 1200,
        }}>
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
