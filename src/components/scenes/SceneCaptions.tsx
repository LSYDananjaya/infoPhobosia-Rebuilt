import React from "react";

export interface SceneBeat {
  kicker: string;
  title: string;
  detail?: string;
  metricLabel?: string;
  metricValue?: string;
  accent?: "mars" | "cyan";
}

function splitWords(text: string): string[] {
  return text.trim().split(/\s+/);
}

/**
 * Caption beats share one grid cell so the timeline can cross-fade them and
 * stagger their masked words (.split-word). With reduced motion, CSS stacks
 * them as a clean list.
 */
export function SceneCaptions({
  beats,
  className = "",
}: {
  beats: SceneBeat[];
  className?: string;
}) {
  const total = String(beats.length).padStart(2, "0");

  return (
    <div className={`scene-captions grid ${className}`}>
      {beats.map((beat, i) => {
        const indexStr = String(i + 1).padStart(2, "0");
        const words = splitWords(beat.title);
        const isCyan = beat.accent === "cyan";

        return (
          <div
            key={beat.title}
            data-beat={i}
            className="scene-beat scene-hud-card max-w-xl rounded-2xl px-4 py-3.5 sm:px-6 sm:py-5 space-y-2 sm:space-y-2.5"
          >
            {/* Corner reticle ticks */}
            <span className="scene-hud-corner scene-hud-corner--tl" aria-hidden="true" />
            <span className="scene-hud-corner scene-hud-corner--tr" aria-hidden="true" />
            <span className="scene-hud-corner scene-hud-corner--bl" aria-hidden="true" />
            <span className="scene-hud-corner scene-hud-corner--br" aria-hidden="true" />

            <div className="flex flex-wrap items-center justify-between gap-2 font-mission text-xs uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    isCyan ? "bg-cyan-300 shadow-[0_0_8px_#38bdf8]" : "bg-mars-400 shadow-[0_0_8px_#e86c48]"
                  }`}
                  aria-hidden="true"
                />
                <span className={isCyan ? "text-cyan-300" : "text-mars-300"}>{beat.kicker}</span>
              </div>
              <span className="text-slate-400 tabular-nums">
                PHASE {indexStr} / {total}
              </span>
            </div>

            <p
              aria-label={beat.title}
              className="font-display text-xl sm:text-3xl lg:text-[32px] font-semibold leading-[1.14] tracking-tight text-white"
            >
              {words.map((word, wIdx) => (
                <React.Fragment key={`${wIdx}-${word}`}>
                  <span className="split-word-mask" aria-hidden="true">
                    <span data-word className="split-word">
                      {word}
                    </span>
                  </span>
                  {wIdx < words.length - 1 ? " " : ""}
                </React.Fragment>
              ))}
            </p>

            {beat.detail && (
              <p
                data-beat-detail
                className="text-xs sm:text-sm text-slate-300/95 leading-relaxed max-w-lg"
              >
                {beat.detail}
              </p>
            )}

            {beat.metricLabel && beat.metricValue && (
              <div
                data-beat-meta
                className="pt-2 border-t border-white/10 flex items-center justify-between gap-4 font-mission text-xs uppercase tracking-[0.16em]"
              >
                <span className="text-slate-400">{beat.metricLabel}</span>
                <span className={isCyan ? "text-cyan-300" : "text-mars-300"}>
                  {beat.metricValue}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface SceneProgressProps {
  label: string;
  primaryLabel?: string;
  primaryInitial?: string;
  secondaryLabel?: string;
  secondaryInitial?: string;
}

/** Top HUD telemetry bar with live scroll-interpolated readout slots + progress rail. */
export function SceneProgress({
  label,
  primaryLabel = "ALTITUDE",
  primaryInitial = "42,800 KM",
  secondaryLabel = "VELOCITY",
  secondaryInitial = "4.82 KM/S",
}: SceneProgressProps) {
  return (
    <div className="scene-progress absolute top-20 sm:top-24 inset-x-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pointer-events-none">
      <div className="flex flex-wrap items-center justify-between gap-3 py-2 px-3.5 sm:px-4 rounded-full bg-space-950/60 border border-white/10 backdrop-blur-md font-mission text-xs uppercase tracking-[0.18em] text-slate-300">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="inline-block w-1.5 h-1.5 rounded-full bg-mars-400 shadow-[0_0_8px_rgba(232,108,72,0.75)]"
          />
          <span data-telemetry-stage className="text-white">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-5 text-[11px] sm:text-xs tabular-nums">
          <div>
            <span data-telemetry-primary-label className="hidden sm:inline text-slate-500 mr-1.5">
              {primaryLabel}
            </span>
            <span data-telemetry-primary className="text-mars-300">
              {primaryInitial}
            </span>
          </div>
          <span className="hidden md:inline-block h-3 w-px bg-white/15" />
          <div className="hidden md:block">
            <span data-telemetry-secondary-label className="text-slate-500 mr-1.5">
              {secondaryLabel}
            </span>
            <span data-telemetry-secondary className="text-cyan-300">
              {secondaryInitial}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="relative block h-1 w-20 sm:w-28 rounded-full bg-white/15 overflow-hidden">
            <span
              data-layer="progress"
              className="scene-progress-fill absolute inset-0 rounded-full bg-gradient-to-r from-mars-400 via-mars-300 to-cyan-300"
            />
          </span>
        </div>
      </div>
    </div>
  );
}
