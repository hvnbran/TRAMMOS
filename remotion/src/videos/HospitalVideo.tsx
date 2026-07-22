import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { IntroCard } from "../components/IntroCard";
import { RealScene } from "../components/RealScene";
import { OutroCard } from "../components/OutroCard";

const S = 95;
const INTRO = 120;
const OUTRO = 90;

const scenes: { src: string; caption: string; subtitle?: string }[] = [
  { src: "real/hospital/01-home.png", caption: "Portal Hospital del Sur", subtitle: "Vista dedicada a la ESE Itagüí — solo tu flota, tus conductores y tus pacientes." },
  { src: "real/hospital/02-vehiculos.png", caption: "Vehículos asignados", subtitle: "Consulta placas, estado y documentos vigentes de la flota asignada al hospital." },
  { src: "real/hospital/03-conductores.png", caption: "Conductores autorizados", subtitle: "Perfil, licencia y examen médico de cada conductor habilitado para servicios de salud." },
  { src: "real/hospital/07-pasajeros.png", caption: "Registrar pasajeros", subtitle: "Crea cuentas de pacientes/acompañantes con acceso directo a la app pasajero." },
  { src: "real/hospital/04-servicios.png", caption: "Servicios del hospital", subtitle: "Solo los servicios generados por pasajeros del Hospital del Sur — filtrado automático." },
  { src: "real/hospital/05-monitoreo.png", caption: "Monitoreo en vivo", subtitle: "Ubicación GPS del vehículo asignado y estado del servicio en curso." },
  { src: "real/hospital/06-cumplimiento.png", caption: "Cumplimiento ANS", subtitle: "KPIs de puntualidad, cobertura y calidad — auditables mes a mes." },
];

export const HOSPITAL_DURATION = INTRO + scenes.length * S + OUTRO;

export const HospitalVideo: React.FC = () => (
  <AbsoluteFill style={{ background: "#0B1120" }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={INTRO}>
        <IntroCard chip="HOSPITAL DEL SUR ITAGÜÍ" title="Transporte especial en salud" subtitle="Panel dedicado con acceso restringido a los recursos de tu ESE." brand="hospital" />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
      {scenes.map((sc, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={S}>
            <RealScene device="desktop" src={sc.src} caption={sc.caption} subtitle={sc.subtitle} duration={S} brand="hospital" />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition presentation={i % 2 === 0 ? slide({ direction: "from-right" }) : fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: 18 })} />
        </React.Fragment>
      ))}
      <TransitionSeries.Sequence durationInFrames={OUTRO}>
        <OutroCard />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
