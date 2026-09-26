"use client";

import { useEffect, useRef } from "react";

// A proof-reader's ring that trails the pointer. It sits on top of the
// system cursor rather than replacing it, grows over anything clickable and
// can carry a one-word caption (data-cursor="play"). Touch devices never
// see it.
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const cap = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = ring.current!;
    const label = cap.current!;
    let x = -100, y = -100, tx = -100, ty = -100, raf = 0, scale = 1, ts = 1;
    let shown = false;
    const loop = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      scale += (ts - scale) * 0.18;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(ts - scale) > 0.05 ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!shown) {
        shown = true;
        x = tx;
        y = ty;
        el.style.opacity = "1";
      }
      const t = (e.target as Element | null)?.closest?.("a, button, [data-cursor], label, input, textarea, select");
      const word = t?.getAttribute("data-cursor");
      if (word === "none") {
        el.style.opacity = "0";
      } else {
        el.style.opacity = "1";
        ts = word ? 2.6 : t ? 1.7 : 1;
        label.textContent = word ?? "";
      }
      kick();
    };
    const leave = () => {
      shown = false;
      el.style.opacity = "0";
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("mouseleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <div
      ref={ring}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[70] flex h-7 w-7 items-center justify-center rounded-full border border-white opacity-0 mix-blend-difference transition-opacity duration-300"
    >
      <span ref={cap} className="font-mono text-[4px] uppercase tracking-[0.2em] text-white" />
    </div>
  );
}
