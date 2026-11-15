import React from "react";
import { HeroStage } from "@/components/home/HeroStage";
import { BentoOutpostShowcase } from "@/components/home/BentoOutpostShowcase";
import { SciencePipelineBand } from "@/components/home/SciencePipelineBand";
import { LoreAndCreatorBand } from "@/components/home/LoreAndCreatorBand";
import { LaunchHorizonCTA } from "@/components/home/LaunchHorizonCTA";
import { OrbitalApproachScene } from "@/components/scenes/OrbitalApproachScene";
import {
  ScrollProgress,
  type ScrollProgressSection,
} from "@/components/ui/ScrollProgress";

const HOME_SECTIONS: ScrollProgressSection[] = [
  { id: "hero", label: "Outpost Command", code: "01", scrollOffset: 0 },
  { id: "orbital-approach", label: "Orbital Descent", code: "02", scrollOffset: 0 },
  { id: "outpost-systems", label: "Habitat & Fleet", code: "03", scrollOffset: 16 },
  { id: "planetary-science", label: "NASA Science", code: "04", scrollOffset: 16 },
  { id: "story-creator", label: "Lore & Creator", code: "05", scrollOffset: 16 },
  { id: "launch-horizon", label: "Launch Horizon", code: "06", scrollOffset: 16 },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroStage />
      <OrbitalApproachScene />
      <BentoOutpostShowcase />
      <SciencePipelineBand />
      <LoreAndCreatorBand />
      <LaunchHorizonCTA />
      <ScrollProgress sections={HOME_SECTIONS} offset={140} />
    </div>
  );
}
