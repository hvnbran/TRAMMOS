import idleSrc from "@/assets/trami/trami-idle.png";
import waveSrc from "@/assets/trami/trami-wave.png";
import thinkingSrc from "@/assets/trami/trami-thinking.png";
import talkingSrc from "@/assets/trami/trami-talking.png";
import sadSrc from "@/assets/trami/trami-sad.png";

export type TramiState = "idle" | "wave" | "thinking" | "talking" | "sad";

const SRC: Record<TramiState, string> = {
  idle: idleSrc,
  wave: waveSrc,
  thinking: thinkingSrc,
  talking: talkingSrc,
  sad: sadSrc,
};

const SIZE: Record<NonNullable<Props["size"]>, string> = {
  xs: "h-8 w-8",
  sm: "h-12 w-12",
  md: "h-20 w-20",
  lg: "h-32 w-32",
  xl: "h-48 w-48",
};

interface Props {
  state?: TramiState;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Animación sutil de balanceo cuando está en idle */
  bobbing?: boolean;
  className?: string;
  alt?: string;
  priority?: boolean;
}

/**
 * Avatar de la mascota TRAMI (jirafa azul). Cambia de pose según el estado
 * conversacional. Respeta prefers-reduced-motion.
 */
export function TramiAvatar({
  state = "idle",
  size = "md",
  bobbing = false,
  className = "",
  alt = "TRAMI, tu ayudante TRAMMOS",
  priority = false,
}: Props) {
  const src = SRC[state] ?? SRC.idle;
  return (
    <img
      src={src}
      alt={alt}
      width={512}
      height={512}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={`${SIZE[size]} object-contain select-none ${
        bobbing ? "motion-safe:animate-trami-bob" : ""
      } ${className}`}
    />
  );
}
