"use client";

import { useRef, type ReactNode } from "react";
import { useScrollProgress } from "@/lib/scroll";
import { cn } from "@/lib/utils";

/**
 * A section that arrives like a plate being pressed: it starts inset with
 * rounded corners and opens to the full page as it scrolls in.
 */
export function PressIn({ children, className, ...rest }: { children: ReactNode; className?: string; "data-section"?: string; id?: string }) {
  const ref = useRef<HTMLElement>(null);
  useScrollProgress(ref, (_p, r) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 0.9)));
    const e = 1 - Math.pow(1 - t, 3);
    const side = (1 - e) * 6;
    el.style.clipPath = `inset(0 ${side}% round ${(1 - e) * 28}px)`;
  });
  return (
    <section ref={ref} className={cn("will-change-[clip-path]", className)} {...rest}>
      {children}
    </section>
  );
}
