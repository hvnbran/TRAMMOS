import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { BgLayer } from "../components/BgLayer";
import { TitleCard } from "../components/TitleCard";
import { OutroCard } from "../components/OutroCard";
import { HLogin } from "../scenes/hospital/HLogin";
import { HPasajero } from "../scenes/hospital/HPasajero";
import { HMonitoreo } from "../scenes/hospital/HMonitoreo";
import { HAns } from "../scenes/hospital/HAns";
import { COLORS } from "../theme";

const S1=90, S2=240, S3=390, S4=360, S5=270, S6=180;
export const HOSPITAL_DURATION = S1+S2+S3+S4+S5+S6;

export const HospitalVideo: React.FC = () => (
  <AbsoluteFill>
    <BgLayer hospital />
    <Series>
      <Series.Sequence durationInFrames={S1}>
        <TitleCard eyebrow="Panel Hospital del Sur" title="Tu operación en vivo" subtitle="Solo tus vehículos, conductores, pasajeros y servicios" accent={COLORS.hospital} logo="assets/logo-hospital.png" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={S2}><HLogin /></Series.Sequence>
      <Series.Sequence durationInFrames={S3}><HPasajero /></Series.Sequence>
      <Series.Sequence durationInFrames={S4}><HMonitoreo /></Series.Sequence>
      <Series.Sequence durationInFrames={S5}><HAns /></Series.Sequence>
      <Series.Sequence durationInFrames={S6}>
        <OutroCard tip="Sedes preconfiguradas: San Pío, Santamaría y Calatrava" accent={COLORS.hospital} />
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);
