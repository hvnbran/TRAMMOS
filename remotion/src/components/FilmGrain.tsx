import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

// Lightweight CSS-only film grain: multiple thin stripes with rotation cycling per frame.
// Combined with a fixed noise SVG via data URI for micro-texture.
const NOISE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
  <filter id='n'>
    <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>
    <feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/>
  </filter>
  <rect width='100%' height='100%' filter='url(#n)'/>
</svg>`;

const NOISE_URI = `url("data:image/svg+xml;utf8,${encodeURIComponent(NOISE_SVG)}")`;

export const FilmGrain: React.FC<{ opacity?: number }> = ({ opacity = 0.08 }) => {
  const frame = useCurrentFrame();
  // Shift the noise position each frame to animate grain
  const x = (frame * 37) % 200;
  const y = (frame * 53) % 200;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        backgroundImage: NOISE_URI,
        backgroundSize: "200px 200px",
        backgroundPosition: `${x}px ${y}px`,
        opacity,
        mixBlendMode: "overlay",
        zIndex: 999,
      }}
    />
  );
};

export const Vignette: React.FC<{ intensity?: number }> = ({ intensity = 0.55 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,${intensity}) 100%)`,
      zIndex: 998,
    }}
  />
);
