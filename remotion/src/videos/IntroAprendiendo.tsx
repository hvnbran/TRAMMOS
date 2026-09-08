import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Montserrat";
import { IntroLogoMark } from "../components/IntroLogoMark";

const { fontFamily } = loadFont("normal", {
  weights: ["600", "700", "900"],
  subsets: ["latin"],
});

export const INTRO_DURATION = 150; // 5s @ 30fps

const LIME = "#b2e800";
const CYAN = "#00b4d8";

// Pseudo-random determinista
const rnd = (i: number, salt = 1) => {
  const x = Math.sin(i * 127.1 * salt + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const Particles: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: 90 }).map((_, i) => {
        const x0 = rnd(i, 1) * 1080;
        const y0 = rnd(i, 2) * 1920;
        const vx = (rnd(i, 3) - 0.5) * 0.7;
        const vy = (rnd(i, 4) - 0.5) * 0.7;
        const r = rnd(i, 5) * 2.6 + 0.8;
        const op = rnd(i, 6) * 0.5 + 0.12;
        const x = ((x0 + vx * frame) % 1080 + 1080) % 1080;
        const y = ((y0 + vy * frame) % 1920 + 1920) % 1920;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: r * 2,
              height: r * 2,
              borderRadius: r * 2,
              background: i % 2 ? LIME : CYAN,
              opacity: op,
            }}
          />
        );
      })}
    </>
  );
};

const Hexagons: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: 9 }).map((_, i) => {
        const size = rnd(i, 11) * 90 + 50;
        const x = rnd(i, 12) * 1080;
        const y = rnd(i, 13) * 1920;
        const rot = rnd(i, 14) * 360 + frame * (rnd(i, 15) - 0.5) * 0.5;
        const color = i % 2 ? LIME : CYAN;
        const pts = Array.from({ length: 6 })
          .map((__, k) => {
            const a = (k * Math.PI) / 3;
            return `${50 + Math.cos(a) * 46},${50 + Math.sin(a) * 46}`;
          })
          .join(" ");
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 100 100"
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              transform: `rotate(${rot}deg)`,
              opacity: 0.12,
            }}
          >
            <polygon points={pts} fill="none" stroke={color} strokeWidth={1.4} />
          </svg>
        );
      })}
    </>
  );
};

export const IntroAprendiendo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Isotipo: entra girando con rebote
  const iso = spring({ frame: frame - 8, fps, config: { damping: 12, stiffness: 130 } });
  const isoScale = interpolate(iso, [0, 1], [0.25, 1]);
  const isoRot = interpolate(iso, [0, 1], [-180, 0]);

  // Wordmark: desde la derecha
  const wm = spring({ frame: frame - 30, fps, config: { damping: 20, stiffness: 110 } });

  // "Aprendiendo con": revelado por clip-path
  const rev = interpolate(frame, [46, 70], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  const revOp = interpolate(frame, [46, 60], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  // Línea de acento
  const line = spring({ frame: frame - 66, fps, config: { damping: 200 }, durationInFrames: 24 });

  // Respiración lenta del conjunto
  const breathe = 1 + Math.sin((frame / fps) * 1.1) * 0.012;
  const drift = Math.sin((frame / fps) * 0.8) * 8;

  // Cierre suave
  const outro = interpolate(frame, [INTRO_DURATION - 14, INTRO_DURATION - 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const glow = interpolate(frame, [8, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#06090f", fontFamily, opacity: outro }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 900px at 22% 26%, ${LIME}1f, transparent 65%),
                       radial-gradient(1000px 1000px at 80% 76%, ${CYAN}22, transparent 65%)`,
        }}
      />
      <Hexagons />
      <Particles />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${breathe}) translateY(${drift}px)`,
        }}
      >
        {/* Aprendiendo con */}
        <div
          style={{
            fontSize: 58,
            fontWeight: 600,
            letterSpacing: 14,
            color: "rgba(255,255,255,0.72)",
            textTransform: "uppercase",
            opacity: revOp,
            clipPath: `inset(0 ${rev}% 0 0)`,
            marginBottom: 54,
          }}
        >
          Aprendiendo con
        </div>

        {/* Isotipo */}
        <div
          style={{
            opacity: iso,
            transform: `scale(${isoScale}) rotate(${isoRot}deg)`,
            filter: `drop-shadow(0 0 ${40 * glow}px ${CYAN}66)`,
          }}
        >
          <IntroLogoMark size={300} />
        </div>

        {/* TRAMMOS */}
        <div
          style={{
            marginTop: 56,
            fontSize: 132,
            fontWeight: 900,
            letterSpacing: 8,
            lineHeight: 1,
            background: `linear-gradient(135deg, ${LIME} 0%, ${CYAN} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            opacity: wm,
            transform: `translateX(${(1 - wm) * 90}px)`,
          }}
        >
          TRAMMOS
        </div>

        {/* Línea de acento */}
        <div
          style={{
            marginTop: 38,
            height: 2,
            width: 460 * line,
            background: `linear-gradient(90deg, transparent, ${CYAN}, ${LIME}, transparent)`,
            boxShadow: `0 0 28px ${CYAN}`,
          }}
        />
      </AbsoluteFill>

      {/* Viñeta */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 80% at 50% 50%, transparent 45%, rgba(0,0,0,0.75) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
