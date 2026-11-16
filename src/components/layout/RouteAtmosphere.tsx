"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";

interface AtmoPreset {
  primary: string;
  secondary: string;
  alpha: string;
}

function getAtmoPreset(pathname: string): AtmoPreset {
  if (pathname.startsWith("/missions")) {
    return { primary: "217 75 50", secondary: "245 158 108", alpha: "0.14" };
  }
  if (pathname.startsWith("/science") || pathname.startsWith("/development")) {
    return { primary: "56 189 248", secondary: "14 165 233", alpha: "0.13" };
  }
  if (pathname.startsWith("/models") || pathname.startsWith("/experience")) {
    return { primary: "56 189 248", secondary: "217 75 50", alpha: "0.13" };
  }
  if (pathname.startsWith("/story") || pathname.startsWith("/creator")) {
    return { primary: "245 158 11", secondary: "217 75 50", alpha: "0.12" };
  }
  return { primary: "217 75 50", secondary: "56 189 248", alpha: "0.12" };
}

export function RouteAtmosphere() {
  const pathname = usePathname();

  useEffect(() => {
    const preset = getAtmoPreset(pathname);
    const root = document.documentElement;
    root.style.setProperty("--atmo-rgb", preset.primary);
    root.style.setProperty("--atmo-secondary-rgb", preset.secondary);
    root.style.setProperty("--atmo-alpha", preset.alpha);
  }, [pathname]);

  return (
    <>
      <div aria-hidden="true" className="atmo-backdrop" />
      <div aria-hidden="true" className="dossier-hud-frame">
        <span className="absolute top-3 left-4 font-mission text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
          HUD // ELYSIUM PLANITIA TELEMETRY OVERLAY
        </span>
        <span className="absolute top-3 right-4 font-mission text-[10px] uppercase tracking-[0.2em] text-mars-300/70">
          4.5° N · 135.9° E · SOL 01-11
        </span>
        <span className="absolute bottom-3 left-4 font-mission text-[10px] uppercase tracking-[0.2em] text-slate-400/70">
          DATUM: MOLA -2,600M // HIRISE 1.0M/PX
        </span>
        <span className="absolute bottom-3 right-4 font-mission text-[10px] uppercase tracking-[0.2em] text-cyan-300/70">
          SYS: NOMINAL
        </span>
      </div>
    </>
  );
}
