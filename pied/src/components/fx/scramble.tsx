"use client";

import { useEffect, useRef, type ElementType } from "react";

const POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+=/<>";

/**
 * Text that composes itself: letters shuffle through the type case and lock
 * into place left to right, when it scrolls into view and again on hover.
 */
export function Scramble({ text, as: Tag = "span", className }: { text: string; as?: ElementType; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      const start = performance.now();
      const dur = 380 + text.length * 18;
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / dur);
        const fixed = Math.floor(p * text.length);
        let out = "";
        for (let i = 0; i < text.length; i++) out += i < fixed || text[i] === " " ? text[i] : POOL[Math.floor(Math.random() * POOL.length)];
        el.textContent = out;
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        run();
        io.disconnect();
      }
    });
    io.observe(el);
    const hover = el.closest("a, button") ?? el;
    hover.addEventListener("pointerenter", run);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      hover.removeEventListener("pointerenter", run);
      el.textContent = text;
    };
  }, [text]);
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {text}
    </Tag>
  );
}
