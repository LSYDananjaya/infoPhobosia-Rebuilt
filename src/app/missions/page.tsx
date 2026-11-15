"use client";

import React, { useEffect, useState } from "react";
import { missionsData, SolMission } from "@/data/missionsData";
import { Compass, CheckCircle2, ChevronRight, Monitor, MapPin } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { handleTabListKeyDown, readQueryParam, syncQueryParams } from "@/lib/uiHelpers";

const categories = ["All Sols", "Orientation & Setup", "Outpost Operations", "Scientific Research", "Field Exploration & Recon", "Hazard Response & Recovery", "Life Support & Ecology", "Mission Handover & Departure"];

export default function MissionsPage() {
  const [selectedCategory, setSelectedCategoryState] = useState("All Sols");
  const [activeModalMission, setActiveModalMissionState] = useState<SolMission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const categoryParam = readQueryParam("category");
    if (categoryParam && categories.includes(categoryParam)) {
      setSelectedCategoryState(categoryParam);
    }
    const solParam = Number(readQueryParam("sol"));
    if (Number.isInteger(solParam)) {
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

  const filteredMissions = selectedCategory === "All Sols"
    ? missionsData
    : missionsData.filter((m) => m.category === selectedCategory);

  return (
    <div className="py-16 sm:py-24 bg-space-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Intro */}
        <div className="max-w-3xl mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mission uppercase tracking-wider bg-mars-500/10 border border-mars-500/20 text-mars-400 mb-4">
            <Compass className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Authoritative Expedition Architecture</span>
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white">
            SOL 1–11 Mission Progress
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            A comprehensive, day-by-day expedition schedule across eleven Martian SOLs. Sourced directly from the official project mission specification and JSON data files.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div
          role="tablist"
          aria-label="Filter missions by category"
          className="flex items-center gap-2 overflow-x-auto pb-4 mb-12 scrollbar-none"
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
          {filteredMissions.map((mission) => (
            <div
              key={mission.sol}
              className="p-6 sm:p-8 rounded-3xl liquid-glass-card group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left: SOL Number & Main Info */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 rounded-lg text-xs font-mission bg-mars-500/20 text-mars-300 border border-mars-500/30">
                      SOL {mission.sol < 10 ? `0${mission.sol}` : mission.sol}
                    </span>
                    <span className="text-xs font-mission text-cyan-300 px-2.5 py-0.5 rounded bg-space-800 border border-space-700">
                      {mission.category}
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
          ))}
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
