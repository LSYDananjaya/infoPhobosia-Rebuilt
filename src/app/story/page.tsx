import React from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { storyData } from "@/data/storyData";
import { BookOpen, User, Radio, Compass, ShieldAlert, ArrowRight, Flag } from "lucide-react";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { PageTelemetryLayout } from "@/components/layout/PageTelemetryLayout";
import type { RailTocItem } from "@/components/ui/RailToc";

export const metadata: Metadata = {
  title: "Astronaut Carl Ashwindu — Narrative Lore & Dossier | PHOBOSIA",
  description:
    "Explore the fictional backstory of astronaut Carl Ashwindu (35, Sri Lankan heritage / American citizen), the solitary observer of PHOBOSIA Outpost.",
};

const STORY_TOC: RailTocItem[] = [
  { id: "carl-dossier", label: "Carl Ashwindu Dossier", depth: 0 },
  { id: "isolation-role", label: "Isolation & Duty", depth: 0 },
  { id: "sol-11-departure", label: "SOL 11 Departure", depth: 0 },
  { id: "timeline-archive", label: "Archive Verification", depth: 0 },
];

export default function StoryPage() {
  return (
    <div className="py-16 sm:py-24 bg-space-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Intro */}
        <div className="space-y-4 mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mission uppercase tracking-wider bg-mars-500/10 border border-mars-500/20 text-mars-400">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Fictional Expedition Lore &amp; Narrative</span>
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white">
            Astronaut Carl Ashwindu
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed max-w-3xl">
            The solitary human observer stationed on the rust-red plains of Elysium Planitia. Discover the backstory, heritage, and expedition departure of PHOBOSIA&apos;s protagonist.
          </p>
        </div>

        <PageTelemetryLayout tocTitle="Mission Narrative" items={STORY_TOC}>
        {/* Character Dossier Card */}
        <LiquidGlassCard
          id="carl-dossier"
          as="section"
          tier="showcase"
          accent="mars"
          className="scroll-mt-28 p-8 sm:p-10 rounded-3xl mb-16"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/10 pb-8 mb-8">
            <div>
              <span className="text-xs font-mission uppercase text-mars-400 tracking-wider">
                Expedition Personnel File #01
              </span>
              <h2 className="font-display text-3xl font-semibold text-white mt-1">
                {storyData.characterName}
              </h2>
              <p className="text-xs font-mission text-cyan-300 mt-1">
                Role: {storyData.role} ({storyData.callsign})
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl liquid-glass-well text-center">
                <span className="text-xs font-mission text-slate-400 uppercase block">Age</span>
                <span className="text-lg font-mission text-white">{storyData.age}</span>
              </div>
              <div className="px-4 py-2 rounded-xl liquid-glass-well text-center">
                <span className="text-xs font-mission text-slate-400 uppercase block">Gender</span>
                <span className="text-lg font-mission text-white">{storyData.gender}</span>
              </div>
            </div>
          </div>

          {/* Heritage & Citizenship Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
            <div className="p-5 rounded-2xl liquid-glass-well space-y-2">
              <span className="text-xs font-mission uppercase text-amber-400 flex items-center gap-2">
                <span>🇱🇰</span>
                <span>Heritage &amp; Cultural Background</span>
              </span>
              <p className="text-slate-300 leading-relaxed">
                {storyData.heritageNotes}
              </p>
            </div>

            <div className="p-5 rounded-2xl liquid-glass-well space-y-2">
              <span className="text-xs font-mission uppercase text-cyan-400 flex items-center gap-2">
                <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Citizenship &amp; Education Path</span>
              </span>
              <p className="text-slate-300 leading-relaxed">
                {storyData.educationalPath}
              </p>
            </div>
          </div>
        </LiquidGlassCard>

        {/* Narrative Biography Sections */}
        <section id="isolation-role" className="scroll-mt-28 space-y-6 mb-16">
          <h2 className="font-subhead text-2xl font-semibold text-white">
            Character Role &amp; Expedition Isolation
          </h2>

          <div className="space-y-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            {storyData.characterBio.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
        </section>

        {/* The SOL 11 Departure & Selina's Incoming Message */}
        <LiquidGlassCard
          id="sol-11-departure"
          as="section"
          tier="showcase"
          accent="cyan"
          className="scroll-mt-28 p-8 sm:p-10 rounded-3xl mb-16 space-y-6"
        >
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-cyan-400" aria-hidden="true" />
            <h2 className="font-subhead text-xl sm:text-2xl font-semibold text-white">
              The SOL 11 Departure &amp; Incoming Transmission
            </h2>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {storyData.departureNarrative}
          </p>

          <div className="p-5 rounded-2xl liquid-glass-well space-y-2 font-mission text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-slate-400">Incoming Sender:</span>
              <span className="text-cyan-300">{storyData.incomingTransmission.sender} (Astronaut)</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-slate-400">Route:</span>
              <span className="text-slate-200">{storyData.incomingTransmission.origin} → {storyData.incomingTransmission.destination}</span>
            </div>
            <div className="pt-2 text-slate-400 font-body">
              <p className="text-slate-300">{storyData.incomingTransmission.summary}</p>
            </div>
          </div>
        </LiquidGlassCard>

        {/* Timeline Verification Disclaimer */}
        <section id="timeline-archive" className="scroll-mt-28 p-5 rounded-2xl liquid-glass-well mb-16 flex items-start gap-3 text-xs text-slate-400">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="leading-relaxed">
            {storyData.timelineVerificationNote}
          </p>
        </section>

        {/* Bottom Navigation */}
        <div className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <LiquidGlassButton
            href="/missions/11"
            variant="mars"
            size="md"
            contentClassName="px-6 uppercase tracking-wider"
          >
            <span>Review SOL 11 Mission Details</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </LiquidGlassButton>
          <Link
            href="/creator"
            className="text-xs font-nav text-slate-400 hover:text-white transition-colors"
          >
            Meet Real Developer Osanda Hirushaka →
          </Link>
        </div>
        </PageTelemetryLayout>
      </div>
    </div>
  );
}
