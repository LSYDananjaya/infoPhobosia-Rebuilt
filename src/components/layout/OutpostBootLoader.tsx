"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PhobosiaLoader } from "@/components/ui/PhobosiaLoader";
import type { AiStatusState } from "@/components/ui/AiStatus";

const BOOT_SESSION_KEY = "phobosia_boot_v1";

type BootStep = {
  state: AiStatusState;
  label: string;
  detail: string;
  progress: number;
  badge: string;
};

const BOOT_STEPS: BootStep[] = [
  {
    state: "calibrating",
    label: "Calibrating HiRISE DTM",
    detail: "Elysium Planitia",
    progress: 0.26,
    badge: "PHASE 01/04",
  },
  {
    state: "analyzing",
    label: "Indexing Sol Archive",
    detail: "Sols 01–12",
    progress: 0.54,
    badge: "PHASE 02/04",
  },
  {
    state: "streaming",
    label: "Hydrating WebGL Stage",
    detail: "Draco PBR",
    progress: 0.84,
    badge: "PHASE 03/04",
  },
  {
    state: "done",
    label: "Telemetry Lock Verified",
    detail: "Ready",
    progress: 1,
    badge: "PHASE 04/04",
  },
];

/**
 * Runs a brief first-visit telemetry sequence once per browser session (or when
 * `?boot=1` is present), layered above the already-rendered SSR page so initial
 * SEO and reduced-motion accessibility are never blocked.
 */
export function OutpostBootLoader() {
  const reduced = !!useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(BOOT_SESSION_KEY, "1");
    } catch {
      // Ignore storage access errors in private browsing contexts
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get("boot") === "1";
    const reduceQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceQuery && !forced) return;

    let alreadyBooted = false;
    try {
      alreadyBooted = sessionStorage.getItem(BOOT_SESSION_KEY) === "1";
    } catch {
      alreadyBooted = false;
    }

    if (alreadyBooted && !forced) return;

    setStepIndex(0);
    setVisible(true);

    let cancelled = false;
    let fontsReady = false;
    let doneGateReached = false;

    const tryEnterDone = () => {
      if (!cancelled && fontsReady && doneGateReached) {
        setStepIndex(3);
      }
    };

    const t1 = window.setTimeout(() => {
      if (!cancelled) setStepIndex(1);
    }, 1350);

    const t2 = window.setTimeout(() => {
      if (!cancelled) setStepIndex(2);
    }, 2750);

    const t3 = window.setTimeout(() => {
      doneGateReached = true;
      tryEnterDone();
    }, 4100);

    // Strictly run the boot sequence for 5 seconds before dismissal
    const t4 = window.setTimeout(() => {
      if (!cancelled) dismiss();
    }, 5000);

    if (document.fonts?.ready) {
      document.fonts.ready
        .then(() => {
          fontsReady = true;
          tryEnterDone();
        })
        .catch(() => {
          fontsReady = true;
          tryEnterDone();
        });
    } else {
      fontsReady = true;
    }

    return () => {
      cancelled = true;
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, [dismiss]);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, dismiss]);

  const current = BOOT_STEPS[stepIndex] ?? BOOT_STEPS[0];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="outpost-boot-loader"
          role="region"
          aria-label="PHOBOSIA outpost telemetry initialization"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-space-950/95 backdrop-blur-2xl overscroll-contain"
          initial={{ opacity: reduced ? 1 : 0 }}
          animate={{ opacity: 1 }}
          exit={
            reduced
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.985, filter: "blur(8px)" }
          }
          transition={{ duration: reduced ? 0.1 : 0.36, ease: [0.22, 1, 0.36, 1] }}
        >
          <PhobosiaLoader
            variant="fullscreen"
            state={current.state}
            label={current.label}
            detail={current.detail}
            progress={current.progress}
            phaseBadge={current.badge}
            telemetryCode="PHOBOSIA // BOOT"
            timer={true}
            onSkip={dismiss}
            skipLabel="Enter Outpost"
            className="min-h-screen bg-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
