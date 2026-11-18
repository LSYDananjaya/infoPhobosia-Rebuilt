"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

let refreshTimer: number | undefined;

/** Debounced refresh for when late-loading images or fonts shift layout. */
export function queueScrollRefresh() {
  if (typeof window === "undefined") return;
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150);
}

/**
 * Sets up a damped 2.5D depth rig on any [data-depth] descendants inside `container`.
 * Uses pointer movement on fine-pointer devices and touch + scroll-driven depth parallax
 * on mobile/touch viewports while the section is in the viewport.
 */
export function setupPointerParallax(container: HTMLElement | null, maxShift = 20): () => void {
  if (typeof window === "undefined" || !container) return () => {};
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return () => {};

  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const nodes = Array.from(container.querySelectorAll<HTMLElement>("[data-depth]"));
  if (!nodes.length) return () => {};

  const targets = nodes.map((el) => {
    const depth = parseFloat(el.dataset.depth || "0.5");
    return {
      depth,
      xTo: gsap.quickTo(el, "x", { duration: 0.95, ease: "power3.out" }),
      yTo: gsap.quickTo(el, "y", { duration: 0.95, ease: "power3.out" }),
      rTo: gsap.quickTo(el, "rotate", { duration: 1.1, ease: "power3.out" }),
    };
  });

  let active = true;
  let pointerX = 0;
  let pointerY = 0;
  let scrollProgress = 0.5;

  const applyTargets = () => {
    const mobileScale = canHover ? 0.55 : 1.0;
    const yScrollFactor = (scrollProgress - 0.5) * maxShift * 2.35 * mobileScale;
    const xScrollFactor = Math.sin(scrollProgress * Math.PI * 2) * (maxShift * 0.65) * mobileScale;
    const rotScrollFactor = (scrollProgress - 0.5) * 2.8 * mobileScale;
    for (const t of targets) {
      t.xTo((-pointerX * maxShift + xScrollFactor) * t.depth);
      t.yTo((-pointerY * (maxShift * 0.7) + yScrollFactor) * t.depth);
      t.rTo((pointerX * 1.15 + rotScrollFactor) * t.depth);
    }
  };

  const st = ScrollTrigger.create({
    trigger: container,
    start: "top bottom",
    end: "bottom top",
    onUpdate: (self) => {
      scrollProgress = self.progress;
      if (active) applyTargets();
    },
    onToggle: (self) => {
      active = self.isActive;
      if (!active) {
        pointerX = 0;
        pointerY = 0;
        targets.forEach((t) => {
          t.xTo(0);
          t.yTo(0);
          t.rTo(0);
        });
      }
    },
  });

  const onMove = (e: PointerEvent) => {
    if (!active || e.pointerType === "touch") return;
    pointerX = (e.clientX / window.innerWidth - 0.5) * 2; // -1 .. 1
    pointerY = (e.clientY / window.innerHeight - 0.5) * 2; // -1 .. 1
    applyTargets();
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!active || !e.touches[0]) return;
    pointerX = (e.touches[0].clientX / window.innerWidth - 0.5) * 1.1;
    pointerY = (e.touches[0].clientY / window.innerHeight - 0.5) * 1.1;
    applyTargets();
  };

  const onTouchEnd = () => {
    pointerX = 0;
    pointerY = 0;
    if (active) applyTargets();
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("touchcancel", onTouchEnd, { passive: true });
  return () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
    window.removeEventListener("touchcancel", onTouchEnd);
    st.kill();
  };
}

if (typeof window !== "undefined") {
  ScrollTrigger.config({ ignoreMobileResize: true });
  window.addEventListener("load", queueScrollRefresh, { once: true });
  document.fonts?.ready.then(queueScrollRefresh);
}

export { gsap, ScrollTrigger, useGSAP };
