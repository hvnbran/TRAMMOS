import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { IntroCard } from "../components/IntroCard";
import { RealScene } from "../components/RealScene";
import { OutroCard } from "../components/OutroCard";

const S = 100;
const INTRO = 110;
const OUTRO = 90;

const scenes: { src: string; caption: string; subtitle?: string }[] = [
  { src: "real/pasajero/04-hero.png", caption: "App Pasajero TRAMMOS", subtitle: "Pide tu servicio de transporte especial en segundos — hecho para Medellín y el Valle de Aburrá." },
  { src: "real/pasajero/01-home.png", caption: "Pantalla principal", subtitle: "Selecciona destino, revisa tus favoritos o repite tu último viaje con un toque." },
  { src: "real/pasajero/02-form.png", caption: "Formulario de solicitud", subtitle: "Ingresa origen, destino, fecha y hora — todo en la misma pantalla, sin pasos innecesarios." },
  { src: "real/pasajero/03-suggestions.png", caption: "Autocompletado inteligente", subtitle: "Sugerencias por cercanía usando Google Places — igual que Uber o DiDi." },
  { src: "real/pasajero/05-favoritos.png", caption: "Destinos favoritos", subtitle: "Guarda casa, oficina, colegio de los niños — pide en un toque desde tu lista." },
];

export const PASAJERO_DURATION = INTRO + scenes.length * S + OUTRO;

export const PasajeroVideo: React.FC = () => (
  <AbsoluteFill style={{ background: "#0B1120" }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={INTRO}>
        <IntroCard chip="APP PASAJERO" title="Pide tu servicio en segundos" subtitle="Transporte especial confiable, con conductores verificados y vehículos monitoreados." />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
      {scenes.map((sc, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={S}>
            <RealScene device="phone" src={sc.src} caption={sc.caption} subtitle={sc.subtitle} duration={S} />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={i % 2 === 0 ? slide({ direction: "from-right" }) : fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })} />
        </React.Fragment>
      ))}
      <TransitionSeries.Sequence durationInFrames={OUTRO}>
        <OutroCard />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
