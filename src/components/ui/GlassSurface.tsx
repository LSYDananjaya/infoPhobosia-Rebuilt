"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export type GlassSurfaceChannel = "R" | "G" | "B";

export interface GlassSurfaceProps {
  children?: ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: GlassSurfaceChannel;
  yChannel?: GlassSurfaceChannel;
  mixBlendMode?: CSSProperties["mixBlendMode"];
  /** Tint painted over the glass, any CSS color. */
  tint?: string;
  /** Force the frosted (non-refractive) look. */
  frosted?: boolean;
  /** Render as an absolutely positioned background layer filling the parent. */
  layer?: boolean;
  className?: string;
  style?: CSSProperties;
}

const SVG_SHADOW = [
  "inset 0 1px 0 0 rgba(255, 255, 255, 0.48)",
  "inset 0 -1px 0 0 rgba(255, 255, 255, 0.12)",
  "inset 0 0 12px 2px rgba(255, 255, 255, 0.1)",
  "0 12px 32px -8px rgba(0, 0, 0, 0.55)",
  "0 4px 12px -2px rgba(0, 0, 0, 0.35)",
].join(", ");

const FALLBACK_SHADOW = [
  "inset 0 1px 0 0 hsl(0 0% 100% / 0.34)",
  "inset 0 -1px 0 0 hsl(0 0% 100% / 0.08)",
  "0 0 2px 1px color-mix(in oklch, white, transparent 72%) inset",
  "0 0 12px 3px color-mix(in oklch, white, transparent 90%) inset",
  "0px 4px 16px rgba(17, 17, 26, 0.18)",
  "0px 16px 56px rgba(17, 17, 26, 0.16)",
].join(", ");

const SHEEN =
  "linear-gradient(135deg, hsl(0 0% 100% / 0.16) 0%, transparent 42%, transparent 64%, hsl(0 0% 100% / 0.05) 100%)";

let supportCache: boolean | null = null;
const mapCache = new Map<string, string>();

function supportsSvgBackdrop(filterId: string): boolean {
  if (typeof window === "undefined") return false;
  if (supportCache !== null) return supportCache;
  const ua = navigator.userAgent;
  const isWebkit = /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua);
  const isFirefox = /Firefox/.test(ua);
  if (isWebkit || isFirefox) {
    supportCache = false;
    return false;
  }
  const div = document.createElement("div");
  div.style.backdropFilter = `url(#${filterId})`;
  supportCache = div.style.backdropFilter !== "";
  return supportCache;
}

export function GlassSurface({
  children,
  width,
  height,
  borderRadius: borderRadiusProp = 20,
  borderWidth = 0.08,
  brightness = 52,
  opacity = 0.94,
  blur = 14,
  displace = 0.85,
  backgroundOpacity = 0.1,
  saturation = 1.35,
  distortionScale = -110,
  redOffset = 0,
  greenOffset = 5,
  blueOffset = 10,
  xChannel = "R",
  yChannel = "G",
  mixBlendMode = "difference",
  tint,
  frosted = false,
  layer = false,
  className = "",
  style = {},
}: GlassSurfaceProps) {
  const uid = useId().replace(/:/g, "-");
  const filterId = `glass-filter-${uid}`;

  const [svgOk, setSvgOk] = useState(false);
  const [blurOk, setBlurOk] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [inView, setInView] = useState(true);
  const [size, setSize] = useState("");
  const [parentRadius, setParentRadius] = useState<number | null>(null);

  const borderRadius =
    layer && parentRadius !== null ? parentRadius : borderRadiusProp;

  const containerRef = useRef<HTMLDivElement>(null);
  const feImageRef = useRef<SVGFEImageElement>(null);
  const redRef = useRef<SVGFEDisplacementMapElement>(null);
  const greenRef = useRef<SVGFEDisplacementMapElement>(null);
  const blueRef = useRef<SVGFEDisplacementMapElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const buildVectorMap = () => {
    if (typeof document === "undefined") return "";
    const rect = containerRef.current?.getBoundingClientRect();
    const w = Math.max(2, Math.round(rect?.width || 400));
    const h = Math.max(2, Math.round(rect?.height || 200));
    const rx = Math.min(borderRadius, w / 2, h / 2);
    const edge = Math.min(w, h) * (borderWidth * 0.5);
    const innerRx = Math.max(1, rx - edge);

    const key = [
      w,
      h,
      Math.round(rx * 10),
      borderWidth,
      brightness,
      opacity,
      blur,
      mixBlendMode,
    ].join("|");
    const cached = mapCache.get(key);
    if (cached) return cached;

    const svg = `
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="r" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="b" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/>
          </linearGradient>
          <filter id="s" filterUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}" color-interpolation-filters="sRGB">
            <feGaussianBlur stdDeviation="${blur}" />
          </filter>
        </defs>
        <rect width="${w}" height="${h}" fill="black"/>
        <rect width="${w}" height="${h}" rx="${rx}" fill="url(#r)"/>
        <rect width="${w}" height="${h}" rx="${rx}" fill="url(#b)" style="mix-blend-mode:${mixBlendMode}"/>
        <rect x="${edge}" y="${edge}" width="${Math.max(2, w - edge * 2)}" height="${Math.max(2, h - edge * 2)}" rx="${innerRx}" fill="hsl(0 0% ${brightness}% / ${opacity})" filter="url(#s)"/>
      </svg>`;

    const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    if (mapCache.size > 60) mapCache.clear();
    mapCache.set(key, url);
    return url;
  };

  useEffect(() => {
    const mapUrl = buildVectorMap();
    if (mapUrl) {
      feImageRef.current?.setAttribute("href", mapUrl);
    }
    [
      { ref: redRef, offset: redOffset },
      { ref: greenRef, offset: greenOffset },
      { ref: blueRef, offset: blueOffset },
    ].forEach(({ ref, offset }) => {
      const el = ref.current;
      if (!el) return;
      el.setAttribute("scale", String(distortionScale + offset));
      el.setAttribute("xChannelSelector", xChannel);
      el.setAttribute("yChannelSelector", yChannel);
    });
    blurRef.current?.setAttribute("stdDeviation", String(displace));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    size,
    borderRadius,
    borderWidth,
    brightness,
    opacity,
    blur,
    displace,
    distortionScale,
    redOffset,
    greenOffset,
    blueOffset,
    xChannel,
    yChannel,
    mixBlendMode,
    svgOk,
  ]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (layer && el.parentElement) {
          const r = parseFloat(
            getComputedStyle(el.parentElement).borderTopLeftRadius
          );
          if (Number.isFinite(r)) {
            setParentRadius(Math.min(r, el.offsetHeight / 2));
          }
        }
        setSize(`${el.offsetWidth}x${el.offsetHeight}`);
      });
    });
    ro.observe(el);

    // Offscreen viewport gating for non-fixed surfaces only so offscreen buttons don't hold GPU filters
    const isFixedChrome = Boolean(
      el.closest("header, [data-slot='scroll-progress'], [role='dialog'], [role='menu']")
    );
    let io: IntersectionObserver | undefined;
    if (!isFixedChrome && typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        ([entry]) => setInView(entry.isIntersecting),
        { rootMargin: "240px" }
      );
      io.observe(el);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io?.disconnect();
    };
  }, [layer]);

  useEffect(() => {
    setSvgOk(!frosted && supportsSvgBackdrop(filterId));
    setBlurOk(
      CSS.supports("backdrop-filter", "blur(1px)") ||
        CSS.supports("-webkit-backdrop-filter", "blur(1px)")
    );
  }, [filterId, frosted]);

  const refractive = svgOk && !frosted && !reducedMotion && inView;
  const fallbackFilter = `blur(14px) saturate(${saturation * 1.4}) brightness(1.04)`;
  const tintLayer = tint ? `linear-gradient(${tint}, ${tint}), ` : "";

  const modeStyle: CSSProperties = refractive
    ? {
        background: `${tintLayer}hsl(0 0% 0% / ${backgroundOpacity})`,
        backdropFilter: `url(#${filterId}) saturate(${saturation})`,
        boxShadow: SVG_SHADOW,
      }
    : {
        background: blurOk
          ? `${tintLayer}hsl(0 0% 100% / ${0.05 + backgroundOpacity * 0.5})`
          : `${tintLayer}hsl(0 0% 12% / 0.82)`,
        WebkitBackdropFilter: fallbackFilter,
        backdropFilter: fallbackFilter,
        boxShadow: FALLBACK_SHADOW,
      };

  const containerStyle: CSSProperties = {
    ...style,
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
    ...modeStyle,
  };

  return (
    <div
      ref={containerRef}
      data-glass={refractive ? "refractive" : "frosted"}
      className={`${
        layer
          ? "pointer-events-none absolute inset-0 -z-[1]"
          : "relative flex items-center justify-center"
      } overflow-hidden ${className}`}
      style={containerStyle}
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter
            id={filterId}
            colorInterpolationFilters="sRGB"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feImage
              ref={feImageRef}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="map"
            />
            <feDisplacementMap ref={redRef} in="SourceGraphic" in2="map" result="dispRed" />
            <feColorMatrix
              in="dispRed"
              type="matrix"
              values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"
              result="red"
            />
            <feDisplacementMap ref={greenRef} in="SourceGraphic" in2="map" result="dispGreen" />
            <feColorMatrix
              in="dispGreen"
              type="matrix"
              values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"
              result="green"
            />
            <feDisplacementMap ref={blueRef} in="SourceGraphic" in2="map" result="dispBlue" />
            <feColorMatrix
              in="dispBlue"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"
              result="blue"
            />
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur ref={blurRef} in="output" stdDeviation={displace} />
          </filter>
        </defs>
      </svg>

      {!refractive && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ background: SHEEN }}
        />
      )}

      {children && (
        <div className="relative z-[1] flex h-full w-full items-center justify-center rounded-[inherit]">
          {children}
        </div>
      )}
    </div>
  );
}

export default GlassSurface;
