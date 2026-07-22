import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { BgLayer } from "../components/BgLayer";
import { TitleCard } from "../components/TitleCard";
import { OutroCard } from "../components/OutroCard";
import { ABuscar } from "../scenes/admin/ABuscar";
import { AOperacion } from "../scenes/admin/AOperacion";
import { AFijo } from "../scenes/admin/AFijo";
import { ACuentas } from "../scenes/admin/ACuentas";
import { COLORS } from "../theme";

const S1=90, S2=390, S3=390, S4=360, S5=300, S6=180;
export const ADMIN_DURATION = S1+S2+S3+S4+S5+S6;

export const AdminVideo: React.FC = () => (
  <AbsoluteFill>
    <BgLayer />
    <Series>
      <Series.Sequence durationInFrames={S1}>
        <TitleCard eyebrow="Panel Admin" title="Todo el control" subtitle="Vehículos, conductores, operación, monitoreo y servicios fijos" accent={COLORS.cyan} />
      </Series.Sequence>
      <Series.Sequence durationInFrames={S2}><ABuscar /></Series.Sequence>
      <Series.Sequence durationInFrames={S3}><AOperacion /></Series.Sequence>
      <Series.Sequence durationInFrames={S4}><AFijo /></Series.Sequence>
      <Series.Sequence durationInFrames={S5}><ACuentas /></Series.Sequence>
      <Series.Sequence durationInFrames={S6}>
        <OutroCard tip="Busca por placa o conductor: la ficha se abre en un solo clic" accent={COLORS.cyan} />
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);
