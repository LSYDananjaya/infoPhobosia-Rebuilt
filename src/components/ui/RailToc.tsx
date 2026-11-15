"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
} from "motion/react";

import { cn } from "@/lib/utils";
import { scrollToTarget } from "@/components/scenes/SmoothScrollProvider";

export type RailTocItem = {
  id: string;
  label: string;
  depth?: number;
  scrollOffset?: number;
};

const RAIL_X = 6;
const LABEL_GAP = 14;
const TRAVEL_SPRING = { stiffness: 140, damping: 26, mass: 0.6 };
const TURN_SPRING = { stiffness: 260, damping: 30 };
// Rail length the craft must back up before turning around so scroll jitter won't flip it
const TURN_SLACK = 2;

const PLANE = "M12 2 20.5 21 12 17.5 3.5 21z";
// Plane is slightly narrower than node cutouts so the underlying rail & dots clean away beneath it
const PLANE_HOLE = 4.5;

const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

type Point = { x: number; y: number };
type Geometry = { nodes: Point[]; d: string; width: number; height: number };

function buildPath(nodes: Point[]) {
  if (!nodes.length) return "";
  const points: Point[] = [{ x: nodes[0].x, y: 0 }, nodes[0]];
  for (let i = 1; i < nodes.length; i++) {
    const from = nodes[i - 1];
    const to = nodes[i];
    if (from.x !== to.x) {
      const bend = (to.y - from.y) * 0.3;
      points.push({ x: from.x, y: from.y + bend }, { x: to.x, y: to.y - bend });
    }
    points.push(to);
  }
  return points.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");
}

// The rail only ever runs downward, so y is monotonic along its length
function lengthAtY(path: SVGPathElement, total: number, y: number) {
  let lo = 0;
  let hi = total;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (path.getPointAtLength(mid).y < y) lo = mid;
    else hi = mid;
  }
  return hi;
}

export type RailTocProps = React.ComponentProps<"nav"> & {
  items: RailTocItem[];
  containerRef?: React.RefObject<HTMLElement | null>;
  offset?: number;
  indent?: number;
  title?: string;
};

const RailToc = ({
  className,
  items,
  containerRef,
  offset = 112,
  indent = 13,
  title = "Telemetry Index",
  ...props
}: RailTocProps) => {
  const reduceMotion = useReducedMotion();
  const maskId = `rail-toc-${React.useId().replace(/[^\w-]/g, "")}`;

  const listRef = React.useRef<HTMLUListElement>(null);
  const rowRefs = React.useRef<(HTMLLIElement | null)[]>([]);
  const pathRef = React.useRef<SVGPathElement>(null);
  const holeRefs = React.useRef<(SVGCircleElement | null)[]>([]);

  const [geometry, setGeometry] = React.useState<Geometry>();
  const [reached, setReached] = React.useState(1);

  const lengths = React.useRef<number[]>([]);
  const total = React.useRef(0);
  const placed = React.useRef(false);
  const pinned = React.useRef<number | null>(null);
  const userScrolled = React.useRef(false);
  const facing = React.useRef<1 | -1>(1);
  const turnFrom = React.useRef(0);

  const target = useMotionValue(0);
  const travel = useSpring(target, TRAVEL_SPRING);
  const distance = reduceMotion ? target : travel;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const heading = useMotionValue(180);
  const turn = useSpring(heading, TURN_SPRING);
  const filled = useMotionValue(0);

  const pose = React.useCallback(
    (l: number) => {
      const path = pathRef.current;
      const length = total.current;
      if (!path || !length) return;
      const at = path.getPointAtLength(l);
      const behind = path.getPointAtLength(Math.max(0, l - 1));
      const ahead = path.getPointAtLength(Math.min(length, l + 1));
      x.set(at.x);
      y.set(at.y);
      holeRefs.current.forEach((hole) => {
        hole?.setAttribute("cx", `${at.x}`);
        hole?.setAttribute("cy", `${at.y}`);
      });
      const angle =
        (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI +
        90 +
        (facing.current < 0 ? 180 : 0);
      // Unwrap angle so the rotational spring takes the shortest turn
      const prev = heading.get();
      heading.set(angle + 360 * Math.round((prev - angle) / 360));
      filled.set(l / length);
      setReached(lengths.current.filter((n) => n <= l + 0.5).length);
    },
    [x, y, heading, filled]
  );

  useMotionValueEvent(distance, "change", pose);

  const aim = React.useCallback(
    (next: number) => {
      const from = turnFrom.current;
      if ((next - from) * facing.current > 0) turnFrom.current = next;
      else if (Math.abs(next - from) > TURN_SLACK) {
        facing.current = facing.current > 0 ? -1 : 1;
        turnFrom.current = next;
      }
      target.set(next);
    },
    [target]
  );

  const sync = React.useCallback(() => {
    const nodes = lengths.current;
    if (!nodes.length) return;

    if (pinned.current !== null) {
      aim(nodes[pinned.current] ?? nodes[0]);
      return;
    }

    const scroller = containerRef?.current;
    const scrollTop = scroller ? scroller.scrollTop : window.scrollY;
    const viewHeight = scroller ? scroller.clientHeight : window.innerHeight;
    const scrollHeight = scroller
      ? scroller.scrollHeight
      : document.documentElement.scrollHeight;
    const originTop = scroller ? scroller.getBoundingClientRect().top : 0;

    // Anchor sweeps smoothly toward bottom near the end of the page so final sections stay reachable
    const remaining = Math.max(0, scrollHeight - viewHeight - scrollTop);
    const line = Math.min(offset, scrollTop);
    const anchor = line + Math.max(0, viewHeight - line - remaining);

    const tops = items.map((item) => {
      const el = document.getElementById(item.id);
      return el ? el.getBoundingClientRect().top - originTop : Infinity;
    });

    let index = -1;
    for (let i = tops.length - 1; i >= 0; i--) {
      if (tops[i] <= anchor) {
        index = i;
        break;
      }
    }
    let next: number;
    if (index === -1) next = nodes[0];
    else if (index === nodes.length - 1) next = nodes[index];
    else {
      const span = tops[index + 1] - tops[index];
      const progress = span > 0 ? (anchor - tops[index]) / span : 0;
      next =
        nodes[index] +
        Math.min(1, Math.max(0, progress)) * (nodes[index + 1] - nodes[index]);
    }

    aim(next);
    if (!placed.current) {
      placed.current = true;
      travel.jump(next);
      pose(next);
      turn.jump(heading.get());
    }
  }, [containerRef, items, offset, aim, travel, turn, heading, pose]);

  useIsoLayoutEffect(() => {
    const list = listRef.current;
    if (!list || !items.length) return;

    const measure = () => {
      const nodes = items.map((item, i) => {
        const row = rowRefs.current[i];
        return {
          x: RAIL_X + (item.depth ?? 0) * indent,
          y: row ? row.offsetTop + row.offsetHeight / 2 : 0,
        };
      });
      setGeometry({
        nodes,
        d: buildPath(nodes),
        width: Math.max(...nodes.map((n) => n.x)) + RAIL_X + 6,
        height: list.offsetHeight,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [items, indent]);

  useIsoLayoutEffect(() => {
    const path = pathRef.current;
    if (!path || !geometry) return;
    total.current = path.getTotalLength();
    lengths.current = geometry.nodes.map((n) =>
      lengthAtY(path, total.current, n.y)
    );
    sync();
    pose(distance.get());
  }, [geometry, sync, pose, distance]);

  React.useEffect(() => {
    const scroller = containerRef?.current ?? window;
    const onIntent = () => {
      userScrolled.current = true;
    };
    const onScroll = () => {
      if (pinned.current !== null && userScrolled.current) pinned.current = null;
      sync();
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    scroller.addEventListener("wheel", onIntent, { passive: true });
    scroller.addEventListener("touchstart", onIntent, { passive: true });
    scroller.addEventListener("pointerdown", onIntent);
    window.addEventListener("keydown", onIntent);
    window.addEventListener("resize", sync);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("wheel", onIntent);
      scroller.removeEventListener("touchstart", onIntent);
      scroller.removeEventListener("pointerdown", onIntent);
      window.removeEventListener("keydown", onIntent);
      window.removeEventListener("resize", sync);
    };
  }, [containerRef, sync]);

  const select = (index: number) => {
    const item = items[index];
    if (!item) return;
    const el = document.getElementById(item.id);
    if (!el) return;

    pinned.current = index;
    userScrolled.current = false;
    sync();

    const jumpOffset = item.scrollOffset ?? Math.max(0, offset - 12);
    scrollToTarget(el, {
      offset: jumpOffset,
      immediate: Boolean(reduceMotion),
      container: containerRef?.current ?? null,
    });
  };

  if (items.length === 0) return null;

  const active = Math.max(0, reached - 1);
  const activeCode = String(active + 1).padStart(2, "0");
  const totalCode = String(items.length).padStart(2, "0");

  return (
    <nav
      data-slot="rail-toc"
      aria-label={title}
      className={cn(
        "relative w-full rounded-2xl border border-white/10",
        "bg-[linear-gradient(165deg,rgba(14,20,34,0.82),rgba(6,9,17,0.92))]",
        "px-4 py-5 shadow-[0_20px_48px_-16px_rgba(0,0,0,0.82),inset_0_1px_0_rgba(255,255,255,0.14)]",
        "backdrop-blur-xl",
        className
      )}
      {...props}
    >
      {/* Subtle HUD corner ticks */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-2 left-2 h-2 w-2 rounded-tl border-t border-l border-cyan-glow/35"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 right-2 h-2 w-2 rounded-br border-b border-r border-mars-400/35"
      />

      <div
        data-slot="rail-toc-title"
        className="mb-4 flex items-center justify-between gap-2 border-b border-white/[0.07] pb-2.5"
      >
        <p className="flex items-center gap-2 font-mission text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-glow/90">
          <svg
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5 shrink-0 text-cyan-glow"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M2 4h12M2 8h8M2 12h10" />
          </svg>
          <span>{title}</span>
        </p>
        <span className="font-mission text-[10px] tabular-nums tracking-[0.12em] text-slate-400">
          {activeCode}/{totalCode}
        </span>
      </div>

      <ul ref={listRef} data-slot="rail-toc-list" className="relative">
        {geometry && geometry.nodes.length > 0 && (
          <svg
            className="pointer-events-none absolute left-0 top-0 overflow-visible"
            width={geometry.width}
            height={geometry.height}
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id={`${maskId}-fade`}
                gradientUnits="userSpaceOnUse"
                x1={0}
                y1={0}
                x2={0}
                y2={Math.max(1, geometry.nodes[0].y - 4)}
              >
                <stop offset="0" stopColor="black" />
                <stop offset="1" stopColor="white" />
              </linearGradient>

              <linearGradient
                id={`${maskId}-trail`}
                gradientUnits="userSpaceOnUse"
                x1={0}
                y1={0}
                x2={0}
                y2={Math.max(1, geometry.height)}
              >
                <stop offset="0%" stopColor="#e86c48" />
                <stop offset="45%" stopColor="#f59e6c" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>

              <mask
                id={maskId}
                maskUnits="userSpaceOnUse"
                x={-10}
                y={-10}
                width={geometry.width + 20}
                height={geometry.height + 20}
              >
                <rect
                  x={-10}
                  y={-10}
                  width={geometry.width + 20}
                  height={geometry.height + 20}
                  fill={`url(#${maskId}-fade)`}
                />
                {geometry.nodes.map((node, i) => (
                  <circle key={i} cx={node.x} cy={node.y} r={4.25} fill="black" />
                ))}
                <circle
                  ref={(el) => {
                    holeRefs.current[0] = el;
                  }}
                  r={PLANE_HOLE}
                  fill="black"
                />
              </mask>

              <mask
                id={`${maskId}-nodes`}
                maskUnits="userSpaceOnUse"
                x={-10}
                y={-10}
                width={geometry.width + 20}
                height={geometry.height + 20}
              >
                <rect
                  x={-10}
                  y={-10}
                  width={geometry.width + 20}
                  height={geometry.height + 20}
                  fill="white"
                />
                <circle
                  ref={(el) => {
                    holeRefs.current[1] = el;
                  }}
                  r={PLANE_HOLE}
                  fill="black"
                />
              </mask>
            </defs>

            <g mask={`url(#${maskId})`}>
              <path
                ref={pathRef}
                d={geometry.d}
                fill="none"
                strokeWidth="1.25"
                strokeDasharray="2 5"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke="rgba(255, 255, 255, 0.16)"
              />
              <motion.path
                d={geometry.d}
                fill="none"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke={`url(#${maskId}-trail)`}
                style={{ pathLength: filled }}
              />
            </g>

            <g mask={`url(#${maskId}-nodes)`}>
              {geometry.nodes.map((node, i) => {
                const covered = i < reached;
                const isSub = (items[i]?.depth ?? 0) > 0;
                return (
                  <circle
                    key={items[i]?.id ?? i}
                    cx={node.x}
                    cy={node.y}
                    r={isSub ? (covered ? 2.6 : 2.75) : covered ? 3.25 : 3.25}
                    strokeWidth="1.35"
                    className="transition-[fill,stroke] duration-200"
                    fill={
                      covered
                        ? isSub
                          ? "#38bdf8"
                          : "#e86c48"
                        : "#060a13"
                    }
                    stroke={
                      covered
                        ? isSub
                          ? "#bae6fd"
                          : "#f59e6c"
                        : "rgba(255, 255, 255, 0.28)"
                    }
                  />
                );
              })}
            </g>
          </svg>
        )}

        {geometry && geometry.nodes.length > 0 && (
          <motion.div
            data-slot="rail-toc-plane"
            className="pointer-events-none absolute left-0 top-0 -ml-2 -mt-2 h-4 w-4 text-cyan-glow [filter:drop-shadow(0_0_6px_rgba(56,189,248,0.75))]"
            style={{ x, y, rotate: reduceMotion ? heading : turn }}
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 overflow-visible">
              <path
                d={PLANE}
                fill="currentColor"
                stroke="#e0f2fe"
                strokeWidth="1.15"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        )}

        {items.map((item, i) => {
          const isActive = i === active;
          const isSub = (item.depth ?? 0) > 0;
          return (
            <li
              key={item.id}
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
            >
              <button
                type="button"
                onClick={() => select(i)}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "block w-full rounded-lg py-1.5 pr-2 text-left transition-colors duration-200 cursor-pointer",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50",
                  isSub ? "font-sans text-[12px] leading-[1.35]" : "font-nav text-[13px] leading-5",
                  isActive
                    ? cn(
                        "font-medium bg-white/[0.05]",
                        isSub ? "text-cyan-glow" : "text-white"
                      )
                    : isSub
                      ? "text-slate-400 hover:text-slate-200"
                      : "text-slate-300/80 hover:text-white"
                )}
                style={{
                  paddingLeft: RAIL_X + (item.depth ?? 0) * indent + LABEL_GAP,
                }}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export { RailToc };
export default RailToc;
