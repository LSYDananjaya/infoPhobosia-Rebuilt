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
  Atom,
  ArrowUpRight,
  Box,
  ChevronDown,
  ChevronRight,
  Compass,
  Home,
  Info,
  Layers,
  Orbit,
  Rocket,
  Sparkles,
  User,
} from "lucide-react";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { LiquidGlassButton } from "@/components/ui/LiquidGlassButton";

const primaryLinks = [
  {
    href: "/",
    label: "Home",
    index: "01",
    tagline: "Where Mars observation begins.",
    Icon: Home,
  },
  {
    href: "/missions",
    label: "Missions",
    index: "02",
    tagline: "SOL 1 to 11 surface operations.",
    Icon: Orbit,
  },
  {
    href: "/models",
    label: "3D Models",
    index: "03",
    tagline: "Interactive outpost & rover assets.",
    Icon: Box,
  },
  {
    href: "/science",
    label: "Science",
    index: "04",
    tagline: "NASA HiRISE DTM & terrain data.",
    Icon: Atom,
  },
  {
    href: "/experience",
    label: "Experience",
    index: "05",
    tagline: "Real-time WebGL console systems.",
    Icon: Rocket,
  },
  {
    href: "/about",
    label: "About",
    index: "06",
    tagline: "Crafted with quiet intent.",
    Icon: Info,
  },
];

const archiveLinks = [
  {
    href: "/development",
    label: "Development",
    index: "07",
    tagline: "Engineering & WebGL architecture.",
    Icon: Compass,
  },
  {
    href: "/story",
    label: "Astronaut Lore",
    index: "08",
    tagline: "Expedition logs of Carl Ashwindu.",
    Icon: Sparkles,
  },
  {
    href: "/creator",
    label: "Creator",
    index: "09",
    tagline: "Built by Osanda Hirushaka.",
    Icon: User,
  },
  {
    href: "/credits",
    label: "Asset Credits",
    index: "10",
    tagline: "CC BY 4.0 models & planetary sources.",
    Icon: Layers,
  },
];

const allLinks = [...primaryLinks, ...archiveLinks];

type PanelPhase = "closed" | "opening" | "open" | "closing";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function Navbar() {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [previewMeta, setPreviewMeta] = useState<{
    index: string;
    tagline: string;
  } | null>(null);
  const [dropdownPhase, setDropdownPhase] = useState<PanelPhase>("closed");
  const [scrolled, setScrolled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Optimistic pending key so clicking a tab begins gliding immediately
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isGliding, setIsGliding] = useState(false);
  const [glide, setGlide] = useState({ sx: 1.1, sy: 1.5 });
  const prevLeftRef = useRef(-1);
  const [isCapsulePressed, setIsCapsulePressed] = useState(false);
  const [indicatorReady, setIndicatorReady] = useState(false);
  const [hudMode, setHudMode] = useState(false);

  const toggleHudMode = useCallback(() => {
    setHudMode((prev) => {
      const next = !prev;
      if (typeof document !== "undefined") {
        if (next) document.documentElement.setAttribute("data-dossier", "on");
        else document.documentElement.removeAttribute("data-dossier");
      }
      return next;
    });
  }, []);

  const navRef = useRef<HTMLDivElement>(null);
  const navRectRef = useRef<DOMRect | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | HTMLButtonElement | null>>({});
  const archiveContainerRef = useRef<HTMLDivElement>(null);
  const dossierButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownPanelRef = useRef<HTMLDivElement>(null);
  const dropdownRectRef = useRef<DOMRect | null>(null);
  const menuItemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const mobilePanelRef = useRef<HTMLElement>(null);
  const mobileToggleBtnRef = useRef<HTMLButtonElement>(null);
  const mobileInnerRef = useRef<HTMLDivElement>(null);

  const prevActiveKeyRef = useRef<string | null>(null);
  const glideTimerRef = useRef<number | null>(null);
  const pendingTimerRef = useRef<number | null>(null);
  const dropdownTimerRef = useRef<number | null>(null);
  const dropdownRafRef = useRef<number | null>(null);

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

  const activeMobileMeta =
    allLinks.find((l) =>
      l.href === "/" ? pathname === "/" : pathname.startsWith(l.href)
    ) ?? primaryLinks[0];
  const displayMeta = previewMeta ?? activeMobileMeta;

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
    const dist = Math.abs(rect.left - prevLeftRef.current);
    if (prevLeftRef.current >= 0 && dist > 6) {
      setGlide({
        sx: 1.08 + Math.min(0.08, dist / 1400),
        sy: 1.48 + Math.min(0.08, dist / 2200),
      });
    }
    prevLeftRef.current = rect.left;
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

  const setMobileMenuState = useCallback(
    (open: boolean, returnFocus = false) => {
      setMobileOpen(open);
      if (!open) {
        setPreviewMeta(null);
        if (mobilePanelRef.current) {
          mobilePanelRef.current.style.transform = "";
        }
        if (returnFocus) {
          window.requestAnimationFrame(() => {
            mobileToggleBtnRef.current?.focus();
          });
        }
      }
    },
    []
  );

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
    setMobileMenuState(false, false);
    closeDropdown(false);
  }, [pathname, setMobileMenuState, closeDropdown]);

  // Trigger optical lens droplet inflation & glide when active tab changes
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
      }, 360);
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
          setMobileMenuState(false, true);
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
      if (
        mobileOpen &&
        mobilePanelRef.current &&
        !mobilePanelRef.current.contains(e.target as Node)
      ) {
        setMobileMenuState(false, false);
      }
    };

    const handleResize = () => {
      if (mobileOpen && window.innerWidth >= 1024) {
        setMobileMenuState(false, false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDownOutside);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDownOutside);
      window.removeEventListener("resize", handleResize);
    };
  }, [archiveOpen, mobileOpen, closeDropdown, setMobileMenuState]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // Size the open panel to its real content height (no dead space); CSS caps it to the viewport
  useIsomorphicLayoutEffect(() => {
    const inner = mobileInnerRef.current;
    const panel = mobilePanelRef.current;
    if (!inner || !panel || typeof ResizeObserver === "undefined") return;
    const sync = () => {
      panel.style.setProperty("--menu-open-h", `${Math.ceil(inner.offsetHeight)}px`);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(inner);
    document.fonts?.ready.then(sync).catch(() => {});
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (glideTimerRef.current) window.clearTimeout(glideTimerRef.current);
      if (pendingTimerRef.current) window.clearTimeout(pendingTimerRef.current);
      if (dropdownTimerRef.current) window.clearTimeout(dropdownTimerRef.current);
      if (dropdownRafRef.current) window.cancelAnimationFrame(dropdownRafRef.current);
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

  const handleMobilePanelPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (
      !mobileOpen ||
      reducedMotion ||
      e.pointerType === "touch" ||
      window.innerWidth < 768 ||
      !mobilePanelRef.current
    ) {
      return;
    }
    const rect = mobilePanelRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mobilePanelRef.current.style.transform = `perspective(1000px) rotateY(${(x * 3).toFixed(2)}deg) rotateX(${(-y * 3).toFixed(2)}deg)`;
  };

  const handleMobilePanelPointerLeave = () => {
    if (mobilePanelRef.current) {
      mobilePanelRef.current.style.transform = "";
    }
  };

  const bubbleTransform = isGliding
    ? `scale(${glide.sx}, ${glide.sy})`
    : isCapsulePressed
      ? "scale(1.08, 1.38)"
      : "scale(1, 1)";

  return (
    <>
      <header className="fixed top-4 sm:top-5 left-0 right-0 z-40 lg:z-50 px-4 sm:px-6 lg:px-8 pointer-events-none">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between xl:grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 sm:gap-4 lg:gap-4 xl:gap-6">
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
              className="h-9 lg:h-10 xl:h-[52px] w-auto object-contain object-left select-none drop-shadow-[0_2px_8px_rgba(4,7,14,0.75)]"
            />
          </Link>

          {/* Center Zone: Desktop Optical Glass Lens Tab Bar (lg+) */}
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
              className={`flex items-center relative overflow-visible rounded-full liquid-glass-pill liquid-glass-pill--refract p-1.5 xl:p-2 gap-0.5 xl:gap-1 ${
                scrolled ? "liquid-glass-pill--scrolled" : ""
              } ${archiveOpen ? "liquid-glass-pill--dropdown-open" : ""}`}
            >
              <GlassSurface
                layer
                distortionScale={-115}
                displace={0.85}
                blur={14}
                backgroundOpacity={scrolled ? 0.32 : 0.16}
                tint="rgba(10, 15, 28, 0.36)"
                saturation={1.4}
              />

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

              {/* Gliding Optical Magnifier Glass Droplet (bulges beyond track while moving) */}
              {indicator.visible && (
                <span
                  aria-hidden="true"
                  className={`absolute top-1.5 xl:top-2 bottom-1.5 xl:bottom-2 left-0 z-[6] pointer-events-none liquid-glass-nav-track-pos ${
                    !indicatorReady ? "liquid-glass-nav-track-pos--instant" : ""
                  }`}
                  style={{
                    width: `${indicator.width}px`,
                    transform: `translate3d(${indicator.left}px, 0, 0)`,
                  }}
                >
                  <span
                    className={`block w-full h-full rounded-full liquid-glass-nav-capsule relative ${
                      !indicatorReady ? "liquid-glass-nav-capsule--instant" : ""
                    } ${isGliding ? "liquid-glass-nav-capsule--gliding" : ""} ${
                      isCapsulePressed ? "liquid-glass-nav-capsule--pressed" : ""
                    }`}
                    style={{
                      transform: bubbleTransform,
                    }}
                  />
                </span>
              )}

              {primaryLinks.map((link) => {
                const isActive = activeKey === link.href;
                const TabIcon = link.Icon;
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
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
                        return;
                      }
                      triggerTabClick(link.href);
                    }}
                    className={`liquid-glass-tab-item group relative z-10 px-2.5 xl:px-4 2xl:px-5 py-2 rounded-full text-[12px] xl:text-[13px] font-nav whitespace-nowrap min-h-[40px] xl:min-h-[44px] inline-flex items-center gap-1.5 select-none ${
                      isActive
                        ? indicator.visible
                          ? "text-white liquid-glass-tab-item--active"
                          : "text-white liquid-glass-nav-capsule liquid-glass-tab-item--active"
                        : "text-slate-200/80 hover:text-white"
                    }`}
                  >
                    <TabIcon
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isActive
                          ? "scale-110 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]"
                          : "opacity-75 group-hover:opacity-100 group-hover:scale-105"
                      }`}
                      strokeWidth={isActive ? 2.15 : 1.75}
                      aria-hidden="true"
                    />
                    <span>{link.label}</span>
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
                className={`liquid-glass-tab-item group relative z-10 px-2.5 xl:px-4 2xl:px-5 py-2 rounded-full text-[12px] xl:text-[13px] font-nav whitespace-nowrap min-h-[40px] xl:min-h-[44px] inline-flex items-center gap-1.5 select-none ${
                  activeKey === "__archive__"
                    ? indicator.visible
                      ? "text-white liquid-glass-tab-item--active"
                      : "text-white liquid-glass-nav-capsule liquid-glass-tab-item--active"
                    : archiveOpen
                      ? "text-white liquid-glass-trigger-open liquid-glass-tab-item--active"
                      : "text-slate-200/80 hover:text-white"
                }`}
              >
                <Layers
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    activeKey === "__archive__"
                      ? "scale-110 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.45)]"
                      : "opacity-75 group-hover:opacity-100 group-hover:scale-105"
                  }`}
                  strokeWidth={activeKey === "__archive__" ? 2.15 : 1.75}
                  aria-hidden="true"
                />
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
                <GlassSurface
                  layer
                  borderRadius={24}
                  distortionScale={-105}
                  displace={0.9}
                  blur={15}
                  backgroundOpacity={0.26}
                  tint="rgba(10, 15, 28, 0.52)"
                  saturation={1.4}
                />
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
                        onClick={(e) => {
                          if (
                            !e.metaKey &&
                            !e.ctrlKey &&
                            !e.shiftKey &&
                            !e.altKey &&
                            e.button === 0
                          ) {
                            triggerTabClick("__archive__");
                          } else {
                            closeDropdown(false);
                          }
                        }}
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

          {/* Right Zone: Tablet/Desktop HUD & Launch CTA (leaves space on sm–md for fixed top-right Menu pill) */}
          <div
            className={`justify-self-end flex items-center gap-1.5 sm:gap-2.5 shrink-0 pointer-events-auto pr-[124px] sm:pr-[126px] lg:pr-0 transition-opacity duration-200 ${
              mobileOpen
                ? "sm:opacity-0 sm:pointer-events-none lg:opacity-100 lg:pointer-events-auto"
                : ""
            }`}
          >
            <button
              type="button"
              onClick={toggleHudMode}
              aria-pressed={hudMode}
              title="Toggle Telemetry HUD Overlay"
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 xl:px-3 min-h-[40px] rounded-full font-mission text-[11px] uppercase tracking-wider transition-all ${
                hudMode
                  ? "bg-cyan-400/20 text-cyan-200 border border-cyan-300/50 shadow-[0_0_18px_rgba(56,189,248,0.3)]"
                  : "liquid-glass-tab text-slate-300 hover:text-white"
              }`}
            >
              <span
                aria-hidden="true"
                className={`w-1.5 h-1.5 rounded-full ${
                  hudMode ? "bg-cyan-300 shadow-[0_0_8px_#38bdf8]" : "bg-slate-400"
                }`}
              />
              <span>HUD</span>
            </button>

            <LiquidGlassButton
              href="https://phobosia.sim623.site/"
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              size="md"
              wrapClassName="hidden sm:inline-flex"
              contentClassName="px-4 xl:px-6 min-h-[40px] sm:min-h-[44px] xl:min-h-[54px] text-xs xl:text-[13px] font-btn tracking-tight"
            >
              <span>Launch 3D</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </LiquidGlassButton>
          </div>
        </div>
      </header>

      {/* Reserve clean top clearance on inner documentation pages */}
      {pathname !== "/" && <div aria-hidden="true" className="h-20 sm:h-24" />}

      {/* Mobile Backdrop Scrim (< lg) */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        aria-label="Close mobile navigation menu"
        onClick={() => setMobileMenuState(false, true)}
        className={`fixed inset-0 z-[45] lg:hidden bg-space-950/55 backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto cursor-default" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Mobile Liquid-Glass Morphing Menu Container (Top-Right Origin, < lg) */}
      <nav
        id="glass-menu"
        ref={mobilePanelRef}
        aria-label="Mobile Navigation"
        onClick={() => {
          if (!mobileOpen) setMobileMenuState(true);
        }}
        onPointerMove={handleMobilePanelPointerMove}
        onPointerLeave={handleMobilePanelPointerLeave}
        className={`mobile-glass-panel lg:hidden z-50 ${
          mobileOpen ? "is-open" : "is-closed"
        }`}
      >
        {/* Scroll viewport (only scrolls on very short screens) */}
        <div
          id="mobile-menu-content"
          aria-hidden={!mobileOpen}
          className="mobile-glass-content"
        >
          {/* Natural-height inner column: measured to size the open panel */}
          <div
            ref={mobileInnerRef}
            className="mobile-glass-inner"
            onPointerLeave={() => setPreviewMeta(null)}
          >
            {/* Header: site wordmark (toggle button is pinned over the right side) */}
            <div className="mobile-glass-header">
              <Link
                href="/"
                aria-label="PHOBOSIA Home"
                tabIndex={mobileOpen ? undefined : -1}
                onClick={() => setMobileMenuState(false, false)}
                className="inline-flex items-center -ml-1 py-1 rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
              >
                <Image
                  src="/phobosia-logo.webp"
                  alt="PHOBOSIA"
                  width={1600}
                  height={533}
                  className="h-8 w-auto object-contain object-left select-none"
                />
              </Link>
            </div>

            {/* Primary Links */}
            <ul className="flex flex-col gap-0.5">
              {primaryLinks.map((link, idx) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <li key={link.href} className="mobile-reveal-mask">
                    <div
                      className="mobile-reveal-item"
                      style={
                        {
                          "--reveal-delay": `${0.08 + idx * 0.035}s`,
                        } as React.CSSProperties
                      }
                    >
                      <Link
                        href={link.href}
                        tabIndex={mobileOpen ? undefined : -1}
                        aria-current={isActive ? "page" : undefined}
                        onPointerEnter={(e) => {
                          if (e.pointerType !== "touch") {
                            setPreviewMeta({ index: link.index, tagline: link.tagline });
                          }
                        }}
                        onFocus={() =>
                          setPreviewMeta({ index: link.index, tagline: link.tagline })
                        }
                        onBlur={() => setPreviewMeta(null)}
                        onClick={() => setMobileMenuState(false, false)}
                        className={`mobile-nav-link text-[26px] sm:text-[29px] font-normal tracking-[-0.025em] leading-[1.22] py-[3px] rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 ${
                          isActive ? "active" : ""
                        }`}
                      >
                        <span className="mobile-nav-dash" aria-hidden="true" />
                        <span>{link.label}</span>
                        <span className="mobile-nav-dot" aria-hidden="true" />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mobile-glass-divider" aria-hidden="true" />

            {/* Dossier Routes */}
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[14px] font-normal">
              {archiveLinks.map((item, idx) => {
                const isSubActive = pathname.startsWith(item.href);
                return (
                  <li key={item.href} className="mobile-reveal-mask">
                    <div
                      className="mobile-reveal-item"
                      style={
                        {
                          "--reveal-delay": `${0.3 + Math.floor(idx / 2) * 0.035}s`,
                        } as React.CSSProperties
                      }
                    >
                      <Link
                        href={item.href}
                        tabIndex={mobileOpen ? undefined : -1}
                        aria-current={isSubActive ? "page" : undefined}
                        onPointerEnter={(e) => {
                          if (e.pointerType !== "touch") {
                            setPreviewMeta({ index: item.index, tagline: item.tagline });
                          }
                        }}
                        onFocus={() =>
                          setPreviewMeta({ index: item.index, tagline: item.tagline })
                        }
                        onBlur={() => setPreviewMeta(null)}
                        onClick={() => setMobileMenuState(false, false)}
                        className={`inline-flex items-center gap-1.5 py-1 rounded transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 ${
                          isSubActive ? "text-white font-medium" : "text-white/70 hover:text-white"
                        }`}
                      >
                        {isSubActive && (
                          <span
                            aria-hidden="true"
                            className="w-1.5 h-1.5 rounded-full bg-mars-300 shrink-0"
                          />
                        )}
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mobile-glass-divider" aria-hidden="true" />

            {/* Actions: primary launch button + GitHub */}
            <div
              className="mobile-reveal-item flex items-center gap-4"
              style={{ "--reveal-delay": "0.38s" } as React.CSSProperties}
            >
              <LiquidGlassButton
                href="https://phobosia.sim623.site/"
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                size="sm"
                magnetic={false}
                tabIndex={mobileOpen ? undefined : -1}
                onClick={() => setMobileMenuState(false, false)}
                contentClassName="px-4 min-h-[40px] text-[13px] font-btn"
              >
                <span>Launch 3D Outpost</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </LiquidGlassButton>
              <a
                href="https://github.com/osa623/Phobosia-Martian-exploration-experience-powered-by-NASA-Data"
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={mobileOpen ? undefined : -1}
                onClick={() => setMobileMenuState(false, false)}
                className="inline-flex items-center gap-1 min-h-[40px] text-[13px] text-white/75 hover:text-white transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
              >
                <span>GitHub</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>

            {/* Metadata row: route index + tagline, HUD toggle */}
            <div
              className="mobile-reveal-item flex items-center justify-between gap-3"
              style={{ "--reveal-delay": "0.42s" } as React.CSSProperties}
            >
              <div className="flex items-center gap-2.5 min-w-0 text-[12px] tracking-wide">
                <span className="font-mono text-white/45 shrink-0 tabular-nums">
                  <span className="text-white/90">{displayMeta.index}</span> /{" "}
                  {String(allLinks.length).padStart(2, "0")}
                </span>
                <span className="text-white/60 truncate">{displayMeta.tagline}</span>
              </div>
              <button
                type="button"
                tabIndex={mobileOpen ? undefined : -1}
                onClick={toggleHudMode}
                aria-pressed={hudMode}
                className={`shrink-0 inline-flex items-center gap-1.5 font-mission text-[11px] uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 ${
                  hudMode
                    ? "bg-cyan-400/20 text-cyan-200 border-cyan-300/45"
                    : "bg-white/[0.06] text-white/70 border-white/15 hover:text-white"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`w-1.5 h-1.5 rounded-full ${
                    hudMode ? "bg-cyan-300 shadow-[0_0_6px_#38bdf8]" : "bg-white/45"
                  }`}
                />
                <span>HUD</span>
              </button>
            </div>
          </div>
        </div>

        {/* Toggle: pinned top-right in both states, hamburger morphs into an X */}
        <button
          ref={mobileToggleBtnRef}
          type="button"
          id="toggle-menu-btn"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu-content"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={(e) => {
            e.stopPropagation();
            setMobileMenuState(!mobileOpen, mobileOpen);
          }}
          className="mobile-pill-btn font-nav font-medium text-[13.5px] tracking-wide cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80"
        >
          <span className="menu-icon" aria-hidden="true">
            <span className="menu-icon-bar" />
            <span className="menu-icon-bar" />
          </span>
          <span className="mobile-btn-label-wrapper" aria-hidden="true">
            <span className="mobile-btn-label mobile-btn-label-menu">Menu</span>
            <span className="mobile-btn-label mobile-btn-label-close">Close</span>
          </span>
        </button>
      </nav>
    </>
  );
}
