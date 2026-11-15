"use client";

import React, { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, setupPointerParallax } from "@/lib/gsap";
import { sceneAssets } from "@/data/sceneAssets";
import { SceneSprite } from "./SceneSprite";

/** Astronaut helmet drifting with orbital compass ring beside the Lore & Creator heading. */
export function HelmetFloat() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = root.current?.closest("section") ?? root.current;
      const cleanupPointer = setupPointerParallax(section, 18);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-layer=helmet]",
          { y: 95, rotate: -12, scale: 0.92 },
          {
            y: -85,
            rotate: 8,
            scale: 1.04,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.15,
            },
          }
        );

        gsap.fromTo(
          "[data-layer=helmet-ring]",
          { rotate: -40, scale: 0.9 },
          {
            rotate: 45,
            scale: 1.08,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
            },
          }
        );

        gsap.fromTo(
          "[data-layer=helmet] [data-glint]",
          { xPercent: 0 },
          {
            xPercent: 330,
            duration: 1.5,
            ease: "power2.inOut",
            scrollTrigger: {
              trigger: section,
              start: "top 68%",
              toggleActions: "play none none reverse",
            },
          }
        );

        const floatLoop = gsap.to("[data-layer=helmet] [data-inner]", {
          y: -9,
          rotate: 1.8,
          duration: 2.7,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          paused: true,
        });

        ScrollTrigger.create({
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (self.isActive ? floatLoop.play() : floatLoop.pause()),
        });
      });

      return cleanupPointer;
    },
    { scope: root }
  );

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="absolute top-6 sm:top-10 right-[4%] lg:right-[8%] w-[clamp(140px,18vw,244px)] hidden md:block pointer-events-none"
    >
      <span className="absolute inset-[-28%] rounded-full bg-mars-500/18 blur-3xl" />
      <svg
        data-layer="helmet-ring"
        viewBox="0 0 260 260"
        className="scene-layer absolute inset-[-16%] w-[132%] h-[132%] opacity-65"
      >
        <circle
          cx="130"
          cy="130"
          r="118"
          fill="none"
          stroke="rgba(245,158,108,0.28)"
          strokeWidth="1"
          strokeDasharray="3 7"
        />
        <circle
          cx="130"
          cy="130"
          r="102"
          fill="none"
          stroke="rgba(56,189,248,0.22)"
          strokeWidth="1"
          strokeDasharray="18 12 4 12"
        />
      </svg>
      <SceneSprite
        asset={sceneAssets.astronautHelmet}
        layer="helmet"
        depth={0.85}
        rimGlow="amber"
        glint
      />
    </div>
  );
}
