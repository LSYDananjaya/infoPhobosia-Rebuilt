"use client";

import { useEffect, useRef } from "react";

export interface LiquidGlassCardPointerProps {
  tilt?: boolean;
}

/**
 * Writes --mx/--my and optional subtle 3D tilt (--rx/--ry) on the parent card
 * (rAF-throttled) so the CSS spotlight sheen and micro-tilt follow the pointer.
 */
export function LiquidGlassCardPointer({ tilt = false }: LiquidGlassCardPointerProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const card = ref.current?.parentElement;
    if (!card) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (!canHover) {
      if (reduced) return;
      let inView = false;
      let scrollRaf = 0;

      const applyScrollSheen = () => {
        scrollRaf = 0;
        if (!inView) return;
        const r = card.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        // 0 when card enters bottom, 1 when card exits top
        const progress = Math.min(Math.max((vh - r.top) / Math.max(vh + r.height, 1), 0), 1);
        const mx = 18 + progress * 64;
        const my = 8 + Math.sin(progress * Math.PI) * 32;
        card.style.setProperty("--mx", `${mx.toFixed(1)}%`);
        card.style.setProperty("--my", `${my.toFixed(1)}%`);
        if (tilt) {
          const rx = (0.5 - progress) * 2.4;
          const ry = Math.sin(progress * Math.PI * 2) * 1.4;
          card.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
          card.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
        }
      };

      const onScroll = () => {
        if (scrollRaf || !inView) return;
        scrollRaf = requestAnimationFrame(applyScrollSheen);
      };

      const io =
        typeof IntersectionObserver !== "undefined"
          ? new IntersectionObserver(
              ([entry]) => {
                inView = Boolean(entry?.isIntersecting);
                if (inView) applyScrollSheen();
              },
              { rootMargin: "80px 0px" }
            )
          : null;
      io?.observe(card);
      window.addEventListener("scroll", onScroll, { passive: true });

      return () => {
        io?.disconnect();
        window.removeEventListener("scroll", onScroll);
        if (scrollRaf) cancelAnimationFrame(scrollRaf);
      };
    }

    let raf = 0;
    let x = 0;
    let y = 0;

    const apply = () => {
      raf = 0;
      const r = card.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      const nx = (x - r.left) / r.width;
      const ny = (y - r.top) / r.height;
      card.style.setProperty("--mx", `${(nx * 100).toFixed(1)}%`);
      card.style.setProperty("--my", `${(ny * 100).toFixed(1)}%`);
      if (tilt && !reduced) {
        const rx = (0.5 - ny) * 3.2;
        const ry = (nx - 0.5) * 3.2;
        card.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
        card.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      }
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    };

    card.addEventListener("pointermove", onMove, { passive: true });
    card.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [tilt]);

  return <span ref={ref} aria-hidden="true" className="hidden" />;
}
