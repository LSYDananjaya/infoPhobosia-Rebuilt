"use client";

import React, { useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Maximize2 } from "lucide-react";
import { modelsData, ModelShowcase } from "@/data/modelsData";
import { missionsData } from "@/data/missionsData";
import { SoftModelStage } from "@/components/ui/SoftModelStage";
import { Modal } from "@/components/ui/Modal";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { handleTabListKeyDown, readQueryParam, syncQueryParams } from "@/lib/uiHelpers";

const featuredSectorIds = [
  "outpost-night-observation",
  "mission-control",
  "habitat-zone",
  "science-lab",
  "engineering-unit",
  "airlock",
];

const milestoneSolNumbers = [1, 3, 5, 7, 11];

type ConsoleId = "laptop" | "spectrometer" | "power" | "airlock";
type ConsoleMode = "active" | "empty" | "storm";
const consoleIds: ConsoleId[] = ["laptop", "spectrometer", "power", "airlock"];

const consoleSpecs: Record<
  ConsoleId,
  {
    label: string;
    keyHint: string;
    location: string;
    sol: string;
    metrics: { label: string; value: string }[];
    summary: string;
  }
> = {
  laptop: {
    label: "Personal Laptop OS",
    keyHint: "Press E at Habitat Desk",
    location: "Crew Habitat Quarters",
    sol: "SOL 01",
    metrics: [
      { label: "Active Explorer", value: "Carl Ashwindu" },
      { label: "Callsign", value: "Explorer-01" },
      { label: "Audio Archive", value: "Daily Log Ready" },
    ],
    summary:
      "Windowed crew terminal containing mission directives, audio dispatches, and outpost orientation manifests.",
  },
  spectrometer: {
    label: "Regolith Spectrometer",
    keyHint: "Press E in Science Lab",
    location: "Research & Cultivation Lab",
    sol: "SOL 03, 06, 09",
    metrics: [
      { label: "Primary Target", value: "Basaltic Regolith" },
      { label: "Hydroponics", value: "Dual Chambers" },
      { label: "Element Peaks", value: "Fe, Si, Mg" },
    ],
    summary:
      "Analyzes Martian soil samples gathered on EVA and monitors nutrient pH inside twin pressurized plant growth tubes.",
  },
  power: {
    label: "Power Distribution Bus",
    keyHint: "Press E in Engineering Unit",
    location: "Engineering & Machinery Hall",
    sol: "SOL 02, 04, 07, 08",
    metrics: [
      { label: "Primary Bus", value: "Solar Inverter Array" },
      { label: "Scrubber Bank", value: "CO2 Electrolyzer" },
      { label: "Storm Surge", value: "Breaker Reset Ready" },
    ],
    summary:
      "Routes load between habitat life support, solar farms, and drone charging pads, including SOL 8 breaker recovery.",
  },
  airlock: {
    label: "Dual-Stage Airlock",
    keyHint: "Press E at Airlock Console",
    location: "Airlock Chamber",
    sol: "SOL 06, 11",
    metrics: [
      { label: "Interior Pressure", value: "101.3 kPa" },
      { label: "Mars Surface", value: "0.61 kPa" },
      { label: "Safety Interlock", value: "EVA Suit Required" },
    ],
    summary:
      "Orchestrates inner bulkhead seal, atmospheric reclamation venting, and EVA suit HUD transition before surface egress.",
  },
};

export function BentoOutpostShowcase() {
  const idPrefix = useId();
  const sectors = featuredSectorIds
    .map((id) => modelsData.find((m) => m.id === id))
    .filter((m): m is ModelShowcase => Boolean(m));

  const [activeSectorId, setActiveSectorIdState] = useState<string>(
    sectors[0]?.id ?? "outpost-night-observation"
  );
  const [modalModel, setModalModelState] = useState<ModelShowcase | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const milestoneMissions = milestoneSolNumbers
    .map((sol) => missionsData.find((m) => m.sol === sol))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  const [activeSol, setActiveSolState] = useState<number>(1);

  const [activeConsole, setActiveConsoleState] = useState<ConsoleId>("laptop");
  const [consoleMode, setConsoleMode] = useState<ConsoleMode>("active");

  useEffect(() => {
    const sectorParam = readQueryParam("sector");
    if (sectorParam && featuredSectorIds.includes(sectorParam)) {
      setActiveSectorIdState(sectorParam);
    }
    const solParam = Number(readQueryParam("sol"));
    if (milestoneSolNumbers.includes(solParam)) {
      setActiveSolState(solParam);
    }
    const consoleParam = readQueryParam("console") as ConsoleId | null;
    if (consoleParam && consoleIds.includes(consoleParam)) {
      setActiveConsoleState(consoleParam);
    }
  }, []);

  const setActiveSectorId = (id: string) => {
    setActiveSectorIdState(id);
    syncQueryParams({ sector: id === featuredSectorIds[0] ? null : id });
  };

  const setActiveSol = (sol: number) => {
    setActiveSolState(sol);
    syncQueryParams({ sol: sol === 1 ? null : String(sol) });
  };

  const setModalModel = (model: ModelShowcase | null) => {
    if (model) {
      setModalModelState(model);
      setIsModalOpen(true);
    } else {
      setIsModalOpen(false);
    }
  };

  const currentSector =
    sectors.find((s) => s.id === activeSectorId) ?? sectors[0];
  const currentMission =
    milestoneMissions.find((m) => m.sol === activeSol) ?? milestoneMissions[0];
  const currentConsole = consoleSpecs[activeConsole];

  const handleConsoleSwitch = (id: ConsoleId) => {
    setActiveConsoleState(id);
    setConsoleMode("active");
    syncQueryParams({ console: id === "laptop" ? null : id });
  };

  const activeSectorIndex = Math.max(
    sectors.findIndex((s) => s.id === currentSector?.id),
    0
  );
  const activeSolIndex = Math.max(
    milestoneMissions.findIndex((m) => m.sol === currentMission?.sol),
    0
  );
  const activeConsoleIndex = Math.max(consoleIds.indexOf(activeConsole), 0);

  return (
    <section
      id="outpost-systems"
      aria-labelledby="bento-showcase-heading"
      className="relative py-20 sm:py-28 bg-space-950 border-b border-white/10 overflow-hidden"
    >
      {/* Diffused ambient meshes anchoring the Bento Liquid Glass layer */}
      <div
        aria-hidden="true"
        className="absolute top-24 left-1/4 w-[520px] h-[420px] rounded-full bg-mars-500/12 blur-[140px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-20 right-1/6 w-[480px] h-[480px] rounded-full bg-cyan-glow/12 blur-[140px] pointer-events-none"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 sm:mb-14">
          <div className="max-w-3xl space-y-3">
            <h2
              id="bento-showcase-heading"
              className="type-giant-anchor font-semibold text-white"
            >
              Outpost Systems &amp; Soft 3D Assets
            </h2>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Explore the interconnected 3D base sectors, interactive SOL 1 to 11 campaign progression, and tactile Blender models built for browser rendering.
            </p>
          </div>
          <LiquidGlassButton
            href="/models"
            variant="glass"
            size="md"
            wrapClassName="self-start lg:self-auto"
            contentClassName="px-5 text-sm"
          >
            Open Full 3D Gallery
          </LiquidGlassButton>
        </div>

        {/* Asymmetric 12-Column Modular Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* TILE 1 (Wide Hero Span col-span-8): Outpost Architecture & Nocturnal Observation */}
          {currentSector && (
            <LiquidGlassCard
              as="article"
              tier="showcase"
              accent="cyan"
              backdropSrc={currentSector.image}
              className="md:col-span-6 lg:col-span-8 rounded-[28px] p-5 sm:p-6 flex flex-col justify-between gap-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mission text-xs uppercase tracking-wider text-cyan-300">
                    {currentSector.category} Sector
                  </span>
                  <h3 className="font-subhead text-xl sm:text-2xl font-semibold text-white mt-0.5">
                    {currentSector.name}
                  </h3>
                </div>
                <LiquidGlassButton
                  type="button"
                  variant="glass"
                  size="sm"
                  onClick={() => setModalModel(currentSector)}
                  contentClassName="min-h-[44px] px-4"
                >
                  <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Inspect Specs</span>
                </LiquidGlassButton>
              </div>

              {/* Sector Viewport */}
              <div
                id={`${idPrefix}-sector-panel`}
                role="tabpanel"
                aria-labelledby={`${idPrefix}-sector-tab-${currentSector.id}`}
                className="relative h-60 sm:h-72 lg:h-80 w-full rounded-[20px] overflow-hidden border border-white/15 bg-space-900"
              >
                <Image
                  src={currentSector.image}
                  alt={currentSector.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover object-center transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-space-950/90 via-space-950/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <p className="text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed">
                    {currentSector.tagline}. {currentSector.dimensions} ({currentSector.triangles}).
                  </p>
                </div>
              </div>

              {/* Interactive Module Tabs */}
              <div
                role="tablist"
                aria-label="Outpost 3D sectors"
                className="flex flex-wrap gap-2"
              >
                {sectors.map((sector) => {
                  const selected = sector.id === currentSector.id;
                  return (
                    <button
                      key={sector.id}
                      id={`${idPrefix}-sector-tab-${sector.id}`}
                      type="button"
                      role="tab"
                      tabIndex={selected ? 0 : -1}
                      aria-selected={selected}
                      aria-controls={`${idPrefix}-sector-panel`}
                      onClick={() => setActiveSectorId(sector.id)}
                      onKeyDown={(e) =>
                        handleTabListKeyDown(e, sectors, activeSectorIndex, (next) =>
                          setActiveSectorId(next.id)
                        )
                      }
                      className={`px-3.5 py-2 rounded-full text-xs font-btn transition-colors min-h-[40px] ${
                        selected
                          ? "bg-white text-space-950 shadow-[0_6px_18px_rgba(255,255,255,0.22)]"
                          : "liquid-glass-tab text-slate-200"
                      }`}
                    >
                      {sector.name.replace("Outpost Night Observation & Terrain Investigation", "Night Observation")}
                    </button>
                  );
                })}
              </div>
            </LiquidGlassCard>
          )}

          {/* TILE 2 (Tall Vertical Span col-span-4 row-span-2): Interactive SOL 1-11 Campaign */}
          {currentMission && (
            <LiquidGlassCard
              as="article"
              tier="showcase"
              accent="mars"
              className="md:col-span-6 lg:col-span-4 lg:row-span-2 rounded-[28px] p-5 sm:p-6 flex flex-col justify-between gap-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mission text-xs uppercase tracking-wider text-mars-300">
                    Expedition Arc
                  </span>
                  <span className="font-mission text-xs text-slate-300">
                    11 Playable Days
                  </span>
                </div>

                <h3 className="font-subhead text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                  SOL 1 to 11 Campaign
                </h3>

                {/* SOL Milestone Selector */}
                <div
                  role="tablist"
                  aria-label="Mission SOL milestones"
                  className="grid grid-cols-5 gap-1.5"
                >
                  {milestoneMissions.map((m) => {
                    const active = m.sol === currentMission.sol;
                    return (
                      <button
                        key={m.sol}
                        id={`${idPrefix}-sol-tab-${m.sol}`}
                        type="button"
                        role="tab"
                        tabIndex={active ? 0 : -1}
                        aria-selected={active}
                        aria-controls={`${idPrefix}-sol-panel`}
                        onClick={() => setActiveSol(m.sol)}
                        onKeyDown={(e) =>
                          handleTabListKeyDown(
                            e,
                            milestoneMissions,
                            activeSolIndex,
                            (next) => setActiveSol(next.sol)
                          )
                        }
                        className={`py-2.5 rounded-xl font-btn text-xs transition-colors min-h-[44px] ${
                          active
                            ? "bg-mars-500 text-white shadow-[0_6px_18px_rgba(217,75,50,0.45)] border border-mars-300/60"
                            : "liquid-glass-tab text-slate-300"
                        }`}
                      >
                        S{m.sol < 10 ? `0${m.sol}` : m.sol}
                      </button>
                    );
                  })}
                </div>

                {/* Selected SOL Details */}
                <div
                  id={`${idPrefix}-sol-panel`}
                  role="tabpanel"
                  aria-labelledby={`${idPrefix}-sol-tab-${currentMission.sol}`}
                  className="p-4 sm:p-5 rounded-[20px] liquid-glass-well space-y-4"
                >
                  <div className="flex items-center justify-between text-xs font-mission">
                    <span className="text-mars-300">
                      SOL {currentMission.sol < 10 ? `0${currentMission.sol}` : currentMission.sol}
                    </span>
                    <span className="text-cyan-300 truncate max-w-[170px]">
                      {currentMission.category}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-subhead text-lg font-semibold text-white leading-snug">
                      {currentMission.title}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      {currentMission.primaryObjective}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <span className="block font-mission text-xs text-slate-400 uppercase">
                      Mission Protocol Tasks
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-200">
                      {currentMission.tasks.slice(0, 3).map((task, idx) => (
                        <li key={task} className="flex items-start gap-2">
                          <span className="font-mission text-xs text-mars-300 mt-0.5 shrink-0">
                            0{idx + 1}
                          </span>
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <span className="block font-mission text-xs text-slate-400 uppercase">
                      Active Consoles
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-200">
                      {currentMission.screens.slice(0, 3).map((screen) => (
                        <li key={screen} className="flex items-start gap-2">
                          <span aria-hidden="true" className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                          <span>{screen}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-white/10 space-y-1">
                    <span className="block font-mission text-xs text-cyan-300 uppercase tracking-wider">
                      Expected Telemetry Output
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {currentMission.expectedOutput}
                    </p>
                  </div>

                  <div className="pt-2 text-xs font-mission text-slate-300">
                    Location: {currentMission.location}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <LiquidGlassButton
                  href={`/missions/${currentMission.sol}`}
                  variant="primary"
                  size="md"
                  fullWidth
                >
                  Inspect SOL {currentMission.sol} Briefing
                </LiquidGlassButton>
                <LiquidGlassButton
                  href="/missions"
                  variant="glass"
                  size="md"
                  fullWidth
                >
                  View All 11 SOLs
                </LiquidGlassButton>
              </div>
            </LiquidGlassCard>
          )}

          {/* TILE 3 (col-span-4): Soft-3D Coaxial Mars Drone */}
          <LiquidGlassCard
            as="article"
            tier="showcase"
            accent="cyan"
            className="md:col-span-3 lg:col-span-4 rounded-[28px] p-5 flex flex-col justify-between gap-4"
          >
            <div className="relative h-56 w-full rounded-[20px] liquid-glass-well overflow-hidden">
              <SoftModelStage
                modelUrl="/models/bento-drone.glb"
                posterSrc="/renders/bento-drone.webp"
                alt="Soft 3D model of the PHOBOSIA coaxial Martian reconnaissance drone"
                targetScale={2.45}
                cameraPosition={[0, 0.85, 4.1]}
                fov={35}
                baseRotation={[0.16, -0.5, 0]}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mission">
                <span className="text-cyan-300">SOL 04 &amp; SOL 05</span>
                <span className="text-slate-400">0.020 kg/m³ Air</span>
              </div>
              <h3 className="font-subhead text-lg font-semibold text-white">
                Coaxial Aerial Recon Drone
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Simulated low-density Martian rotor flight capturing aerial orthophotos and targeting geological waypoints above Elysium Planitia.
              </p>
              <div className="pt-1">
                <Link
                  href="/experience"
                  className="inline-flex items-center text-xs font-nav text-cyan-300 hover:text-white transition-colors py-1"
                >
                  Flight Physics &amp; Telemetry
                </Link>
              </div>
            </div>
          </LiquidGlassCard>

          {/* TILE 4 (col-span-4): Soft-3D 6-Wheel Pressurized Rover */}
          <LiquidGlassCard
            as="article"
            tier="showcase"
            accent="mars"
            className="md:col-span-3 lg:col-span-4 rounded-[28px] p-5 flex flex-col justify-between gap-4"
          >
            <div className="relative h-56 w-full rounded-[20px] liquid-glass-well overflow-hidden">
              <SoftModelStage
                modelUrl="/models/bento-rover.glb"
                posterSrc="/renders/bento-rover.webp"
                alt="Soft 3D model of the six-wheeled pressurized Mars Terrain Vehicle"
                targetScale={2.5}
                cameraPosition={[0, 0.9, 4.2]}
                fov={35}
                baseRotation={[0.16, -0.82, 0]}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mission">
                <span className="text-mars-300">SOL 06 &amp; SOL 11</span>
                <span className="text-slate-400">6-Wheel Rocker-Bogie</span>
              </div>
              <h3 className="font-subhead text-lg font-semibold text-white">
                Mars Terrain Vehicle
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pressurized surface rover with terrain-conforming suspension used for EVA field context and the 200-meter departure traverse.
              </p>
              <div className="pt-1">
                <Link
                  href="/models"
                  className="inline-flex items-center text-xs font-nav text-mars-300 hover:text-white transition-colors py-1"
                >
                  Inspect Vehicle Dimensions
                </Link>
              </div>
            </div>
          </LiquidGlassCard>

          {/* TILE 5 (col-span-6): Soft-3D Terrain Pod + NASA HiRISE Specimen */}
          <LiquidGlassCard
            as="article"
            tier="showcase"
            accent="cyan"
            className="md:col-span-6 lg:col-span-6 rounded-[28px] p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center"
          >
            <div className="sm:col-span-5 relative h-56 sm:h-64 w-full rounded-[20px] liquid-glass-well overflow-hidden">
              <SoftModelStage
                modelUrl="/models/bento-terrain-pod.glb"
                posterSrc="/renders/bento-terrain-pod.webp"
                alt="Soft 3D Elysium Planitia HiRISE terrain contour slice with frosted hydroponic bio-core"
                targetScale={2.45}
                cameraPosition={[0, 0.95, 4.1]}
                fov={35}
                baseRotation={[0.18, -0.4, 0]}
              />
            </div>

            <div className="sm:col-span-7 space-y-4">
              <div>
                <span className="font-mission text-xs uppercase tracking-wider text-cyan-300">
                  NASA HiRISE Elevation &amp; Lab
                </span>
                <h3 className="font-subhead text-xl sm:text-2xl font-semibold text-white mt-1">
                  Real Planetary Relief
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  NASA HiRISE Digital Terrain Models are clipped via Python GDAL and paired with 100,000+ GPU-instanced boulders for 60 FPS browser travel.
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 font-mission text-xs">
                <div className="p-2.5 rounded-xl liquid-glass-well">
                  <dt className="text-xs text-slate-400">HiRISE DTM</dt>
                  <dd className="text-white mt-0.5">1.0 m / px</dd>
                </div>
                <div className="p-2.5 rounded-xl liquid-glass-well">
                  <dt className="text-xs text-slate-400">Instanced Rocks</dt>
                  <dd className="text-cyan-300 mt-0.5">100,000+</dd>
                </div>
              </dl>

              <Link
                href="/science"
                className="inline-flex items-center text-xs font-nav text-white hover:text-cyan-300 transition-colors py-1"
              >
                Review Scientific Datasets
              </Link>
            </div>
          </LiquidGlassCard>

          {/* TILE 6 (col-span-6): Interactive E-Key Physical Console Preview with UI States */}
          <LiquidGlassCard
            as="article"
            tier="showcase"
            accent="amber"
            className="md:col-span-6 lg:col-span-6 rounded-[28px] p-5 sm:p-6 flex flex-col justify-between gap-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-mission text-xs uppercase tracking-wider text-amber-300">
                  Interactive Hardware Consoles
                </span>
                <h3 className="font-subhead text-xl sm:text-2xl font-semibold text-white mt-0.5">
                  20+ Press [E] Screens
                </h3>
              </div>

              {/* Explicit State Controls (Active, Storm Fault, Standby/Empty) */}
              <div className="flex items-center gap-1.5" role="group" aria-label="Console simulation states">
                <button
                  type="button"
                  aria-pressed={consoleMode === "active"}
                  onClick={() => setConsoleMode("active")}
                  className={`px-3 py-1.5 rounded-full text-xs font-btn transition-colors min-h-[36px] ${
                    consoleMode === "active"
                      ? "bg-cyan-400 text-space-950 shadow-[0_4px_14px_rgba(56,189,248,0.35)]"
                      : "liquid-glass-tab text-slate-300 hover:text-white"
                  }`}
                >
                  Online
                </button>
                <button
                  type="button"
                  aria-pressed={consoleMode === "storm"}
                  onClick={() => setConsoleMode("storm")}
                  className={`px-3 py-1.5 rounded-full text-xs font-btn transition-colors min-h-[36px] ${
                    consoleMode === "storm"
                      ? "bg-amber-400 text-space-950 shadow-[0_4px_14px_rgba(245,158,11,0.35)]"
                      : "liquid-glass-tab text-slate-300 hover:text-white"
                  }`}
                >
                  SOL 7 Fault
                </button>
                <button
                  type="button"
                  aria-pressed={consoleMode === "empty"}
                  onClick={() => setConsoleMode("empty")}
                  className={`px-3 py-1.5 rounded-full text-xs font-btn transition-colors min-h-[36px] ${
                    consoleMode === "empty"
                      ? "bg-white text-space-950 shadow-[0_4px_14px_rgba(255,255,255,0.28)]"
                      : "liquid-glass-tab text-slate-300 hover:text-white"
                  }`}
                >
                  Standby
                </button>
              </div>
            </div>

            {/* Console Switcher Tabs */}
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Physical outpost consoles">
              {consoleIds.map((id) => {
                const selected = activeConsole === id;
                return (
                  <button
                    key={id}
                    id={`${idPrefix}-console-tab-${id}`}
                    type="button"
                    role="tab"
                    tabIndex={selected ? 0 : -1}
                    aria-selected={selected}
                    aria-controls={`${idPrefix}-console-panel`}
                    onClick={() => handleConsoleSwitch(id)}
                    onKeyDown={(e) =>
                      handleTabListKeyDown(e, consoleIds, activeConsoleIndex, (next) =>
                        handleConsoleSwitch(next)
                      )
                    }
                    className={`px-3.5 py-2 rounded-full text-xs font-btn transition-colors min-h-[40px] ${
                      selected
                        ? "bg-white text-space-950 shadow-[0_4px_16px_rgba(255,255,255,0.24)]"
                        : "liquid-glass-tab text-slate-200"
                    }`}
                  >
                    {consoleSpecs[id].label}
                  </button>
                );
              })}
            </div>

            {/* Console Screen Output supporting Fault, Standby/Empty, and Active States */}
            <div
              id={`${idPrefix}-console-panel`}
              role="tabpanel"
              aria-labelledby={`${idPrefix}-console-tab-${activeConsole}`}
              aria-live="polite"
              className="rounded-[20px] liquid-glass-well p-4 min-h-[168px] flex flex-col justify-between"
            >
              {consoleMode === "empty" && (
                <div className="my-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                  <div className="space-y-1">
                    <p className="text-sm font-subhead font-semibold text-white">
                      Console in Standby Mode
                    </p>
                    <p className="text-xs text-slate-300">
                      Approach within 2.5 m inside {currentConsole.location} and press E to wake telemetry.
                    </p>
                  </div>
                  <LiquidGlassButton
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setConsoleMode("active")}
                    wrapClassName="shrink-0"
                    contentClassName="min-h-[40px] px-4"
                  >
                    Simulate Press [E]
                  </LiquidGlassButton>
                </div>
              )}

              {consoleMode === "storm" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mission">
                    <span className="text-amber-300">
                      SOL 07 Dust Storm Alert: Solar Input Degraded
                    </span>
                    <button
                      type="button"
                      onClick={() => setConsoleMode("active")}
                      className="text-xs font-btn text-cyan-300 underline hover:text-white"
                    >
                      Restore Bus
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Breaker tripped on auxiliary circuit during dust storm surge. Reset relays in the Engineering Unit (SOL 08) to restore full telemetry on {currentConsole.label}.
                  </p>
                </div>
              )}

              {consoleMode === "active" && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mission">
                    <span className="text-cyan-300">{currentConsole.keyHint}</span>
                    <span className="text-slate-400">
                      {currentConsole.location} ({currentConsole.sol})
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed my-2.5">
                    {currentConsole.summary}
                  </p>
                  <dl className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 font-mission text-xs">
                    {currentConsole.metrics.map((m) => (
                      <div key={m.label}>
                        <dt className="text-xs text-slate-400 truncate">{m.label}</dt>
                        <dd className="text-white truncate">{m.value}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mission">
                WASD + Mouse Look + E Key
              </span>
              <Link
                href="/experience"
                className="font-nav text-mars-300 hover:text-white transition-colors py-1"
              >
                Explore All Control Systems
              </Link>
            </div>
          </LiquidGlassCard>
        </div>
      </div>

      {/* Accessible Modal for Sector Details */}
      {modalModel && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setModalModel(null)}
          title={modalModel.name}
        >
          <div className="space-y-6">
            <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden bg-space-950 border border-white/15">
              <Image
                src={modalModel.image}
                alt={modalModel.name}
                fill
                sizes="(max-width: 1024px) 100vw, 800px"
                className="object-cover object-center"
              />
            </div>
            <div>
              <p className="text-sm font-mission text-mars-300">{modalModel.tagline}</p>
              <p className="mt-2 text-sm text-slate-200 leading-relaxed">
                {modalModel.description}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
              <div>
                <span className="text-slate-400 uppercase tracking-wider font-mission">
                  Outpost Role
                </span>
                <p className="text-slate-100 mt-1">{modalModel.role}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase tracking-wider font-mission">
                  Dimensions &amp; Budget
                </span>
                <p className="text-slate-100 font-mission mt-1">
                  {modalModel.dimensions} ({modalModel.triangles})
                </p>
              </div>
            </div>
            <div className="pt-2">
              <LiquidGlassButton
                href="/models"
                onClick={() => setModalModel(null)}
                variant="primary"
                size="md"
                contentClassName="px-5"
              >
                <span>Open Full 3D Models Page</span>
              </LiquidGlassButton>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
