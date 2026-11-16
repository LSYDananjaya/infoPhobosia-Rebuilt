"use client";

import React, { useEffect, useState } from "react";
import { missionsData, SolMission } from "@/data/missionsData";
import {
  Compass,
  CheckCircle2,
  ChevronRight,
  Monitor,
  MapPin,
  Sun,
  Moon,
  AlertTriangle,
  Radio,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { TelemetryScramble } from "@/components/ui/TelemetryScramble";
import { handleTabListKeyDown, readQueryParam, syncQueryParams } from "@/lib/uiHelpers";

const categories = [
  "All Sols",
  "Orientation & Setup",
  "Outpost Operations",
  "Scientific Research",
  "Field Exploration & Recon",
  "Hazard Response & Recovery",
  "Life Support & Ecology",
  "Mission Handover & Departure",
];

interface SolAtmosphere {
  lmst: string;
  solarDeg: number;
  tempC: number;
  skyState: "Daylight" | "High Noon" | "Dust Storm" | "Recovery" | "Dawn Departure";
  gradient: string;
}

const SOL_ATMO: Record<number, SolAtmosphere> = {
  1: {
    lmst: "08:15 LMST",
    solarDeg: 28,
    tempC: -42,
    skyState: "Daylight",
    gradient: "linear-gradient(125deg, rgba(245,158,108,0.22) 0%, rgba(14,21,38,0.75) 60%, rgba(4,7,14,0.92) 100%)",
  },
  2: {
    lmst: "10:40 LMST",
    solarDeg: 52,
    tempC: -28,
    skyState: "Daylight",
    gradient: "linear-gradient(125deg, rgba(56,189,248,0.18) 0%, rgba(217,75,50,0.16) 52%, rgba(4,7,14,0.92) 100%)",
  },
  3: {
    lmst: "12:10 LMST",
    solarDeg: 74,
    tempC: -19,
    skyState: "High Noon",
    gradient: "linear-gradient(125deg, rgba(56,189,248,0.24) 0%, rgba(14,21,38,0.78) 58%, rgba(4,7,14,0.94) 100%)",
  },
  4: {
    lmst: "13:35 LMST",
    solarDeg: 68,
    tempC: -21,
    skyState: "High Noon",
    gradient: "linear-gradient(125deg, rgba(56,189,248,0.22) 0%, rgba(245,158,108,0.16) 55%, rgba(4,7,14,0.94) 100%)",
  },
  5: {
    lmst: "14:50 LMST",
    solarDeg: 54,
    tempC: -26,
    skyState: "Daylight",
    gradient: "linear-gradient(125deg, rgba(232,108,72,0.24) 0%, rgba(56,189,248,0.16) 55%, rgba(4,7,14,0.94) 100%)",
  },
  6: {
    lmst: "15:45 LMST",
    solarDeg: 41,
    tempC: -34,
    skyState: "Daylight",
    gradient: "linear-gradient(125deg, rgba(217,75,50,0.26) 0%, rgba(14,21,38,0.78) 58%, rgba(4,7,14,0.94) 100%)",
  },
  7: {
    lmst: "17:20 LMST",
    solarDeg: 14,
    tempC: -58,
    skyState: "Dust Storm",
    gradient: "linear-gradient(125deg, rgba(245,158,11,0.3) 0%, rgba(217,75,50,0.24) 52%, rgba(12,10,18,0.95) 100%)",
  },
  8: {
    lmst: "09:10 LMST",
    solarDeg: 34,
    tempC: -46,
    skyState: "Recovery",
    gradient: "linear-gradient(125deg, rgba(245,158,11,0.22) 0%, rgba(56,189,248,0.18) 56%, rgba(4,7,14,0.94) 100%)",
  },
  9: {
    lmst: "11:25 LMST",
    solarDeg: 62,
    tempC: -24,
    skyState: "Daylight",
    gradient: "linear-gradient(125deg, rgba(52,211,153,0.18) 0%, rgba(56,189,248,0.18) 54%, rgba(4,7,14,0.94) 100%)",
  },
  10: {
    lmst: "16:30 LMST",
    solarDeg: 29,
    tempC: -48,
    skyState: "Daylight",
    gradient: "linear-gradient(125deg, rgba(56,189,248,0.22) 0%, rgba(14,21,38,0.8) 58%, rgba(4,7,14,0.94) 100%)",
  },
  11: {
    lmst: "06:05 LMST",
    solarDeg: 9,
    tempC: -76,
    skyState: "Dawn Departure",
    gradient: "linear-gradient(125deg, rgba(245,158,108,0.28) 0%, rgba(56,189,248,0.22) 54%, rgba(4,7,14,0.95) 100%)",
  },
};

export default function MissionsPage() {
  const [selectedCategory, setSelectedCategoryState] = useState("All Sols");
  const [ribbonSol, setRibbonSol] = useState<number>(1);
  const [activeModalMission, setActiveModalMissionState] = useState<SolMission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const categoryParam = readQueryParam("category");
    if (categoryParam && categories.includes(categoryParam)) {
      setSelectedCategoryState(categoryParam);
    }
    const solParam = Number(readQueryParam("sol"));
    if (Number.isInteger(solParam) && solParam >= 1 && solParam <= 11) {
      setRibbonSol(solParam);
      const match = missionsData.find((m) => m.sol === solParam);
      if (match) {
        setActiveModalMissionState(match);
        setIsModalOpen(true);
      }
    }
  }, []);

  const setSelectedCategory = (cat: string) => {
    setSelectedCategoryState(cat);
    syncQueryParams({ category: cat === "All Sols" ? null : cat });
  };

  const setActiveModalMission = (mission: SolMission | null) => {
    if (mission) {
      setActiveModalMissionState(mission);
      setIsModalOpen(true);
      syncQueryParams({ sol: String(mission.sol) });
    } else {
      setIsModalOpen(false);
      syncQueryParams({ sol: null });
    }
  };

  const selectedCategoryIndex = Math.max(categories.indexOf(selectedCategory), 0);

  const filteredMissions =
    selectedCategory === "All Sols"
      ? missionsData
      : missionsData.filter((m) => m.category === selectedCategory);

  const activeRibbonMission =
    missionsData.find((m) => m.sol === ribbonSol) ?? missionsData[0];
  const activeAtmo = SOL_ATMO[activeRibbonMission.sol] ?? SOL_ATMO[1];

  return (
    <div className="py-16 sm:py-24 bg-space-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Intro */}
        <div className="max-w-3xl mb-10">
          <span className="telemetry-chip text-mars-300 mb-4">
            <Compass className="w-3.5 h-3.5 text-mars-400" aria-hidden="true" />
            <TelemetryScramble text="AUTHORITATIVE EXPEDITION ARCHITECTURE · SOL 01-11" />
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white">
            SOL 1–11 Mission Progress
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            A comprehensive, day-by-day expedition schedule across eleven Martian SOLs. Scrub the interactive SOL ribbon below to inspect solar elevation, atmospheric telemetry, and daily console protocols.
          </p>
        </div>

        {/* Interactive SOL 1-11 Horizon Ribbon Hero */}
        <LiquidGlassCard
          as="section"
          tier="showcase"
          accent={activeRibbonMission.sol === 7 ? "amber" : "mars"}
          className="rounded-[32px] p-5 sm:p-8 mb-14 overflow-hidden relative"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-[1] transition-all duration-700 ease-out"
            style={{ background: activeAtmo.gradient }}
          />

          {/* Top Telemetry Readout Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/12">
            <div className="flex flex-wrap items-center gap-2">
              <span className="telemetry-chip text-mars-300">
                SOL {activeRibbonMission.sol < 10 ? `0${activeRibbonMission.sol}` : activeRibbonMission.sol} / 11
              </span>
              <span className="telemetry-chip text-cyan-300">
                {activeAtmo.lmst}
              </span>
              <span className="telemetry-chip text-slate-200">
                {activeAtmo.skyState === "Dust Storm" ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                ) : activeAtmo.solarDeg < 20 ? (
                  <Moon className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                )}
                <span>{activeAtmo.skyState}</span>
              </span>
            </div>

            <div className="flex items-center gap-4 font-mission text-xs text-slate-300 tabular-nums">
              <span>
                SOLAR ELEV: <strong className="text-white">{activeAtmo.solarDeg}°</strong>
              </span>
              <span>
                SURFACE TEMP: <strong className="text-cyan-300">{activeAtmo.tempC}°C</strong>
              </span>
            </div>
          </div>

          {/* 11-Node Interactive SOL Scrubber Track */}
          <div
            role="tablist"
            aria-label="Interactive SOL 1 to 11 timeline scrubber"
            className="grid grid-cols-11 gap-1.5 sm:gap-2 my-6"
          >
            {missionsData.map((m, idx) => {
              const selected = m.sol === activeRibbonMission.sol;
              const isHazard = m.sol === 7 || m.sol === 8;
              return (
                <button
                  key={m.sol}
                  type="button"
                  role="tab"
                  tabIndex={selected ? 0 : -1}
                  aria-selected={selected}
                  onClick={() => setRibbonSol(m.sol)}
                  onKeyDown={(e) =>
                    handleTabListKeyDown(e, missionsData, idx, (next) => setRibbonSol(next.sol))
                  }
                  className={`group relative flex flex-col items-center justify-center py-2.5 sm:py-3 rounded-2xl font-mission text-xs transition-all duration-200 min-h-[54px] ${
                    selected
                      ? "bg-white text-space-950 shadow-[0_8px_24px_rgba(255,255,255,0.28)] scale-[1.04]"
                      : isHazard
                        ? "liquid-glass-tab text-amber-300 hover:text-white border-amber-400/30"
                        : "liquid-glass-tab text-slate-300 hover:text-white"
                  }`}
                >
                  <span className="text-[10px] opacity-70 uppercase">SOL</span>
                  <span className="text-xs sm:text-sm font-semibold tabular-nums">
                    {m.sol < 10 ? `0${m.sol}` : m.sol}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active SOL Expanded Spotlight Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mission">
                <span className="text-cyan-300 uppercase tracking-wider">
                  {activeRibbonMission.category}
                </span>
                <span aria-hidden="true" className="text-slate-500">•</span>
                <span className="text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-mars-400" aria-hidden="true" />
                  {activeRibbonMission.location}
                </span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white">
                {activeRibbonMission.title}
              </h2>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-3xl">
                {activeRibbonMission.primaryObjective}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {activeRibbonMission.screens.map((scr) => (
                  <span
                    key={scr}
                    className="px-2.5 py-1 rounded-lg bg-space-950/70 border border-white/12 font-mission text-xs text-cyan-200 flex items-center gap-1.5"
                  >
                    <Radio className="w-3 h-3 text-cyan-400" aria-hidden="true" />
                    {scr}
                  </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-2.5 justify-end">
              <LiquidGlassButton
                href={`/missions/${activeRibbonMission.sol}`}
                variant="primary"
                size="md"
                fullWidth
              >
                <span>Open SOL {activeRibbonMission.sol} Full Dossier</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </LiquidGlassButton>
              <LiquidGlassButton
                type="button"
                variant="glass"
                size="md"
                fullWidth
                onClick={() => setActiveModalMission(activeRibbonMission)}
              >
                <span>Quick Briefing Modal</span>
              </LiquidGlassButton>
            </div>
          </div>
        </LiquidGlassCard>

        {/* Category Filter Pills */}
        <div
          role="tablist"
          aria-label="Filter missions by category"
          className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none"
        >
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                tabIndex={active ? 0 : -1}
                aria-selected={active}
                onClick={() => setSelectedCategory(cat)}
                onKeyDown={(e) =>
                  handleTabListKeyDown(e, categories, selectedCategoryIndex, (next) =>
                    setSelectedCategory(next)
                  )
                }
                className={`px-4 py-2 rounded-full text-xs font-btn whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] min-h-[40px] ${
                  active
                    ? "bg-mars-500 text-white border border-mars-300/60 shadow-[0_6px_18px_rgba(217,75,50,0.4)]"
                    : "liquid-glass-tab text-slate-300 hover:text-white"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Timeline / Mission List */}
        <div className="space-y-6">
          {filteredMissions.map((mission) => {
            const solCode = mission.sol < 10 ? `0${mission.sol}` : `${mission.sol}`;
            const atmo = SOL_ATMO[mission.sol] ?? SOL_ATMO[1];
            return (
              <div
                key={mission.sol}
                style={{ viewTransitionName: `sol-card-${mission.sol}` } as React.CSSProperties}
                className="p-6 sm:p-8 rounded-3xl liquid-glass-card scroll-reveal group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: SOL Number & Main Info */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-3 py-1 rounded-lg text-xs font-mission bg-mars-500/20 text-mars-300 border border-mars-500/30">
                        SOL {solCode}
                      </span>
                      <span className="text-xs font-mission text-cyan-300 px-2.5 py-0.5 rounded bg-space-800 border border-space-700">
                        {mission.category}
                      </span>
                      <span className="text-xs font-mission text-slate-400">
                        {atmo.lmst} · {atmo.tempC}°C
                      </span>
                      <span className="text-xs font-mission text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-mars-400" aria-hidden="true" />
                        {mission.location}
                      </span>
                    </div>

                    <h2 className="font-subhead text-xl sm:text-2xl font-semibold text-white group-hover:text-mars-300 transition-colors">
                      {mission.title}
                    </h2>

                    <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
                      {mission.primaryObjective}
                    </p>

                    {/* Summary Tags */}
                    <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mission text-slate-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                        <span>{mission.tasks.length} Verified Tasks</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Monitor className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                        <span>{mission.screens.length} Interactive Screens</span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-3 self-start lg:self-center shrink-0">
                    <LiquidGlassButton
                      type="button"
                      variant="glass"
                      size="sm"
                      onClick={() => setActiveModalMission(mission)}
                      contentClassName="min-h-[42px] px-4"
                    >
                      Quick Briefing
                    </LiquidGlassButton>
                    <LiquidGlassButton
                      href={`/missions/${mission.sol}`}
                      variant="mars"
                      size="sm"
                      contentClassName="min-h-[42px] px-5 uppercase tracking-wider"
                    >
                      <span>Full Dossier</span>
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </LiquidGlassButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Briefing Modal */}
      {activeModalMission && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setActiveModalMission(null)}
          title={`SOL ${activeModalMission.sol} Briefing — ${activeModalMission.title}`}
        >
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mission uppercase text-mars-400">Primary Objective</span>
              <p className="mt-1 text-sm text-slate-200 leading-relaxed">
                {activeModalMission.primaryObjective}
              </p>
            </div>

            <div>
              <span className="text-xs font-mission uppercase text-slate-400">Story &amp; Operational Context</span>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                {activeModalMission.storyContext}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-space-800">
              <div>
                <span className="text-xs font-mission uppercase text-cyan-400">Tasks to Complete:</span>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                  {activeModalMission.tasks.map((task, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-xs font-mission uppercase text-amber-400">Active Consoles &amp; Screens:</span>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-300">
                  {activeModalMission.screens.map((screen, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span className="font-mission">{screen}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
              <span className="text-xs font-mission text-slate-400">
                Location: {activeModalMission.location}
              </span>
              <LiquidGlassButton
                href={`/missions/${activeModalMission.sol}`}
                variant="mars"
                size="sm"
                contentClassName="min-h-[40px] px-4"
              >
                <span>Read Full Technical Details</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </LiquidGlassButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
