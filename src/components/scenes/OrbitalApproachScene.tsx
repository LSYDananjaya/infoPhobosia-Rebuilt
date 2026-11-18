"use client";

import React, { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, setupPointerParallax } from "@/lib/gsap";
import { sceneAssets } from "@/data/sceneAssets";
import { SceneSprite, SpriteImg } from "./SceneSprite";
import { SceneCaptions, SceneProgress, type SceneBeat } from "./SceneCaptions";
import { SurfaceArrivalStage, SURFACE_BEATS } from "./SurfaceArrivalScene";

const ORBITAL_BEATS: SceneBeat[] = [
  {
    kicker: "Transfer Orbit · 225M km",
    title: "Seven months out, the Red Planet commands the viewport.",
    detail:
      "Approaching along a heliocentric Hohmann transfer trajectory as Valles Marineris rotates across the sunlit hemisphere.",
    metricLabel: "Insertion Window",
    metricValue: "T-MINUS 00:42:18",
    accent: "mars",
  },
  {
    kicker: "Orbit Insertion · 400 km",
    title: "Reconnaissance orbiter locks the telemetry relay.",
    detail:
      "Solar-array relay satellite aligns with NASA HiRISE DTM strip DTEEC_017983_1865 to guide surface descent.",
    metricLabel: "Relay Link",
    metricValue: "LOCKED · 32.4 MBPS",
    accent: "cyan",
  },
  {
    kicker: "Atmospheric Entry · 4.5° N 135.9° E",
    title: "Descending through the upper atmosphere to Elysium Planitia.",
    detail:
      "Spacecraft curves over the planetary horizon as the volcanic plains and pressurized PHOBOSIA outpost come into view.",
    metricLabel: "Target Elevation",
    metricValue: "-2,930 M MOLA",
    accent: "mars",
  },
];

const ALL_BEATS: SceneBeat[] = [...ORBITAL_BEATS, ...SURFACE_BEATS];

export function OrbitalApproachScene() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const cleanupPointer = setupPointerParallax(root.current, 22);
      const mm = gsap.matchMedia();

      mm.add(
        {
          desktop: "(min-width: 768px)",
          mobile: "(max-width: 767px)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (ctx) => {
          const { desktop, reduce } = ctx.conditions as {
            desktop: boolean;
            mobile: boolean;
            reduce: boolean;
          };
          if (reduce) return;

          // Idle loops on inner wrappers, paused while off-screen
          const loops = [
            gsap.to("[data-layer=satellite] [data-inner]", {
              y: -7,
              rotate: 1.2,
              duration: 2.8,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
              paused: true,
            }),
            gsap.to("[data-layer=ast-mid] [data-inner]", {
              y: 6,
              rotate: -2.2,
              duration: 3.4,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
              paused: true,
            }),
            gsap.to("[data-layer=drone] [data-inner]", {
              y: 10,
              rotate: 1.6,
              duration: 1.75,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
              paused: true,
            }),
            gsap.to("[data-layer=rover] [data-inner]", {
              y: -2.2,
              rotate: 0.45,
              duration: 0.28,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
              paused: true,
            }),
          ];

          ScrollTrigger.create({
            trigger: root.current,
            start: "top bottom",
            end: "bottom top",
            onToggle: (self) => loops.forEach((l) => (self.isActive ? l.play() : l.pause())),
          });

          const stageEl = root.current?.querySelector<HTMLElement>("[data-telemetry-stage]");
          const primaryLabelEl = root.current?.querySelector<HTMLElement>("[data-telemetry-primary-label]");
          const primaryEl = root.current?.querySelector<HTMLElement>("[data-telemetry-primary]");
          const secondaryLabelEl = root.current?.querySelector<HTMLElement>("[data-telemetry-secondary-label]");
          const secondaryEl = root.current?.querySelector<HTMLElement>("[data-telemetry-secondary]");

          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: desktop ? "+=450%" : "+=340%",
              scrub: desktop ? 1.15 : 0.7,
              pin: "[data-pin]",
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                if (!primaryEl || !secondaryEl) return;
                const p = self.progress;
                if (p < 0.5) {
                  const op = p / 0.5; // 0 .. 1 across orbital stage
                  if (stageEl) stageEl.textContent = "SOL 0 · Orbital Approach";
                  if (primaryLabelEl) primaryLabelEl.textContent = "ALTITUDE";
                  if (secondaryLabelEl) secondaryLabelEl.textContent = "VELOCITY";
                  const alt = Math.round(42800 * Math.pow(1 - op, 2.2) + 85);
                  const vel = (4.82 + op * 0.94).toFixed(2);
                  primaryEl.textContent =
                    op > 0.8 ? `${alt} KM · ENTRY` : `${alt.toLocaleString("en-US")} KM`;
                  secondaryEl.textContent = `${vel} KM/S`;
                } else {
                  const sp = (p - 0.5) / 0.5; // 0 .. 1 across surface stage
                  if (stageEl) stageEl.textContent = "SOL 1–8 · Surface Operations";
                  if (primaryLabelEl) primaryLabelEl.textContent = "SECTOR";
                  if (secondaryLabelEl) secondaryLabelEl.textContent = "SURFACE WIND";
                  const sol =
                    sp < 0.34 ? "SOL 01 · HABITAT" : sp < 0.66 ? "SOL 04 · ROVER" : "SOL 08 · RECON";
                  const wind = (11.4 + Math.sin(sp * Math.PI) * 6.8).toFixed(1);
                  primaryEl.textContent = sol;
                  secondaryEl.textContent = `${wind} M/S ENE`;
                }
              },
            },
          });

          // Initial states
          gsap.set('[data-stage="surface"]', { autoAlpha: 0 });
          gsap.set('[data-beat="0"] [data-word]', { yPercent: 0, autoAlpha: 1 });
          gsap.set(
            '[data-beat="1"] [data-word], [data-beat="2"] [data-word], [data-beat="3"] [data-word], [data-beat="4"] [data-word], [data-beat="5"] [data-word]',
            { yPercent: 110, autoAlpha: 0 }
          );

          // ==================================================================
          // STAGE 1: ORBITAL APPROACH (0.00 -> 0.50)
          // ==================================================================
          tl.fromTo("[data-layer=progress]", { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0)
            .fromTo(
              "[data-layer=stars-far]",
              { yPercent: 0, scale: 1 },
              { yPercent: -10, scale: 1.05, duration: 0.54 },
              0
            )
            .fromTo(
              "[data-layer=stars-near]",
              { yPercent: 0, scale: 1 },
              { yPercent: -22, scale: 1.12, duration: 0.54 },
              0
            )
            // Mars rises into center, then curves down to form the planetary horizon
            .fromTo(
              "[data-layer=mars]",
              {
                scale: desktop ? 0.54 : 0.72,
                xPercent: desktop ? 10 : 4,
                yPercent: desktop ? 38 : 20,
              },
              {
                scale: desktop ? 1.28 : 1.26,
                xPercent: 0,
                yPercent: desktop ? 4 : -10,
                duration: 0.28,
                ease: "power1.inOut",
              },
              0
            )
            .to(
              "[data-layer=mars]",
              {
                scale: desktop ? 2.45 : 2.15,
                xPercent: 0,
                yPercent: desktop ? 52 : 38,
                duration: 0.26,
                ease: "power2.inOut",
              },
              0.28
            )
            .fromTo("[data-layer=mars-surface]", { rotate: -12 }, { rotate: 8, duration: 0.54 }, 0)
            .fromTo(
              "[data-layer=mars-halo]",
              { opacity: 0.45, scale: 0.92 },
              { opacity: 1, scale: 1.18, duration: 0.5 },
              0
            )
            // Orbital trajectory ring draw + fade before horizon descent
            .fromTo(
              "[data-layer=orbital-arc]",
              { strokeDashoffset: 900, opacity: 0.25 },
              { strokeDashoffset: 0, opacity: 0.9, duration: 0.28, ease: "power1.out" },
              0.02
            )
            .to("[data-layer=orbital-ring]", { scale: 1.32, opacity: 0, duration: 0.14 }, 0.34)
            // Mid-ground asteroid cluster drift
            .fromTo(
              "[data-layer=ast-mid]",
              { x: "38vw", y: "12vh", scale: 0.72, rotate: 8 },
              { x: "-58vw", y: "-16vh", scale: 1.12, rotate: -38, duration: 0.46 },
              0.02
            )
            // Curved 2-stage satellite slingshot fly-by
            .fromTo(
              "[data-layer=satellite]",
              { x: "-68vw", y: "22vh", scale: 0.56, rotate: -22 },
              {
                x: "-4vw",
                y: "-2vh",
                scale: 1.04,
                rotate: -3,
                duration: 0.18,
                ease: "power1.out",
              },
              0.05
            )
            .to(
              "[data-layer=satellite]",
              {
                x: "68vw",
                y: "-26vh",
                scale: 0.74,
                rotate: 15,
                duration: 0.18,
                ease: "power1.in",
              },
              0.23
            )
            .fromTo(
              "[data-layer=satellite] [data-glint]",
              { xPercent: 0 },
              { xPercent: 330, duration: 0.12, ease: "power1.inOut" },
              0.17
            )
            .fromTo(
              "[data-layer=ast-far]",
              { x: desktop ? "-16vw" : "-12vw", y: "-4vh", rotate: -6, scale: 0.85 },
              { x: desktop ? "22vw" : "18vw", y: "-12vh", rotate: 24, scale: 1.05, duration: 0.48 },
              0
            )
            .fromTo(
              "[data-layer=ast-near]",
              { x: desktop ? "78vw" : "66vw", y: "22vh", scale: desktop ? 0.88 : 0.78, rotate: 6 },
              { x: desktop ? "-118vw" : "-95vw", y: "-10vh", scale: desktop ? 1.28 : 1.08, rotate: -30, duration: 0.22 },
              0.22
            );

          // ==================================================================
          // SEAMLESS HORIZON CROSS-DISSOLVE (0.44 -> 0.55)
          // No opaque wall: Surface stage dissolves in right over the planet!
          // ==================================================================
          tl.fromTo(
            "[data-layer=entry-veil]",
            { opacity: 0, yPercent: 24 },
            { opacity: 0.38, yPercent: 0, duration: 0.06, ease: "sine.out" },
            0.44
          )
            .to(
              "[data-layer=entry-veil]",
              { opacity: 0, yPercent: -24, duration: 0.07, ease: "sine.in" },
              0.5
            )
            .fromTo(
              '[data-stage="surface"]',
              { autoAlpha: 0 },
              { autoAlpha: 1, duration: 0.1, ease: "power2.inOut" },
              0.45
            )
            // Glide the HUD caption deck smoothly from lower-left to upper-left on desktop, while keeping lower-viewport framing on mobile so sprites stay unobstructed
            .fromTo(
              "[data-layer=caption-deck]",
              { y: "0vh" },
              { y: desktop ? "-44vh" : "-2vh", duration: 0.1, ease: "power2.inOut" },
              0.45
            );

          // ==================================================================
          // STAGE 2: SURFACE ARRIVAL (0.45 -> 1.00)
          // ==================================================================
          tl.fromTo(
            "[data-layer=sun]",
            { yPercent: 28, scale: 0.9, opacity: 0.45 },
            { yPercent: -4, scale: 1.08, opacity: 1, duration: 0.45 },
            0.45
          )
            .fromTo(
              "[data-layer=sunbeams]",
              { rotate: -8, opacity: 0.25, scale: 0.94 },
              { rotate: 6, opacity: 0.78, scale: 1.08, duration: 0.54 },
              0.45
            )
            .fromTo(
              "[data-layer=dust-motes]",
              { xPercent: 8, yPercent: 6 },
              { xPercent: -16, yPercent: -6, duration: 0.54 },
              0.46
            )
            .fromTo(
              "[data-layer=ridge]",
              { yPercent: 18, scale: 1.04 },
              { yPercent: -4, scale: 1, duration: 0.54 },
              0.45
            )
            // Habitat module rises right during the cross-dissolve so Stage 2 is immediately rich
            .fromTo(
              "[data-layer=habitat]",
              { y: "18vh", scale: 0.9, autoAlpha: 0 },
              { y: 0, scale: 1, autoAlpha: 1, duration: 0.14, ease: "power2.out" },
              0.46
            )
            .fromTo(
              "[data-layer=habitat] [data-glint]",
              { xPercent: 0 },
              { xPercent: 330, duration: 0.11, ease: "power1.inOut" },
              0.58
            )
            // Six-wheel Mars Rover drives up the slope with dust plume
            .fromTo(
              "[data-layer=rover]",
              { x: "-62vw", y: "6vh", scale: 0.84, rotate: -3 },
              { x: 0, y: 0, scale: 1, rotate: 0, duration: 0.18, ease: "power2.out" },
              0.62
            )
            .fromTo(
              "[data-layer=rover-plume]",
              { opacity: 0, scaleX: 0.5 },
              { opacity: 0.85, scaleX: 1.15, duration: 0.14 },
              0.65
            )
            .to("[data-layer=rover-plume]", { opacity: 0.25, duration: 0.12 }, 0.82)
            // Exploration drone swoops in along a curved arc and activates terrain scan beam
            .fromTo(
              "[data-layer=drone]",
              { x: "50vw", y: "-32vh", scale: 0.58, rotate: -18 },
              { x: 0, y: 0, scale: 1, rotate: 0, duration: 0.17, ease: "power2.out" },
              0.76
            )
            .fromTo(
              "[data-layer=scan-cone]",
              { opacity: 0, scaleY: 0.3 },
              { opacity: 0.9, scaleY: 1, duration: 0.1, ease: "power2.out" },
              0.86
            )
            // Foreground framing boulders part outward
            .fromTo(
              "[data-layer=rocks-right]",
              { yPercent: 40, xPercent: 10, scale: 1.08 },
              { yPercent: -18, xPercent: 0, scale: 1, duration: 0.54 },
              0.46
            )
            .fromTo(
              "[data-layer=rocks-left]",
              { yPercent: 46, xPercent: -10, scale: 1.08 },
              { yPercent: -14, xPercent: 0, scale: 1, duration: 0.54 },
              0.46
            );

          // ==================================================================
          // 6-BEAT KINETIC CAPTION CHOREOGRAPHY (0..2 Orbital, 3..5 Surface)
          // ==================================================================
          const beat = (i: number) => `[data-beat="${i}"]`;
          const words = (i: number) => `[data-beat="${i}"] [data-word]`;

          const transitions: Array<[number, number, number]> = [
            // [fromBeat, toBeat, startTime]
            [0, 1, 0.14],
            [1, 2, 0.31],
            [2, 3, 0.47], // Crosses seamlessly from Orbital Beat 2 to Surface Beat 3
            [3, 4, 0.64],
            [4, 5, 0.8],
          ];

          for (const [fromIdx, toIdx, at] of transitions) {
            tl.to(beat(fromIdx), { autoAlpha: 0, y: -18, duration: 0.035 }, at)
              .fromTo(
                beat(toIdx),
                { autoAlpha: 0, y: 20 },
                { autoAlpha: 1, y: 0, duration: 0.035 },
                at + 0.025
              )
              .fromTo(
                words(toIdx),
                { yPercent: 110, autoAlpha: 0 },
                {
                  yPercent: 0,
                  autoAlpha: 1,
                  stagger: 0.006,
                  duration: 0.045,
                  ease: "power2.out",
                },
                at + 0.03
              );
          }
        },
        root
      );

      return cleanupPointer;
    },
    { scope: root }
  );

  return (
    <section
      id="orbital-approach"
      ref={root}
      aria-labelledby="orbital-approach-heading"
      className="scene-section relative bg-space-950 border-b border-white/10"
    >
      <h2 id="orbital-approach-heading" className="sr-only">
        Orbital approach and surface arrival at PHOBOSIA outpost on Elysium Planitia
      </h2>

      <div
        data-pin
        className="relative h-[100svh] min-h-[600px] overflow-hidden bg-[radial-gradient(ellipse_at_50%_115%,#2b131c_0%,#0b0f1d_48%,#04070e_78%)]"
      >
        {/* Top seamless blend from HeroStage */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-space-950 via-space-950/60 to-transparent z-[9] pointer-events-none"
        />

        {/* ================================================================ */}
        {/* STAGE 1: ORBITAL APPROACH LAYER                                  */}
        {/* ================================================================ */}
        <div data-stage="orbital" className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div data-layer="stars-far" className="starfield starfield-far scene-layer" />
          <div data-layer="stars-near" className="starfield starfield-near scene-layer" />

          {/* Ambient cosmic nebula glows with pointer depth */}
          <div
            data-depth="0.18"
            className="scene-layer absolute top-[12%] left-[18%] w-[44vw] max-w-[560px] aspect-square rounded-full bg-mars-500/12 blur-[130px]"
          />
          <div
            data-depth="0.28"
            className="scene-layer absolute bottom-[18%] right-[12%] w-[38vw] max-w-[480px] aspect-square rounded-full bg-cyan-glow/10 blur-[130px]"
          />

          <SceneSprite
            asset={sceneAssets.asteroidField}
            layer="ast-far"
            depth={0.22}
            className="absolute top-[14%] left-[8%] w-[clamp(95px,22vw,210px)] opacity-45"
            filter="blur(2.5px) brightness(0.72)"
          />

          {/* Mars centerpiece with pointer depth, animated orbital telemetry ring, and fixed terminator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div data-layer="mars" className="scene-layer relative w-[clamp(230px,42vmin,390px)] aspect-square">
              <div data-depth="0.38" className="scene-layer relative w-full h-full">
                <span data-layer="mars-halo" className="mars-halo" />

                {/* Orbital insertion trajectory SVG ring */}
                <svg
                  data-layer="orbital-ring"
                  viewBox="0 0 500 500"
                  className="scene-layer absolute inset-[-36%] w-[172%] h-[172%] overflow-visible"
                >
                  <defs>
                    <linearGradient id="orbital-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(56,189,248,0)" />
                      <stop offset="45%" stopColor="rgba(56,189,248,0.65)" />
                      <stop offset="80%" stopColor="rgba(245,158,108,0.85)" />
                      <stop offset="100%" stopColor="rgba(245,158,108,0)" />
                    </linearGradient>
                  </defs>
                  <g transform="rotate(-18 250 250)">
                    <ellipse
                      cx="250"
                      cy="250"
                      rx="235"
                      ry="86"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="1"
                      strokeDasharray="4 6"
                    />
                    <ellipse
                      data-layer="orbital-arc"
                      cx="250"
                      cy="250"
                      rx="235"
                      ry="86"
                      fill="none"
                      stroke="url(#orbital-grad)"
                      strokeWidth="1.75"
                      strokeDasharray="900"
                      strokeDashoffset="900"
                      strokeLinecap="round"
                    />
                    {/* Landing zone reticle marker on Elysium Planitia */}
                    <g transform="translate(310, 178)">
                      <circle r="5" fill="none" stroke="#38bdf8" strokeWidth="1.2" />
                      <circle r="1.8" fill="#f59e6c" />
                    </g>
                  </g>
                </svg>

                <div data-layer="mars-surface" className="scene-layer relative">
                  <SpriteImg asset={sceneAssets.mars} />
                </div>
                <span className="mars-terminator" />
              </div>
            </div>
          </div>

          <SceneSprite
            asset={sceneAssets.asteroidField}
            layer="ast-mid"
            depth={0.58}
            className="absolute bottom-[20%] right-[8%] w-[clamp(140px,20vw,300px)]"
            filter="blur(0.6px) brightness(0.88)"
            rimGlow="mars"
          />

          <SceneSprite
            asset={sceneAssets.satellite}
            layer="satellite"
            depth={0.88}
            className="absolute top-[18%] left-[12%] w-[clamp(180px,30vw,470px)] z-[5]"
            rimGlow="cyan"
            glint
          />

          <SceneSprite
            asset={sceneAssets.asteroidField}
            layer="ast-near"
            depth={1.32}
            className="absolute bottom-[-10%] left-[-6%] w-[clamp(180px,48vw,620px)] z-[5]"
            filter="blur(5.5px) brightness(0.62)"
            flip
          />

          <div className="absolute inset-0 scene-vignette" />
        </div>

        {/* ================================================================ */}
        {/* STAGE 2: SURFACE ARRIVAL LAYER (Cross-dissolves in at 45%..54%)  */}
        {/* ================================================================ */}
        <SurfaceArrivalStage />

        {/* Translucent screen-blended entry aurora wisp (never opaque) */}
        <div
          data-layer="entry-veil"
          aria-hidden="true"
          className="scene-entry-veil absolute inset-0 z-[8] pointer-events-none opacity-0"
        />

        {/* ================================================================ */}
        {/* SHARED PERSISTENT TELEMETRY HUD                                  */}
        {/* ================================================================ */}
        <div data-layer="hud" className="absolute inset-0 z-10 pointer-events-none">
          <SceneProgress
            label="SOL 0 · Orbital Approach"
            primaryLabel="ALTITUDE"
            primaryInitial="42,800 KM"
            secondaryLabel="VELOCITY"
            secondaryInitial="4.82 KM/S"
          />
          <div
            data-layer="caption-deck"
            className="scene-layer absolute inset-x-0 bottom-[7%] sm:bottom-[8%] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <SceneCaptions beats={ALL_BEATS} />
          </div>
        </div>
      </div>
    </section>
  );
}
