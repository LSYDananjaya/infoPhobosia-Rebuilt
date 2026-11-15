"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  liquidGlassEngine,
  LiquidGlassAccent,
  LiquidGlassMode,
} from "@/lib/liquidGlassEngine";
import { getScrollVersion, subscribeScrollProgress } from "@/lib/viewportMetrics";

export interface LiquidGlassSurfaceProps {
  accent?: LiquidGlassAccent;
  mode?: LiquidGlassMode;
  glassAlpha?: number;
  backdropSrc?: string;
  interactive?: boolean;
  className?: string;
}

export function LiquidGlassSurface({
  accent = "neutral",
  mode = "card",
  glassAlpha,
  backdropSrc,
  interactive = true,
  className = "",
}: LiquidGlassSurfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  const resolvedAlpha =
    glassAlpha ?? (mode === "navbar" ? 0.24 : 0.42);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = mq.matches;

    let width = parent.clientWidth || 1;
    let height = parent.clientHeight || 1;
    let radius = 28;
    let inView = mode === "navbar";
    let rafId = 0;
    let lastTime = performance.now();
    let cachedRect: DOMRect | null = null;
    let cachedRectScrollVersion = -1;

    const refreshRect = () => {
      cachedRect = parent.getBoundingClientRect();
      cachedRectScrollVersion = getScrollVersion();
    };

    const getParentRect = () => {
      if (!cachedRect || cachedRectScrollVersion !== getScrollVersion()) {
        refreshRect();
      }
      return cachedRect!;
    };

    const state = {
      mouseX: width * 0.5,
      mouseY: height * 0.35,
      targetX: width * 0.5,
      targetY: height * 0.35,
      hover: 0,
      targetHover: 0,
      scrollPhase: 0,
      pointerInside: false,
    };

    const readRadius = () => {
      const style = window.getComputedStyle(parent);
      const parsed = parseFloat(style.borderTopLeftRadius);
      if (Number.isFinite(parsed) && parsed > 0) {
        radius = parsed;
      } else {
        radius = mode === "navbar" ? height * 0.5 : 28;
      }
    };

    const drawFrame = () => {
      if (!inView || width < 2 || height < 2) return;
      const ok = liquidGlassEngine.render(
        {
          targetCanvas: canvas,
          width,
          height,
          radius,
          mouseX: state.mouseX,
          mouseY: state.mouseY,
          hover: reducedMotion ? 0 : state.hover,
          accent,
          mode,
          glassAlpha: resolvedAlpha,
          scrollPhase: state.scrollPhase,
          backdropSrc,
        },
        () => {
          drawFrame();
        }
      );
      if (ok) {
        setReady(true);
      }
    };

    const tick = (now: number) => {
      rafId = 0;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const lerpFactor = 1 - Math.exp(-12 * dt);
      state.mouseX += (state.targetX - state.mouseX) * lerpFactor;
      state.mouseY += (state.targetY - state.mouseY) * lerpFactor;
      state.hover += (state.targetHover - state.hover) * lerpFactor;

      drawFrame();

      const dx = Math.abs(state.targetX - state.mouseX);
      const dy = Math.abs(state.targetY - state.mouseY);
      const dh = Math.abs(state.targetHover - state.hover);

      if (
        !reducedMotion &&
        inView &&
        (state.pointerInside || dx > 0.35 || dy > 0.35 || dh > 0.005)
      ) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const scheduleRender = () => {
      if (!inView || rafId) return;
      lastTime = performance.now();
      rafId = window.requestAnimationFrame(tick);
    };

    readRadius();
    if (inView) {
      drawFrame();
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      width = Math.max(entry.contentRect.width, parent.clientWidth, 2);
      height = Math.max(entry.contentRect.height, parent.clientHeight, 2);
      cachedRect = null;
      if (!state.pointerInside) {
        state.mouseX = width * 0.5;
        state.mouseY = height * 0.35;
        state.targetX = state.mouseX;
        state.targetY = state.mouseY;
      }
      readRadius();
      drawFrame();
    });
    resizeObserver.observe(parent);

    let intersectionObserver: IntersectionObserver | null = null;
    if (mode !== "navbar") {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          inView = Boolean(entries[0]?.isIntersecting);
          if (inView) {
            drawFrame();
          }
        },
        { rootMargin: "160px" }
      );
      intersectionObserver.observe(parent);
    }

    const handlePointerEnter = () => {
      if (!interactive || reducedMotion) return;
      refreshRect();
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!interactive || reducedMotion) return;
      const rect = getParentRect();
      state.targetX = e.clientX - rect.left;
      state.targetY = e.clientY - rect.top;
      state.targetHover = 1;
      state.pointerInside = true;
      scheduleRender();
    };

    const handlePointerLeave = () => {
      if (!interactive || reducedMotion) return;
      state.pointerInside = false;
      state.targetHover = 0;
      state.targetX = width * 0.5;
      state.targetY = height * 0.35;
      scheduleRender();
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches;
      if (reducedMotion) {
        state.hover = 0;
        state.targetHover = 0;
      }
      drawFrame();
    };

    if (interactive) {
      parent.addEventListener("pointerenter", handlePointerEnter, { passive: true });
      parent.addEventListener("pointermove", handlePointerMove, { passive: true });
      parent.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    }
    let unsubscribeScroll: (() => void) | null = null;
    if (mode === "navbar") {
      unsubscribeScroll = subscribeScrollProgress((progress) => {
        state.scrollPhase = progress;
        if (!reducedMotion) {
          scheduleRender();
        }
      });
    }
    mq.addEventListener("change", handleMotionChange);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
      if (interactive) {
        parent.removeEventListener("pointerenter", handlePointerEnter);
        parent.removeEventListener("pointermove", handlePointerMove);
        parent.removeEventListener("pointerleave", handlePointerLeave);
      }
      unsubscribeScroll?.();
      mq.removeEventListener("change", handleMotionChange);
    };
  }, [accent, mode, resolvedAlpha, backdropSrc, interactive]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-lg-layer="webgl"
      className={`pointer-events-none absolute inset-0 -z-[1] h-full w-full rounded-[inherit] transition-opacity duration-500 ${
        ready ? "opacity-100" : "opacity-0"
      } ${className}`}
    />
  );
}
