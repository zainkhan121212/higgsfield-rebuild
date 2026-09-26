"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { PressIn } from "../fx/press-in";
import { Magnetic } from "../fx/magnetic";

const LINES = ["Set", "something", "loose."];

// The closing line is itself loose type: each letter is a DOM span on a
// spring, pushed by the cursor, so the page ends the way it began.
export function Finale() {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = wrap.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const spans = Array.from(root.querySelectorAll<HTMLSpanElement>("[data-l]"));
    const st = spans.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, r: 0, cx: 0, cy: 0 }));
    let px = -1e5, py = -1e5, raf = 0;
    const home = () => {
      spans.forEach((s, i) => {
        const b = s.getBoundingClientRect();
        st[i].cx = b.left + b.width / 2 - st[i].x + window.scrollX;
        st[i].cy = b.top + b.height / 2 - st[i].y + window.scrollY;
      });
    };
    const loop = () => {
      raf = 0;
      let e = 0;
      const R = 170;
      spans.forEach((s, i) => {
        const p = st[i];
        const x = p.cx + p.x - window.scrollX - px;
        const y = p.cy + p.y - window.scrollY - py;
        const d = Math.hypot(x, y) || 1;
        if (d < R) {
          const f = (1 - d / R) * 3.2;
          p.vx += (x / d) * f;
          p.vy += (y / d) * f;
        }
        p.vx = (p.vx - p.x * 0.06) * 0.84;
        p.vy = (p.vy - p.y * 0.06) * 0.84;
        p.x += p.vx;
        p.y += p.vy;
        p.r = p.vx * 1.6;
        e += Math.abs(p.vx) + Math.abs(p.vy) + Math.abs(p.x) * 0.02;
        s.style.transform = `translate3d(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px,0) rotate(${p.r.toFixed(2)}deg)`;
      });
      if (e > 0.05) raf = requestAnimationFrame(loop);
    };
    const move = (ev: PointerEvent) => {
      px = ev.clientX;
      py = ev.clientY;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const leave = () => {
      px = py = -1e5;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    home();
    const ro = new ResizeObserver(home);
    ro.observe(root);
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <PressIn data-section="Colophon" className="relative overflow-hidden bg-night text-paper">
      <div ref={wrap} className="mx-auto max-w-[1600px] px-4 pb-16 pt-28 sm:px-8 sm:pt-40" data-cursor="push">
        <p className="label text-paper/50">§ 06 — Colophon</p>
        <h2 className="mt-8 font-display text-[clamp(4rem,15vw,16rem)] leading-[0.82] tracking-[-0.03em]" aria-label="Set something loose.">
          {LINES.map((w, li) => (
            <span key={li} className={li === 2 ? "block font-serif italic" : "block"} aria-hidden>
              {Array.from(w).map((c, i) => (
                <span key={i} data-l className="inline-block will-change-transform">
                  {c}
                </span>
              ))}
            </span>
          ))}
        </h2>
        <div className="mt-14 flex flex-wrap items-center justify-between gap-8">
          <Magnetic>
            <Link href="/make" className="label group inline-flex items-center gap-3 bg-paper px-6 py-4 text-ink">
              Open the press <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </Magnetic>
          <p className="max-w-sm font-serif text-paper/60">Free, in your browser. Your photographs are read on your own machine and never uploaded.</p>
        </div>
        <div className="mt-24 grid gap-4 border-t border-paper/15 pt-6 sm:grid-cols-3">
          <p className="label text-paper/40">Set in Libre Caslon &amp; Courier Prime</p>
          <p className="label text-paper/40 sm:text-center">Printed by canvas, 60 frames a second</p>
          <p className="label text-paper/40 sm:text-right">Pied · Vol. I · MMXXVI</p>
        </div>
      </div>
    </PressIn>
  );
}
