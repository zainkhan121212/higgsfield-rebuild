"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// Reveal on first sight. The class is added by an observer rather than baked
// into the markup, so with JS off (or for a crawler) everything is already
// visible — .reveal only hides once this has had a chance to run.
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  /** seconds */
  delay?: number;
  as?: "div" | "section" | "figure" | "li";
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("in");
      return;
    }
    el.classList.add("reveal");
    if (delay) el.style.transitionDelay = `${delay}s`;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    // @ts-expect-error -- one of a fixed set of tags, all of them HTMLElement
    <Tag ref={ref} className={cn(className)}>
      {children}
    </Tag>
  );
}
