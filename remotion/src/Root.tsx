import React from "react";
import { Composition } from "remotion";
import { PasajeroVideo, PASAJERO_DURATION } from "./videos/PasajeroVideo";
import { ConductorVideo, CONDUCTOR_DURATION } from "./videos/ConductorVideo";
import { HospitalVideo, HOSPITAL_DURATION } from "./videos/HospitalVideo";
import { IntroAprendiendo, INTRO_DURATION } from "./videos/IntroAprendiendo";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="pasajero" component={PasajeroVideo} durationInFrames={PASAJERO_DURATION} fps={30} width={1920} height={1080} />
    <Composition id="conductor" component={ConductorVideo} durationInFrames={CONDUCTOR_DURATION} fps={30} width={1920} height={1080} />
    <Composition id="hospital" component={HospitalVideo} durationInFrames={HOSPITAL_DURATION} fps={30} width={1920} height={1080} />
    <Composition id="intro-aprendiendo" component={IntroAprendiendo} durationInFrames={INTRO_DURATION} fps={30} width={1080} height={1920} />
  </>
);
