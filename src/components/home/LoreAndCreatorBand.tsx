import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { storyData } from "@/data/storyData";
import { creatorData } from "@/data/creatorData";
import { GithubIcon, LinkedinIcon } from "@/components/ui/Icons";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { HelmetFloat } from "@/components/scenes/HelmetFloat";

export function LoreAndCreatorBand() {
  return (
    <section
      id="story-creator"
      aria-labelledby="story-creator-heading"
      className="relative overflow-hidden py-20 sm:py-28 bg-space-950 border-b border-white/10"
    >
      <HelmetFloat />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10 sm:mb-12">
          <h2
            id="story-creator-heading"
            className="text-3xl sm:text-5xl font-semibold tracking-tight text-white"
          >
            The Explorer &amp; The Builder
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Every mission corridor connects fictional astronaut Carl Ashwindu&apos;s eleven-day log with the solo engineering effort behind the simulation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Panel: Astronaut Carl Ashwindu Lore */}
          <LiquidGlassCard
            as="article"
            tier="showcase"
            accent="mars"
            className="lg:col-span-5 rounded-[28px] p-6 sm:p-8 flex flex-col justify-between gap-6"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between font-mission text-xs">
                <span className="text-mars-300">
                  {storyData.callsign}
                </span>
                <span className="text-slate-400">Fictional Lore</span>
              </div>

              <div>
                <h3 className="font-subhead text-2xl sm:text-3xl font-semibold text-white">
                  {storyData.characterName}
                </h3>
                <p className="text-xs font-mission text-slate-300 mt-1">
                  {storyData.role}
                </p>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                {storyData.characterBio[0]}
              </p>

              <div className="p-4 rounded-2xl liquid-glass-well space-y-1.5">
                <span className="block font-mission text-xs uppercase tracking-wider text-cyan-300">
                  SOL 11 Incoming Dispatch
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {storyData.incomingTransmission.sender} departs {storyData.incomingTransmission.origin} toward PHOBOSIA Outpost, prompting Carl&apos;s final log and 200-meter vehicle departure.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <LiquidGlassButton href="/story" variant="glass" size="md">
                Read Astronaut Lore
              </LiquidGlassButton>
              <Link
                href="/development"
                className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-nav text-slate-300 hover:text-white transition-colors min-h-[44px]"
              >
                Development Stack
              </Link>
            </div>
          </LiquidGlassCard>

          {/* Right Panel: Solo Developer & 3D Artist Osanda Hirushaka */}
          <LiquidGlassCard
            as="article"
            tier="showcase"
            accent="cyan"
            className="lg:col-span-7 rounded-[28px] p-6 sm:p-8 flex flex-col justify-between gap-6"
          >
            <div className="space-y-5">
              {/* Top Dossier Metadata Row (aligned with Left Card header) */}
              <div className="flex flex-wrap items-center justify-between gap-2 font-mission text-xs">
                <span className="inline-flex items-center gap-2 text-cyan-300">
                  <span
                    aria-hidden="true"
                    className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]"
                  />
                  Creator &amp; Technical Artist
                </span>
                <span className="text-slate-300">
                  {creatorData.location} • @{creatorData.githubUsername}
                </span>
              </div>

              {/* Upper Profile Split: High-DPI Portrait Frame + Bio & Discipline Chips */}
              <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-5 sm:gap-6">
                {/* High-DPI Dossier Portrait Frame */}
                <div className="relative w-40 h-48 sm:w-44 sm:h-auto sm:min-h-[208px] rounded-[22px] overflow-hidden bg-space-900 border border-white/20 ring-1 ring-cyan-400/15 shadow-[0_18px_40px_-12px_rgba(2,6,23,0.85)] shrink-0 group">
                  <Image
                    src={creatorData.portraitImage}
                    alt={`Portrait of ${creatorData.name}`}
                    fill
                    quality={95}
                    sizes="(max-width: 640px) 320px, 420px"
                    className="object-cover object-top transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]"
                  />
                  {/* Subtle edge vignette + bottom gradient so studio backdrop blends into dark space UI */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,transparent_52%,rgba(2,6,23,0.48)_100%)] pointer-events-none"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-space-950/90 via-space-950/40 to-transparent pointer-events-none"
                  />
                  {/* HUD Reticle Corner Ticks */}
                  <span
                    aria-hidden="true"
                    className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t border-l border-cyan-300/70 pointer-events-none"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute top-2.5 right-2.5 w-2.5 h-2.5 border-t border-r border-cyan-300/70 pointer-events-none"
                  />
                  {/* Bottom Dossier Badge */}
                  <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between px-2.5 py-1 rounded-lg bg-space-950/75 backdrop-blur-md border border-white/15 font-mission text-xs text-slate-200">
                    <span className="text-cyan-300">SOLO DEV</span>
                    <span>~2.5 MO</span>
                  </div>
                </div>

                {/* Identity, Bio & Core Engineering Stack */}
                <div className="flex-1 flex flex-col justify-between space-y-3.5 text-center sm:text-left">
                  <div>
                    <h3 className="font-subhead text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                      {creatorData.name}
                    </h3>
                    <p className="text-xs font-mission text-mars-300 mt-1">
                      {creatorData.role}
                    </p>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed">
                    Conceived, 3D modeled from scratch in Blender, and engineered over ~2.5 months in Sri Lanka, uniting NASA geospatial elevation rasters with real-time 60 FPS WebGL graphics.
                  </p>

                  {/* Core Stack Chips */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                    {[
                      "Three.js & WebGL",
                      "Blender 3D",
                      "Python GDAL / HiRISE",
                      "Next.js & TypeScript",
                    ].map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 font-mission text-xs text-slate-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recessed Engineering & Asset Telemetry Well (mirrors Left Card's SOL 11 Dispatch box) */}
              <div className="p-3.5 sm:p-4 rounded-2xl liquid-glass-well grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-0.5">
                  <span className="block font-mission text-xs uppercase tracking-wider text-cyan-300">
                    3D Architecture
                  </span>
                  <p className="font-subhead text-xs sm:text-sm font-semibold text-white">
                    5 Base Sectors
                  </p>
                  <span className="block text-xs text-slate-400">
                    Scratch Blender Meshes
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="block font-mission text-xs uppercase tracking-wider text-mars-300">
                    NASA Terrain
                  </span>
                  <p className="font-subhead text-xs sm:text-sm font-semibold text-white">
                    1.0 m/px DTM
                  </p>
                  <span className="block text-xs text-slate-400">
                    Elysium Planitia HiRISE
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="block font-mission text-xs uppercase tracking-wider text-cyan-300">
                    Avionics UI
                  </span>
                  <p className="font-subhead text-xs sm:text-sm font-semibold text-white">
                    20+ Consoles
                  </p>
                  <span className="block text-xs text-slate-400">
                    Interactive [E] Terminals
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="block font-mission text-xs uppercase tracking-wider text-mars-300">
                    GPU Pipeline
                  </span>
                  <p className="font-subhead text-xs sm:text-sm font-semibold text-white">
                    60 FPS WebGL
                  </p>
                  <span className="block text-xs text-slate-400">
                    100K+ Instanced Rocks
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Action Bar (pinned to bottom, aligned horizontally with Left Card CTA row) */}
            <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <LiquidGlassButton
                  href="/creator"
                  variant="primary"
                  size="md"
                >
                  View Creator Profile
                </LiquidGlassButton>
                <LiquidGlassButton
                  href={creatorData.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="glass"
                  size="md"
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  <span>GitHub</span>
                  <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                </LiquidGlassButton>
                <LiquidGlassButton
                  href={creatorData.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="glass"
                  size="md"
                >
                  <LinkedinIcon className="w-3.5 h-3.5" />
                  <span>LinkedIn</span>
                </LiquidGlassButton>
              </div>

              <a
                href={creatorData.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-nav text-slate-300 hover:text-cyan-300 transition-colors"
              >
                <span>Source Repo</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </LiquidGlassCard>
        </div>
      </div>
    </section>
  );
}
