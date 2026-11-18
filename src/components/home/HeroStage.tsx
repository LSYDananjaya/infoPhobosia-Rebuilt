"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  ArrowUpRight,
  Compass,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";
import { TelemetryScramble, AnimatedCounter } from "@/components/ui/TelemetryScramble";
import { sceneAssets } from "@/data/sceneAssets";
import { SpriteImg } from "@/components/scenes/SceneSprite";
import { gsap, useGSAP } from "@/lib/gsap";

export function HeroStage() {
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const userPausedRef = useRef(false);
  const isInViewRef = useRef(true);
  const isMutedRef = useRef(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [lmst, setLmst] = useState("14:22:08");

  const attemptAutoplay = useCallback(() => {
    const video = videoRef.current;
    if (!video || userPausedRef.current || !isInViewRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      setVideoPlaying(false);
      return;
    }
    if (isMutedRef.current) {
      video.defaultMuted = true;
      video.muted = true;
    }
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setVideoPlaying(true))
        .catch(() => setVideoPlaying(false));
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
      const video = videoRef.current;
      if (!video) return;
      if (e.matches) {
        video.pause();
        setVideoPlaying(false);
      } else if (!userPausedRef.current && isInViewRef.current) {
        attemptAutoplay();
      }
    };
    mq.addEventListener("change", onChange);

    const video = videoRef.current;
    if (video) {
      if (mq.matches) {
        video.pause();
        setVideoPlaying(false);
      } else {
        attemptAutoplay();
      }
    }

    const section = heroRef.current;
    let observer: IntersectionObserver | undefined;
    if (section && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        ([entry]) => {
          isInViewRef.current = entry.isIntersecting;
          const v = videoRef.current;
          if (!v) return;
          if (!entry.isIntersecting) {
            if (!v.paused) {
              v.pause();
              setVideoPlaying(false);
            }
          } else if (!mq.matches && !userPausedRef.current) {
            attemptAutoplay();
          }
        },
        { threshold: 0.05 }
      );
      observer.observe(section);
    }

    // Live Local Mean Solar Time (LMST) clock ticker
    const clockTimer = window.setInterval(() => {
      const now = new Date();
      const s = (now.getUTCSeconds() + 8) % 60;
      const m = (now.getUTCMinutes() + 22) % 60;
      const h = (now.getUTCHours() + 14) % 24;
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      setLmst(`${pad(h)}:${pad(m)}:${pad(s)}`);
    }, 1000);

    return () => {
      mq.removeEventListener("change", onChange);
      observer?.disconnect();
      window.clearInterval(clockTimer);
    };
  }, [attemptAutoplay]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.65,
          },
        });

        tl.fromTo(
          "[data-hero-orb-scroll]",
          { y: 0, x: 0, scale: 1, rotate: 0 },
          { y: 74, x: -20, scale: 1.12, rotate: 9, duration: 1 },
          0
        )
          .fromTo(
            "[data-hero-orbit]",
            { rotate: 0, scale: 1 },
            { rotate: 24, scale: 1.06, duration: 1 },
            0
          )
          .fromTo(
            "[data-hero-glow]",
            { y: 0, scale: 1, opacity: 0.85 },
            { y: -56, scale: 1.18, opacity: 1, duration: 1 },
            0
          );
      });
    },
    { scope: heroRef }
  );

  const handleHeroPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reducedMotion || e.pointerType === "touch") return;
    const section = heroRef.current;
    const orb = orbRef.current;
    if (!section || !orb) return;
    const r = section.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    orb.style.transform = `translate3d(${(nx * -22).toFixed(1)}px, ${(ny * -18).toFixed(1)}px, 0) rotate(${(nx * 4.5).toFixed(2)}deg)`;
  };

  const handleHeroPointerLeave = () => {
    if (orbRef.current) {
      orbRef.current.style.transform = "";
    }
  };

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      isMutedRef.current = false;
      video.defaultMuted = false;
      video.muted = false;
      video.volume = 0.75;
      if (video.paused && !userPausedRef.current) {
        video.play().then(() => setVideoPlaying(true)).catch(() => {});
      }
      setIsMuted(false);
    } else {
      isMutedRef.current = true;
      video.muted = true;
      setIsMuted(true);
    }
  };

  const toggleVideoPlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPausedRef.current = false;
      video
        .play()
        .then(() => setVideoPlaying(true))
        .catch(() => setVideoPlaying(false));
    } else {
      userPausedRef.current = true;
      video.pause();
      setVideoPlaying(false);
    }
  };

  return (
    <section
      ref={heroRef}
      id="hero"
      aria-labelledby="hero-heading"
      onPointerMove={handleHeroPointerMove}
      onPointerLeave={handleHeroPointerLeave}
      className="relative min-h-[100svh] flex flex-col justify-between overflow-hidden bg-space-950 pt-28 pb-8 sm:pt-32 sm:pb-10 lg:pt-36 lg:pb-12 border-b border-white/10"
    >
      {/* Ambient trailer backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <video
          ref={videoRef}
          src="/videos/trailer_phobosia.mp4"
          autoPlay={!reducedMotion}
          loop
          playsInline
          muted={isMuted}
          preload="metadata"
          poster="/images/outpost_1.png"
          width={1920}
          height={1080}
          onCanPlay={() => {
            if (videoRef.current?.paused && !userPausedRef.current && isInViewRef.current) {
              attemptAutoplay();
            }
          }}
          onPlay={() => setVideoPlaying(true)}
          onPause={() => setVideoPlaying(false)}
          className="w-full h-full object-cover object-center opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-space-950/75 via-space-950/15 to-space-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-space-950/92 via-space-950/75 lg:via-space-950/55 to-space-950/45 lg:to-space-950/15" />
      </div>

      {/* Interactive 3D Planetary Fresnel Orb & Orbital Telemetry Overlay (Right Viewport) */}
      <div
        aria-hidden="true"
        className="flex absolute right-[-6%] sm:right-[2%] lg:right-[5%] xl:right-[7%] top-[15%] sm:top-[22%] lg:top-1/2 lg:-translate-y-1/2 w-[235px] sm:w-[270px] lg:w-[310px] xl:w-[370px] opacity-75 sm:opacity-85 lg:opacity-100 aspect-square items-center justify-center pointer-events-none z-[5]"
      >
        <div data-hero-orb-scroll className="scene-layer relative w-full h-full">
          <div
            ref={orbRef}
            className="relative w-full h-full transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
          >
            <span className="mars-halo opacity-85" />
            <svg
              data-hero-orbit
              viewBox="0 0 420 420"
              className="scene-layer absolute inset-[-22%] w-[144%] h-[144%] overflow-visible"
            >
            <defs>
              <linearGradient id="hero-orbit-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(56,189,248,0)" />
                <stop offset="45%" stopColor="rgba(56,189,248,0.55)" />
                <stop offset="85%" stopColor="rgba(245,158,108,0.8)" />
                <stop offset="100%" stopColor="rgba(245,158,108,0)" />
              </linearGradient>
            </defs>
            <g transform="rotate(-16 210 210)">
              <ellipse
                cx="210"
                cy="210"
                rx="196"
                ry="68"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
                strokeDasharray="3 6"
              />
              <ellipse
                cx="210"
                cy="210"
                rx="196"
                ry="68"
                fill="none"
                stroke="url(#hero-orbit-grad)"
                strokeWidth="1.5"
                strokeDasharray="420 900"
              />
              <g transform="translate(268, 152)">
                <circle r="6" fill="none" stroke="#38bdf8" strokeWidth="1.25" />
                <circle r="2" fill="#f59e6c" />
              </g>
            </g>
          </svg>

          <div className="relative w-full h-full rounded-full overflow-hidden shadow-[0_0_90px_-10px_rgba(217,75,50,0.42)]">
            <SpriteImg asset={sceneAssets.mars} />
            <span className="mars-terminator" />
          </div>

            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 telemetry-chip text-cyan-200 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span>ORBIT LOCK · 4.5°N 135.9°E · {lmst} LMST</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle horizon atmospheric glow */}
      <div
        data-hero-glow
        aria-hidden="true"
        className="scene-layer absolute -bottom-24 left-1/4 w-[520px] h-[360px] rounded-full bg-mars-500/14 blur-[140px] pointer-events-none"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col justify-between">
        {/* Editorial Command Column */}
        <div className="my-auto py-4 sm:py-6 max-w-2xl space-y-5 sm:space-y-7">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mission text-slate-300">
            <span className="telemetry-chip text-mars-300">
              <span className="w-1.5 h-1.5 rounded-full bg-mars-400" aria-hidden="true" />
              <TelemetryScramble text="ELYSIUM PLANITIA · 4.5° N 135.9° E" />
            </span>
            <span className="telemetry-chip text-cyan-300">
              <TelemetryScramble text="SOL 01 TO 11 · LMST" duration={640} />
              <span className="text-white">{lmst}</span>
            </span>
          </div>

          <h1
            id="hero-heading"
            className="type-giant-hero font-bold text-white tracking-tight"
          >
            Walk Mars.
            <br />
            <span className="text-mars-300">Command</span>{" "}
            <span className="sm:whitespace-nowrap">the Outpost.</span>
          </h1>

          <p className="max-w-xl text-base sm:text-lg text-slate-200 leading-relaxed">
            PHOBOSIA is a browser-based 3D Mars simulation built from NASA HiRISE elevation terrain, five custom-modeled outpost modules, and 20+ interactive consoles across an 11-SOL expedition.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-4 pt-1">
            <LiquidGlassButton
              href="https://phobosia.sim623.site/"
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="lg"
            >
              <Compass className="w-4 h-4" aria-hidden="true" />
              <span>Launch 3D Outpost</span>
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </LiquidGlassButton>

            <LiquidGlassButton
              href="/missions"
              variant="glass"
              size="lg"
            >
              <span>Inspect SOL 1 to 11</span>
            </LiquidGlassButton>
          </div>
        </div>

        {/* Bottom-Docked Telemetry Strip & Media Controls */}
        <div className="mt-8 pt-5 border-t border-white/15 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3">
            <div>
              <dt className="text-xs font-mission uppercase tracking-wider text-slate-400">
                Terrain Grid
              </dt>
              <dd className="mt-0.5 text-sm font-mission text-white tabular-nums">
                <AnimatedCounter value={1.0} decimals={1} suffix=" m/px HiRISE" />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-mission uppercase tracking-wider text-slate-400">
                Architecture
              </dt>
              <dd className="mt-0.5 text-sm font-mission text-white tabular-nums">
                <AnimatedCounter value={5} suffix=" Custom Pods" />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-mission uppercase tracking-wider text-slate-400">
                Interfaces
              </dt>
              <dd className="mt-0.5 text-sm font-mission text-white tabular-nums">
                <AnimatedCounter value={20} suffix="+ Consoles" />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-mission uppercase tracking-wider text-slate-400">
                Campaign
              </dt>
              <dd className="mt-0.5 text-sm font-mission text-cyan-300 tabular-nums">
                <AnimatedCounter value={11} suffix=" Martian SOLs" />
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <LiquidGlassButton
              type="button"
              variant="glass"
              size="sm"
              onClick={toggleSound}
              aria-pressed={!isMuted}
              aria-label={isMuted ? "Enable trailer background audio" : "Mute trailer background audio"}
              contentClassName="min-h-[44px] px-4 text-slate-100"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-mars-300" aria-hidden="true" />
              )}
              <span>{isMuted ? "Sound: Off" : "Sound: On"}</span>
            </LiquidGlassButton>

            <LiquidGlassButton
              type="button"
              variant="glass"
              size="sm"
              onClick={toggleVideoPlayback}
              aria-pressed={!videoPlaying}
              aria-label={videoPlaying ? "Pause background trailer video" : "Play background trailer video"}
              contentClassName="min-h-[44px] px-4 text-slate-100"
            >
              {videoPlaying ? (
                <Pause className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
              ) : (
                <Play className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
              )}
              <span>{videoPlaying ? "Pause Trailer" : "Play Trailer"}</span>
            </LiquidGlassButton>
          </div>
        </div>
      </div>
    </section>
  );
}
