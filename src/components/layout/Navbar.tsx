"use client";

import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  ArrowUpRight,
  Compass,
  Sparkles,
  User,
  Layers,
} from "lucide-react";
import { LiquidGlassSurface } from "@/components/ui/LiquidGlassSurface";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/missions", label: "Missions" },
  { href: "/models", label: "3D Models" },
  { href: "/science", label: "Science" },
  { href: "/experience", label: "Experience" },
  { href: "/about", label: "About" },
];

const archiveLinks = [
  { href: "/development", label: "Development", Icon: Compass },
  { href: "/story", label: "Astronaut Lore", Icon: Sparkles },
  { href: "/creator", label: "Creator", Icon: User },
  { href: "/credits", label: "Asset Credits", Icon: Layers },
];

const allLinks = [...primaryLinks, ...archiveLinks.map(({ href, label }) => ({ href, label }))];

type PanelPhase = "closed" | "opening" | "open" | "closing";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function Navbar() {
  const pathname = usePathname();

  const [mobilePhase, setMobilePhase] = useState<PanelPhase>("closed");
  const [dropdownPhase, setDropdownPhase] = useState<PanelPhase>("closed");
  const [scrolled, setScrolled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Optimistic pending key so clicking a tab begins gliding immediately
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isGliding, setIsGliding] = useState(false);
  const [isCapsulePressed, setIsCapsulePressed] = useState(false);
  const [indicatorReady, setIndicatorReady] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);
  const navRectRef = useRef<DOMRect | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | HTMLButtonElement | null>>({});
  const archiveContainerRef = useRef<HTMLDivElement>(null);
  const dossierButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownPanelRef = useRef<HTMLDivElement>(null);
  const dropdownRectRef = useRef<DOMRect | null>(null);
  const menuButtonRef = useRef<HTMLDivElement>(null);
  const menuItemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const prevActiveKeyRef = useRef<string | null>(null);
  const glideTimerRef = useRef<number | null>(null);
  const pendingTimerRef = useRef<number | null>(null);
  const dropdownTimerRef = useRef<number | null>(null);
  const dropdownRafRef = useRef<number | null>(null);
  const mobileTimerRef = useRef<number | null>(null);
  const mobileRafRef = useRef<number | null>(null);

  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
    visible: boolean;
  }>({
    left: 0,
    width: 0,
    visible: false,
  });

  const [hoverIndicator, setHoverIndicator] = useState<{
    left: number;
    width: number;
    visible: boolean;
  }>({
    left: 0,
    width: 0,
    visible: false,
  });

  const [hoveredDropdownIdx, setHoveredDropdownIdx] = useState<number | null>(null);
  const [dropdownHighlight, setDropdownHighlight] = useState<{
    top: number;
    height: number;
    visible: boolean;
  }>({
    top: 0,
    height: 0,
    visible: false,
  });

  const routeActiveKey = (() => {
    const primaryMatch = primaryLinks.find((l) =>
      l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
    );
    if (primaryMatch) return primaryMatch.href;
    const archiveMatch = archiveLinks.find((l) => pathname.startsWith(l.href));
    if (archiveMatch) return "__archive__";
    return "/";
  })();

  const activeKey = pendingKey ?? routeActiveKey;
  const archiveOpen = dropdownPhase === "opening" || dropdownPhase === "open";
  const archiveMounted = dropdownPhase !== "closed";
  const mobileOpen = mobilePhase === "opening" || mobilePhase === "open";
  const mobileMounted = mobilePhase !== "closed";

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const measureItemInNav = useCallback((key: string) => {
    const container = navRef.current;
    const target = itemRefs.current[key];
    if (!container || !target) return null;
    const cRect = container.getBoundingClientRect();
    const tRect = target.getBoundingClientRect();
    if (cRect.width <= 0 || tRect.width <= 0) return null;
    return {
      left: tRect.left - cRect.left - container.clientLeft,
      width: tRect.width,
    };
  }, []);

  const updateIndicator = useCallback(() => {
    const rect = measureItemInNav(activeKey);
    if (!rect) {
      setIndicator((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }
    setIndicator({
      left: rect.left,
      width: rect.width,
      visible: true,
    });
  }, [activeKey, measureItemInNav]);

  const handleTabHover = useCallback(
    (key: string, pointerType?: string) => {
      if (pointerType === "touch") return;
      const rect = measureItemInNav(key);
      if (!rect) return;
      if (key === activeKey) {
        setHoverIndicator((prev) =>
          prev.visible ? { ...prev, visible: false } : prev
        );
        return;
      }
      setHoverIndicator({
        left: rect.left,
        width: rect.width,
        visible: true,
      });
    },
    [activeKey, measureItemInNav]
  );

  const openDropdown = useCallback(() => {
    if (dropdownTimerRef.current) window.clearTimeout(dropdownTimerRef.current);
    if (dropdownRafRef.current) window.cancelAnimationFrame(dropdownRafRef.current);

    if (reducedMotion) {
      setDropdownPhase("open");
      return;
    }

    setDropdownPhase((prev) => {
      if (prev === "open" || prev === "opening") return prev;
      if (prev === "closing") return "open";
      return "opening";
    });

    dropdownRafRef.current = window.requestAnimationFrame(() => {
      dropdownRafRef.current = window.requestAnimationFrame(() => {
        setDropdownPhase("open");
      });
    });
  }, [reducedMotion]);

  const closeDropdown = useCallback(
    (returnFocus = false) => {
      if (dropdownTimerRef.current) window.clearTimeout(dropdownTimerRef.current);
      if (dropdownRafRef.current) window.cancelAnimationFrame(dropdownRafRef.current);

      setHoveredDropdownIdx(null);
      setDropdownHighlight((prev) => ({ ...prev, visible: false }));

      setDropdownPhase((prev) => {
        if (prev === "closed") return "closed";
        if (reducedMotion) return "closed";
        return "closing";
      });

      if (!reducedMotion) {
        dropdownTimerRef.current = window.setTimeout(() => {
          setDropdownPhase("closed");
        }, 160);
      }

      if (returnFocus) {
        window.requestAnimationFrame(() => {
          dossierButtonRef.current?.focus();
        });
      }
    },
    [reducedMotion]
  );

  const toggleDropdown = useCallback(() => {
    if (dropdownPhase === "opening" || dropdownPhase === "open") {
      closeDropdown(false);
    } else {
      openDropdown();
    }
  }, [dropdownPhase, openDropdown, closeDropdown]);

  const openMobile = useCallback(() => {
    if (mobileTimerRef.current) window.clearTimeout(mobileTimerRef.current);
    if (mobileRafRef.current) window.cancelAnimationFrame(mobileRafRef.current);

    if (reducedMotion) {
      setMobilePhase("open");
      return;
    }

    setMobilePhase("opening");
    mobileRafRef.current = window.requestAnimationFrame(() => {
      mobileRafRef.current = window.requestAnimationFrame(() => {
        setMobilePhase("open");
      });
    });
  }, [reducedMotion]);

  const closeMobile = useCallback(
    (returnFocus = false) => {
      if (mobileTimerRef.current) window.clearTimeout(mobileTimerRef.current);
      if (mobileRafRef.current) window.cancelAnimationFrame(mobileRafRef.current);

      setMobilePhase((prev) => {
        if (prev === "closed") return "closed";
        if (reducedMotion) return "closed";
        return "closing";
      });

      if (!reducedMotion) {
        mobileTimerRef.current = window.setTimeout(() => {
          setMobilePhase("closed");
        }, 180);
      }

      if (returnFocus) {
        const btn = menuButtonRef.current?.querySelector("button");
        window.requestAnimationFrame(() => btn?.focus());
      }
    },
    [reducedMotion]
  );

  const toggleMobile = useCallback(() => {
    if (mobilePhase === "opening" || mobilePhase === "open") {
      closeMobile(false);
    } else {
      openMobile();
    }
  }, [mobilePhase, openMobile, closeMobile]);

  const moveDropdownHighlight = useCallback((idx: number | null) => {
    setHoveredDropdownIdx(idx);
    if (idx === null) {
      setDropdownHighlight((prev) =>
        prev.visible ? { ...prev, visible: false } : prev
      );
      return;
    }
    const item = menuItemRefs.current[idx];
    if (!item) return;

    setDropdownHighlight({
      top: item.offsetTop,
      height: item.offsetHeight,
      visible: true,
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync navigation state on actual route completion
  useEffect(() => {
    setPendingKey(null);
    if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
    closeMobile(false);
    closeDropdown(false);
  }, [pathname, closeMobile, closeDropdown]);

  // Trigger brief physical glass droplet stretch when active tab changes
  useEffect(() => {
    if (
      prevActiveKeyRef.current !== null &&
      prevActiveKeyRef.current !== activeKey &&
      !reducedMotion
    ) {
      setIsGliding(true);
      if (glideTimerRef.current) window.clearTimeout(glideTimerRef.current);
      glideTimerRef.current = window.setTimeout(() => {
        setIsGliding(false);
      }, 220);
    }
    prevActiveKeyRef.current = activeKey;
  }, [activeKey, reducedMotion]);

  useIsomorphicLayoutEffect(() => {
    updateIndicator();
    const raf = window.requestAnimationFrame(() => {
      updateIndicator();
      setIndicatorReady(true);
    });
    window.addEventListener("resize", updateIndicator);

    const navEl = navRef.current;
    const ro =
      navEl && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateIndicator())
        : null;
    if (ro && navEl) ro.observe(navEl);

    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => updateIndicator()).catch(() => {});
    }

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateIndicator);
      ro?.disconnect();
    };
  }, [updateIndicator, scrolled]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (archiveOpen) {
          e.preventDefault();
          closeDropdown(true);
        } else if (mobileOpen) {
          e.preventDefault();
          closeMobile(true);
        }
      }
    };

    const handlePointerDownOutside = (e: PointerEvent) => {
      if (
        archiveOpen &&
        archiveContainerRef.current &&
        !archiveContainerRef.current.contains(e.target as Node)
      ) {
        closeDropdown(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDownOutside);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDownOutside);
    };
  }, [archiveOpen, mobileOpen, closeDropdown, closeMobile]);

  useEffect(() => {
    return () => {
      if (glideTimerRef.current) window.clearTimeout(glideTimerRef.current);
      if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
      if (dropdownTimerRef.current) window.clearTimeout(dropdownTimerRef.current);
      if (dropdownRafRef.current) window.cancelAnimationFrame(dropdownRafRef.current);
      if (mobileTimerRef.current) window.clearTimeout(mobileTimerRef.current);
      if (mobileRafRef.current) window.cancelAnimationFrame(mobileRafRef.current);
    };
  }, []);

  const refreshNavRect = () => {
    if (navRef.current) {
      navRectRef.current = navRef.current.getBoundingClientRect();
    }
  };

  const handleNavPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reducedMotion || !navRef.current || e.pointerType === "touch") return;
    if (!navRectRef.current) refreshNavRect();
    const rect = navRectRef.current;
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    navRef.current.style.setProperty("--nav-px", `${x.toFixed(1)}%`);
    navRef.current.style.setProperty("--nav-py", `${y.toFixed(1)}%`);
  };

  const refreshDropdownRect = () => {
    if (dropdownPanelRef.current) {
      dropdownRectRef.current = dropdownPanelRef.current.getBoundingClientRect();
    }
  };

  const handleDropdownPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || !dropdownPanelRef.current || e.pointerType === "touch") return;
    if (!dropdownRectRef.current) refreshDropdownRect();
    const rect = dropdownRectRef.current;
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    dropdownPanelRef.current.style.setProperty("--drop-px", `${x.toFixed(1)}%`);
    dropdownPanelRef.current.style.setProperty("--drop-py", `${y.toFixed(1)}%`);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      openDropdown();
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          menuItemRefs.current[0]?.focus();
          moveDropdownHighlight(0);
        });
      });
    } else if (e.key === "Escape" && archiveOpen) {
      e.preventDefault();
      closeDropdown(true);
    }
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = menuItemRefs.current.filter(Boolean) as HTMLAnchorElement[];
    if (items.length === 0) return;
    const currentIdx = items.findIndex((el) => el === document.activeElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = currentIdx < 0 ? 0 : (currentIdx + 1) % items.length;
      items[next]?.focus();
      moveDropdownHighlight(next);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev =
        currentIdx <= 0 ? items.length - 1 : (currentIdx - 1 + items.length) % items.length;
      items[prev]?.focus();
      moveDropdownHighlight(prev);
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
      moveDropdownHighlight(0);
    } else if (e.key === "End") {
      e.preventDefault();
      const last = items.length - 1;
      items[last]?.focus();
      moveDropdownHighlight(last);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeDropdown(true);
    }
  };

  const handleArchiveBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!archiveOpen) return;
    const nextTarget = e.relatedTarget as Node | null;
    if (nextTarget && archiveContainerRef.current?.contains(nextTarget)) return;
    closeDropdown(false);
  };

  const triggerTabClick = (href: string) => {
    setIsCapsulePressed(false);
    setPendingKey(href);
    if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
    pendingTimerRef.current = window.setTimeout(() => {
      setPendingKey(null);
    }, 1200);
    closeDropdown(false);
  };

  const transformSuffix = isGliding
    ? " scale(1.035, 0.94)"
    : isCapsulePressed
      ? " scale(0.96)"
      : " scale(1, 1)";

  return (
    <>
      <header className="fixed top-4 sm:top-5 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pointer-events-none">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 sm:gap-4 lg:gap-6">
          {/* Left Zone: Uncropped PHOBOSIA Wordmark */}
          <Link
            href="/"
            className="pointer-events-auto justify-self-start inline-flex items-center -ml-1 py-1 rounded-xl hover:opacity-90 transition-opacity shrink-0 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
            aria-label="PHOBOSIA Home"
          >
            <Image
              src="/phobosia-logo.webp"
              alt="PHOBOSIA"
              width={1600}
              height={533}
              priority
              className="h-9 sm:h-11 xl:h-[52px] w-auto object-contain object-left select-none drop-shadow-[0_2px_8px_rgba(4,7,14,0.75)]"
            />
          </Link>

          {/* Center Zone: Shared Non-Blurred Wrapper Decoupling Dropdown from Nav Backdrop Root */}
          <div
            ref={archiveContainerRef}
            onBlur={handleArchiveBlur}
            className="hidden lg:block relative justify-self-center pointer-events-auto"
          >
            <nav
              ref={navRef}
              aria-label="Main Navigation"
              onPointerEnter={refreshNavRect}
              onPointerMove={handleNavPointerMove}
              onPointerLeave={() => {
                navRectRef.current = null;
                setHoverIndicator((prev) =>
                  prev.visible ? { ...prev, visible: false } : prev
                );
                setIsCapsulePressed(false);
              }}
              className={`flex items-center relative rounded-full liquid-glass-pill p-1.5 xl:p-2 gap-0.5 xl:gap-1 ${
                scrolled ? "liquid-glass-pill--scrolled" : ""
              } ${archiveOpen ? "liquid-glass-pill--dropdown-open" : ""}`}
            >
              <LiquidGlassSurface mode="navbar" accent="neutral" glassAlpha={0.18} />

              {/* Subtle sliding ghost glass hover indicator for inactive tabs */}
              <span
                aria-hidden="true"
                className={`absolute top-1.5 xl:top-2 bottom-1.5 xl:bottom-2 left-0 z-[2] rounded-full liquid-glass-nav-hover pointer-events-none ${
                  hoverIndicator.visible ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  width: `${hoverIndicator.width}px`,
                  transform: `translate3d(${hoverIndicator.left}px, 0, 0)`,
                }}
              />

              {/* Shared gliding Active Liquid Glass Droplet Indicator */}
              {indicator.visible && (
                <span
                  aria-hidden="true"
                  className={`absolute top-1.5 xl:top-2 bottom-1.5 xl:bottom-2 left-0 z-[3] rounded-full liquid-glass-nav-capsule pointer-events-none ${
                    !indicatorReady ? "liquid-glass-nav-capsule--instant" : ""
                  } ${isGliding ? "liquid-glass-nav-capsule--gliding" : ""} ${
                    isCapsulePressed ? "liquid-glass-nav-capsule--pressed" : ""
                  }`}
                  style={{
                    width: `${indicator.width}px`,
                    transform: `translate3d(${indicator.left}px, 0, 0)${transformSuffix}`,
                  }}
                />
              )}

              {primaryLinks.map((link) => {
                const isActive = activeKey === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    ref={(el) => {
                      itemRefs.current[link.href] = el;
                    }}
                    aria-current={
                      (link.href === "/" ? pathname === "/" : pathname.startsWith(link.href))
                        ? "page"
                        : undefined
                    }
                    onPointerEnter={(e) => handleTabHover(link.href, e.pointerType)}
                    onFocus={() => handleTabHover(link.href)}
                    onPointerDown={() => {
                      if (isActive) setIsCapsulePressed(true);
                    }}
                    onPointerUp={() => setIsCapsulePressed(false)}
                    onPointerCancel={() => setIsCapsulePressed(false)}
                    onClick={() => triggerTabClick(link.href)}
                    className={`liquid-glass-tab-item relative z-10 px-3 xl:px-[18px] 2xl:px-[22px] py-2 rounded-full text-[13px] font-nav whitespace-nowrap min-h-[42px] xl:min-h-[44px] flex items-center select-none ${
                      isActive
                        ? indicator.visible
                          ? "text-white liquid-glass-tab-item--active"
                          : "text-white liquid-glass-nav-capsule liquid-glass-tab-item--active"
                        : "text-slate-200/80 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Morphing Liquid Glass Dropdown Trigger */}
              <button
                ref={(el) => {
                  dossierButtonRef.current = el;
                  itemRefs.current["__archive__"] = el;
                }}
                type="button"
                onClick={toggleDropdown}
                onKeyDown={handleTriggerKeyDown}
                onPointerEnter={(e) => handleTabHover("__archive__", e.pointerType)}
                onFocus={() => handleTabHover("__archive__")}
                onPointerDown={() => {
                  if (activeKey === "__archive__") setIsCapsulePressed(true);
                }}
                onPointerUp={() => setIsCapsulePressed(false)}
                onPointerCancel={() => setIsCapsulePressed(false)}
                aria-expanded={archiveOpen}
                aria-haspopup="menu"
                aria-controls="dossier-liquid-menu"
                className={`liquid-glass-tab-item relative z-10 px-3 xl:px-[18px] 2xl:px-[22px] py-2 rounded-full text-[13px] font-nav whitespace-nowrap min-h-[42px] xl:min-h-[44px] inline-flex items-center gap-1.5 select-none ${
                  activeKey === "__archive__"
                    ? indicator.visible
                      ? "text-white liquid-glass-tab-item--active"
                      : "text-white liquid-glass-nav-capsule liquid-glass-tab-item--active"
                    : archiveOpen
                      ? "text-white liquid-glass-trigger-open liquid-glass-tab-item--active"
                      : "text-slate-200/80 hover:text-white"
                }`}
              >
                <span>Dossier</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                    archiveOpen ? "rotate-180 text-cyan-200" : "opacity-80"
                  }`}
                  aria-hidden="true"
                />
              </button>
            </nav>

            {/* Sibling of <nav> outside backdrop root so backdrop-filter genuinely blurs underlying UI */}
            {archiveMounted && (
              <div
                id="dossier-liquid-menu"
                ref={dropdownPanelRef}
                role="menu"
                aria-label="Project Dossier Pages"
                data-phase={dropdownPhase}
                onKeyDown={handleMenuKeyDown}
                onPointerEnter={refreshDropdownRect}
                onPointerMove={handleDropdownPointerMove}
                onPointerLeave={() => {
                  dropdownRectRef.current = null;
                  moveDropdownHighlight(null);
                }}
                className="liquid-glass-dropdown right-0 top-[calc(100%+12px)] w-60 p-2 rounded-[24px] z-50"
              >
                <div className="relative z-10 flex flex-col gap-0.5">
                  {/* Shared gliding glass row selection pill aligned to layout offsetTop */}
                  <span
                    aria-hidden="true"
                    className={`liquid-glass-dropdown-highlight absolute left-0 right-0 top-0 rounded-2xl pointer-events-none z-0 ${
                      dropdownHighlight.visible ? "opacity-100" : "opacity-0"
                    }`}
                    style={{
                      height: `${dropdownHighlight.height}px`,
                      transform: `translate3d(0, ${dropdownHighlight.top}px, 0)`,
                    }}
                  />

                  {archiveLinks.map((item, idx) => {
                    const isSubActive = pathname.startsWith(item.href);
                    const isHovered = hoveredDropdownIdx === idx;
                    const ItemIcon = item.Icon;
                    return (
                      <Link
                        key={item.href}
                        ref={(el) => {
                          menuItemRefs.current[idx] = el;
                        }}
                        href={item.href}
                        role="menuitem"
                        style={
                          {
                            "--item-delay": `${20 + idx * 28}ms`,
                          } as React.CSSProperties
                        }
                        onPointerEnter={(e) => {
                          if (e.pointerType !== "touch") moveDropdownHighlight(idx);
                        }}
                        onFocus={() => moveDropdownHighlight(idx)}
                        onClick={() => closeDropdown(false)}
                        className={`liquid-glass-dropdown-item relative z-10 group flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-nav min-h-[42px] transition-[color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 ${
                          isSubActive
                            ? "text-white bg-white/10"
                            : "text-slate-100 hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span
                            className={`flex items-center justify-center w-6 h-6 rounded-lg border transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                              isSubActive
                                ? "bg-cyan-400/20 border-cyan-300/40 text-cyan-200"
                                : isHovered
                                  ? "bg-white/14 border-white/25 text-white scale-105"
                                  : "bg-white/[0.06] border-white/12 text-slate-300"
                            }`}
                          >
                            <ItemIcon className="w-3.5 h-3.5" aria-hidden="true" />
                          </span>
                          <span>{item.label}</span>
                        </span>
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-[transform,opacity,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                            isHovered
                              ? "translate-x-0.5 opacity-95 text-cyan-200"
                              : isSubActive
                                ? "opacity-75 text-cyan-200"
                                : "opacity-40"
                          }`}
                          aria-hidden="true"
                        />
                      </Link>
                    );
                  })}

                  <div
                    className="liquid-glass-dropdown-item relative z-10 my-1.5 border-t border-white/14"
                    style={{ "--item-delay": "135ms" } as React.CSSProperties}
                  />

                  <a
                    ref={(el) => {
                      menuItemRefs.current[archiveLinks.length] = el;
                    }}
                    href="https://github.com/osa623/Phobosia-Martian-exploration-experience-powered-by-NASA-Data"
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    style={{ "--item-delay": "150ms" } as React.CSSProperties}
                    onPointerEnter={(e) => {
                      if (e.pointerType !== "touch")
                        moveDropdownHighlight(archiveLinks.length);
                    }}
                    onFocus={() => moveDropdownHighlight(archiveLinks.length)}
                    onClick={() => closeDropdown(false)}
                    className="liquid-glass-dropdown-item relative z-10 group flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-nav text-cyan-300 hover:text-cyan-200 min-h-[42px] transition-[color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
                  >
                    <span>GitHub Source</span>
                    <ArrowUpRight
                      className={`w-3.5 h-3.5 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                        hoveredDropdownIdx === archiveLinks.length
                          ? "translate-x-0.5 -translate-y-0.5"
                          : ""
                      }`}
                      aria-hidden="true"
                    />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right Zone: Detached Standalone Liquid Glass CTA Pill + Mobile Menu Toggle */}
          <div className="justify-self-end flex items-center gap-1.5 sm:gap-3 shrink-0 pointer-events-auto">
            <LiquidGlassButton
              href="https://phobosia.sim623.site/"
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="md"
              contentClassName="px-3 sm:px-6 lg:px-7 min-h-[40px] sm:min-h-[44px] lg:min-h-[54px] text-xs sm:text-[13px] font-btn tracking-tight"
            >
              <span>Launch 3D</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </LiquidGlassButton>

            <div ref={menuButtonRef} className="lg:hidden">
              <LiquidGlassButton
                type="button"
                variant="glass"
                size="sm"
                onClick={toggleMobile}
                aria-expanded={mobileOpen}
                aria-controls="mobile-liquid-nav"
                aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
                contentClassName="px-2.5 sm:px-3.5 min-h-[40px] sm:min-h-[44px]"
              >
                {mobileOpen ? (
                  <>
                    <X className="w-4 h-4" aria-hidden="true" />
                    <span>Close</span>
                  </>
                ) : (
                  <>
                    <Menu className="w-4 h-4" aria-hidden="true" />
                    <span>Menu</span>
                  </>
                )}
              </LiquidGlassButton>
            </div>
          </div>
        </div>
      </header>

      {/* Reserve clean top clearance on inner documentation pages */}
      {pathname !== "/" && <div aria-hidden="true" className="h-20 sm:h-24" />}

      {/* Mobile Frosted Liquid Glass Morphing Sheet */}
      {mobileMounted && (
        <div
          id="mobile-liquid-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
          data-phase={mobilePhase}
          className="liquid-glass-mobile-backdrop fixed inset-0 z-40 lg:hidden flex flex-col justify-start pt-24 px-4 pb-6 overflow-y-auto overscroll-contain"
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close mobile navigation menu"
            onClick={() => closeMobile(false)}
            className="fixed inset-0 bg-space-950/75 backdrop-blur-xl cursor-default"
          />
          <div className="liquid-glass-mobile-sheet relative z-10 w-full max-w-md mx-auto liquid-glass-card liquid-glass-card--cyan p-4 space-y-2">
            <LiquidGlassSurface accent="cyan" glassAlpha={0.48} />
            <div className="px-3 py-1.5 flex items-center justify-between border-b border-white/15 pb-3">
              <span className="font-mission text-xs text-slate-300 uppercase tracking-wider">
                Outpost Navigation
              </span>
              <span className="font-mission text-xs text-mars-300">
                SOL 1 to 11
              </span>
            </div>
            <nav aria-label="Mobile Navigation Links" className="grid grid-cols-2 gap-2 pt-1">
              {allLinks.map((link, idx) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{ "--tile-delay": `${16 + idx * 18}ms` } as React.CSSProperties}
                    onClick={() => closeMobile(false)}
                    className={`liquid-glass-mobile-tile px-3.5 py-3 rounded-2xl text-xs font-nav min-h-[44px] flex items-center transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] ${
                      isActive
                        ? "bg-white/20 text-white border border-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
                        : "bg-white/[0.04] text-slate-200 hover:bg-white/10 hover:text-white border border-white/10"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-white/15 flex flex-col sm:flex-row gap-2">
              <LiquidGlassButton
                href="https://phobosia.sim623.site/"
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                size="md"
                fullWidth
                wrapClassName="flex-1"
                contentClassName="font-btn"
              >
                <span>Open 3D Outpost</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </LiquidGlassButton>
              <LiquidGlassButton
                href="https://github.com/osa623/Phobosia-Martian-exploration-experience-powered-by-NASA-Data"
                target="_blank"
                rel="noopener noreferrer"
                variant="glass"
                size="md"
              >
                <span>GitHub Source</span>
              </LiquidGlassButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
