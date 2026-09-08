import React from "react";

// Isotipo TRAMMOS: 4 círculos + diamante central, degradado lima → cian.
export const IntroLogoMark: React.FC<{ size?: number }> = ({ size = 260 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="introIso" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#b2e800" />
        <stop offset="50%" stopColor="#5bd4a0" />
        <stop offset="100%" stopColor="#00b4d8" />
      </linearGradient>
    </defs>
    <circle cx="28" cy="28" r="20" fill="url(#introIso)" opacity="0.95" />
    <circle cx="72" cy="28" r="20" fill="url(#introIso)" opacity="0.85" />
    <circle cx="28" cy="72" r="20" fill="url(#introIso)" opacity="0.75" />
    <circle cx="72" cy="72" r="20" fill="url(#introIso)" opacity="0.65" />
    <path d="M50 36 L64 50 L50 64 L36 50 Z" fill="#06090f" />
    <path d="M50 42 L58 50 L50 58 L42 50 Z" fill="url(#introIso)" />
  </svg>
);
