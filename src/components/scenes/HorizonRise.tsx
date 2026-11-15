"use client";

import React, { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, setupPointerParallax } from "@/lib/gsap";
import { sceneAssets } from "@/data/sceneAssets";
import { SceneSprite } from "./SceneSprite";

/** Red-rock horizon, atmospheric rim glow, and EVA astronaut rising behind the launch CTA card. */
export function HorizonRise() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = root.current?.closest("section") ?? root.current;
      const cleanupPointer = setupPointerParallax(section, 20);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "center 52%",
            scrub: 1.15,
          },
        });

        tl.fromTo(
          "[data-layer=cta-horizon-glow]",
          { yPercent: 35, scale: 0.85, opacity: 0.2 },
          { yPercent: 0, scale: 1.08, opacity: 0.9, duration: 1 },
          0
        )
          .fromTo("[data-layer=horizon-back]", { yPercent: 48 }, { yPercent: 0, duration: 1 }, 0)
          .fromTo("[data-layer=horizon-front]", { yPercent: 85 }, { yPercent: 0, duration: 1 }, 0)
          .fromTo(
            "[data-layer=astronaut]",
            { yPercent: 36, scale: 0.92, autoAlpha: 0 },
            { yPercent: 0, scale: 1, autoAlpha: 1, duration: 0.78, ease: "power2.out" },
            0.22
          )
          .fromTo(
            "[data-layer=astronaut] [data-glint]",
            { xPercent: 0 },
            { xPercent: 330, duration: 0.35, ease: "power1.inOut" },
            0.62
          );

        const idle = gsap.to("[data-layer=astronaut] [data-inner]", {
          y: -5,
          rotate: 0.6,
          duration: 3.1,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          paused: true,
        });

        ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (self.isActive ? idle.play() : idle.pause()),
        });
      });

      return cleanupPointer;
    },
    { scope: root }
  );

  return (
    <div ref={root} aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Planetary horizon rim flare */}
      <div
        data-layer="cta-horizon-glow"
        className="scene-layer absolute inset-x-[-10%] bottom-[-18%] h-[340px] rounded-[100%] bg-[radial-gradient(ellipse_at_50%_75%,rgba(232,108,72,0.34)_0%,rgba(245,158,11,0.14)_42%,transparent_72%)] blur-2xl"
      />

      <SceneSprite
        asset={sceneAssets.astronaut}
        layer="astronaut"
        depth={0.78}
        className="absolute bottom-[3%] right-[2%] xl:right-[5%] 2xl:right-[8%] w-[clamp(165px,14vw,255px)] hidden lg:block z-[2]"
        filter="brightness(0.94)"
        rimGlow="mars"
        glint
        shadow
      >
        <span className="astronaut-tablet-glow" />
      </SceneSprite>

      <div
        data-layer="horizon-back"
        className="scene-layer absolute inset-x-[-5%] bottom-0 flex items-end justify-between"
      >
        <div className="w-[38%] max-w-[520px] -mb-[3%]">
          <SceneSprite
            asset={sceneAssets.marsTerrain}
            layer="rock-a"
            depth={0.32}
            filter="brightness(0.46) saturate(0.82) blur(1px)"
          />
        </div>
        <div className="w-[32%] max-w-[460px] -mb-[2%]">
          <SceneSprite
            asset={sceneAssets.marsTerrain}
            layer="rock-b"
            depth={0.38}
            filter="brightness(0.42) saturate(0.8) blur(1px)"
            flip
          />
        </div>
      </div>

      <div
        data-layer="horizon-front"
        className="scene-layer absolute inset-x-[-8%] bottom-0 flex items-end justify-between z-[3]"
      >
        <div className="w-[30%] max-w-[420px] -mb-[4%]">
          <SceneSprite
            asset={sceneAssets.marsTerrain}
            layer="rock-c"
            depth={1.12}
            filter="brightness(0.32) blur(2.5px)"
            flip
          />
        </div>
        <div className="w-[34%] max-w-[480px] -mb-[5%]">
          <SceneSprite
            asset={sceneAssets.marsTerrain}
            layer="rock-d"
            depth={1.18}
            filter="brightness(0.3) blur(3px)"
          />
        </div>
      </div>
    </div>
  );
}
