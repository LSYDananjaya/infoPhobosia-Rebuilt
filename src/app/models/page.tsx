"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { modelsData, ModelShowcase } from "@/data/modelsData";
import { Layers, Maximize2, ArrowRight, Moon, Sparkles, Radio, Eye } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { TelemetryScramble } from "@/components/ui/TelemetryScramble";
import { PageTelemetryLayout } from "@/components/layout/PageTelemetryLayout";
import type { RailTocItem } from "@/components/ui/RailToc";
import { handleTabListKeyDown, readQueryParam, syncQueryParams } from "@/lib/uiHelpers";

const categories = ["All Models", "Architecture", "Operations", "Science", "Exterior", "Aviation"];

const MODELS_TOC: RailTocItem[] = [
  { id: "night-observation", label: "Night Observation", depth: 0 },
  { id: "architecture-gallery", label: "3D Architecture Gallery", depth: 0 },
  { id: "attribution-note", label: "Asset Attribution", depth: 0 },
];

export default function ModelsPage() {
  const [selectedCategory, setSelectedCategoryState] = useState("All Models");
  const [lightboxModel, setLightboxModelState] = useState<ModelShowcase | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    const categoryParam = readQueryParam("category");
    if (categoryParam && categories.includes(categoryParam)) {
      setSelectedCategoryState(categoryParam);
    }
    const modelParam = readQueryParam("model");
    if (modelParam) {
      const match = modelsData.find((m) => m.id === modelParam);
      if (match) {
        setLightboxModelState(match);
        setIsLightboxOpen(true);
      }
    }
  }, []);

  const setSelectedCategory = (cat: string) => {
    setSelectedCategoryState(cat);
    syncQueryParams({ category: cat === "All Models" ? null : cat });
  };

  const setLightboxModel = (model: ModelShowcase | null) => {
    if (model) {
      setLightboxModelState(model);
      setIsLightboxOpen(true);
      syncQueryParams({ model: model.id });
    } else {
      setIsLightboxOpen(false);
      syncQueryParams({ model: null });
    }
  };

  const selectedCategoryIndex = Math.max(categories.indexOf(selectedCategory), 0);

  const filteredModels = selectedCategory === "All Models"
    ? modelsData
    : modelsData.filter((m) => m.category === selectedCategory);

  const nightObservationModel = modelsData.find((m) => m.id === "outpost-night-observation");

  return (
    <div className="py-16 sm:py-24 bg-space-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="max-w-3xl mb-12">
          <span className="telemetry-chip text-mars-300 mb-4">
            <Layers className="w-3.5 h-3.5 text-mars-400" aria-hidden="true" />
            <TelemetryScramble text="HANDMADE 3D ASSETS & ENVIRONMENTS · DRACO GLB" />
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-white">
            3D Outpost Architecture
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Every primary architectural structure, habitat interior, and terrain lighting system in PHOBOSIA was modeled from scratch in Blender specifically for this project. Explore the pressurized pods, command hubs, exterior terrain sectors, and nocturnal exploration systems.
          </p>
        </div>

        <PageTelemetryLayout tocTitle="Hardware Registry" items={MODELS_TOC}>
        {/* FEATURED SECTION: Night-Time Martian Terrain Investigation */}
        <LiquidGlassCard
          id="night-observation"
          as="section"
          tier="showcase"
          accent="cyan"
          backdropSrc="/images/outpost_night_observation.png"
          className="scroll-mt-28 mb-20 rounded-3xl overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-mars-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10 lg:p-12 items-center relative z-10">
            {/* Visual Preview Container */}
            <div className="lg:col-span-7">
              <button
                type="button"
                onClick={() => nightObservationModel && setLightboxModel(nightObservationModel)}
                aria-label="Enlarge Night Observation render"
                className="block w-full text-left relative h-72 sm:h-96 md:h-[420px] rounded-2xl overflow-hidden border border-white/15 group shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <Image
                  src="/images/outpost_night_observation.png"
                  alt="PHOBOSIA — Outpost Night Observation and Terrain Investigation on Mars"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover object-center group-hover:scale-[1.03] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-space-950/90 via-space-950/30 to-transparent" />

                {/* Night Indicator Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mission bg-space-950/85 backdrop-blur-md border border-cyan-500/40 text-cyan-300">
                    <Moon className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                    <span>Nocturnal Planetary Simulation</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mission text-slate-300 bg-space-950/80 backdrop-blur-md border border-white/15">
                    <span>Elysium Planitia • Night SOL</span>
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="text-xs font-mission text-slate-300 bg-space-950/80 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/15">
                    Temp: -84°C • PBR Floodlight Array Active
                  </span>
                  <span
                    aria-hidden="true"
                    className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 group-hover:bg-cyan-500/35 transition-colors"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </span>
                </div>
              </button>
            </div>

            {/* Narrative & Scientific Breakdown */}
            <div className="lg:col-span-5 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mission uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Environmental Spotlight</span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight leading-tight">
                Night-Time Investigation on Mars Terrain
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                Martian nights in Elysium Planitia plunge temperatures down to -100°C under an intensely dark, hyper-thin carbon-dioxide atmosphere. PHOBOSIA faithfully recreates the technical challenge and scientific necessity of nocturnal surface operations.
              </p>

              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3.5 rounded-xl liquid-glass-well flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 shrink-0">
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-subhead font-semibold text-white mb-0.5">High-Intensity Outpost Floodlights</h3>
                    <p className="text-slate-400 leading-relaxed">
                      Custom directional lighting shaders cast long, razor-sharp shadows across the volcanic basalt and loose regolith dunes, illuminating EVAs and equipment checks.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl liquid-glass-well flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-mars-950/60 border border-mars-800/40 text-mars-400 shrink-0">
                    <Radio className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-subhead font-semibold text-white mb-0.5">Cryogenic Terrain &amp; Telemetry Sweeps</h3>
                    <p className="text-slate-400 leading-relaxed">
                      Explorers track thermal contraction stress across outpost airlock seals, log nighttime seismic micro-tremors, and gather low-temperature mineral samples.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <LiquidGlassButton
                  type="button"
                  variant="cyan"
                  size="md"
                  onClick={() => nightObservationModel && setLightboxModel(nightObservationModel)}
                >
                  <span>Inspect Technical Specs</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </LiquidGlassButton>
                <a
                  href="https://phobosia.sim623.site/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-nav text-slate-300 hover:text-white transition-colors underline underline-offset-4"
                >
                  Experience in Simulation ↗
                </a>
              </div>
            </div>
          </div>
        </LiquidGlassCard>

        {/* Section Heading & Filter Pills */}
        <section id="architecture-gallery" className="scroll-mt-28">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">Full 3D Architecture Gallery</h2>
            <p className="text-xs text-slate-400 mt-0.5">Filter by functional outpost sector or architectural domain</p>
          </div>
          <div
            role="tablist"
            aria-label="Filter 3D architecture models by category"
            className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none"
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
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {filteredModels.map((model) => (
            <div
              key={model.id}
              className="group rounded-3xl overflow-hidden liquid-glass-card flex flex-col justify-between"
            >
              <div>
                {/* Large Reference Image Container */}
                <button
                  type="button"
                  onClick={() => setLightboxModel(model)}
                  aria-label={`Enlarge ${model.name} render`}
                  className="block relative h-72 sm:h-80 w-full overflow-hidden bg-space-900 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <Image
                    src={model.image}
                    alt={model.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/20 to-transparent" />

                  {/* Badges on Image */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-mission bg-space-950/80 backdrop-blur-md border border-white/15 text-cyan-300">
                      {model.category}
                    </span>
                    {model.id === "outpost-night-observation" && (
                      <span className="px-3 py-1 rounded-full text-xs font-mission bg-cyan-950/90 backdrop-blur-md border border-cyan-500/40 text-cyan-300 flex items-center gap-1">
                        <Moon className="w-3 h-3" aria-hidden="true" />
                        <span>Nocturnal</span>
                      </span>
                    )}
                  </div>

                  <span
                    aria-hidden="true"
                    className="absolute bottom-4 right-4 inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-full bg-white/10 backdrop-blur-md border border-white/25 text-white group-hover:bg-white/20 transition-colors"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </span>
                </button>

                {/* Model Narrative & Role */}
                <div className="p-6 sm:p-8 space-y-4">
                  <div>
                    <h3 className="font-subhead text-xl sm:text-2xl font-semibold text-white group-hover:text-mars-300 transition-colors">
                      {model.name}
                    </h3>
                    <p className="text-xs font-mission text-mars-400 mt-1">
                      {model.tagline}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {model.description}
                  </p>

                  <div className="pt-2 text-xs space-y-1.5">
                    <p>
                      <strong className="text-white font-mission text-xs uppercase">Outpost Role: </strong>
                      <span className="text-slate-300">{model.role}</span>
                    </p>
                    <p>
                      <strong className="text-white font-mission text-xs uppercase">Expedition Relevance: </strong>
                      <span className="text-cyan-300 font-mission text-xs">{model.solRelevance}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Footer with Technical Highlights */}
              <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-4 border-t border-space-800/80 flex items-center justify-between text-xs font-mission text-slate-400">
                <span>{model.triangles}</span>
                <button
                  type="button"
                  onClick={() => setLightboxModel(model)}
                  className="text-mars-400 hover:text-mars-300 font-btn flex items-center gap-1"
                >
                  <span>Detailed Specs</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
        </section>

        {/* Note on External 3D Models & Link to Credits */}
        <section id="attribution-note" className="scroll-mt-28 mt-16 p-8 rounded-3xl liquid-glass-card flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="font-subhead text-base font-semibold text-white">
              3D Asset Credits &amp; External Model Attribution
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              While the outpost architectural pods, night investigation environment, and terrain pipeline are custom-built, selected equipment props (such as the surface drone, terrain rover, and observation chairs) incorporate externally sourced 3D models.
            </p>
          </div>
          <LiquidGlassButton
            href="/credits"
            variant="glass"
            size="md"
            wrapClassName="shrink-0"
            contentClassName="px-5 uppercase tracking-wider"
          >
            View Asset Attribution Page →
          </LiquidGlassButton>
        </section>
        </PageTelemetryLayout>
      </div>

      {/* Lightbox Modal */}
      {lightboxModel && (
        <Modal
          isOpen={isLightboxOpen}
          onClose={() => setLightboxModel(null)}
          title={lightboxModel.name}
          maxWidth="max-w-5xl"
        >
          <div className="space-y-6">
            <div className="relative w-full h-80 sm:h-[450px] rounded-2xl overflow-hidden bg-space-950 border border-space-800">
              <Image
                src={lightboxModel.image}
                alt={lightboxModel.name}
                fill
                sizes="(max-width: 1024px) 100vw, 960px"
                className="object-cover object-center"
              />
            </div>

            <div>
              <p className="text-sm font-mission text-mars-400">{lightboxModel.tagline}</p>
              <p className="mt-2 text-sm text-slate-200 leading-relaxed">{lightboxModel.description}</p>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-space-950 border border-space-800 text-xs font-mission">
              <div>
                <span className="text-slate-400 uppercase text-xs block">Architectural Category:</span>
                <span className="text-white">{lightboxModel.category}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-xs block">Spatial Dimensions:</span>
                <span className="text-cyan-300">{lightboxModel.dimensions}</span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-xs block">Geometric Budget:</span>
                <span className="text-mars-400">{lightboxModel.triangles}</span>
              </div>
            </div>

            {/* Technical Highlights */}
            <div className="p-4 rounded-xl bg-space-950 border border-space-800">
              <h3 className="font-subhead text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
                Modeling &amp; Technical Features:
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {lightboxModel.technicalHighlights.map((tech, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span>{tech}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Screens & Interactions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-space-950 border border-space-800">
                <span className="font-mission text-xs uppercase text-amber-400 block mb-2">
                  Associated Hardware Consoles:
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {lightboxModel.associatedScreens.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span aria-hidden="true" className="text-amber-400">›</span>
                      <span className="font-mission">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-space-950 border border-space-800">
                <span className="font-mission text-xs uppercase text-emerald-400 block mb-2">
                  In-Game Player Interactions:
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {lightboxModel.inGameInteractions.map((act, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span aria-hidden="true" className="text-emerald-400">›</span>
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
