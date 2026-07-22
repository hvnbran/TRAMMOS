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
  { src: "real/conductor/01-login.png", caption: "Ingreso del Conductor", subtitle: "Login con cédula y contraseña — acceso directo desde el enlace enviado por WhatsApp." },
  { src: "real/conductor/02-login-filled.png", caption: "Credenciales seguras", subtitle: "Contraseña sincronizada con el panel admin — si te la cambian, entra al instante." },
  { src: "real/conductor/03-home.png", caption: "Panel del Conductor", subtitle: "Servicios asignados, jornada activa y notificaciones — todo en la pantalla principal." },
  { src: "real/conductor/04-fijos.png", caption: "Servicios Fijos", subtitle: "Rutas recurrentes (ej. Hospital del Sur) — abre y cierra la jornada con un toque." },
  { src: "real/conductor/05-servicios.png", caption: "Servicios del día", subtitle: "Historial y estado de cada carrera — origen, destino, hora y pasajero." },
];

export const CONDUCTOR_DURATION = INTRO + scenes.length * S + OUTRO;

export const ConductorVideo: React.FC = () => (
  <AbsoluteFill style={{ background: "#0B1120" }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={INTRO}>
        <IntroCard chip="APP CONDUCTOR" title="Tu jornada en tu mano" subtitle="Login, servicios asignados, apertura y cierre de jornada — desde el celular." />
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
