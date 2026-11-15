import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Compass, Sparkles, Orbit, Target, Globe, BookOpen, Layers, ArrowRight } from "lucide-react";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { PageTelemetryLayout } from "@/components/layout/PageTelemetryLayout";
import type { RailTocItem } from "@/components/ui/RailToc";

export const metadata: Metadata = {
  title: "About PHOBOSIA — Project Concept & Vision",
  description:
    "Discover the background, objectives, and artistic vision behind PHOBOSIA, an interactive 3D Mars exploration and scientific observation experience.",
};

const ABOUT_TOC: RailTocItem[] = [
  { id: "outpost-visual", label: "Outpost Visual", depth: 0 },
  { id: "core-concept", label: "Why Mars & WebGL", depth: 0 },
  { id: "outpost-architecture", label: "Architecture & Scope", depth: 0 },
  { id: "outpost-galleries", label: "Habitation & Ecology", depth: 0 },
];

export default function AboutPage() {
  return (
    <div className="py-16 sm:py-24 bg-space-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="max-w-3xl mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mission uppercase tracking-wider bg-mars-500/10 border border-mars-500/20 text-mars-400 mb-4">
            <Orbit className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Project Manifesto &amp; Architecture</span>
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white">
            About PHOBOSIA
          </h1>
          <p className="mt-4 text-lg text-slate-300 leading-relaxed">
            PHOBOSIA is an independent, browser-based 3D exploration and scientific observation experience powered by authentic planetary elevation data.
          </p>
        </div>

        <PageTelemetryLayout tocTitle="Project Brief" items={ABOUT_TOC}>
        {/* Hero Editorial Image Feature */}
        <LiquidGlassCard
          id="outpost-visual"
          as="section"
          tier="showcase"
          accent="mars"
          backdropSrc="/images/outpost_1.png"
          className="scroll-mt-28 relative w-full h-[400px] sm:h-[520px] rounded-3xl overflow-hidden mb-20"
        >
          <Image
            src="/images/outpost_1.png"
            alt="PHOBOSIA Outpost in Elysium Planitia"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/20 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 max-w-2xl liquid-glass-pill p-6 rounded-2xl">
            <p className="text-xs font-mission text-cyan-400 uppercase tracking-widest mb-1">
              Outpost Location: Elysium Planitia (4.5° N, 135.9° E)
            </p>
            <p className="text-sm sm:text-base text-white leading-relaxed">
              A self-contained research enclave built to study Martian volcanology, mineralogical stratigraphy, and closed-loop bioregenerative life support.
            </p>
          </div>
        </LiquidGlassCard>

        {/* Section 1: Core Concept & Philosophy */}
        <section id="core-concept" className="scroll-mt-28 grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20 items-start">
          <div className="lg:col-span-5 space-y-4">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white">
              Why Mars? Why a Browser Experience?
            </h2>
            <p className="text-xs font-mission text-mars-400 uppercase tracking-wider">
              Accessible Planetary Science for Everyone
            </p>
          </div>
          <div className="lg:col-span-7 space-y-6 text-sm sm:text-base text-slate-300 leading-relaxed">
            <p>
              Space exploration games often gravitate toward exaggerated sci-fi tropes: alien shootouts, faster-than-light hyperdrives, or sprawling fantasy space stations. In contrast, <strong className="font-medium text-white">PHOBOSIA was founded on scientific grounding and quiet human reality</strong>.
            </p>
            <p>
              Mars is the next frontier of human habitation. Yet, the genuine technical constraints—such as surviving in an atmosphere less than 1% the density of Earth&apos;s, managing tight kilowatt budgets under dust-choked skies, and navigating uneven boulder-strewn basaltic fields—are rarely simulated authentically in an accessible medium.
            </p>
            <p>
              By engineering PHOBOSIA as a zero-install browser application using Three.js and WebGL, anyone with a modern web browser can step into the boots of an astronaut without purchasing high-end gaming consoles or downloading multi-gigabyte client installers.
            </p>
          </div>
        </section>

        {/* Section 2: Fictional Outpost Concept & Scientific Observation */}
        <LiquidGlassCard
          id="outpost-architecture"
          as="section"
          tier="showcase"
          accent="cyan"
          className="scroll-mt-28 p-8 sm:p-12 rounded-3xl mb-20"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-mars-500/10 border border-mars-500/30 flex items-center justify-center text-mars-400 font-mission">
                01
              </div>
              <h3 className="font-subhead text-lg font-semibold text-white">The Fictional Outpost</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                PHOBOSIA is envisioned as a prototype surface base consisting of five interconnected pressurized pods: Habitat, Mission Control, Science Lab, Engineering, and Airlock. It illustrates how modular architecture could sustain human endurance on Mars.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mission">
                02
              </div>
              <h3 className="font-subhead text-lg font-semibold text-white">Scientific Observation</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Rather than arbitrary quest markers, daily tasks revolve around authentic scientific methods: conducting rock spectroscopy, measuring atmospheric pressure drops, launching aerial drone sweeps, and balancing hydroponic cultivation chemistry.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mission">
                03
              </div>
              <h3 className="font-subhead text-lg font-semibold text-white">Target Audience &amp; Impact</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Designed for aerospace enthusiasts, STEM students, educators, and gamers who appreciate thoughtful realism, technical depth, and atmospheric environmental storytelling.
              </p>
            </div>
          </div>
        </LiquidGlassCard>

        {/* Section 3: Two Imagery Showcases */}
        <section id="outpost-galleries" className="scroll-mt-28 grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div className="space-y-4">
            <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden border border-white/15 bg-space-900">
              <Image
                src="/images/habitat_zone.png"
                alt="Habitat Zone Pod"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
            <h3 className="font-subhead text-base font-semibold text-white">Human Factors &amp; Psychological Well-being</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Living quarters engineered to simulate Earth circadian lighting, personal workspace privacy, and nutritional recycling to safeguard astronaut mental health during multi-year expeditions.
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden border border-white/15 bg-space-900">
              <Image
                src="/images/Science_lab.png"
                alt="Science Lab Cultivation Chamber"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
            <h3 className="font-subhead text-base font-semibold text-white">Bioregenerative Ecology &amp; Sample Analysis</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dual closed-loop cultivation pods testing crop transpiration under simulated Martian light recipes alongside spectrometers analyzing volcanic regolith.
            </p>
          </div>
        </section>

        {/* Call to Actions */}
        <div className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <LiquidGlassButton
            href="/missions"
            variant="mars"
            size="md"
            contentClassName="px-6 uppercase tracking-wider"
          >
            <span>Explore The 11-Day Campaign</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </LiquidGlassButton>
          <Link
            href="/science"
            className="text-xs font-nav text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Review Scientific Data Sources &amp; HiRISE Terrain →
          </Link>
        </div>
        </PageTelemetryLayout>
      </div>
    </div>
  );
}
