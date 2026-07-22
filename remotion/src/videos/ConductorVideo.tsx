import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { BgLayer } from "../components/BgLayer";
import { TitleCard } from "../components/TitleCard";
import { OutroCard } from "../components/OutroCard";
import { CLogin } from "../scenes/conductor/CLogin";
import { CHome } from "../scenes/conductor/CHome";
import { CTurno } from "../scenes/conductor/CTurno";
import { CFinalizar } from "../scenes/conductor/CFinalizar";
import { COLORS } from "../theme";

const S1=90, S2=210, S3=390, S4=390, S5=270, S6=180;
export const CONDUCTOR_DURATION = S1+S2+S3+S4+S5+S6;

export const ConductorVideo: React.FC = () => (
  <AbsoluteFill>
    <BgLayer />
    <Series>
      <Series.Sequence durationInFrames={S1}>
        <TitleCard eyebrow="App Conductor" title="Tu jornada, tu ritmo" subtitle="Milton (placa QWN462) opera el fijo L–V del Hospital del Sur" accent={COLORS.lime} />
      </Series.Sequence>
      <Series.Sequence durationInFrames={S2}><CLogin /></Series.Sequence>
      <Series.Sequence durationInFrames={S3}><CHome /></Series.Sequence>
      <Series.Sequence durationInFrames={S4}><CTurno /></Series.Sequence>
      <Series.Sequence durationInFrames={S5}><CFinalizar /></Series.Sequence>
      <Series.Sequence durationInFrames={S6}>
        <OutroCard tip="Instala TRAMMOS como app en tu celular desde el navegador" accent={COLORS.lime} />
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);
