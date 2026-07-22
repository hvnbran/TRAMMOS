import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from "remotion";
import { FONT_DISPLAY, FONT_UI } from "./fonts";
import { DesktopFrame } from "./DesktopFrame";
import { PhoneFrame } from "./PhoneFrame";
import { FilmGrain, Vignette } from "./FilmGrain";
import { LightSweep } from "./LightSweep";

export type CaptionSide = "left" | "right" | "center-bottom";

export const CinemaScene: React.FC<{
  device: "desktop" | "phone";
  src: string;
  eyebrow?: string;     // small label above title
  title: string;        // serif big display
  body?: string;        // supporting sentence
  duration: number;
  side?: CaptionSide;
  zoom?: number;        // final scale for Ken-Burns
  panX?: number;
  panY?: number;
  accent?: string;
}> = ({
  device,
  src,
  eyebrow,
  title,
  body,
  duration,
  side = "left",
  zoom = 1.14,
  panX = 0,
  panY = -30,
  accent = "#00B4D8",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene enter — quick fade & slight blur clear
  const enterP = interpolate(frame, [0, 14], [0, 1], {
    extrapolateRight: "clamp", easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  const blurPx = interpolate(frame, [0, 14], [16, 0], { extrapolateRight: "clamp" });

  // Ken-Burns
  const kb = interpolate(frame, [0, duration], [0, 1], { extrapolateRight: "clamp" });
  const kbScale = interpolate(kb, [0, 1], [1.0, zoom]);
  const kbX = interpolate(kb, [0, 1], [0, panX]);
  const kbY = interpolate(kb, [0, 1], [0, panY]);

  // Text reveals
  const eyeS = spring({ frame: frame - 10, fps, config: { damping: 200 }, durationInFrames: 22 });
  const titleP = interpolate(frame, [16, 46], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  const bodyS = spring({ frame: frame - 30, fps, config: { damping: 200 }, durationInFrames: 22 });

  const screenshot = (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "top center",
          transform: `scale(${kbScale}) translate(${kbX}px, ${kbY}px)`,
          transformOrigin: "center top",
          filter: `blur(${blurPx}px)`,
        }}
      />
    </div>
  );

  // Position the device and text based on side
  const isLeftText = side === "left";
  const isRightText = side === "right";
  const isCenterBottom = side === "center-bottom";

  const deviceEl = (
    <div style={{
      transform: `scale(${0.98 + enterP * 0.02})`,
      opacity: enterP,
    }}>
      {device === "desktop" ? <DesktopFrame>{screenshot}</DesktopFrame> : <PhoneFrame scale={0.95}>{screenshot}</PhoneFrame>}
    </div>
  );

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(180deg, #050507 0%, #0a0a0f 100%)",
      overflow: "hidden",
      opacity: enterP,
    }}>
      {/* Ambient orb behind device */}
      <div style={{
        position: "absolute", left: "50%", top: "55%",
        width: 1400, height: 900, borderRadius: 700,
        background: `radial-gradient(ellipse, ${accent}18 0%, transparent 60%)`,
        transform: "translate(-50%, -50%)", filter: "blur(30px)",
      }} />

      <LightSweep color="#7dd3fc" opacity={0.05} duration={duration} />

      {/* LEFT-text layout: text left, device right */}
      {isLeftText && (
        <>
          <div style={{
            position: "absolute", left: 100, top: "50%", transform: "translateY(-50%)",
            maxWidth: 700, zIndex: 3,
          }}>
            {eyebrow && (
              <div style={{
                fontFamily: FONT_UI, fontSize: 12, letterSpacing: 6, color: accent,
                fontWeight: 500, textTransform: "uppercase", marginBottom: 26,
                opacity: eyeS, transform: `translateX(${(1 - eyeS) * -8}px)`,
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <span style={{ width: 24, height: 1, background: accent }} />
                {eyebrow}
              </div>
            )}
            <div style={{
              fontFamily: FONT_DISPLAY, fontSize: 78, fontWeight: 300, letterSpacing: -2.5,
              lineHeight: 1.02, color: "#ffffff",
              clipPath: `inset(0 ${(1 - titleP) * 100}% 0 0)`,
              fontVariationSettings: "'opsz' 96",
            }}>
              {title}
            </div>
            {body && (
              <div style={{
                fontFamily: FONT_UI, fontSize: 20, color: "rgba(255,255,255,0.62)",
                marginTop: 26, lineHeight: 1.45, fontWeight: 400,
                opacity: bodyS, transform: `translateY(${(1 - bodyS) * 8}px)`, maxWidth: 620,
              }}>{body}</div>
            )}
          </div>
          <div style={{
            position: "absolute", right: device === "phone" ? 200 : 40, top: "50%",
            transform: "translateY(-50%)",
          }}>
            {deviceEl}
          </div>
        </>
      )}

      {isRightText && (
        <>
          <div style={{
            position: "absolute", right: 100, top: "50%", transform: "translateY(-50%)",
            maxWidth: 700, zIndex: 3, textAlign: "right",
          }}>
            {eyebrow && (
              <div style={{
                fontFamily: FONT_UI, fontSize: 12, letterSpacing: 6, color: accent,
                fontWeight: 500, textTransform: "uppercase", marginBottom: 26,
                opacity: eyeS, transform: `translateX(${(1 - eyeS) * 8}px)`,
                display: "flex", alignItems: "center", gap: 14, justifyContent: "flex-end",
              }}>
                {eyebrow}
                <span style={{ width: 24, height: 1, background: accent }} />
              </div>
            )}
            <div style={{
              fontFamily: FONT_DISPLAY, fontSize: 78, fontWeight: 300, letterSpacing: -2.5,
              lineHeight: 1.02, color: "#ffffff",
              clipPath: `inset(0 0 0 ${(1 - titleP) * 100}%)`,
              fontVariationSettings: "'opsz' 96",
            }}>
              {title}
            </div>
            {body && (
              <div style={{
                fontFamily: FONT_UI, fontSize: 20, color: "rgba(255,255,255,0.62)",
                marginTop: 26, lineHeight: 1.45, fontWeight: 400,
                opacity: bodyS, transform: `translateY(${(1 - bodyS) * 8}px)`, maxWidth: 620,
                marginLeft: "auto",
              }}>{body}</div>
            )}
          </div>
          <div style={{
            position: "absolute", left: device === "phone" ? 200 : 40, top: "50%",
            transform: "translateY(-50%)",
          }}>
            {deviceEl}
          </div>
        </>
      )}

      {isCenterBottom && (
        <>
          <div style={{
            position: "absolute", left: "50%", top: "40%",
            transform: "translate(-50%, -50%)",
          }}>
            {deviceEl}
          </div>
          <div style={{
            position: "absolute", left: 0, right: 0, bottom: 60,
            display: "flex", flexDirection: "column", alignItems: "center",
            zIndex: 3,
          }}>
            {eyebrow && (
              <div style={{
                fontFamily: FONT_UI, fontSize: 12, letterSpacing: 6, color: accent,
                fontWeight: 500, textTransform: "uppercase", marginBottom: 18,
                opacity: eyeS,
              }}>{eyebrow}</div>
            )}
            <div style={{
              fontFamily: FONT_DISPLAY, fontSize: 62, fontWeight: 300, letterSpacing: -2,
              color: "#ffffff", textAlign: "center", maxWidth: 1300,
              clipPath: `inset(0 ${(1 - titleP) * 50}% 0 ${(1 - titleP) * 50}%)`,
              fontVariationSettings: "'opsz' 72",
            }}>{title}</div>
          </div>
        </>
      )}

      <Vignette intensity={0.55} />
      <FilmGrain opacity={0.07} />
    </AbsoluteFill>
  );
};
