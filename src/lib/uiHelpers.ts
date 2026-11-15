import type React from "react";

/**
 * Shared WAI-ARIA horizontal tablist keyboard navigation (ArrowLeft/Right, Home/End).
 * Focuses the newly active [role="tab"] inside the nearest [role="tablist"].
 */
export function handleTabListKeyDown<T>(
  e: React.KeyboardEvent<HTMLElement>,
  items: readonly T[],
  currentIndex: number,
  onSelect: (item: T, nextIndex: number) => void
) {
  if (items.length === 0) return;
  let nextIndex = -1;

  if (e.key === "ArrowRight") {
    nextIndex = (currentIndex + 1) % items.length;
  } else if (e.key === "ArrowLeft") {
    nextIndex = (currentIndex - 1 + items.length) % items.length;
  } else if (e.key === "Home") {
    nextIndex = 0;
  } else if (e.key === "End") {
    nextIndex = items.length - 1;
  }

  if (nextIndex < 0) return;
  e.preventDefault();
  onSelect(items[nextIndex], nextIndex);

  const tablist = e.currentTarget.closest('[role="tablist"]');
  const tabs = tablist?.querySelectorAll<HTMLElement>('[role="tab"]');
  tabs?.[nextIndex]?.focus();
}

export function readQueryParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(key);
}

/**
 * Updates URL search parameters via replaceState without scrolling or losing hashes.
 */
export function syncQueryParams(updates: Record<string, string | null>) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let changed = false;

  for (const [key, value] of Object.entries(updates)) {
    const existing = url.searchParams.get(key);
    if (value === null || value === "") {
      if (existing !== null) {
        url.searchParams.delete(key);
        changed = true;
      }
    } else if (existing !== value) {
      url.searchParams.set(key, value);
      changed = true;
    }
  }

  if (changed) {
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }
}
