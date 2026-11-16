import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { interactionsData } from "@/data/interactionsData";
import { Hand, Terminal, Monitor, Navigation, Compass, Layers, ShieldCheck, ArrowRight } from "lucide-react";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { TelemetryScramble } from "@/components/ui/TelemetryScramble";
import { PageTelemetryLayout } from "@/components/layout/PageTelemetryLayout";
import type { RailTocItem } from "@/components/ui/RailToc";

export const metadata: Metadata = {
  title: "User Experience & Physical Consoles | PHOBOSIA",
  description:
    "Explore the first-person controls, physical screen interfaces, 'E' key interactions, and simulated outpost systems in PHOBOSIA.",
};

const EXPERIENCE_TOC: RailTocItem[] = [
  { id: "experience-overview", label: "Console Overview", depth: 0 },
  { id: "habitat-controls", label: "Habitat & Controls", depth: 0 },
  { id: "first-person-navigation", label: "First-Person Navigation", depth: 1 },
  { id: "e-key-interaction", label: "Proximity [E] Prompts", depth: 1 },
  { id: "personal-laptop-os", label: "Personal Laptop OS", depth: 1 },
  { id: "research-power", label: "Research & Power", depth: 0 },
  { id: "science-spectrometry", label: "Spectrometry & Botany", depth: 1 },
  { id: "engineering-power-grid", label: "Electrical Power Grid", depth: 1 },
  { id: "eva-vehicles", label: "EVA & Surface Vehicles", depth: 0 },
  { id: "airlock-depressurization", label: "Airlock & EVA Suiting", depth: 1 },
  { id: "drone-reconnaissance", label: "Coaxial Drone Flight", depth: 1 },
  { id: "rover-departure", label: "Terrain Vehicle Drive", depth: 1 },
];

const EXPERIENCE_GROUPS = [
  {
    id: "habitat-controls",
    eyebrow: "Subsystem 01 · Habitat & Command Interface",
    title: "Navigation, Proximity Triggers & Crew OS",
    items: interactionsData.slice(0, 3),
  },
  {
    id: "research-power",
    eyebrow: "Subsystem 02 · Laboratory & Engineering",
    title: "Spectrometry, Botany & Electrical Power Grids",
    items: interactionsData.slice(3, 5),
  },
  {
    id: "eva-vehicles",
    eyebrow: "Subsystem 03 · EVA & Surface Operations",
    title: "Airlock Cycling, Aerial Recon & Terrain Traverse",
    items: interactionsData.slice(5, 8),
  },
];

export default function ExperiencePage() {
  return (
    <div className="py-16 sm:py-24 bg-space-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Intro */}
        <div className="max-w-3xl mb-16">
          <span className="telemetry-chip text-mars-300 mb-4">
            <Hand className="w-3.5 h-3.5 text-mars-400" aria-hidden="true" />
            <TelemetryScramble text="INTERACTIVE SYSTEMS ARCHITECTURE · 20+ CONSOLES" />
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white">
            User Experience &amp; Interactions
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            PHOBOSIA is an active, tactile simulation. Discover how players navigate pressurized modules, operate physical command screens, cycle airlocks, and control field equipment.
          </p>
        </div>

        <PageTelemetryLayout tocTitle="Systems Guide" items={EXPERIENCE_TOC}>
        {/* Feature Hero Image */}
        <LiquidGlassCard
          id="experience-overview"
          as="section"
          tier="showcase"
          accent="cyan"
          backdropSrc="/images/mission_control.png"
          className="scroll-mt-28 relative w-full h-80 sm:h-[450px] rounded-3xl overflow-hidden mb-16"
        >
          <Image
            src="/images/mission_control.png"
            alt="Mission Control Physical Screens"
            fill
            sizes="(max-width: 1280px) 100vw, 960px"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/30 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 max-w-xl liquid-glass-pill p-5 rounded-2xl">
            <span className="text-xs font-mission text-cyan-400 uppercase tracking-wider">
              Press [E] Proximity Interaction
            </span>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
              Every console in Mission Control, Habitat, Engineering, and the Science Lab is interactive. Approaching within 2.5 meters reveals dynamic UI prompts to access operational telemetry.
            </p>
          </div>
        </LiquidGlassCard>

        {/* Interaction Systems Cards */}
        <div className="space-y-14 mb-20">
          {EXPERIENCE_GROUPS.map((group) => (
            <section key={group.id} id={group.id} className="scroll-mt-28 space-y-6">
              <div className="border-b border-white/10 pb-3">
                <span className="text-xs font-mission uppercase tracking-[0.18em] text-cyan-400">
                  {group.eyebrow}
                </span>
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-white mt-1">
                  {group.title}
                </h2>
              </div>

              <div className="space-y-8">
                {group.items.map((item) => (
                  <article
                    id={item.id}
                    key={item.id}
                    className="scroll-mt-28 p-8 rounded-3xl liquid-glass-card"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      <div className="space-y-4 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="px-3 py-1 rounded-lg text-xs font-mission bg-space-800 text-cyan-300 border border-space-700">
                            {item.triggerKey}
                          </span>
                          <span className="text-xs font-mission text-slate-400">
                            📍 {item.primaryLocation}
                          </span>
                        </div>

                        <h3 className="font-subhead text-2xl font-semibold text-white">
                          {item.systemName}
                        </h3>

                        <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                          <p>
                            <strong className="font-mission text-white">Mechanics &amp; Underlying System: </strong>
                            {item.mechanism}
                          </p>
                          <p>
                            <strong className="font-mission text-white">Player Experience: </strong>
                            {item.userExperience}
                          </p>
                          <p>
                            <strong className="font-mission text-white">Mission Relevance: </strong>
                            {item.missionSignificance}
                          </p>
                        </div>
                      </div>

                      {/* Features List */}
                      <div className="lg:w-80 p-5 rounded-2xl liquid-glass-well shrink-0">
                        <h4 className="font-subhead text-xs font-semibold uppercase tracking-wider text-mars-400 mb-3">
                          Technical Highlights
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-400">
                          {item.features.map((feat, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-2">
                              <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-mars-400 mt-1.5 shrink-0" />
                              <span className="leading-relaxed">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Link to Models & Missions */}
        <div className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <LiquidGlassButton
            href="/models"
            variant="mars"
            size="md"
            contentClassName="px-6 uppercase tracking-wider"
          >
            <span>Inspect 3D Outpost Modules</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </LiquidGlassButton>
          <Link
            href="/missions"
            className="text-xs font-nav text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            See which screens are active in SOL 1–11 →
          </Link>
        </div>
        </PageTelemetryLayout>
      </div>
    </div>
  );
}
