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

// Hospital uses a refined red-tinged accent for medical brand — but we keep the palette elegant, not clinical.
const ACCENT = "#E11D48";
const COLD = 55;
const MANIFESTO = 110;
const INTER = 45;
const SCENE = 100;
const FINAL = 110;
const T = 8;

type Scene = { src: string; eyebrow: string; title: string; body: string; side: CaptionSide };

const scenes: Scene[] = [
  {
    src: "real/hospital/01-home.png",
    eyebrow: "01 — Portal",
    title: "Un portal solo para tu ESE.",
    body: "Vista dedicada al Hospital del Sur — tu flota, tu equipo, tus pacientes.",
    side: "left",
  },
  {
    src: "real/hospital/02-vehiculos.png",
    eyebrow: "02 — Flota",
    title: "Vehículos asignados.",
    body: "Placas, estado y documentos vigentes de la flota autorizada.",
    side: "right",
  },
  {
    src: "real/hospital/03-conductores.png",
    eyebrow: "03 — Equipo",
    title: "Conductores autorizados.",
    body: "Licencia, exámenes médicos y perfil — todo verificado.",
    side: "left",
  },
  {
    src: "real/hospital/07-pasajeros.png",
    eyebrow: "04 — Pacientes",
    title: "Pasajeros del hospital.",
    body: "Crea cuentas de pacientes con acceso directo a la app.",
    side: "right",
  },
  {
    src: "real/hospital/04-servicios.png",
    eyebrow: "05 — Servicios",
    title: "Solo lo tuyo.",
    body: "Filtrado automático de los servicios generados por pacientes del hospital.",
    side: "left",
  },
  {
    src: "real/hospital/05-monitoreo.png",
    eyebrow: "06 — Monitoreo",
    title: "Cada viaje, en vivo.",
    body: "Ubicación GPS y estado del servicio, en tiempo real.",
    side: "right",
  },
  {
    src: "real/hospital/06-cumplimiento.png",
    eyebrow: "07 — Cumplimiento",
    title: "ANS medibles. Auditables.",
    body: "Puntualidad, cobertura y calidad — reportes mes a mes.",
    side: "left",
  },
];

export const HOSPITAL_DURATION =
  COLD + MANIFESTO + INTER + SCENE * scenes.length + FINAL - T * (3 + scenes.length);

export const HospitalVideo: React.FC = () => (
  <AbsoluteFill style={{ background: "#050507" }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={COLD}>
        <ColdOpen label="Hospital del Sur · Itagüí" sub="Transporte especial en salud" accent={ACCENT} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />

      <TransitionSeries.Sequence durationInFrames={MANIFESTO}>
        <Manifesto
          kicker="Trammos · Hospital"
          lines={["Cada paciente.", "Cada viaje.", "Trazable."]}
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
              device="desktop"
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
        <FinalCard tagline="Transporte especial. Con la trazabilidad que la salud exige." accent={ACCENT} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
