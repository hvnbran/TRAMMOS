import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { TransitionSeries, springTiming, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { IntroCard } from "../components/IntroCard";
import { RealScene } from "../components/RealScene";
import { OutroCard } from "../components/OutroCard";

const S = 90; // ~3s per scene
const INTRO = 120;
const OUTRO = 90;

const scenes: { src: string; caption: string; subtitle?: string }[] = [
  { src: "real/admin/01-home.png", caption: "Panel de Administración", subtitle: "Dashboard central con métricas de flota, servicios y cumplimiento en tiempo real." },
  { src: "real/admin/02-vehiculos.png", caption: "Módulo Vehículos", subtitle: "Cada tarjeta muestra placa, marca, estado y acceso directo a documentos y conductores asignados." },
  { src: "real/admin/14-vehiculo-modal.png", caption: "Documentos por vehículo", subtitle: "Ventana emergente con SOAT, RTM, tarjeta de operación y licencia — todo en formato horizontal." },
  { src: "real/admin/03-conductores.png", caption: "Módulo Conductores", subtitle: "Perfil completo por conductor: foto, licencia, cédula, exámenes médicos y planilla PILA." },
  { src: "real/admin/04-servicios-fijos.png", caption: "Servicios Fijos", subtitle: "Recurrencia Lun–Vie con horario libre o programado — el conductor abre y cierra la jornada desde su app." },
  { src: "real/admin/05-cuentas.png", caption: "Creación de Cuentas", subtitle: "Genera credenciales para conductores y clientes; contraseñas sincronizadas con la app de conductor." },
  { src: "real/admin/07-operacion.png", caption: "Operación de Servicios", subtitle: "Servicios empresariales, turismo, salud y escolares — importación desde Excel disponible." },
  { src: "real/admin/06-monitoreo.png", caption: "Monitoreo en Vivo", subtitle: "Ubicación GPS, estado del servicio y alertas de cumplimiento ANS en tiempo real." },
  { src: "real/admin/13-reportes.png", caption: "Reportes y Analítica", subtitle: "KPIs de flota, cumplimiento, facturación y utilización — exportables a Excel y PDF." },
];

export const ADMIN_DURATION = INTRO + scenes.length * S + OUTRO;

export const AdminVideo: React.FC = () => (
  <AbsoluteFill style={{ background: "#0B1120" }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={INTRO}>
        <IntroCard chip="MÓDULO ADMINISTRADOR" title="Control total de tu flota" subtitle="Vehículos, conductores, servicios, cumplimiento y monitoreo — en una sola plataforma." />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
      {scenes.map((sc, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={S}>
            <RealScene device="desktop" src={sc.src} caption={sc.caption} subtitle={sc.subtitle} duration={S} />
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
