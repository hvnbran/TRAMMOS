import React from "react";
import { useCurrentFrame } from "remotion";

export const TypeText: React.FC<{ text: string; startFrame: number; cps?: number; style?: React.CSSProperties; caret?: boolean }> = ({ text, startFrame, cps = 20, style, caret = true }) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const chars = Math.min(text.length, Math.floor((elapsed / 30) * cps));
  const shown = text.slice(0, chars);
  const blink = Math.floor(frame / 15) % 2 === 0;
  return (
    <span style={style}>
      {shown}
      {caret && chars < text.length && blink ? <span style={{ opacity: 0.6 }}>|</span> : null}
    </span>
  );
};
