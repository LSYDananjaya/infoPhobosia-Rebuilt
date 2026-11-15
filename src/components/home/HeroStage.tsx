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

export function HeroStage() {
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPausedRef = useRef(false);
  const isInViewRef = useRef(true);
  const isMutedRef = useRef(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

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

    return () => {
      mq.removeEventListener("change", onChange);
      observer?.disconnect();
    };
  }, [attemptAutoplay]);

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

      {/* Subtle horizon atmospheric glow */}
      <div
        aria-hidden="true"
        className="absolute -bottom-24 left-1/4 w-[520px] h-[360px] rounded-full bg-mars-500/14 blur-[140px] pointer-events-none"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col justify-between">
        {/* Editorial Command Column */}
        <div className="my-auto py-4 sm:py-6 max-w-2xl space-y-5 sm:space-y-7">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mission text-slate-300">
            <span className="text-mars-300">Elysium Planitia</span>
            <span aria-hidden="true" className="text-slate-500">/</span>
            <span>4.5° N, 135.9° E</span>
            <span aria-hidden="true" className="text-slate-500">/</span>
            <span className="text-cyan-300">SOL 1 to 11</span>
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
                1.0 m/px HiRISE
              </dd>
            </div>
            <div>
              <dt className="text-xs font-mission uppercase tracking-wider text-slate-400">
                Architecture
              </dt>
              <dd className="mt-0.5 text-sm font-mission text-white tabular-nums">
                5 Custom Pods
              </dd>
            </div>
            <div>
              <dt className="text-xs font-mission uppercase tracking-wider text-slate-400">
                Interfaces
              </dt>
              <dd className="mt-0.5 text-sm font-mission text-white tabular-nums">
                20+ Consoles
              </dd>
            </div>
            <div>
              <dt className="text-xs font-mission uppercase tracking-wider text-slate-400">
                Campaign
              </dt>
              <dd className="mt-0.5 text-sm font-mission text-cyan-300 tabular-nums">
                11 Martian SOLs
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
