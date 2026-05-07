import { useEffect, useRef, useState } from "react";
import welcomeImg from "@/assets/welcome-trammos.png";
import { TramiAvatar } from "@/components/trami/TramiAvatar";

interface Props {
  nombre?: string;
  /** Llamado cuando el splash termina (después del fade-out). */
  onDone: () => void;
  /** Duración total visible (sin contar fade-out). Default 1800ms. */
  durationMs?: number;
}

/**
 * Splash de bienvenida del pasajero.
 * Muestra el afiche de marca TRAMMOS con una entrada animada y luego se desvanece
 * para dar paso a la pantalla de "pedir mi carro".
 *
 * Respeta `prefers-reduced-motion`: si el usuario prefiere menos movimiento,
 * el splash se muestra estático y se cierra rápido (~700ms).
 */
export function PasajeroWelcomeSplash({ nombre, onDone, durationMs = 1800 }: Props) {
  const [fadeOut, setFadeOut] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const primerNombre = (nombre || "").trim().split(/\s+/)[0];

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const visible = reduce ? 700 : durationMs;
    const fadeMs = reduce ? 150 : 350;

    timersRef.current.push(setTimeout(() => setFadeOut(true), visible));
    timersRef.current.push(setTimeout(() => onDone(), visible + fadeMs));

    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, [durationMs, onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[60] flex items-center justify-center transition-opacity duration-300 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ background: "#C6FF00" }}
    >
      <div className="relative w-full max-w-md px-6 flex flex-col items-center gap-5">
        <img
          src={welcomeImg}
          alt="Todo Colombia es territorio TRAMMOS"
          width={720}
          height={1280}
          decoding="async"
          fetchPriority="high"
          className="w-full max-w-[320px] h-auto rounded-2xl shadow-2xl welcome-pop"
          style={{ boxShadow: "0 30px 80px -20px rgba(0,153,204,0.55)" }}
        />

        {primerNombre && (
          <div className="welcome-rise rounded-2xl bg-white px-4 py-2 shadow-md">
            <p className="text-[#0099CC] font-bold text-base">¡Hola, {primerNombre}!</p>
            <p className="text-[#00798F] text-xs">Bienvenido a TRAMMOS</p>
          </div>
        )}

        <div className="w-40 h-1.5 rounded-full bg-white/40 overflow-hidden">
          <div className="welcome-bar h-full bg-[#00CAFF]" />
        </div>
      </div>

      <style>{`
        @keyframes welcome-pop {
          0%   { opacity: 0; transform: scale(0.92) translateY(8px); }
          60%  { opacity: 1; transform: scale(1.02) translateY(0); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes welcome-rise {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes welcome-bar {
          0%   { width: 0%; }
          100% { width: 100%; }
        }
        .welcome-pop  { animation: welcome-pop 700ms cubic-bezier(.2,.7,.2,1) both; }
        .welcome-rise { animation: welcome-rise 500ms ease-out 350ms both; }
        .welcome-bar  { animation: welcome-bar 1500ms ease-out 200ms both; }
        @media (prefers-reduced-motion: reduce) {
          .welcome-pop, .welcome-rise, .welcome-bar { animation: none !important; }
          .welcome-bar { width: 100%; }
        }
      `}</style>
    </div>
  );
}
