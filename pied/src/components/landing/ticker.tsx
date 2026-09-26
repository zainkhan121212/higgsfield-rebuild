"use client";

import { useEffect, useRef } from "react";

const WORDS = ["Set", "Paint", "Scatter", "Keep"];

// Two lines of type running in opposite directions. Scrolling throws them:
// the speed follows the scroll velocity and the lines lean into it.
export function Ticker() {
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let x = 0;
    let v = 0;
    let lastY = window.scrollY;
    let skew = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });
    if (a.current) io.observe(a.current.parentElement!);
    function loop() {
      raf = 0;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      v += (dy * 0.6 - v) * 0.12;
      skew += (Math.max(-12, Math.min(12, v * 0.5)) - skew) * 0.15;
      x -= 0.6 + Math.abs(v) * 0.9;
      const wa = a.current?.scrollWidth ?? 1;
      const half = wa / 2;
      if (-x > half) x += half;
      if (a.current) a.current.style.transform = `translate3d(${x}px,0,0) skewX(${-skew}deg)`;
      if (b.current) b.current.style.transform = `translate3d(${-half - x}px,0,0) skewX(${skew}deg)`;
      if (visible) raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  const row = (outline: boolean) =>
    Array.from({ length: 4 }).flatMap((_, k) =>
      WORDS.map((w, i) => (
        <span key={`${k}-${i}`} className="flex items-center gap-[0.35em] pr-[0.35em]">
          <span className={(i + (outline ? 1 : 0)) % 2 ? "outline-paper" : ""}>{w}</span>
          <span className="font-serif text-[0.4em] italic">✺</span>
        </span>
      )),
    );

  return (
    <section aria-label="Set, paint, scatter, keep" className="overflow-hidden bg-night py-10 text-paper sm:py-14">
      <div ref={a} className="flex w-max whitespace-nowrap font-display text-[clamp(3.5rem,11vw,11rem)] leading-[0.95] will-change-transform">
        {row(false)}
      </div>
      <div ref={b} className="flex w-max whitespace-nowrap font-display text-[clamp(3.5rem,11vw,11rem)] leading-[0.95] will-change-transform">
        {row(true)}
      </div>
    </section>
  );
}
