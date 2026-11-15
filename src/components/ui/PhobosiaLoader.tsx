"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import {
  MatrixOrb,
  type MatrixOrbAccent,
  type MatrixOrbState,
} from "@/components/ui/MatrixOrb";
import {
  AiStatus,
  type AiStatusState,
  type AiStatusStateConfig,
} from "@/components/ui/AiStatus";

export type PhobosiaLoaderVariant = "fullscreen" | "card" | "pill";

export type PhobosiaLoaderProps = {
  variant?: PhobosiaLoaderVariant;
  state?: AiStatusState | (string & {});
  states?: Record<string, AiStatusStateConfig>;
  label?: string;
  detail?: string;
  progress?: number;
  telemetryCode?: string;
  phaseBadge?: string;
  accent?: MatrixOrbAccent;
  timer?: boolean;
  elapsed?: number;
  onSkip?: () => void;
  skipLabel?: string;
  className?: string;
};

function resolveOrbState(state: string): MatrixOrbState {
  if (state === "streaming" || state === "researching") return "listening";
  if (state === "done" || state === "error") return "idle";
  return "thinking";
}

function resolveOrbAccent(
  state: string,
  accent?: MatrixOrbAccent
): MatrixOrbAccent {
  if (accent) return accent;
  if (state === "error") return "mars";
  if (state === "streaming" || state === "researching") return "cyan";
  return "dual";
}

/**
 * Unified PHOBOSIA loader combining the physics-blended MatrixOrb dot matrix
 * and spring-measured AiStatus telemetry bar in Liquid Glass surfaces.
 */
export function PhobosiaLoader({
  variant = "card",
  state = "calibrating",
  states,
  label,
  detail,
  progress,
  telemetryCode = "PHOBOSIA // EL-04",
  phaseBadge,
  accent,
  timer = true,
  elapsed,
  onSkip,
  skipLabel = "Enter Outpost",
  className,
}: PhobosiaLoaderProps) {
  const reduced = !!useReducedMotion();
  const orbState = resolveOrbState(state);
  const orbAccent = resolveOrbAccent(state, accent);

  if (variant === "pill") {
    return (
      <div
        data-slot="phobosia-loader"
        data-variant="pill"
        className={cn(
          "inline-flex items-center gap-2.5 rounded-full border border-white/15",
          "bg-[linear-gradient(155deg,rgba(16,23,40,0.86),rgba(6,10,18,0.94))]",
          "px-3 py-1.5 backdrop-blur-xl",
          "shadow-[0_12px_28px_-8px_rgba(0,0,0,0.82),inset_0_1px_0_rgba(255,255,255,0.22)]",
          className
        )}
      >
        <MatrixOrb
          size={26}
          dots={7}
          state={orbState}
          accent={orbAccent}
          level={progress}
        />
        <AiStatus
          state={state}
          states={states}
          label={label}
          detail={detail}
          timer={timer}
          elapsed={elapsed}
          showIcon={false}
          compact={true}
        />
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        data-slot="phobosia-loader"
        data-variant="card"
        className={cn(
          "flex flex-col sm:flex-row items-center justify-center gap-4 px-4 py-3",
          className
        )}
      >
        <MatrixOrb
          size={54}
          dots={9}
          state={orbState}
          accent={orbAccent}
          level={progress}
        />
        <span
          aria-hidden="true"
          className="hidden sm:block h-8 w-px bg-white/10"
        />
        <div className="flex flex-col items-center sm:items-start gap-1">
          <AiStatus
            state={state}
            states={states}
            label={label}
            detail={detail}
            timer={timer}
            elapsed={elapsed}
          />
          {telemetryCode && (
            <span className="font-mission text-[10px] uppercase tracking-[0.18em] text-slate-400">
              {telemetryCode}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Fullscreen / Route segment telemetry deck
  const clampedProgress =
    progress === undefined ? undefined : Math.min(1, Math.max(0, progress));

  return (
    <div
      data-slot="phobosia-loader"
      data-variant="fullscreen"
      className={cn(
        "relative flex min-h-[70dvh] w-full items-center justify-center overflow-hidden bg-space-950 px-4 py-12",
        className
      )}
    >
      {/* Subtle planetary ambient aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 left-1/3 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mars-500/12 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1/4 right-1/3 h-80 w-80 translate-x-1/2 translate-y-1/2 rounded-full bg-cyan-glow/10 blur-[120px]"
      />

      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-3xl border border-white/15",
          "bg-[linear-gradient(155deg,rgba(18,25,42,0.88),rgba(6,10,19,0.96))]",
          "px-6 py-8 sm:px-8 sm:py-9 backdrop-blur-2xl",
          "shadow-[0_28px_72px_-16px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(255,255,255,0.22)]"
        )}
      >
        {/* Telemetry HUD corner ticks */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-3 left-3 h-2.5 w-2.5 rounded-tl border-t border-l border-cyan-glow/45"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-3 right-3 h-2.5 w-2.5 rounded-tr border-t border-r border-white/25"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 left-3 h-2.5 w-2.5 rounded-bl border-b border-l border-white/25"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 right-3 h-2.5 w-2.5 rounded-br border-b border-r border-mars-400/45"
        />

        {/* Top header strip */}
        <div className="mb-7 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                "h-2 w-2 rounded-full",
                state === "done"
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.75)]"
                  : state === "error"
                    ? "bg-mars-500 shadow-[0_0_8px_rgba(217,75,50,0.75)]"
                    : "bg-mars-400 shadow-[0_0_8px_rgba(232,108,72,0.75)]"
              )}
            />
            <span className="font-mission text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              {telemetryCode}
            </span>
          </div>

          <span className="font-mission text-xs uppercase tracking-[0.14em] text-cyan-glow/85 tabular-nums">
            {phaseBadge ?? "4.5°N · 135.9°E"}
          </span>
        </div>

        {/* Centerpiece MatrixOrb */}
        <div className="flex flex-col items-center">
          <MatrixOrb
            size={132}
            dots={11}
            ring={true}
            state={orbState}
            accent={orbAccent}
            level={clampedProgress}
          />

          {/* Progress rail */}
          <div
            aria-hidden="true"
            className="mt-7 h-1 w-48 sm:w-56 overflow-hidden rounded-full bg-white/[0.08]"
          >
            {clampedProgress !== undefined ? (
              <motion.div
                className="h-full origin-left rounded-full bg-gradient-to-r from-mars-400 via-mars-300 to-cyan-glow"
                initial={false}
                animate={{ scaleX: clampedProgress }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 120, damping: 24 }
                }
              />
            ) : (
              <motion.div
                className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-cyan-glow to-mars-400"
                animate={reduced ? undefined : { x: ["-100%", "220%"] }}
                transition={{
                  duration: 1.5,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
              />
            )}
          </div>

          {/* Morphing AiStatus telemetry bar */}
          <div className="mt-5 flex justify-center">
            <AiStatus
              state={state}
              states={states}
              label={label}
              detail={detail}
              timer={timer}
              elapsed={elapsed}
            />
          </div>

          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 min-h-[38px] font-mission text-xs uppercase tracking-[0.16em] text-slate-300 transition-colors hover:border-cyan-glow/40 hover:text-white cursor-pointer"
            >
              <span>{skipLabel}</span>
              <span className="text-slate-400">ESC</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PhobosiaLoader;
