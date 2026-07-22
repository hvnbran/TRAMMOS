import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { BgLayer } from "../components/BgLayer";
import { TitleCard } from "../components/TitleCard";
import { OutroCard } from "../components/OutroCard";
import { PLogin } from "../scenes/pasajero/PLogin";
import { PPedir } from "../scenes/pasajero/PPedir";
import { PViaje } from "../scenes/pasajero/PViaje";
import { PCalificar } from "../scenes/pasajero/PCalificar";
import { COLORS } from "../theme";

const S1 = 90;   // title 3s
const S2 = 240;  // login 8s
const S3 = 420;  // pedir 14s
const S4 = 420;  // viaje 14s
const S5 = 270;  // calificar 9s
const S6 = 180;  // outro 6s
export const PASAJERO_DURATION = S1+S2+S3+S4+S5+S6;

export const PasajeroVideo: React.FC = () => (
  <AbsoluteFill>
    <BgLayer />
    <Series>
      <Series.Sequence durationInFrames={S1}>
        <TitleCard eyebrow="App Pasajero" title="Pide tu servicio" subtitle="María, enfermera del Hospital del Sur, va de San Pío a Calatrava" accent={COLORS.cyan} />
      </Series.Sequence>
      <Series.Sequence durationInFrames={S2}><PLogin /></Series.Sequence>
      <Series.Sequence durationInFrames={S3}><PPedir /></Series.Sequence>
      <Series.Sequence durationInFrames={S4}><PViaje /></Series.Sequence>
      <Series.Sequence durationInFrames={S5}><PCalificar /></Series.Sequence>
      <Series.Sequence durationInFrames={S6}>
        <OutroCard tip="Activa notificaciones push y guarda tus destinos favoritos" accent={COLORS.cyan} />
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);
