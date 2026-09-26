"use client";

import { useEffect, useRef } from "react";

// Loose type follows the cursor: every few pixels of movement sheds a letter
// that tumbles, falls and fades; a click spills a handful at once. One
// canvas over the page, drawn in difference so it reads on paper and in the
// dark room alike. The loop sleeps when no letter is in the air.
const WORDS = "PIED·TYPE·SET·LOOSE·INK·PAPER·";

type Bit = { x: number; y: number; vx: number; vy: number; r: number; vr: number; life: number; ch: string; size: number };

export function TypeTrail() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = c.getContext("2d")!;
    const bits: Bit[] = [];
    let raf = 0;
    let dpr = 1;
    let lx = -1, ly = -1, dist = 0, li = 0;
    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = innerWidth * dpr;
      c.height = innerHeight * dpr;
    };
    size();
    const spawn = (x: number, y: number, vx: number, vy: number, big = false) => {
      if (bits.length > 220) bits.shift();
      bits.push({ x, y, vx, vy, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, life: 1, ch: WORDS[li++ % WORDS.length], size: big ? 14 + Math.random() * 16 : 10 + Math.random() * 5 });
      if (!raf) raf = requestAnimationFrame(loop);
    };
    function loop() {
      raf = 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        b.vy += 0.18;
        b.vx *= 0.985;
        b.x += b.vx;
        b.y += b.vy;
        b.r += b.vr;
        b.life -= 0.012;
        if (b.life <= 0 || b.y > innerHeight + 40) {
          bits.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.min(1, b.life * 1.4);
        ctx.translate(b.x, b.y);
        ctx.rotate(b.r);
        ctx.font = `700 ${b.size}px "Courier Prime", "Courier New", monospace`;
        ctx.fillText(b.ch, 0, 0);
        ctx.restore();
      }
      if (bits.length) raf = requestAnimationFrame(loop);
    }
    const move = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest?.("canvas, input, textarea, [data-no-trail]")) {
        lx = -1;
        return;
      }
      if (lx < 0) {
        lx = e.clientX;
        ly = e.clientY;
        return;
      }
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      dist += Math.hypot(dx, dy);
      lx = e.clientX;
      ly = e.clientY;
      if (dist > 26) {
        dist = 0;
        spawn(e.clientX, e.clientY, dx * 0.08 + (Math.random() - 0.5), dy * 0.05 - 1.2);
      }
    };
    const click = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest?.("canvas, input, textarea, a, button, label, [data-no-trail]")) return;
      for (let k = 0; k < 16; k++) {
        const a = Math.random() * Math.PI * 2;
        const s = 2 + Math.random() * 5;
        spawn(e.clientX, e.clientY, Math.cos(a) * s, Math.sin(a) * s - 3, true);
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", click, { passive: true });
    window.addEventListener("resize", size);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", click);
      window.removeEventListener("resize", size);
    };
  }, []);
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[65] h-full w-full mix-blend-difference" />;
}
