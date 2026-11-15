"use client";

import React, { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

let activeLenis: Lenis | null = null;

export type ScrollToTargetOptions = {
  offset?: number;
  immediate?: boolean;
  container?: HTMLElement | null;
};

/**
 * Smoothly scrolls either a scoped scroll container or the active document-level
 * Lenis controller to a target element with consistent navbar clearance.
 */
export function scrollToTarget(
  element: HTMLElement,
  { offset = 0, immediate = false, container = null }: ScrollToTargetOptions = {}
) {
  if (container) {
    const top =
      element.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop -
      offset;
    container.scrollTo({
      top: Math.max(0, top),
      behavior: immediate ? "auto" : "smooth",
    });
    return;
  }

  if (activeLenis) {
    activeLenis.scrollTo(element, {
      offset: -offset,
      immediate,
      duration: 1.05,
    });
    return;
  }

  const top = element.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({
    top: Math.max(0, top),
    behavior: immediate ? "auto" : "smooth",
  });
}

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 0.92,
      syncTouch: false,
    });

    activeLenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onReduceChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        if (activeLenis === lenis) activeLenis = null;
        gsap.ticker.remove(tick);
        lenis.destroy();
      }
    };
    mq.addEventListener("change", onReduceChange);

    return () => {
      if (activeLenis === lenis) activeLenis = null;
      mq.removeEventListener("change", onReduceChange);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
