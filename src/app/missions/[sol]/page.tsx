import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { missionsData } from "@/data/missionsData";
import { Compass, CheckCircle2, Monitor, Hand, ArrowLeft, ArrowRight, MapPin, Award, BookOpen } from "lucide-react";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { PageTelemetryLayout } from "@/components/layout/PageTelemetryLayout";
import type { RailTocItem } from "@/components/ui/RailToc";

interface Props {
  params: Promise<{ sol: string }>;
}

const SOL_DETAIL_TOC: RailTocItem[] = [
  { id: "sol-directive", label: "Mission Directive", depth: 0 },
  { id: "sol-context", label: "Operational Context", depth: 0 },
  { id: "sol-execution", label: "Tasks & Consoles", depth: 0 },
  { id: "sol-outcomes", label: "Interactions & Output", depth: 0 },
];

export async function generateStaticParams() {
  return missionsData.map((m) => ({
    sol: m.sol.toString(),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sol } = await params;
  const solNum = parseInt(sol, 10);
  const mission = missionsData.find((m) => m.sol === solNum);
  if (!mission) return { title: "Mission Not Found" };

  return {
    title: `SOL ${mission.sol}: ${mission.title} | PHOBOSIA Expedition`,
    description: mission.primaryObjective,
  };
}

export default async function SolDetailPage({ params }: Props) {
  const { sol } = await params;
  const solNum = parseInt(sol, 10);
  const mission = missionsData.find((m) => m.sol === solNum);

  if (!mission) {
    notFound();
  }

  const prevMission = missionsData.find((m) => m.sol === solNum - 1);
  const nextMission = missionsData.find((m) => m.sol === solNum + 1);
  const solCode = mission.sol < 10 ? `0${mission.sol}` : `${mission.sol}`;

  return (
    <div className="py-16 sm:py-24 bg-space-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-nav text-slate-400 mb-8">
          <Link href="/missions" className="hover:text-mars-400 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Missions Overview</span>
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-mars-400 font-mission">SOL {mission.sol}</span>
        </nav>

        {/* Header Section */}
        <div className="space-y-4 mb-12">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-lg text-sm font-mission bg-mars-500/20 text-mars-300 border border-mars-500/40">
              SOL {mission.sol < 10 ? `0${mission.sol}` : mission.sol}
            </span>
            <span className="text-xs font-mission text-cyan-300 px-3 py-1 rounded-lg bg-space-900 border border-space-800">
              {mission.category}
            </span>
            <span className="text-xs font-mission text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-mars-400" aria-hidden="true" />
              {mission.location}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight">
            {mission.title}
          </h1>

          {mission.subtitle && (
            <p className="text-lg text-mars-300">
              {mission.subtitle}
            </p>
          )}
        </div>

        <PageTelemetryLayout tocTitle={`SOL ${solCode} Index`} items={SOL_DETAIL_TOC}>
        {/* Primary Objective Banner */}
        <LiquidGlassCard
          id="sol-directive"
          as="section"
          tier="showcase"
          accent="mars"
          className="scroll-mt-28 p-6 sm:p-8 rounded-3xl mb-12"
        >
          <span className="text-xs font-mission uppercase tracking-wider text-mars-400 block mb-2">
            Primary Mission Directive
          </span>
          <p className="text-base sm:text-lg text-slate-100 leading-relaxed">
            {mission.primaryObjective}
          </p>
        </LiquidGlassCard>

        {/* Story & Context Section */}
        <section id="sol-context" className="scroll-mt-28 space-y-6 mb-12">
          <h2 className="font-display text-xl font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>Narrative &amp; Operational Context</span>
          </h2>
          <div className="p-6 rounded-2xl liquid-glass-card text-sm text-slate-300 leading-relaxed">
            {mission.storyContext}
          </div>
        </section>

        {/* Two-Column Grid: Tasks & Consoles */}
        <section id="sol-execution" className="scroll-mt-28 grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Tasks Column */}
          <div className="p-6 rounded-2xl liquid-glass-card">
            <h3 className="font-subhead text-base font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>Step-by-Step Task Sequence</span>
            </h3>
            <ul className="space-y-3">
              {mission.tasks.map((task, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-space-800 border border-space-700 flex items-center justify-center font-mission text-xs text-cyan-400 shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{task}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Consoles & Physical Screens */}
          <div className="p-6 rounded-2xl liquid-glass-card liquid-glass-card--cyan">
            <h3 className="font-subhead text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              <span>Required Consoles &amp; Physical Screens</span>
            </h3>
            <ul className="space-y-3">
              {mission.screens.map((screen, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-300">
                  <span aria-hidden="true" className="w-2 h-2 rounded-full bg-cyan-400 mt-2 shrink-0" />
                  <span className="leading-relaxed font-mission">{screen}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Interactions & Educational Output */}
        <section id="sol-outcomes" className="scroll-mt-28 grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Player Interactions */}
          <div className="p-6 rounded-2xl liquid-glass-card liquid-glass-card--amber">
            <h3 className="font-subhead text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Hand className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>Explorer Interactions</span>
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              {mission.interactions.map((interaction, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span aria-hidden="true" className="text-amber-400">›</span>
                  <span>{interaction}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Scientific Output & Learnings */}
          <div className="p-6 rounded-2xl liquid-glass-card">
            <h3 className="font-subhead text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" aria-hidden="true" />
              <span>Expected Output &amp; Discoveries</span>
            </h3>
            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <p>
                <strong className="font-mission text-white block mb-0.5">Mission Output:</strong>
                {mission.expectedOutput}
              </p>
              <p>
                <strong className="font-mission text-white block mb-0.5">What the Player Learns:</strong>
                {mission.whatYouLearn}
              </p>
            </div>
          </div>
        </section>

        {/* Prev / Next Mission Pagination */}
        <div className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          {prevMission ? (
            <LiquidGlassButton
              href={`/missions/${prevMission.sol}`}
              variant="glass"
              size="md"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>SOL {prevMission.sol}: {prevMission.title.replace(/^SOL\s*\d+\s*[—–-]\s*/i, "")}</span>
            </LiquidGlassButton>
          ) : <div />}

          {nextMission ? (
            <LiquidGlassButton
              href={`/missions/${nextMission.sol}`}
              variant="mars"
              size="md"
            >
              <span>SOL {nextMission.sol}: {nextMission.title.replace(/^SOL\s*\d+\s*[—–-]\s*/i, "")}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </LiquidGlassButton>
          ) : <div />}
        </div>
        </PageTelemetryLayout>
      </div>
    </div>
  );
}
