import { memo, useMemo } from "react";
import carAsset from "@/assets/pasajero-hero-car-new.png.asset.json";


interface PasajeroHeroProps {
  nombre: string;
}

/**
 * Hero de bienvenida del pasajero.
 * Inspirado en el afiche de marca TRAMMOS "Todo Colombia es territorio TRAMMOS":
 *   - Fondo lima Pantone 389C
 *   - Tipografía cyan Pantone 306C
 *   - Mapa de líneas decorativas que se "dibuja" al cargar
 *   - Carro entrando desde la izquierda con bounce + flotación sutil
 *   - Pines pulsantes sugiriendo ubicaciones activas
 */
function PasajeroHeroBase({ nombre }: PasajeroHeroProps) {
  const primerNombre = useMemo(() => (nombre || "").trim().split(/\s+/)[0] || "amigo", [nombre]);

  return (
    <section
      aria-label="Bienvenida TRAMMOS"
      className="relative overflow-hidden rounded-3xl mb-6"
      style={{
        background: "#C6FF00",
      }}
    >
      {/* Mapa decorativo de fondo (curvas tipo trayecto) */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 600"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="pathGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#00CAFF" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#00CAFF" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {/* Curvas estilo "tramos" - inspiradas en el afiche */}
        <path
          d="M -20,520 C 80,460 140,560 220,500 S 360,440 440,500"
          fill="none"
          stroke="url(#pathGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          className="hero-path"
          style={{ animationDelay: "0.2s" }}
        />
        <path
          d="M -20,560 C 100,500 180,610 280,540 S 380,500 440,560"
          fill="none"
          stroke="#00CAFF"
          strokeOpacity="0.35"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="hero-path"
          style={{ animationDelay: "0.5s" }}
        />
        <path
          d="M 60,80 C 120,140 80,220 180,260 S 320,300 380,260"
          fill="none"
          stroke="#00CAFF"
          strokeOpacity="0.25"
          strokeWidth="2"
          strokeLinecap="round"
          className="hero-path"
          style={{ animationDelay: "0.8s" }}
        />
        <path
          d="M 0,300 C 60,280 120,360 200,330 S 360,310 420,340"
          fill="none"
          stroke="#00CAFF"
          strokeOpacity="0.2"
          strokeWidth="2"
          strokeLinecap="round"
          className="hero-path"
          style={{ animationDelay: "1.1s" }}
        />

        {/* Pines pulsantes */}
        {[
          { cx: 70, cy: 110, d: "0s" },
          { cx: 320, cy: 240, d: "0.7s" },
          { cx: 180, cy: 320, d: "1.4s" },
        ].map((p, i) => (
          <g key={i}>
            <circle cx={p.cx} cy={p.cy} r="6" fill="#00CAFF" opacity="0.4" className="hero-pin" style={{ animationDelay: p.d, transformOrigin: `${p.cx}px ${p.cy}px` }} />
            <circle cx={p.cx} cy={p.cy} r="4" fill="#00CAFF" />
            <circle cx={p.cx} cy={p.cy} r="1.5" fill="#fff" />
          </g>
        ))}
      </svg>

      {/* Contenido */}
      <div className="relative px-6 pt-7 pb-6">
        <p
          className="hero-text text-[#0099CC] text-sm font-medium tracking-wide"
          style={{ ["--i" as string]: 0 }}
        >
          Hola, {primerNombre} 👋
        </p>

        <h1 className="mt-2 leading-[0.95] font-bold text-[#0099CC]">
          <span
            className="hero-text block text-[26px] sm:text-[30px]"
            style={{ ["--i" as string]: 1 }}
          >
            Todo Colombia
          </span>
          <span
            className="hero-text block text-[26px] sm:text-[30px] font-normal text-[#666666]"
            style={{ ["--i" as string]: 2 }}
          >
            es territorio
          </span>
          <span
            className="hero-text block text-[44px] sm:text-[52px] font-extrabold tracking-tight text-[#00CAFF] mt-1"
            style={{
              ["--i" as string]: 3,
              textShadow: "0 2px 0 rgba(255,255,255,0.4)",
            }}
          >
            TRAMMOS
          </span>
        </h1>

        {/* Carro real */}
        <div className="hero-car-wrap mt-4 flex justify-center">
          <img
            src={carAsset.url}
            alt="Camioneta TRAMMOS"
            className="w-full max-w-[280px] sm:max-w-[320px] h-auto select-none pointer-events-none"
            draggable={false}
          />
        </div>

        {/* CTA removido: el formulario "Pedir mi carro" aparece justo debajo del hero. */}

        {/* Línea inferior decorativa - como el mapa del afiche */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full h-12 pointer-events-none"
          viewBox="0 0 400 50"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M 0,40 Q 80,15 160,30 T 320,25 T 480,35"
            fill="none"
            stroke="#00CAFF"
            strokeOpacity="0.5"
            strokeWidth="2"
            className="hero-path"
            style={{ animationDelay: "1.4s" }}
          />
        </svg>
      </div>
    </section>
  );
}

export const PasajeroHero = memo(PasajeroHeroBase);
