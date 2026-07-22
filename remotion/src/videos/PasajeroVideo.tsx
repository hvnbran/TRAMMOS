import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { ColdOpen } from "../components/ColdOpen";
import { Manifesto } from "../components/Manifesto";
import { BrandInterstitial } from "../components/BrandInterstitial";
import { CinemaScene, CaptionSide } from "../components/CinemaScene";
import { FinalCard } from "../components/FinalCard";
// Load fonts at module scope
import "../components/fonts";

const ACCENT = "#00B4D8";
const COLD = 55;
const MANIFESTO = 100;
const INTER = 45;
const SCENE = 100;
const FINAL = 100;
const T = 8; // transition frames

type Scene = { src: string; eyebrow: string; title: string; body: string; side: CaptionSide };

const scenes: Scene[] = [
  {
    src: "real/pasajero/04-hero.png",
    eyebrow: "01 — Bienvenida",
    title: "Tu ciudad, más cerca.",
    body: "Un servicio de transporte especial hecho para Medellín y el Valle de Aburrá.",
    side: "left",
  },
  {
    src: "real/pasajero/01-home.png",
    eyebrow: "02 — Inicio",
    title: "Todo en una sola pantalla.",
    body: "Destino, favoritos y tu último viaje, listos con un toque.",
    side: "right",
  },
  {
    src: "real/pasajero/02-form.png",
    eyebrow: "03 — Solicitar",
    title: "De la idea al viaje, sin fricción.",
    body: "Origen, destino, fecha y hora — todo en la misma vista.",
    side: "left",
  },
  {
    src: "real/pasajero/03-suggestions.png",
    eyebrow: "04 — Autocompletado",
    title: "Sugerencias inteligentes.",
    body: "Google Places sugiere lugares cercanos con precisión — como Uber o DiDi.",
    side: "right",
  },
  {
    src: "real/pasajero/05-favoritos.png",
    eyebrow: "05 — Favoritos",
    title: "Tus lugares, un toque.",
    body: "Casa, oficina, colegio de los niños — guardados y listos.",
    side: "left",
  },
];

export const PASAJERO_DURATION =
  COLD + MANIFESTO + INTER + SCENE * scenes.length + FINAL - T * (3 + scenes.length);

export const PasajeroVideo: React.FC = () => (
  <AbsoluteFill style={{ background: "#050507" }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={COLD}>
        <ColdOpen label="App Pasajero" sub="Medellín · Valle de Aburrá" accent={ACCENT} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

      <TransitionSeries.Sequence durationInFrames={MANIFESTO}>
        <Manifesto
          kicker="Trammos · Pasajero"
          lines={["Un toque.", "Un carro.", "Tu ciudad."]}
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
        <FinalCard tagline="Pide tu servicio. Vive tu ciudad." accent={ACCENT} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
