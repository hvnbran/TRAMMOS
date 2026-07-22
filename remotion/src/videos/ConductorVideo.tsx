import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { ColdOpen } from "../components/ColdOpen";
import { Manifesto } from "../components/Manifesto";
import { BrandInterstitial } from "../components/BrandInterstitial";
import { CinemaScene, CaptionSide } from "../components/CinemaScene";
import { FinalCard } from "../components/FinalCard";
import "../components/fonts";

const ACCENT = "#00B4D8";
const COLD = 55;
const MANIFESTO = 100;
const INTER = 45;
const SCENE = 100;
const FINAL = 100;
const T = 8;

type Scene = { src: string; eyebrow: string; title: string; body: string; side: CaptionSide };

const scenes: Scene[] = [
  {
    src: "real/conductor/01-login.png",
    eyebrow: "01 — Ingreso",
    title: "Tu jornada empieza aquí.",
    body: "Login con cédula y contraseña — acceso directo desde WhatsApp.",
    side: "left",
  },
  {
    src: "real/conductor/02-login-filled.png",
    eyebrow: "02 — Credenciales",
    title: "Seguro. Sincronizado.",
    body: "Tu contraseña siempre en línea con el panel de administración.",
    side: "right",
  },
  {
    src: "real/conductor/03-home.png",
    eyebrow: "03 — Panel",
    title: "Todo el día, en tu mano.",
    body: "Servicios asignados, jornada activa y notificaciones — de un vistazo.",
    side: "left",
  },
  {
    src: "real/conductor/04-fijos.png",
    eyebrow: "04 — Fijos",
    title: "Rutas que se repiten, listas.",
    body: "Abre y cierra tu jornada con un toque — el sistema hace el resto.",
    side: "right",
  },
  {
    src: "real/conductor/05-servicios.png",
    eyebrow: "05 — Servicios",
    title: "Tu día, ordenado.",
    body: "Historial y estado — origen, destino, hora y pasajero, siempre a mano.",
    side: "left",
  },
];

export const CONDUCTOR_DURATION =
  COLD + MANIFESTO + INTER + SCENE * scenes.length + FINAL - T * (3 + scenes.length);

export const ConductorVideo: React.FC = () => (
  <AbsoluteFill style={{ background: "#050507" }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={COLD}>
        <ColdOpen label="App Conductor" sub="Diseñada para ti" accent={ACCENT} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

      <TransitionSeries.Sequence durationInFrames={MANIFESTO}>
        <Manifesto
          kicker="Trammos · Conductor"
          lines={["Tu jornada.", "Tu ritmo.", "Bajo control."]}
          accent={ACCENT}
        />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

      <TransitionSeries.Sequence durationInFrames={INTER}>
        <BrandInterstitial accent={ACCENT} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

      {scenes.map((s, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={SCENE}>
            <CinemaScene
              device="phone"
              src={s.src}
              eyebrow={s.eyebrow}
              title={s.title}
              body={s.body}
              duration={SCENE}
              side={s.side}
              accent={ACCENT}
            />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
        </React.Fragment>
      ))}

      <TransitionSeries.Sequence durationInFrames={FINAL}>
        <FinalCard tagline="Maneja. Registra. Cumple." accent={ACCENT} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
