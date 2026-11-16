"use client";

import React, { useEffect, useState } from "react";

const GLYPHS = "0123456789ABCDEF//::--";

export interface TelemetryScrambleProps {
  text: string;
  duration?: number;
  className?: string;
}

/**
 * Console-style scramble decode effect on mount or when `text` changes.
 * Respects `prefers-reduced-motion`.
 */
export function TelemetryScramble({
  text,
  duration = 520,
  className = "",
}: TelemetryScrambleProps) {
  const [output, setOutput] = useState(text);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setOutput(text);
      return;
    }

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const lockCount = Math.floor(progress * text.length);
      let next = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (i < lockCount || ch === " " || ch === "•" || ch === "·") {
          next += ch;
        } else {
          next += GLYPHS[(i + Math.floor(now * 0.06)) % GLYPHS.length];
        }
      }
      setOutput(next);
      if (progress < 1) {
        raf = window.requestAnimationFrame(tick);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [text, duration]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">{output}</span>
    </span>
  );
}

export interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 900,
  className = "",
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(value);
      return;
    }

    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) {
        raf = window.requestAnimationFrame(tick);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toLocaleString("en-US");

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export interface TelemetryGaugeProps {
  label: string;
  valueLabel: string;
  percent: number;
  accent?: "mars" | "cyan" | "amber" | "emerald";
  sublabel?: string;
}

const STROKE_COLOR: Record<NonNullable<TelemetryGaugeProps["accent"]>, string> = {
  mars: "#e86c48",
  cyan: "#38bdf8",
  amber: "#f59e0b",
  emerald: "#34d399",
};

export function TelemetryGauge({
  label,
  valueLabel,
  percent,
  accent = "cyan",
  sublabel,
}: TelemetryGaugeProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const r = 24;
  const c = 2 * Math.PI * r;
  const dashOffset = c * (1 - clamped / 100);

  return (
    <div className="p-3.5 rounded-2xl liquid-glass-well flex items-center gap-3.5">
      <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 60 60" className="w-14 h-14 -rotate-90" aria-hidden="true">
          <circle
            cx="30"
            cy="30"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="4.5"
          />
          <circle
            cx="30"
            cy="30"
            r={r}
            fill="none"
            stroke={STROKE_COLOR[accent]}
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <span className="font-mission text-[11px] font-semibold text-white tabular-nums">
          {Math.round(clamped)}%
        </span>
      </div>
      <div className="min-w-0">
        <span className="block font-mission text-[10px] uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <span className="block font-mission text-sm font-semibold text-white truncate mt-0.5">
          {valueLabel}
        </span>
        {sublabel && (
          <span className="block font-mission text-[11px] text-slate-400 truncate mt-0.5">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
