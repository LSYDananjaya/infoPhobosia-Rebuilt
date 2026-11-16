"use client";

import React, { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { scienceData } from "@/data/scienceData";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { TelemetryGauge } from "@/components/ui/TelemetryScramble";
import { handleTabListKeyDown, readQueryParam, syncQueryParams } from "@/lib/uiHelpers";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function SciencePipelineBand() {
  const idPrefix = useId();
  const [activeStep, setActiveStepState] = useState<number>(1);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const stepParam = Number(readQueryParam("step"));
    if (scienceData.pipelineSteps.some((s) => s.stepNumber === stepParam)) {
      setActiveStepState(stepParam);
    }
  }, []);

  const setActiveStep = (stepNumber: number) => {
    setActiveStepState(stepNumber);
    syncQueryParams({ step: stepNumber === 1 ? null : String(stepNumber) });
  };

  const currentStep =
    scienceData.pipelineSteps.find((s) => s.stepNumber === activeStep) ??
    scienceData.pipelineSteps[0];
  const activeStepIndex = Math.max(
    scienceData.pipelineSteps.findIndex((s) => s.stepNumber === currentStep.stepNumber),
    0
  );

  return (
    <section
      id="planetary-science"
      aria-labelledby="science-band-heading"
      className="py-20 sm:py-28 bg-space-900/45 border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: NASA Data Context & Transparency Matrix */}
          <div className="lg:col-span-5 space-y-6">
            <div className="font-mission text-xs uppercase tracking-wider text-cyan-300">
              Planetary Science Foundation
            </div>
            <h2
              id="science-band-heading"
              className="text-3xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.06]"
            >
              Grounded in NASA HiRISE &amp; MOLA Relief
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Instead of sculpting generic terrain, PHOBOSIA ingests real NASA Digital Terrain Models from the Mars Reconnaissance Orbiter, transforming raw planetary rasters into a 4 km x 4 km navigable WebGL desert.
            </p>

            {/* Target Region Snapshot + Radial Telemetry Gauges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <TelemetryGauge
                label="HiRISE Resolution"
                valueLabel="1.0 m / px DTM"
                sublabel="DTEEC_017983_1865"
                percent={96}
                accent="cyan"
              />
              <TelemetryGauge
                label="GPU Rock Scatter"
                valueLabel="100,000+ Meshes"
                sublabel="60 FPS Instanced"
                percent={88}
                accent="mars"
              />
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mission text-xs">
              <div className="p-4 rounded-2xl liquid-glass-card">
                <dt className="text-xs text-slate-400 uppercase">Target Region</dt>
                <dd className="text-white mt-1">{scienceData.region.name}</dd>
                <dd className="text-xs text-slate-300 mt-0.5">{scienceData.region.coordinates}</dd>
              </div>
              <div className="p-4 rounded-2xl liquid-glass-card liquid-glass-card--cyan">
                <dt className="text-xs text-slate-400 uppercase">Primary Product</dt>
                <dd className="text-cyan-300 mt-1 truncate">DTEEC_017983_1865</dd>
                <dd className="text-xs text-slate-300 mt-0.5">
                  {scienceData.region.elevationBaseline}
                </dd>
              </div>
            </dl>

            <div className="pt-2">
              <LiquidGlassButton
                href="/science"
                variant="primary"
                size="md"
                contentClassName="px-6"
              >
                Inspect Scientific Datasets &amp; Citations
              </LiquidGlassButton>
            </div>
          </div>

          {/* Right: Interactive 5-Step Terrain Pipeline & Transparency Pillars */}
          <div className="lg:col-span-7 space-y-6">
            <LiquidGlassCard
              tier="showcase"
              accent="cyan"
              className="rounded-[28px] p-5 sm:p-7 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-subhead text-base sm:text-lg font-semibold text-white">
                  Python GDAL to 60 FPS WebGL Pipeline
                </h3>
                <span className="font-mission text-xs text-slate-400">
                  5 Processing Stages
                </span>
              </div>

              {/* 5 Pipeline Step Buttons */}
              <div
                role="tablist"
                aria-label="Terrain processing pipeline steps"
                className="grid grid-cols-5 gap-2"
              >
                {scienceData.pipelineSteps.map((step) => {
                  const selected = step.stepNumber === currentStep.stepNumber;
                  return (
                    <button
                      key={step.stepNumber}
                      id={`${idPrefix}-step-tab-${step.stepNumber}`}
                      type="button"
                      role="tab"
                      tabIndex={selected ? 0 : -1}
                      aria-selected={selected}
                      aria-controls={`${idPrefix}-step-panel`}
                      onClick={() => setActiveStep(step.stepNumber)}
                      onKeyDown={(e) =>
                        handleTabListKeyDown(
                          e,
                          scienceData.pipelineSteps,
                          activeStepIndex,
                          (next) => setActiveStep(next.stepNumber)
                        )
                      }
                      className={`py-2.5 px-2 rounded-xl font-btn text-xs transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.96] min-h-[44px] ${
                        selected
                          ? "bg-cyan-400 text-space-950 shadow-[0_6px_18px_rgba(56,189,248,0.35)]"
                          : "liquid-glass-tab text-slate-300 hover:text-white"
                      }`}
                    >
                      0{step.stepNumber}
                    </button>
                  );
                })}
              </div>

              {/* Selected Pipeline Step Readout */}
              <div
                id={`${idPrefix}-step-panel`}
                role="tabpanel"
                aria-labelledby={`${idPrefix}-step-tab-${currentStep.stepNumber}`}
                className="p-5 rounded-2xl liquid-glass-well"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentStep.stepNumber}
                    initial={
                      reducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, filter: "blur(3px)", transform: "translate3d(0, 4px, 0)" }
                    }
                    animate={{
                      opacity: 1,
                      filter: "blur(0px)",
                      transform: "translate3d(0, 0, 0)",
                      transition: { duration: reducedMotion ? 0.14 : 0.2, ease: EASE_OUT },
                    }}
                    exit={
                      reducedMotion
                        ? { opacity: 0 }
                        : {
                            opacity: 0,
                            filter: "blur(3px)",
                            transform: "translate3d(0, -4px, 0)",
                            transition: { duration: 0.12, ease: EASE_OUT },
                          }
                    }
                    className="space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-subhead text-base sm:text-lg font-semibold text-white">
                        {currentStep.title}
                      </h4>
                      <span className="font-mission text-xs text-cyan-300">
                        {currentStep.technology}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {currentStep.description}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
                      <div>
                        <span className="font-mission text-xs text-slate-400 uppercase">
                          Input
                        </span>
                        <p className="text-slate-100 font-mission mt-0.5">{currentStep.input}</p>
                      </div>
                      <div>
                        <span className="font-mission text-xs text-slate-400 uppercase">
                          Output
                        </span>
                        <p className="text-mars-300 font-mission mt-0.5">{currentStep.output}</p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </LiquidGlassCard>

            {/* 4 Transparency Pillars (Clean 2x2 Matrix) */}
            <h3 className="sr-only">Scientific Transparency Pillars</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {scienceData.transparencyPrinciples.map((item) => (
                <div
                  key={item.title}
                  className="p-4 rounded-2xl liquid-glass-card space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-subhead text-xs font-semibold text-white">{item.title}</h4>
                    <span className="font-mission text-xs text-mars-300">
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
