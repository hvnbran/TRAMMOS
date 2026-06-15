import { useEffect, useRef, useState } from "react";

/**
 * CRM entrance animation — premium intro.
 * - Particle + hexagon canvas background
 * - Phase 1: logo (isotype + wordmark + tagline)
 * - Phase 2: module grid with progress bar
 * Auto-dismisses ~6s. Respects prefers-reduced-motion.
 */

const MODS = [
  { icon: "📊", name: "Dashboard", lit: false },
  { icon: "🔀", name: "Pipeline", lit: true },
  { icon: "💰", name: "Ventas", lit: false },
  { icon: "📦", name: "Catálogo", lit: true },
  { icon: "💳", name: "Créditos", lit: false },
  { icon: "⚡", name: "Capacidades", lit: true },
  { icon: "👥", name: "Clientes", lit: false },
  { icon: "🎂", name: "Cumpleaños", lit: true },
  { icon: "🧑‍💼", name: "Asesores", lit: false },
  { icon: "🏢", name: "Concesionarios", lit: true },
  { icon: "🤝", name: "Equipo", lit: false },
];

function ensureMontserrat() {
  if (typeof document === "undefined") return;
  if (document.getElementById("crm-intro-montserrat")) return;
  const l = document.createElement("link");
  l.id = "crm-intro-montserrat";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap";
  document.head.appendChild(l);
}

export function CrmIntro() {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const aliveRef = useRef(true);

  // Phase refs
  const phaseLogoRef = useRef<HTMLDivElement | null>(null);
  const phaseGridRef = useRef<HTMLDivElement | null>(null);
  const isoRef = useRef<SVGSVGElement | null>(null);
  const wmMainRef = useRef<HTMLDivElement | null>(null);
  const wmCrmRef = useRef<HTMLDivElement | null>(null);
  const wmTagRef = useRef<HTMLDivElement | null>(null);
  const progWrapRef = useRef<HTMLDivElement | null>(null);
  const progFillRef = useRef<HTMLDivElement | null>(null);
  const progTextRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ensureMontserrat();
    aliveRef.current = true;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const wait = (ms: number) =>
      new Promise<void>((res) => {
        const t = setTimeout(() => res(), ms);
        timeoutsRef.current.push(t);
      });

    // ---- Canvas background ----
    const canvas = canvasRef.current;
    if (canvas) {
      const setSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      setSize();
      window.addEventListener("resize", setSize);

      const ctx = canvas.getContext("2d");
      if (ctx) {
        const W = () => canvas.width;
        const H = () => canvas.height;
        const particles = Array.from({ length: 120 }, () => ({
          x: Math.random() * W(),
          y: Math.random() * H(),
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 1.2 + 0.2,
          a: Math.random() * 0.6 + 0.1,
          c: Math.random() > 0.5 ? "178,232,0" : "0,180,216",
        }));
        const hexagons = Array.from({ length: 10 }, () => ({
          x: Math.random() * W(),
          y: Math.random() * H(),
          size: Math.random() * 40 + 20,
          a: Math.random() * 0.08 + 0.02,
          rot: Math.random() * Math.PI * 2,
          rotV: (Math.random() - 0.5) * 0.005,
          c: Math.random() > 0.5 ? "178,232,0" : "0,180,216",
        }));

        const draw = () => {
          if (!aliveRef.current) return;
          ctx.clearRect(0, 0, W(), H());
          hexagons.forEach((h) => {
            ctx.save();
            ctx.translate(h.x, h.y);
            ctx.rotate(h.rot);
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const a = (i * Math.PI) / 3;
              ctx.lineTo(Math.cos(a) * h.size, Math.sin(a) * h.size);
            }
            ctx.closePath();
            ctx.strokeStyle = `rgba(${h.c},${h.a})`;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
            h.rot += h.rotV;
          });
          particles.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.c},${p.a})`;
            ctx.fill();
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = W();
            if (p.x > W()) p.x = 0;
            if (p.y < 0) p.y = H();
            if (p.y > H()) p.y = 0;
          });
          rafRef.current = requestAnimationFrame(draw);
        };
        draw();
      }

      // Cleanup resize listener via closure on unmount
      timeoutsRef.current.push(
        setTimeout(() => {
          /* keep handle alive; removed in unmount below */
        }, 0),
      );
      (canvas as any).__cleanupResize = () =>
        window.removeEventListener("resize", setSize);
    }

    // ---- Build grid ----
    const grid = gridRef.current;
    if (grid) {
      grid.innerHTML = "";
      MODS.forEach((m, i) => {
        const d = document.createElement("div");
        d.className = "mcard" + (m.lit ? " lit" : "");
        d.id = "crm-intro-mc" + i;
        d.innerHTML = `<div class="mcard-icon">${m.icon}</div><div class="mcard-name">${m.name}</div><div class="mcard-check">○</div>`;
        grid.appendChild(d);
      });
    }

    // ---- Run sequence ----
    const finish = (ms: number) => {
      const t1 = setTimeout(() => {
        if (!aliveRef.current) return;
        setFadeOut(true);
        const t2 = setTimeout(() => {
          if (!aliveRef.current) return;
          setShow(false);
        }, 450);
        timeoutsRef.current.push(t2);
      }, ms);
      timeoutsRef.current.push(t1);
    };

    if (reduce) {
      finish(400);
      return cleanup;
    }

    (async () => {
      const pLogo = phaseLogoRef.current;
      const pGrid = phaseGridRef.current;
      const iso = isoRef.current;
      const wmMain = wmMainRef.current;
      const wmCrm = wmCrmRef.current;
      const wmTag = wmTagRef.current;
      const progWrap = progWrapRef.current;
      const progFill = progFillRef.current;
      const progText = progTextRef.current;
      if (!pLogo || !pGrid || !iso || !wmMain || !wmCrm || !wmTag || !progWrap || !progFill || !progText) return;

      await wait(250);
      if (!aliveRef.current) return;
      pLogo.style.opacity = "1";

      iso.style.transition =
        "opacity .9s ease, transform .9s cubic-bezier(0.34, 1.56, 0.64, 1)";
      iso.style.opacity = "1";
      iso.style.transform = "scale(1) rotate(0deg)";
      await wait(450);
      if (!aliveRef.current) return;

      wmMain.style.transition = "opacity .6s ease, transform .6s ease";
      wmMain.style.opacity = "1";
      wmMain.style.transform = "translateX(0)";
      await wait(280);
      if (!aliveRef.current) return;

      wmCrm.style.transition = "opacity .5s, clip-path .5s";
      wmCrm.style.opacity = "1";
      wmCrm.style.clipPath = "inset(0 0% 0 0)";
      await wait(200);
      if (!aliveRef.current) return;

      wmTag.style.transition = "opacity .6s, color 1.2s";
      wmTag.style.opacity = "1";
      const tColor = setTimeout(() => {
        wmTag.style.color = "#7ab47a";
      }, 400);
      timeoutsRef.current.push(tColor);
      await wait(700);
      if (!aliveRef.current) return;

      pLogo.style.transition = "opacity .5s";
      pLogo.style.opacity = "0";
      await wait(450);
      if (!aliveRef.current) return;

      pGrid.style.opacity = "1";
      progWrap.style.transition = "opacity .4s";
      progWrap.style.opacity = "1";

      for (let i = 0; i < MODS.length; i++) {
        await wait(140);
        if (!aliveRef.current) return;
        const card = document.getElementById("crm-intro-mc" + i);
        if (card) {
          card.style.opacity = "1";
          card.style.transform = "translateY(0) scale(1)";
          const check = card.querySelector(".mcard-check");
          if (check) check.textContent = "✓";
          card.classList.add("done");
        }
        progText.textContent = MODS[i].name.toUpperCase();
        progFill.style.width =
          Math.round(((i + 1) / MODS.length) * 100) + "%";
      }
      await wait(350);
      if (!aliveRef.current) return;
      progText.textContent = "SISTEMA LISTO ✓";
      progFill.style.background = "linear-gradient(90deg,#b2e800,#00d4b8)";
      finish(550);
    })();

    function cleanup() {
      aliveRef.current = false;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current = [];
      const cv = canvasRef.current as any;
      if (cv && typeof cv.__cleanupResize === "function") cv.__cleanupResize();
    }

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!show) return null;

  return (
    <div
      aria-hidden="true"
      className={`crm-intro-root fixed inset-0 z-[100] overflow-hidden transition-opacity duration-[450ms] ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: "#06090f",
        fontFamily:
          "'Montserrat', system-ui, -apple-system, Segoe UI, sans-serif",
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Phase: Logo */}
      <div
        ref={phaseLogoRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity: 0 }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <svg
              ref={isoRef}
              width={84}
              height={84}
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                opacity: 0,
                transform: "scale(0.3) rotate(-180deg)",
              }}
            >
              <defs>
                <linearGradient id="crmIntroIg1" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#b2e800" />
                  <stop offset="50%" stopColor="#5bd4a0" />
                  <stop offset="100%" stopColor="#00b4d8" />
                </linearGradient>
              </defs>
              <circle cx="28" cy="28" r="20" fill="url(#crmIntroIg1)" opacity=".95" />
              <circle cx="72" cy="28" r="20" fill="url(#crmIntroIg1)" opacity=".85" />
              <circle cx="28" cy="72" r="20" fill="url(#crmIntroIg1)" opacity=".75" />
              <circle cx="72" cy="72" r="20" fill="url(#crmIntroIg1)" opacity=".65" />
              <path d="M50 36 L64 50 L50 64 L36 50 Z" fill="#06090f" />
              <path d="M50 42 L58 50 L50 58 L42 50 Z" fill="url(#crmIntroIg1)" />
            </svg>
            <div className="flex flex-col">
              <div
                ref={wmMainRef}
                style={{
                  fontSize: 64,
                  fontWeight: 900,
                  letterSpacing: 3,
                  lineHeight: 1,
                  background: "linear-gradient(135deg,#b2e800 0%,#00b4d8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  opacity: 0,
                  transform: "translateX(40px)",
                }}
              >
                TRAMMOS
              </div>
              <div
                ref={wmCrmRef}
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: 10,
                  color: "#b2e800",
                  opacity: 0,
                  clipPath: "inset(0 100% 0 0)",
                  marginTop: 4,
                }}
              >
                CRM
              </div>
            </div>
          </div>
          <div
            ref={wmTagRef}
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 5,
              color: "#1e3a1e",
              opacity: 0,
              marginTop: 14,
              textAlign: "center",
            }}
          >
            PLATAFORMA INTELIGENTE DE GESTIÓN
          </div>
        </div>
      </div>

      {/* Phase: Grid */}
      <div
        ref={phaseGridRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity: 0 }}
      >
        <div
          ref={gridRef}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 12,
            width: "min(620px, 92vw)",
          }}
        />
      </div>

      {/* Progress bar */}
      <div
        ref={progWrapRef}
        style={{
          position: "absolute",
          bottom: 36,
          left: "50%",
          transform: "translateX(-50%)",
          width: 320,
          maxWidth: "80vw",
          textAlign: "center",
          opacity: 0,
        }}
      >
        <div
          style={{
            height: 2,
            background: "#0d1a0d",
            borderRadius: 1,
            overflow: "hidden",
            marginBottom: 8,
          }}
        >
          <div
            ref={progFillRef}
            style={{
              height: "100%",
              width: "0%",
              borderRadius: 1,
              background: "linear-gradient(90deg,#b2e800,#00b4d8)",
              transition: "width .35s ease",
            }}
          />
        </div>
        <div
          ref={progTextRef}
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 4,
            color: "#5a8a5a",
          }}
        >
          INICIANDO
        </div>
      </div>

      <style>{`
        .crm-intro-root .mcard {
          background: rgba(178,232,0,0.04);
          border: 1px solid rgba(178,232,0,0.12);
          border-radius: 12px;
          padding: 14px 10px;
          text-align: center;
          opacity: 0;
          transform: translateY(20px) scale(0.9);
          transition: opacity .4s, transform .4s;
        }
        .crm-intro-root .mcard.lit {
          background: rgba(0,180,216,0.08);
          border-color: rgba(0,180,216,0.3);
        }
        .crm-intro-root .mcard-icon { font-size: 24px; margin-bottom: 6px; }
        .crm-intro-root .mcard-name {
          font-size: 9px; font-weight: 700; letter-spacing: 2px;
          color: #b2e800; text-transform: uppercase;
        }
        .crm-intro-root .mcard.lit .mcard-name { color: #00b4d8; }
        .crm-intro-root .mcard-check {
          font-size: 11px; color: #333; margin-top: 6px;
          font-weight: 600; transition: color .3s;
        }
        .crm-intro-root .mcard.done .mcard-check { color: #b2e800; }
        .crm-intro-root .mcard.lit.done .mcard-check { color: #00b4d8; }
      `}</style>
    </div>
  );
}
