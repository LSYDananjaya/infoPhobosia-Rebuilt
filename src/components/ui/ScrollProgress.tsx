"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
} from "motion/react";
import { ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { scrollToTarget } from "@/components/scenes/SmoothScrollProvider";
import { GlassSurface } from "@/components/ui/GlassSurface";

export type ScrollProgressSection = {
  id: string;
  label: string;
  code?: string;
  scrollOffset?: number;
};

const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const SIZE_SPRING = { type: "spring", bounce: 0.16, duration: 0.5 } as const;
const LABEL_CROSSFADE = { duration: 0.22, ease: EASE_OUT } as const;
const LAYER_FADE = { duration: 0.24, ease: EASE_IN_OUT } as const;

const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

type Size = { width: number; height: number };

export type ScrollProgressProps = React.ComponentProps<"div"> & {
  sections?: ScrollProgressSection[];
  containerRef?: React.RefObject<HTMLElement | null>;
  offset?: number;
};

const ScrollProgress = ({
  className,
  sections = [],
  containerRef,
  offset = 120,
  ...props
}: ScrollProgressProps) => {
  const layoutId = React.useId();
  const ringGradId = `scroll-ring-${layoutId.replace(/[^\w-]/g, "")}`;
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll(
    containerRef ? { container: containerRef } : undefined
  );
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  const [activeId, setActiveId] = React.useState(sections[0]?.id);
  const [open, setOpen] = React.useState(false);

  const scrollLock = React.useRef(false);
  const scrollLockTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => {
    const scroller = containerRef?.current ?? window;

    const update = () => {
      if (scrollLock.current) return;
      const anchor =
        (containerRef?.current?.getBoundingClientRect().top ?? 0) + offset;
      let active: ScrollProgressSection | undefined;
      for (let i = sections.length - 1; i >= 0; i--) {
        const top = document
          .getElementById(sections[i].id)
          ?.getBoundingClientRect().top;
        if (top !== undefined && top <= anchor) {
          active = sections[i];
          break;
        }
      }
      setActiveId((prev) => {
        const nextId = active?.id ?? sections[0]?.id;
        return prev === nextId ? prev : nextId;
      });
    };

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    update();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, [sections, containerRef, offset]);

  const activeIndex = Math.max(
    0,
    sections.findIndex((s) => s.id === activeId)
  );
  const activeSection = sections[activeIndex] ?? sections[0];
  const label = activeSection?.label ?? "";
  const activeCode =
    activeSection?.code ?? String(activeIndex + 1).padStart(2, "0");

  const labelVersion = React.useRef(0);
  const prevLabel = React.useRef(`${activeCode}:${label}`);
  if (`${activeCode}:${label}` !== prevLabel.current) {
    prevLabel.current = `${activeCode}:${label}`;
    labelVersion.current += 1;
  }

  const collapsedRef = React.useRef<HTMLDivElement>(null);
  const openRef = React.useRef<HTMLDivElement>(null);
  const labelRef = React.useRef<HTMLSpanElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const [collapsedSize, setCollapsedSize] = React.useState<Size>();
  const [openSize, setOpenSize] = React.useState<Size>();
  const [labelWidth, setLabelWidth] = React.useState<number>();

  useIsoLayoutEffect(() => {
    const measure = () => {
      if (labelRef.current) setLabelWidth(labelRef.current.offsetWidth);
      if (collapsedRef.current) {
        setCollapsedSize({
          width: collapsedRef.current.offsetWidth,
          height: collapsedRef.current.offsetHeight,
        });
      }
      if (openRef.current) {
        setOpenSize({
          width: openRef.current.offsetWidth,
          height: openRef.current.offsetHeight,
        });
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (labelRef.current) ro.observe(labelRef.current);
    if (collapsedRef.current) ro.observe(collapsedRef.current);
    if (openRef.current) ro.observe(openRef.current);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [sections, activeId]);

  React.useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  React.useEffect(() => () => clearTimeout(scrollLockTimer.current), []);

  const selectSection = (section: ScrollProgressSection) => {
    scrollLock.current = true;
    clearTimeout(scrollLockTimer.current);
    scrollLockTimer.current = setTimeout(
      () => {
        scrollLock.current = false;
      },
      reduceMotion ? 0 : 950
    );

    setActiveId(section.id);
    setOpen(false);

    const el = document.getElementById(section.id);
    if (!el) return;

    const targetOffset =
      section.scrollOffset ?? Math.max(0, offset - 20);
    scrollToTarget(el, {
      offset: targetOffset,
      immediate: Boolean(reduceMotion),
      container: containerRef?.current ?? null,
    });
  };

  if (sections.length === 0) return null;

  const size = open ? openSize : collapsedSize;
  const radius = open ? 24 : (collapsedSize?.height ?? 38) / 2;

  return (
    <div
      ref={rootRef}
      data-slot="scroll-progress"
      style={
        collapsedSize
          ? { width: collapsedSize.width, height: collapsedSize.height }
          : undefined
      }
      className={cn(
        "fixed bottom-5 sm:bottom-6 left-1/2 z-40 -translate-x-1/2 max-w-[calc(100vw-1.5rem)]",
        className
      )}
      {...props}
    >
      {/* Hidden synchronized layout measurers */}
      <div className="pointer-events-none invisible fixed -left-[9999px]" aria-hidden="true">
        <div
          ref={collapsedRef}
          className="inline-flex items-center gap-2.5 border border-transparent py-2 pl-2.5 pr-3.5"
        >
          <span className="h-5 w-5 shrink-0" />
          <span
            ref={labelRef}
            className="inline-flex items-center gap-2 whitespace-nowrap"
          >
            <span className="font-mission text-[10px] font-semibold tracking-[0.16em] tabular-nums leading-none">
              {activeCode}
            </span>
            <span className="font-nav text-[13px] font-medium leading-none tracking-[0.01em]">
              {label}
            </span>
          </span>
          <ChevronUp className="h-3.5 w-3.5 shrink-0" />
        </div>

        <div ref={openRef} className="w-max max-h-[min(70dvh,440px)] border border-transparent overflow-hidden p-1.5">
          {sections.map((s, idx) => {
            const code = s.code ?? String(idx + 1).padStart(2, "0");
            return (
              <div
                key={s.id}
                className="flex items-center gap-2.5 px-3.5 py-2 pr-4 leading-none"
              >
                <span className="h-1.5 w-1.5 shrink-0" />
                <span className="font-mission text-[10px] font-semibold tracking-[0.14em] tabular-nums shrink-0">
                  {code}
                </span>
                <span className="whitespace-nowrap font-nav text-[13px] font-medium tracking-[0.01em]">
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {size && (
        <motion.div
          data-slot="scroll-progress-surface"
          className={cn(
            "isolate absolute bottom-0 left-1/2 -translate-x-1/2 overflow-hidden max-w-[calc(100vw-1.5rem)]",
            "border border-white/14",
            "shadow-[0_22px_50px_-12px_rgba(0,0,0,0.82)]",
            "transition-colors duration-200",
            !open && "hover:border-white/25"
          )}
          initial={false}
          animate={{
            width: size.width,
            height: size.height,
            borderRadius: radius,
          }}
          transition={reduceMotion ? { duration: 0 } : SIZE_SPRING}
        >
          <GlassSurface
            layer
            borderRadius={radius}
            distortionScale={open ? -95 : -110}
            displace={0.9}
            blur={14}
            backgroundOpacity={open ? 0.28 : 0.18}
            tint="rgba(10, 15, 28, 0.48)"
            saturation={1.4}
          />
          <AnimatePresence initial={false} mode="popLayout">
            {open ? (
              <motion.ul
                key="list"
                className="absolute inset-0 z-10 flex flex-col p-1.5 max-h-[min(70dvh,440px)] overflow-y-auto overflow-x-hidden scrollbar-none"
                initial={{
                  opacity: 0,
                  filter: reduceMotion ? undefined : "blur(4px)",
                }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{
                  opacity: 0,
                  filter: reduceMotion ? undefined : "blur(4px)",
                }}
                transition={LAYER_FADE}
              >
                {sections.map((s, i) => {
                  const isActive = s.id === activeId;
                  const code = s.code ?? String(i + 1).padStart(2, "0");
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => selectSection(s)}
                        aria-current={isActive ? "location" : undefined}
                        className={cn(
                          "relative flex w-full items-center gap-2.5 rounded-[14px] px-3.5 py-2 pr-4 text-left leading-none transition-colors cursor-pointer",
                          isActive
                            ? "text-white"
                            : "text-slate-300/85 hover:text-white"
                        )}
                      >
                        {isActive && (
                          <motion.span
                            layoutId={`${layoutId}-active`}
                            className="liquid-glass-nav-capsule absolute inset-0 z-0 rounded-[14px]"
                            transition={
                              reduceMotion ? { duration: 0 } : SIZE_SPRING
                            }
                          />
                        )}
                        <motion.span
                          className={cn(
                            "relative z-10 h-1.5 w-1.5 shrink-0 rounded-full",
                            isActive
                              ? "bg-cyan-glow shadow-[0_0_8px_rgba(56,189,248,0.85)]"
                              : "bg-white/25"
                          )}
                          initial={
                            reduceMotion
                              ? undefined
                              : { opacity: 0, y: 4, filter: "blur(3px)" }
                          }
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          transition={{
                            duration: 0.3,
                            ease: EASE_IN_OUT,
                            delay: reduceMotion ? 0 : 0.03 + i * 0.025,
                          }}
                        />
                        <motion.span
                          className={cn(
                            "relative z-10 shrink-0 font-mission text-[10px] font-semibold tracking-[0.14em] tabular-nums",
                            isActive ? "text-mars-300" : "text-slate-400"
                          )}
                          initial={
                            reduceMotion
                              ? undefined
                              : { opacity: 0, y: 4, filter: "blur(3px)" }
                          }
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          transition={{
                            duration: 0.3,
                            ease: EASE_IN_OUT,
                            delay: reduceMotion ? 0 : 0.03 + i * 0.025,
                          }}
                        >
                          {code}
                        </motion.span>
                        <motion.span
                          className="relative z-10 whitespace-nowrap font-nav text-[13px] font-medium tracking-[0.01em]"
                          initial={
                            reduceMotion
                              ? undefined
                              : { opacity: 0, y: 4, filter: "blur(3px)" }
                          }
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          transition={{
                            duration: 0.3,
                            ease: EASE_IN_OUT,
                            delay: reduceMotion ? 0 : 0.03 + i * 0.025,
                          }}
                        >
                          {s.label}
                        </motion.span>
                      </button>
                    </li>
                  );
                })}
              </motion.ul>
            ) : (
              <motion.button
                key="pill"
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open section navigator"
                aria-expanded={open}
                className="group absolute inset-0 z-10 flex items-center gap-2.5 py-2 pl-2.5 pr-3.5 cursor-pointer"
                initial={{
                  opacity: 0,
                  filter: reduceMotion ? undefined : "blur(4px)",
                }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{
                  opacity: 0,
                  filter: reduceMotion ? undefined : "blur(4px)",
                }}
                transition={LAYER_FADE}
              >
                <span className="shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 -rotate-90"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient
                        id={ringGradId}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#e86c48" />
                        <stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="12"
                      cy="12"
                      r="9.5"
                      fill="none"
                      strokeWidth="2.25"
                      className="stroke-white/15"
                    />
                    <motion.circle
                      cx="12"
                      cy="12"
                      r="9.5"
                      fill="none"
                      strokeWidth="2.25"
                      strokeLinecap="round"
                      stroke={`url(#${ringGradId})`}
                      style={{ pathLength: progress }}
                    />
                  </svg>
                </span>

                <span
                  className="relative h-5 shrink-0"
                  style={{ width: labelWidth }}
                >
                  <AnimatePresence initial={false}>
                    {label && (
                      <motion.span
                        key={labelVersion.current}
                        data-slot="scroll-progress-label"
                        className="absolute inset-y-0 left-0 flex items-center gap-2 whitespace-nowrap"
                        initial={
                          reduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, filter: "blur(1.5px)" }
                        }
                        animate={{ opacity: 1, filter: "blur(0px)" }}
                        exit={
                          reduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, filter: "blur(1.5px)" }
                        }
                        transition={LABEL_CROSSFADE}
                      >
                        <span className="font-mission text-[10px] font-semibold tracking-[0.16em] text-cyan-glow/90 tabular-nums leading-none">
                          {activeCode}
                        </span>
                        <span className="font-nav text-[13px] font-medium leading-none tracking-[0.01em] text-slate-100">
                          {label}
                        </span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>

                <ChevronUp
                  className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-colors group-hover:text-cyan-glow"
                  aria-hidden="true"
                />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export { ScrollProgress };
export default ScrollProgress;
