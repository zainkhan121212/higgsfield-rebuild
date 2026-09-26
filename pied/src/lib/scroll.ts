"use client";

import { useEffect, type RefObject } from "react";

/**
 * Calls `fn` with how far an element has travelled through the viewport:
 * 0 when its top meets the bottom of the screen (or `start`), 1 when its
 * bottom meets the top. rAF-throttled, passive.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>, fn: (p: number, rect: DOMRect) => void, mode: "through" | "pinned" = "through") {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // "pinned": progress across the scroll distance of a sticky container
      const p = mode === "pinned" ? -r.top / Math.max(1, r.height - vh) : (vh - r.top) / (vh + r.height);
      fn(Math.min(1, Math.max(0, p)), r);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
    // fn is intentionally read fresh each frame by callers via refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, mode]);
}
