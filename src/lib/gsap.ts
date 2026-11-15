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
 * Sets up a damped 2.5D pointer depth rig on any [data-depth] descendants
 * inside `container`. Only active on fine-pointer devices and only while
 * the section is in the viewport. Returns a cleanup function.
 */
export function setupPointerParallax(container: HTMLElement | null, maxShift = 20): () => void {
  if (typeof window === "undefined" || !container) return () => {};
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!canHover || reduceMotion) return () => {};

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
  const st = ScrollTrigger.create({
    trigger: container,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => {
      active = self.isActive;
      if (!active) {
        targets.forEach((t) => {
          t.xTo(0);
          t.yTo(0);
          t.rTo(0);
        });
      }
    },
  });

  const onMove = (e: PointerEvent) => {
    if (!active) return;
    const nx = (e.clientX / window.innerWidth - 0.5) * 2; // -1 .. 1
    const ny = (e.clientY / window.innerHeight - 0.5) * 2; // -1 .. 1
    for (const t of targets) {
      t.xTo(-nx * maxShift * t.depth);
      t.yTo(-ny * (maxShift * 0.7) * t.depth);
      t.rTo(nx * 1.15 * t.depth);
    }
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  return () => {
    window.removeEventListener("pointermove", onMove);
    st.kill();
  };
}

if (typeof window !== "undefined") {
  ScrollTrigger.config({ ignoreMobileResize: true });
  window.addEventListener("load", queueScrollRefresh, { once: true });
  document.fonts?.ready.then(queueScrollRefresh);
}

export { gsap, ScrollTrigger, useGSAP };
