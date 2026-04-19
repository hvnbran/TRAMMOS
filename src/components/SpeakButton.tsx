import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface SpeakButtonProps {
  /** Text the button will read aloud (Spanish). */
  text: string;
  /** Optional accessible label override. */
  label?: string;
  /** Visual size. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Accessible button that reads `text` aloud using the Web Speech API.
 * Useful for blind users, low-vision users, or low-literacy users.
 * Falls back gracefully (button hidden) if the browser doesn't support speech synthesis.
 */
export function SpeakButton({ text, label, size = "sm", className = "" }: SpeakButtonProps) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!supported) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-CO";
    u.rate = 1;
    u.pitch = 1;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utteranceRef.current = u;
    setSpeaking(true);
    synth.speak(u);
  };

  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const accessibleLabel = label ?? (speaking ? "Detener lectura" : "Escuchar contenido");

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={accessibleLabel}
      aria-pressed={speaking}
      title={accessibleLabel}
      className={`${dim} inline-flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-primary hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors ${
        speaking ? "text-primary border-primary/40 animate-pulse" : ""
      } ${className}`}
    >
      {speaking ? <VolumeX className={icon} aria-hidden="true" /> : <Volume2 className={icon} aria-hidden="true" />}
    </button>
  );
}
