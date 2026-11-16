type ScrollListener = (progress: number, scrollVersion: number) => void;

const listeners = new Set<ScrollListener>();

let cachedMaxScroll = 1;
let cachedProgress = 0;
let scrollVersion = 0;
let teardownFns: (() => void) | null = null;

function updateMaxScroll() {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  cachedMaxScroll = Math.max(
    document.documentElement.scrollHeight - window.innerHeight,
    1
  );
  cachedProgress = Math.min(Math.max(window.scrollY / cachedMaxScroll, 0), 1);
}

let scrollRaf = 0;

function handleScroll() {
  if (scrollRaf) return;
  scrollRaf = window.requestAnimationFrame(() => {
    scrollRaf = 0;
    scrollVersion += 1;
    cachedProgress = Math.min(Math.max(window.scrollY / cachedMaxScroll, 0), 1);
    for (const listener of listeners) {
      listener(cachedProgress, scrollVersion);
    }
  });
}

function handleResize() {
  scrollVersion += 1;
  updateMaxScroll();
  for (const listener of listeners) {
    listener(cachedProgress, scrollVersion);
  }
}

function ensureAttached() {
  if (teardownFns || typeof window === "undefined") return;
  updateMaxScroll();

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleResize, { passive: true });

  let resizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(document.documentElement);
  }

  teardownFns = () => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("resize", handleResize);
    resizeObserver?.disconnect();
    teardownFns = null;
  };
}

export function getScrollProgress(): number {
  if (typeof window === "undefined") return 0;
  if (!teardownFns) updateMaxScroll();
  return cachedProgress;
}

export function getScrollVersion(): number {
  return scrollVersion;
}

export function subscribeScrollProgress(listener: ScrollListener): () => void {
  ensureAttached();
  listeners.add(listener);
  listener(cachedProgress, scrollVersion);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && teardownFns) {
      teardownFns();
    }
  };
}
