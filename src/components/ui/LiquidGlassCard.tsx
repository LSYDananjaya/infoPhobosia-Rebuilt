import React from "react";
import { LiquidGlassSurface } from "@/components/ui/LiquidGlassSurface";
import type { LiquidGlassAccent } from "@/lib/liquidGlassEngine";

export type LiquidGlassCardTier = "showcase" | "surface" | "recessed";

export interface LiquidGlassCardProps {
  id?: string;
  as?: "article" | "div" | "section";
  tier?: LiquidGlassCardTier;
  accent?: LiquidGlassAccent;
  webgl?: boolean;
  interactive?: boolean;
  backdropSrc?: string;
  glassAlpha?: number;
  className?: string;
  children: React.ReactNode;
}

const ACCENT_CLASS: Record<LiquidGlassAccent, string> = {
  neutral: "",
  mars: "liquid-glass-card--mars",
  cyan: "liquid-glass-card--cyan",
  amber: "liquid-glass-card--amber",
};

export function LiquidGlassCard({
  id,
  as: Component = "div",
  tier = "surface",
  accent = "neutral",
  webgl = tier === "showcase",
  interactive = true,
  backdropSrc,
  glassAlpha,
  className = "",
  children,
}: LiquidGlassCardProps) {
  const baseClass =
    tier === "recessed"
      ? "liquid-glass-well"
      : `liquid-glass-card ${ACCENT_CLASS[accent]}`.trim();

  return (
    <Component id={id} className={`${baseClass} ${className}`.trim()}>
      {webgl && tier !== "recessed" && (
        <LiquidGlassSurface
          accent={accent}
          mode="card"
          interactive={interactive}
          backdropSrc={backdropSrc}
          glassAlpha={glassAlpha}
        />
      )}
      {children}
    </Component>
  );
}
