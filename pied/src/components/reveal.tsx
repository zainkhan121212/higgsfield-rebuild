"use client";

import { useEffect, useRef, type ElementType, type ReactNode, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Adds `in` once the element scrolls into view; CSS does the rest. */
export function useInView<T extends Element>(threshold = 0.2, once = true) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            if (once) io.unobserve(e.target);
          } else if (!once) e.target.classList.remove("in");
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);
  return ref;
}

export function Reveal({
  as: Tag = "div",
  className,
  delay = 0,
  children,
  style,
}: {
  as?: ElementType;
  className?: string;
  delay?: number;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const ref = useInView<HTMLElement>();
  return (
    <Tag ref={ref} className={cn("reveal", className)} style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </Tag>
  );
}

/** A headline whose lines rise into place one after another. */
export function Lines({ lines, className, as: Tag = "h2", stagger = 110 }: { lines: ReactNode[]; className?: string; as?: ElementType; stagger?: number }) {
  const ref = useInView<HTMLElement>(0.3);
  return (
    <Tag ref={ref} className={className}>
      {lines.map((l, i) => (
        <span key={i} className="line-mask">
          <span style={{ transitionDelay: `${i * stagger}ms` }}>{l}</span>
        </span>
      ))}
    </Tag>
  );
}
