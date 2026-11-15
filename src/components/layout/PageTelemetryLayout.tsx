"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { RailToc, type RailTocItem } from "@/components/ui/RailToc";
import {
  ScrollProgress,
  type ScrollProgressSection,
} from "@/components/ui/ScrollProgress";

export type PageTelemetryLayoutProps = {
  items: RailTocItem[];
  tocTitle?: string;
  offset?: number;
  mobileSections?: ScrollProgressSection[];
  children: React.ReactNode;
  className?: string;
};

/**
 * Provides desktop sticky hierarchical vector-rail navigation (`RailToc` on xl+)
 * and compact bottom floating morphing navigation (`ScrollProgress` below xl)
 * without wrapping RSC page content in client-only boundaries.
 */
export function PageTelemetryLayout({
  items,
  tocTitle = "Telemetry Index",
  offset = 112,
  mobileSections,
  children,
  className,
}: PageTelemetryLayoutProps) {
  const derivedMobileSections = React.useMemo<ScrollProgressSection[]>(() => {
    if (mobileSections && mobileSections.length > 0) return mobileSections;
    const base =
      items.length > 8 ? items.filter((item) => !item.depth) : items;
    return base.map((item) => ({
      id: item.id,
      label: item.label,
      scrollOffset: item.scrollOffset,
    }));
  }, [items, mobileSections]);

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_248px] gap-10 xl:gap-12 items-start",
          className
        )}
      >
        <div className="min-w-0">{children}</div>

        <aside
          aria-label={tocTitle}
          className="hidden xl:block sticky top-28 self-start"
        >
          <RailToc items={items} title={tocTitle} offset={offset} />
        </aside>
      </div>

      <ScrollProgress
        sections={derivedMobileSections}
        offset={offset}
        className="xl:hidden"
      />
    </>
  );
}
