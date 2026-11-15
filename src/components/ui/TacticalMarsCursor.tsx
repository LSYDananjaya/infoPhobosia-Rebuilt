"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export type TacticalCursorState =
  | "default"
  | "hover"
  | "click"
  | "precision"
  | "text"
  | "hand"
  | "hand-click"
  | "grab"
  | "grabbing"
  | "not-allowed"
  | "loading";

export interface TacticalMarsCursorProps {
  /** Force a global loading cursor state when true */
  isLoading?: boolean;
  /** Optional initial or forced cursor state override */
  forcedState?: TacticalCursorState | null;
  /** Disable custom cursor (e.g. for touch-only environments) */
  disabled?: boolean;
}

const CURSOR_SPRITES: Record<
  "default" | "hover" | "click" | "text" | "hand" | "hand-click" | "grab" | "grabbing",
  string
> = {
  default: "/cursors/pointer-default.png",
  hover: "/cursors/pointer-hover.png",
  click: "/cursors/pointer-click.png",
  text: "/cursors/cursor-text.png",
  hand: "/cursors/hand-point.png",
  "hand-click": "/cursors/hand-click.png",
  grab: "/cursors/hand-grab.png",
  grabbing: "/cursors/hand-grabbing.png",
};

/**
 * Hotspot offsets (% of the sprite container) so the active physical contact point
 * (arrowhead tip, index fingertip, I-beam center, or claw palm center) locks to (clientX, clientY).
 */
const HOTSPOT_OFFSETS: Record<TacticalCursorState, { xPercent: number; yPercent: number }> = {
  default: { xPercent: -21.5, yPercent: -17.0 },
  hover: { xPercent: -21.5, yPercent: -17.0 },
  click: { xPercent: -23.0, yPercent: -19.5 },
  precision: { xPercent: -50.0, yPercent: -50.0 },
  text: { xPercent: -50.0, yPercent: -50.0 },
  hand: { xPercent: -31.0, yPercent: -19.5 },
  "hand-click": { xPercent: -31.0, yPercent: -21.5 },
  grab: { xPercent: -46.0, yPercent: -48.0 },
  grabbing: { xPercent: -46.0, yPercent: -48.0 },
  "not-allowed": { xPercent: -50.0, yPercent: -50.0 },
  loading: { xPercent: -50.0, yPercent: -50.0 },
};

const VALID_CURSOR_STATES = new Set<TacticalCursorState>([
  "default",
  "hover",
  "click",
  "precision",
  "text",
  "hand",
  "hand-click",
  "grab",
  "grabbing",
  "not-allowed",
  "loading",
]);

/**
 * Resolves the appropriate TacticalCursorState from a DOM target via event delegation
 * and `data-cursor="..."` overrides.
 */
function resolveCursorStateFromElement(
  target: Element | null,
  isMouseDown: boolean,
  globalLoading: boolean
): TacticalCursorState {
  if (globalLoading) return "loading";
  if (typeof document !== "undefined" && document.body?.dataset?.cursor === "loading") {
    return "loading";
  }
  if (!target || !(target instanceof Element)) {
    return isMouseDown ? "click" : "default";
  }

  // 1. Explicit data-cursor="..." attribute override on target or ancestor
  const explicitEl = target.closest("[data-cursor]") as HTMLElement | null;
  if (explicitEl) {
    const raw = explicitEl.dataset.cursor?.trim().toLowerCase() as TacticalCursorState | undefined;
    if (raw && VALID_CURSOR_STATES.has(raw)) {
      if (isMouseDown) {
        if (raw === "default" || raw === "hover") return "click";
        if (raw === "hand") return "hand-click";
        if (raw === "grab") return "grabbing";
      }
      return raw;
    }
  }

  // 2. Disabled / Not-Allowed controls (:disabled, [aria-disabled="true"])
  const disabledEl = target.closest(
    ":disabled, [disabled], [aria-disabled='true'], .cursor-not-allowed"
  );
  if (disabledEl) {
    return "not-allowed";
  }

  // 3. Loading elements
  if (target.closest("[aria-busy='true'], .cursor-loading, .cursor-wait")) {
    return "loading";
  }

  // 4. Grab / Draggable elements ([data-cursor="grab"], .draggable, [draggable="true"])
  const grabEl = target.closest(".draggable, [draggable='true'], .cursor-grab, .cursor-grabbing");
  if (grabEl) {
    if (grabEl.classList.contains("cursor-grabbing") || grabEl.classList.contains("dragging")) {
      return "grabbing";
    }
    return isMouseDown ? "grabbing" : "grab";
  }

  // 5. Precision crosshair elements
  if (target.closest(".cursor-crosshair, [data-precision='true']")) {
    return "precision";
  }

  // 6. Hand Pointer / Clickable Hand elements
  const handEl = target.closest(
    ".cursor-hand, [data-interactive='hand'], summary, select, label[for], [role='tab'], [role='switch']"
  );
  if (handEl) {
    return isMouseDown ? "hand-click" : "hand";
  }

  // 7. Interactive Hover Pointer elements (a, button, [role="button"])
  const interactiveEl = target.closest("a, button, [role='button']");
  if (interactiveEl) {
    return isMouseDown ? "click" : "hover";
  }

  // 8. Text Cursor elements (input, textarea, p, [contenteditable])
  const textEl = target.closest(
    "input:not([type='button']):not([type='submit']):not([type='reset']):not([type='checkbox']):not([type='radio']):not([type='range']), textarea, [contenteditable='true'], [contenteditable=''], p"
  );
  if (textEl) {
    return "text";
  }

  return isMouseDown ? "click" : "default";
}

export function TacticalMarsCursor({
  isLoading = false,
  forcedState = null,
  disabled = false,
}: TacticalMarsCursorProps) {
  const [mounted, setMounted] = useState(false);
  const [finePointer, setFinePointer] = useState(false);
  const [cursorState, setCursorState] = useState<TacticalCursorState>("default");
  const [clickPulseId, setClickPulseId] = useState(0);

  const portalRootRef = useRef<HTMLDivElement | null>(null);
  const primaryLayerRef = useRef<HTMLDivElement | null>(null);
  const trailingHudRef = useRef<HTMLDivElement | null>(null);
  const spriteInnerRef = useRef<HTMLDivElement | null>(null);

  const pointerPosRef = useRef({ x: -200, y: -200 });
  const trailingPosRef = useRef({ x: -200, y: -200 });
  const isMouseDownRef = useRef(false);
  const lastTargetRef = useRef<Element | null>(null);
  const activeStateRef = useRef<TacticalCursorState>("default");
  const hasMovedRef = useRef(false);

  // Detect client mount & fine pointer support
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updatePointerMatch = () => setFinePointer(mq.matches);
    updatePointerMatch();

    mq.addEventListener("change", updatePointerMatch);
    return () => mq.removeEventListener("change", updatePointerMatch);
  }, []);

  // Preload all 8 rendered 3D PNG cursor sprites for instant zero-flicker state transitions
  useEffect(() => {
    if (typeof window === "undefined") return;
    Object.values(CURSOR_SPRITES).forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  // Apply global `tactical-cursor-active` class on <html> to hide native browser cursor
  useEffect(() => {
    if (!mounted || !finePointer || disabled) return;
    const htmlEl = document.documentElement;
    htmlEl.classList.add("tactical-cursor-active");
    return () => {
      htmlEl.classList.remove("tactical-cursor-active");
    };
  }, [mounted, finePointer, disabled]);

  // Sync forcedState / isLoading props
  useEffect(() => {
    if (forcedState) {
      activeStateRef.current = forcedState;
      setCursorState(forcedState);
    } else if (isLoading) {
      activeStateRef.current = "loading";
      setCursorState("loading");
    } else {
      const next = resolveCursorStateFromElement(
        lastTargetRef.current,
        isMouseDownRef.current,
        false
      );
      activeStateRef.current = next;
      setCursorState(next);
    }
  }, [forcedState, isLoading]);

  // Zero-latency gsap.quickSetter tracking + 0.06s inertial HUD ring follower
  useGSAP(
    () => {
      if (!mounted || !finePointer || disabled) return;
      const primaryEl = primaryLayerRef.current;
      const trailingEl = trailingHudRef.current;
      if (!primaryEl || !trailingEl) return;

      // Primary cursor sprite locked to (clientX, clientY) via gsap.quickSetter with zero lag
      const setPrimaryX = gsap.quickSetter(primaryEl, "x", "px");
      const setPrimaryY = gsap.quickSetter(primaryEl, "y", "px");
      const setPrimaryOpacity = gsap.quickSetter(primaryEl, "opacity");

      // Secondary trailing HUD ring layer with 0.06s inertial follow via gsap.quickSetter + ticker
      const setTrailingX = gsap.quickSetter(trailingEl, "x", "px");
      const setTrailingY = gsap.quickSetter(trailingEl, "y", "px");
      const setTrailingOpacity = gsap.quickSetter(trailingEl, "opacity");

      setPrimaryX(pointerPosRef.current.x);
      setPrimaryY(pointerPosRef.current.y);
      setTrailingX(trailingPosRef.current.x);
      setTrailingY(trailingPosRef.current.y);

      const updateStateForTarget = (target: Element | null, down: boolean) => {
        if (forcedState) return;
        const resolved = resolveCursorStateFromElement(target, down, isLoading);
        if (resolved !== activeStateRef.current) {
          activeStateRef.current = resolved;
          setCursorState(resolved);
        }
      };

      const onPointerMove = (e: PointerEvent) => {
        const { clientX, clientY } = e;
        pointerPosRef.current.x = clientX;
        pointerPosRef.current.y = clientY;

        // Instant zero-latency lock for primary cursor sprite
        setPrimaryX(clientX);
        setPrimaryY(clientY);

        if (!hasMovedRef.current) {
          hasMovedRef.current = true;
          trailingPosRef.current.x = clientX;
          trailingPosRef.current.y = clientY;
          setTrailingX(clientX);
          setTrailingY(clientY);
          setPrimaryOpacity(1);
          setTrailingOpacity(1);
        }

        const target = e.target instanceof Element ? e.target : null;
        if (target !== lastTargetRef.current) {
          lastTargetRef.current = target;
          updateStateForTarget(target, isMouseDownRef.current);
        }
      };

      const onPointerOver = (e: PointerEvent) => {
        const target = e.target instanceof Element ? e.target : null;
        lastTargetRef.current = target;
        updateStateForTarget(target, isMouseDownRef.current);
      };

      const onPointerDown = (e: PointerEvent) => {
        if (e.button !== 0) return;
        isMouseDownRef.current = true;
        const target = e.target instanceof Element ? e.target : lastTargetRef.current;
        lastTargetRef.current = target;
        updateStateForTarget(target, true);
        setClickPulseId((prev) => prev + 1);
      };

      const onPointerUp = (e: PointerEvent) => {
        isMouseDownRef.current = false;
        const target = e.target instanceof Element ? e.target : lastTargetRef.current;
        lastTargetRef.current = target;
        updateStateForTarget(target, false);
      };

      const onMouseLeaveWindow = () => {
        setPrimaryOpacity(0);
        setTrailingOpacity(0);
        hasMovedRef.current = false;
      };

      const onMouseEnterWindow = () => {
        if (hasMovedRef.current) {
          setPrimaryOpacity(1);
          setTrailingOpacity(1);
        }
      };

      // Custom event listener so external components can imperatively set cursor state
      const onCustomCursorEvent = (e: Event) => {
        const customEvt = e as CustomEvent<{ state?: TacticalCursorState | null }>;
        const nextState = customEvt.detail?.state;
        if (nextState && VALID_CURSOR_STATES.has(nextState)) {
          activeStateRef.current = nextState;
          setCursorState(nextState);
        } else {
          updateStateForTarget(lastTargetRef.current, isMouseDownRef.current);
        }
      };

      // 0.06s inertial follow ticker for the secondary trailing HUD ring layer
      const TAU = 0.06;
      const tickFollower = (_time: number, deltaTime: number) => {
        if (!hasMovedRef.current) return;
        const dt = Math.min(deltaTime / 1000, 0.1);
        const alpha = 1 - Math.exp(-dt / TAU);
        trailingPosRef.current.x += (pointerPosRef.current.x - trailingPosRef.current.x) * alpha;
        trailingPosRef.current.y += (pointerPosRef.current.y - trailingPosRef.current.y) * alpha;
        setTrailingX(trailingPosRef.current.x);
        setTrailingY(trailingPosRef.current.y);
      };

      gsap.ticker.add(tickFollower);
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerover", onPointerOver, { passive: true });
      window.addEventListener("pointerdown", onPointerDown, { passive: true });
      window.addEventListener("pointerup", onPointerUp, { passive: true });
      document.addEventListener("mouseleave", onMouseLeaveWindow);
      document.addEventListener("mouseenter", onMouseEnterWindow);
      window.addEventListener("phobosia:cursor", onCustomCursorEvent);

      return () => {
        gsap.ticker.remove(tickFollower);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerover", onPointerOver);
        window.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointerup", onPointerUp);
        document.removeEventListener("mouseleave", onMouseLeaveWindow);
        document.removeEventListener("mouseenter", onMouseEnterWindow);
        window.removeEventListener("phobosia:cursor", onCustomCursorEvent);
      };
    },
    { dependencies: [mounted, finePointer, disabled, forcedState, isLoading], scope: portalRootRef }
  );

  // Tactile micro-scale spring animation when switching states or clicking
  useGSAP(
    () => {
      if (!spriteInnerRef.current) return;
      const targetScale = cursorState === "click" ? 0.9 : cursorState === "grabbing" ? 0.94 : 1.0;
      gsap.to(spriteInnerRef.current, {
        scale: targetScale,
        duration: 0.16,
        ease: "back.out(2.4)",
        overwrite: "auto",
      });
    },
    { dependencies: [cursorState, clickPulseId], scope: portalRootRef }
  );

  if (!mounted || !finePointer || disabled) {
    return null;
  }

  const hotspot = HOTSPOT_OFFSETS[cursorState];
  const isArrowState =
    cursorState === "default" || cursorState === "hover" || cursorState === "click";
  const isHandState =
    cursorState === "hand" ||
    cursorState === "hand-click" ||
    cursorState === "grab" ||
    cursorState === "grabbing";

  return createPortal(
    <div
      ref={portalRootRef}
      aria-hidden="true"
      className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden select-none"
    >
      <style>{`
        @media (hover: hover) and (pointer: fine) {
          html.tactical-cursor-active,
          html.tactical-cursor-active *,
          html.tactical-cursor-active *::before,
          html.tactical-cursor-active *::after {
            cursor: none !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .tactical-cursor-spin {
            animation: none !important;
          }
        }
      `}</style>
      {/* Shared SVG Filters for Scorching Orange Plasma Bloom (#FF5500 / #FF6A00) & Dark Soot Smoke */}
      <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
        <defs>
          {/* Scorching Orange Plasma Bloom Filter */}
          <filter id="mars-plasma-bloom" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blurTight" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blurWide" />
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="3.5"
              floodColor="#FF5500"
              floodOpacity="0.85"
              result="plasmaDrop"
            />
            <feMerge>
              <feMergeNode in="plasmaDrop" />
              <feMergeNode in="blurWide" />
              <feMergeNode in="blurTight" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Intense Click Surge Plasma Filter */}
          <filter id="mars-plasma-surge" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.4" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="6.5" result="blur2" />
            <feDropShadow
              dx="0"
              dy="0"
              stdDeviation="5"
              floodColor="#FF5500"
              floodOpacity="0.95"
              result="dropSurge"
            />
            <feMerge>
              <feMergeNode in="dropSurge" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Linear & Radial Gradients for SVG Precision, Not-Allowed, and Loading states */}
          <linearGradient id="titanium-needle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#D8DCE2" />
            <stop offset="100%" stopColor="#8A94A6" />
          </linearGradient>

          <linearGradient id="gunmetal-plate-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#262B36" />
            <stop offset="50%" stopColor="#161922" />
            <stop offset="100%" stopColor="#0C0E14" />
          </linearGradient>

          <linearGradient id="plasma-orange-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB066" />
            <stop offset="45%" stopColor="#FF6A00" />
            <stop offset="100%" stopColor="#FF3D00" />
          </linearGradient>
        </defs>
      </svg>

      {/* ==========================================================================
          LAYER 1: Secondary Trailing HUD Ring Layer (0.06s Inertial Follow)
          ========================================================================== */}
      <div
        ref={trailingHudRef}
        style={{ opacity: 0 }}
        className="absolute top-0 left-0 will-change-transform pointer-events-none"
      >
        {/* Subtle trailing telemetry ring on Hover / Click / Hand-Click / Grabbing */}
        {(cursorState === "hover" ||
          cursorState === "click" ||
          cursorState === "hand-click" ||
          cursorState === "grabbing") && (
          <div
            style={{
              transform: isArrowState
                ? "translate(-36%, -34%)"
                : cursorState === "grabbing"
                  ? "translate(-48%, -48%)"
                  : "translate(-50%, -50%)",
            }}
            className="relative flex items-center justify-center"
          >
            {/* Hover Pointer Outer Segmented Telemetry Ring */}
            {cursorState === "hover" && (
              <svg
                width="44"
                height="44"
                viewBox="0 0 100 100"
                className="overflow-visible animate-[spin_14s_linear_infinite] tactical-cursor-spin"
                style={{ filter: "url(#mars-plasma-bloom)" }}
              >
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="none"
                  stroke="#FF6A00"
                  strokeWidth="1.6"
                  strokeDasharray="36 17.4"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              </svg>
            )}

            {/* Click Pointer Expanding Dual Sonar Ripple Rings */}
            {cursorState === "click" && (
              <svg
                key={`click-sonar-${clickPulseId}`}
                width="48"
                height="48"
                viewBox="0 0 100 100"
                className="overflow-visible"
                style={{ filter: "url(#mars-plasma-surge)" }}
              >
                <circle
                  cx="46"
                  cy="46"
                  r="28"
                  fill="none"
                  stroke="#FF7722"
                  strokeWidth="2.2"
                  strokeDasharray="115 80"
                  strokeDashoffset="-15"
                  strokeLinecap="round"
                >
                  <animate
                    attributeName="r"
                    from="18"
                    to="36"
                    dur="0.34s"
                    fill="freeze"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.95"
                    to="0"
                    dur="0.34s"
                    fill="freeze"
                  />
                </circle>
              </svg>
            )}

            {/* Clickable Hand Live Concentric Orange Target Pulse at Index Fingertip */}
            {cursorState === "hand-click" && (
              <svg
                key={`hand-click-sonar-${clickPulseId}`}
                width="42"
                height="42"
                viewBox="0 0 100 100"
                className="overflow-visible"
                style={{ filter: "url(#mars-plasma-surge)" }}
              >
                <circle
                  cx="50"
                  cy="50"
                  r="24"
                  fill="none"
                  stroke="#FF6A00"
                  strokeWidth="2.2"
                  strokeDasharray="30 10"
                  strokeLinecap="round"
                  className="animate-[spin_6s_linear_infinite] tactical-cursor-spin"
                >
                  <animate
                    attributeName="r"
                    from="14"
                    to="34"
                    dur="0.34s"
                    fill="freeze"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.9"
                    to="0"
                    dur="0.34s"
                    fill="freeze"
                  />
                </circle>
              </svg>
            )}

            {/* Grabbing Hand Rotating Orange Containment Arcs */}
            {cursorState === "grabbing" && (
              <svg
                width="48"
                height="48"
                viewBox="0 0 100 100"
                className="overflow-visible animate-[spin_10s_linear_infinite] tactical-cursor-spin"
                style={{ filter: "url(#mars-plasma-surge)" }}
              >
                <path
                  d="M 24 22 A 38 38 0 0 1 86 44"
                  fill="none"
                  stroke="#FF6A00"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  opacity="0.75"
                />
                <path
                  d="M 22 68 A 38 38 0 0 0 58 88"
                  fill="none"
                  stroke="#FF5500"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  opacity="0.75"
                />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* ==========================================================================
          LAYER 2: Primary Zero-Latency Cursor Sprite & SVG Layer
          ========================================================================== */}
      <div
        ref={primaryLayerRef}
        style={{ opacity: 0 }}
        className="absolute top-0 left-0 will-change-transform pointer-events-none"
      >
        <div
          style={{
            transform: `translate3d(${hotspot.xPercent}%, ${hotspot.yPercent}%, 0)`,
          }}
          className="relative"
        >
          <div ref={spriteInnerRef} className="relative flex items-center justify-center">
            {/* Authentic Dark Atmospheric Smoke Halo behind every cursor icon */}
            <div
              className="absolute pointer-events-none rounded-full"
              style={{
                width: isHandState ? "44px" : cursorState === "text" ? "34px" : "38px",
                height: isHandState ? "44px" : cursorState === "text" ? "34px" : "38px",
                background:
                  "radial-gradient(circle, rgba(12, 10, 9, 0.72) 0%, rgba(18, 12, 10, 0.45) 42%, rgba(255, 85, 0, 0.10) 68%, rgba(0, 0, 0, 0) 100%)",
                filter: "blur(3.5px)",
              }}
            />

            {/* ----------------------------------------------------------------------
                STATES 1, 2, 3: Default Pointer, Hover Pointer, Click Pointer (36x36)
                ---------------------------------------------------------------------- */}
            {isArrowState && (
              <div className="relative w-[36px] h-[36px] flex items-center justify-center">
                <img
                  src={CURSOR_SPRITES[cursorState]}
                  alt=""
                  width={36}
                  height={36}
                  draggable={false}
                  className="w-full h-full object-contain select-none"
                  style={{
                    filter:
                      cursorState === "click"
                        ? "drop-shadow(0 0 5px rgba(255, 85, 0, 0.95)) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.85))"
                        : cursorState === "hover"
                          ? "drop-shadow(0 0 3.5px rgba(255, 106, 0, 0.75)) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.8))"
                          : "drop-shadow(0 0 2px rgba(255, 85, 0, 0.55)) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.8))",
                  }}
                />
              </div>
            )}

            {/* ----------------------------------------------------------------------
                STATE 4: Precision Pointer (34x34 Pure Crisp SVG Crosshair)
                ---------------------------------------------------------------------- */}
            {cursorState === "precision" && (
              <div className="relative w-[34px] h-[34px] flex items-center justify-center">
                <svg
                  width="34"
                  height="34"
                  viewBox="0 0 100 100"
                  className="overflow-visible"
                >
                  {/* Segmented Inner Machined Grey Telemetry Ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="16"
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="2.0"
                    strokeDasharray="16 9.1"
                    strokeDashoffset="4"
                    opacity="0.9"
                  />
                  {/* 4 Diagonal Corner Micro-Ticks */}
                  <line x1="37" y1="37" x2="40" y2="40" stroke="#94A3B8" strokeWidth="1.8" />
                  <line x1="63" y1="37" x2="60" y2="40" stroke="#94A3B8" strokeWidth="1.8" />
                  <line x1="37" y1="63" x2="40" y2="60" stroke="#94A3B8" strokeWidth="1.8" />
                  <line x1="63" y1="63" x2="60" y2="60" stroke="#94A3B8" strokeWidth="1.8" />

                  {/* 4 White-Metallic Crosshair Needles with Dark Gunmetal Bevels */}
                  {/* Top Needle */}
                  <g>
                    <polygon
                      points="50,6 46.8,12 47.4,37 50,39.5 52.6,37 53.2,12"
                      fill="#161922"
                    />
                    <polygon
                      points="50,7.5 48.0,12.5 48.4,36.2 50,38 51.6,36.2 52.0,12.5"
                      fill="url(#titanium-needle-grad)"
                    />
                  </g>
                  {/* Bottom Needle */}
                  <g>
                    <polygon
                      points="50,94 46.8,88 47.4,63 50,60.5 52.6,63 53.2,88"
                      fill="#161922"
                    />
                    <polygon
                      points="50,92.5 48.0,87.5 48.4,63.8 50,62 51.6,63.8 52.0,87.5"
                      fill="url(#titanium-needle-grad)"
                    />
                  </g>
                  {/* Left Needle */}
                  <g>
                    <polygon
                      points="6,50 12,46.8 37,47.4 39.5,50 37,52.6 12,53.2"
                      fill="#161922"
                    />
                    <polygon
                      points="7.5,50 12.5,48.0 36.2,48.4 38,50 36.2,51.6 12.5,52.0"
                      fill="url(#titanium-needle-grad)"
                    />
                  </g>
                  {/* Right Needle */}
                  <g>
                    <polygon
                      points="94,50 88,46.8 63,47.4 60.5,50 63,52.6 88,53.2"
                      fill="#161922"
                    />
                    <polygon
                      points="92.5,50 87.5,48.0 63.8,48.4 62,50 63.8,51.6 87.5,52.0"
                      fill="url(#titanium-needle-grad)"
                    />
                  </g>

                  {/* Blazing Orange Plasma Center Dot (#FF5500) with Bloom Filter */}
                  <g style={{ filter: "url(#mars-plasma-surge)" }}>
                    <circle cx="50" cy="50" r="6.8" fill="#FF5500" opacity="0.85" />
                    <circle cx="50" cy="50" r="4.6" fill="#FF8800" />
                    <circle cx="50" cy="50" r="2.4" fill="#FFF0D6" />
                  </g>
                </svg>
              </div>
            )}

            {/* ----------------------------------------------------------------------
                STATE 5: Text Cursor (30x30 Machined Metallic I-Beam, ~20px visual height)
                ---------------------------------------------------------------------- */}
            {cursorState === "text" && (
              <div className="relative w-[30px] h-[30px] flex items-center justify-center">
                <img
                  src={CURSOR_SPRITES.text}
                  alt=""
                  width={30}
                  height={30}
                  draggable={false}
                  className="w-full h-full object-contain select-none"
                  style={{
                    filter:
                      "drop-shadow(0 0 3px rgba(255, 85, 0, 0.7)) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.85))",
                  }}
                />
              </div>
            )}

            {/* ----------------------------------------------------------------------
                STATES 6, 7, 8, 9: Mecha Hand Pointer, Clickable Hand, Grab, Grabbing (42x42)
                ---------------------------------------------------------------------- */}
            {isHandState && (
              <div className="relative w-[42px] h-[42px] flex items-center justify-center">
                <img
                  src={CURSOR_SPRITES[cursorState]}
                  alt=""
                  width={42}
                  height={42}
                  draggable={false}
                  className="w-full h-full object-contain select-none"
                  style={{
                    filter:
                      cursorState === "hand-click" || cursorState === "grabbing"
                        ? "drop-shadow(0 0 4.5px rgba(255, 85, 0, 0.85)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.88))"
                        : "drop-shadow(0 0 2.5px rgba(255, 85, 0, 0.5)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.85))",
                  }}
                />
              </div>
            )}

            {/* ----------------------------------------------------------------------
                STATE 10: Not Allowed (34x34 Octagonal HUD Backing + Neon-Orange Slash)
                ---------------------------------------------------------------------- */}
            {cursorState === "not-allowed" && (
              <div className="relative w-[34px] h-[34px] flex items-center justify-center">
                <svg
                  width="34"
                  height="34"
                  viewBox="0 0 100 100"
                  className="overflow-visible"
                >
                  {/* Dark Octagonal HUD Backing Plate with Machined Bevel & Corner Ticks */}
                  <polygon
                    points="32,10 68,10 90,32 90,68 68,90 32,90 10,68 10,32"
                    fill="url(#gunmetal-plate-grad)"
                    stroke="#333B4D"
                    strokeWidth="2.4"
                  />
                  <polygon
                    points="34,15 66,15 85,34 85,66 66,85 34,85 15,66 15,34"
                    fill="none"
                    stroke="#FF5500"
                    strokeWidth="1.2"
                    strokeDasharray="14 8"
                    opacity="0.45"
                  />
                  {/* HUD Corner Bracket Ticks */}
                  <polyline
                    points="14,26 26,14"
                    fill="none"
                    stroke="#FF6A00"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    opacity="0.75"
                  />
                  <polyline
                    points="74,14 86,26"
                    fill="none"
                    stroke="#FF6A00"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    opacity="0.75"
                  />
                  <polyline
                    points="14,74 26,86"
                    fill="none"
                    stroke="#FF6A00"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    opacity="0.75"
                  />
                  <polyline
                    points="74,86 86,74"
                    fill="none"
                    stroke="#FF6A00"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    opacity="0.75"
                  />

                  {/* Dark Recessed Channel Under Prohibition Ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="28"
                    fill="none"
                    stroke="#090B10"
                    strokeWidth="10"
                  />
                  <line
                    x1="30"
                    y1="30"
                    x2="70"
                    y2="70"
                    stroke="#090B10"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />

                  {/* Blazing Neon-Orange Prohibition Ring & Slash (#FF5500 / #FF6A00) */}
                  <g style={{ filter: "url(#mars-plasma-surge)" }}>
                    <circle
                      cx="50"
                      cy="50"
                      r="28"
                      fill="none"
                      stroke="url(#plasma-orange-grad)"
                      strokeWidth="6.8"
                    />
                    <line
                      x1="30.5"
                      y1="30.5"
                      x2="69.5"
                      y2="69.5"
                      stroke="url(#plasma-orange-grad)"
                      strokeWidth="6.8"
                      strokeLinecap="round"
                    />
                    {/* White-Hot Inner Filament Core */}
                    <circle
                      cx="50"
                      cy="50"
                      r="28"
                      fill="none"
                      stroke="#FFE0B2"
                      strokeWidth="1.8"
                      opacity="0.9"
                    />
                    <line
                      x1="31.5"
                      y1="31.5"
                      x2="68.5"
                      y2="68.5"
                      stroke="#FFE0B2"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      opacity="0.9"
                    />
                  </g>
                </svg>
              </div>
            )}

            {/* ----------------------------------------------------------------------
                STATE 11: Loading Cursor (36x36 Dual Counter-Rotating Telemetry Rings)
                ---------------------------------------------------------------------- */}
            {cursorState === "loading" && (
              <div className="relative w-[36px] h-[36px] flex items-center justify-center">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 100 100"
                  className="overflow-visible"
                >
                  {/* Dark Gunmetal Circular Telemetry Chassis Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="rgba(10, 12, 18, 0.72)"
                    stroke="#2B3240"
                    strokeWidth="2.2"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="23"
                    fill="none"
                    stroke="#1E2430"
                    strokeWidth="1.5"
                  />

                  {/* Outer Ring: Dark Gunmetal Track Segments */}
                  <circle
                    cx="50"
                    cy="50"
                    r="31"
                    fill="none"
                    stroke="#28303E"
                    strokeWidth="6.5"
                    strokeDasharray="20 4.35"
                  />

                  {/* Outer Ring: Clockwise Rotating Asymmetric Glowing Orange Plasma Segments (#FF6A00) */}
                  <g
                    className="origin-center animate-[spin_2.2s_linear_infinite]"
                    style={{
                      transformOrigin: "50px 50px",
                      filter: "url(#mars-plasma-surge)",
                    }}
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="31"
                      fill="none"
                      stroke="#FF6A00"
                      strokeWidth="6.2"
                      strokeDasharray="19 4.5 19 4.5 19 4.5 19 4.5 19 100"
                      strokeDashoffset="15"
                    />
                    {/* White-Hot Core on Active Orange Arc Segments */}
                    <circle
                      cx="50"
                      cy="50"
                      r="31"
                      fill="none"
                      stroke="#FFE5B4"
                      strokeWidth="2.0"
                      strokeDasharray="17 6.5 17 6.5 17 6.5 17 120"
                      strokeDashoffset="14"
                    />
                  </g>

                  {/* Inner Ring: Counter-Rotating Machined Silver-Grey Segmented Telemetry Ring */}
                  <g
                    className="origin-center animate-[spin_3.4s_linear_infinite_reverse]"
                    style={{ transformOrigin: "50px 50px" }}
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="23"
                      fill="none"
                      stroke="#94A3B8"
                      strokeWidth="2.4"
                      strokeDasharray="24 12 16 12"
                      opacity="0.85"
                    />
                  </g>

                  {/* Left Horizon Orange Reference Tick */}
                  <line
                    x1="7"
                    y1="50"
                    x2="14"
                    y2="50"
                    stroke="#FF6A00"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    style={{ filter: "url(#mars-plasma-bloom)" }}
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default TacticalMarsCursor;
