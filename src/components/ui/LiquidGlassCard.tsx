import React from "react";
import { LiquidGlassCardPointer } from "@/components/ui/LiquidGlassCardPointer";

export type LiquidGlassAccent = "neutral" | "mars" | "cyan" | "amber";
export type LiquidGlassCardTier = "showcase" | "surface" | "recessed";

export interface LiquidGlassCardProps {
  id?: string;
  as?: "article" | "div" | "section";
  tier?: LiquidGlassCardTier;
  accent?: LiquidGlassAccent;
  webgl?: boolean;
  interactive?: boolean;
  tilt?: boolean;
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

/**
 * Cards use a GPU-cheap frosted recipe (blur + edge light, see globals.css).
 * Real SVG refraction is reserved for small surfaces: it cannot hold 60fps at card size.
 */
export function LiquidGlassCard({
  id,
  as: Component = "div",
  tier = "surface",
  accent = "neutral",
  interactive = true,
  tilt = false,
  className = "",
  children,
}: LiquidGlassCardProps) {
  const baseClass =
    tier === "recessed"
      ? "liquid-glass-well"
      : `liquid-glass-card scroll-reveal ${ACCENT_CLASS[accent]} ${
          tier === "showcase" ? "liquid-glass-card--showcase" : ""
        } ${tilt ? "liquid-glass-card--tilt" : ""}`.trim();

  const pointer = interactive && (tier === "showcase" || tilt);

  return (
    <Component id={id} className={`${baseClass} ${className}`.trim()}>
      {pointer && <LiquidGlassCardPointer tilt={tilt} />}
      {children}
    </Component>
  );
}
