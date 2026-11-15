import React from "react";
import { ArrowUpRight, Compass } from "lucide-react";
import { GithubIcon } from "@/components/ui/Icons";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { HorizonRise } from "@/components/scenes/HorizonRise";

export function LaunchHorizonCTA() {
  return (
    <section
      id="launch-horizon"
      aria-labelledby="launch-horizon-heading"
      className="relative py-24 sm:py-32 bg-space-950 overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-mars-500/18 via-amber-glow/8 to-transparent pointer-events-none"
      />
      <HorizonRise />
      <div
        aria-hidden="true"
        className="absolute top-12 left-1/2 -translate-x-1/2 w-[560px] h-[260px] rounded-full bg-cyan-glow/12 blur-[130px] pointer-events-none"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <LiquidGlassCard
          tier="showcase"
          accent="mars"
          className="rounded-[32px] px-6 py-12 sm:px-12 sm:py-16 space-y-6"
        >
          <p className="font-mission text-xs uppercase tracking-wider text-mars-300">
            Browser-Based 3D Mars Simulation
          </p>

          <h2
            id="launch-horizon-heading"
            className="type-giant-anchor font-semibold text-white max-w-3xl mx-auto"
          >
            Step onto Elysium Planitia.
          </h2>

          <p className="text-sm sm:text-base text-slate-200 max-w-xl mx-auto leading-relaxed">
            Walk through the pressurized outpost corridors, operate physical consoles, fly the coaxial recon drone, and inspect the complete SOL 1 to 11 archive.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <LiquidGlassButton
              href="https://phobosia.sim623.site/"
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="lg"
            >
              <Compass className="w-4 h-4" aria-hidden="true" />
              <span>Open Live 3D Experience</span>
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </LiquidGlassButton>

            <LiquidGlassButton
              href="/missions"
              variant="glass"
              size="lg"
            >
              Browse SOL 1 to 11 Timeline
            </LiquidGlassButton>

            <LiquidGlassButton
              href="https://github.com/osa623/Phobosia-Martian-exploration-experience-powered-by-NASA-Data"
              target="_blank"
              rel="noopener noreferrer"
              variant="glass"
              size="lg"
            >
              <GithubIcon className="w-4 h-4" />
              <span>View Source on GitHub</span>
            </LiquidGlassButton>
          </div>
        </LiquidGlassCard>
      </div>
    </section>
  );
}
