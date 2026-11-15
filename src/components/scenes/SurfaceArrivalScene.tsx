"use client";

import React from "react";
import { sceneAssets } from "@/data/sceneAssets";
import { SceneSprite, SpriteImg } from "./SceneSprite";
import type { SceneBeat } from "./SceneCaptions";

export const SURFACE_BEATS: SceneBeat[] = [
  {
    kicker: "SOL 1 · Outpost Activation",
    title: "Pressurized habitat modules lock onto the basalt plain.",
    detail:
      "Primary life-support cylinders, central airlock, and engineering bays initialize across the Elysium Planitia landing site.",
    metricLabel: "Hull Pressure",
    metricValue: "101.3 KPA · NOMINAL",
    accent: "mars",
  },
  {
    kicker: "SOL 4 · Surface Mobility",
    title: "Six-wheel utility rover deploys across the regolith ridge.",
    detail:
      "Articulated rocker-bogie suspension and mast spectrometer traverse the 200-meter perimeter toward the geological sample trench.",
    metricLabel: "Drive Range",
    metricValue: "14.8 KM · AUTONOMOUS",
    accent: "mars",
  },
  {
    kicker: "SOL 8 · Aerial Reconnaissance",
    title: "Coaxial quad-rotor drone scans the canyon horizon.",
    detail:
      "High-rpm Martian rotors hold altitude in the 6-millibar atmosphere while optical LiDAR maps surrounding lava tubes.",
    metricLabel: "Scanner Swath",
    metricValue: "1.0 M/PX HIRISE SYNC",
    accent: "cyan",
  },
];

/**
 * Stage 2 visual layer rendered inside OrbitalApproachScene's shared pinned
 * viewport so Orbital Approach cross-dissolves directly into Surface Arrival
 * with zero unpin/repin seam and zero blank screen.
 */
export function SurfaceArrivalStage() {
  return (
    <div
      data-stage="surface"
      aria-hidden="true"
      className="scene-stage-surface absolute inset-0 z-[6] pointer-events-none overflow-hidden bg-[linear-gradient(180deg,#04070e_0%,#120b16_28%,#331710_60%,#5c2614_86%,#120806_100%)]"
    >
      <div className="starfield starfield-far starfield-fade" />
      <div data-layer="sun" className="scene-layer scene-sun" />
      <div data-layer="sunbeams" className="scene-layer scene-sunbeams" />

      {/* Far ridge: two desaturated outcrops on the horizon */}
      <div
        data-layer="ridge"
        className="scene-layer absolute inset-x-[-4%] bottom-[24%] pointer-events-none"
      >
        <div data-depth="0.16" className="scene-layer flex items-end justify-between opacity-75">
          <div className="w-[44%] max-w-[580px]">
            <SpriteImg
              asset={sceneAssets.marsTerrain}
              style={{ filter: "blur(2px) saturate(0.72) brightness(0.56)" }}
            />
          </div>
          <div className="w-[38%] max-w-[500px]">
            <SpriteImg
              asset={sceneAssets.marsTerrain}
              flip
              style={{ filter: "blur(2.5px) saturate(0.7) brightness(0.5)" }}
            />
          </div>
        </div>
      </div>

      {/* Martian ground plane with feathered horizon blend */}
      <div
        className="absolute inset-x-0 bottom-0 h-[34%] bg-[linear-gradient(180deg,transparent_0%,rgba(90,39,21,0.75)_18%,#3a190e_52%,#090608_100%)]"
      />

      {/* Drifting atmospheric dust motes */}
      <div
        data-layer="dust-motes"
        className="scene-layer scene-dust-field absolute inset-[-10%] z-[2] pointer-events-none"
      />

      {/* Habitat Module with docking ring beacon */}
      <SceneSprite
        asset={sceneAssets.habitatModule}
        layer="habitat"
        depth={0.4}
        className="absolute bottom-[19%] right-[4%] md:right-[8%] w-[clamp(280px,48vw,740px)]"
        filter="brightness(0.94) saturate(1.06)"
        rimGlow="mars"
        glint
        shadow
      >
        <span className="scene-habitat-beacon" />
      </SceneSprite>

      {/* Six-wheel Mars Rover + wheel dust plume */}
      <SceneSprite
        asset={sceneAssets.marsRover}
        layer="rover"
        depth={0.72}
        className="absolute bottom-[6%] left-[3%] md:left-[7%] w-[clamp(210px,36vw,600px)] z-[3]"
        rimGlow="amber"
        shadow
      >
        <span data-layer="rover-plume" className="rover-dust-plume" />
      </SceneSprite>

      {/* Exploration Drone + volumetric cyan LiDAR scanner cone */}
      <SceneSprite
        asset={sceneAssets.explorationDrone}
        layer="drone"
        depth={0.96}
        className="absolute top-[26%] md:top-[16%] right-[8%] md:right-[13%] w-[clamp(160px,26vw,440px)] z-[4]"
        rimGlow="cyan"
      >
        <span data-layer="scan-cone" className="drone-scan-cone" />
      </SceneSprite>

      {/* Foreground framing rocks */}
      <SceneSprite
        asset={sceneAssets.marsTerrain}
        layer="rocks-right"
        depth={1.32}
        className="absolute bottom-[-12%] right-[-10%] w-[clamp(240px,40vw,640px)] z-[6]"
        filter="blur(4px) brightness(0.52)"
      />
      <SceneSprite
        asset={sceneAssets.marsTerrain}
        layer="rocks-left"
        depth={1.38}
        className="absolute bottom-[-16%] left-[-12%] w-[clamp(260px,36vw,600px)] z-[6] hidden md:block"
        filter="blur(5px) brightness(0.44)"
        flip
      />

      <div className="absolute inset-0 scene-vignette pointer-events-none" />
      {/* Bottom feather fade into BentoOutpostShowcase */}
      <div
        className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-space-950 via-space-950/70 to-transparent z-[7] pointer-events-none"
      />
    </div>
  );
}

/** Kept as a pass-through in case imported standalone; mounted inside OrbitalApproachScene. */
export function SurfaceArrivalScene() {
  return null;
}
