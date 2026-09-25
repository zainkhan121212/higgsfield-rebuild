"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// The product's thesis as an interaction: a prompt that *is* the picture.
// An image is sampled to a grid; at each cell we draw one character of the
// prompt in that pixel's colour. The pointer pushes letters away; a spring
// pulls them home.
//
// Performance notes (this runs on a marketing page, so it has to be cheap):
//   · one font for the whole canvas — setting ctx.font per glyph is the
//     single most expensive thing you can do in a 2D canvas loop
//   · colours are quantised into buckets so fillStyle changes ~100 times a
//     frame instead of ~3000
//   · the loop parks itself when nothing is moving and wakes on pointermove
//   · reduced motion / no hover → draw once, never animate

type P = { x: number; y: number; hx: number; hy: number; vx: number; vy: number; ch: string };
type Bucket = { color: string; items: P[] };

export function PromptImage({
  src,
  prompt,
  className,
  cell = 10,
  radius = 120,
  force = 2.6,
  palette = "image",
  ink = "17,17,17",
}: {
  src: string;
  prompt: string;
  className?: string;
  /** grid spacing in CSS px — smaller = more letters, heavier */
  cell?: number;
  /** pointer influence radius in CSS px */
  radius?: number;
  force?: number;
  /** "image" keeps each pixel's colour; "ink" prints the picture in one
   *  colour on a light ground, the way type on paper reads. */
  palette?: "image" | "ink";
  /** rgb triple used by the "ink" palette */
  ink?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const still =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(hover: hover)").matches;

    let buckets: Bucket[] = [];
    let all: P[] = [];
    let font = "10px ui-monospace, monospace";
    let raf = 0;
    let running = false;
    let stopped = false;
    let dpr = 1;
    let w = 0;
    let h = 0;
    const pointer = { x: -9999, y: -9999, active: false };
    const letters = prompt.replace(/\s+/g, " ").trim() || "prompt";

    function build(img: HTMLImageElement) {
      const rect = wrap!.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;

      const cols = Math.max(1, Math.floor(w / cell));
      const rows = Math.max(1, Math.floor(h / cell));
      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rows;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      // cover-crop the source into the grid
      const scale = Math.max(cols / img.width, rows / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      octx.drawImage(img, (cols - dw) / 2, (rows - dh) / 2, dw, dh);
      const data = octx.getImageData(0, 0, cols, rows).data;

      const map = new Map<number, Bucket>();
      const flat: P[] = [];
      let li = 0;
      for (let ry = 0; ry < rows; ry++) {
        for (let rx = 0; rx < cols; rx++) {
          const i = (ry * cols + rx) * 4;
          let r = data[i], g = data[i + 1], b = data[i + 2];
          const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          let key: number;
          let color: string;
          if (palette === "ink") {
            // Darkness becomes ink. Light areas are left as paper.
            const depth = 1 - lum;
            if (depth < 0.3) continue;
            const level = Math.min(9, Math.max(1, Math.round(depth * 9)));
            key = 1000 + level;
            color = `rgba(${ink},${(level / 9).toFixed(2)})`;
          } else {
            if (lum < 0.1) continue; // darkest areas stay as negative space
            // Lift a little so the picture still reads as type.
            r = Math.min(255, r * 1.25 + 26);
            g = Math.min(255, g * 1.25 + 26);
            b = Math.min(255, b * 1.25 + 26);
            // 5 bits per channel keeps the palette small enough to batch.
            key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
            color = `rgb(${r & 0xf8},${g & 0xf8},${b & 0xf8})`;
          }
          let ch = letters[li % letters.length];
          li++;
          if (ch === " ") ch = "·";
          const p: P = {
            x: rx * cell + cell / 2,
            y: ry * cell + cell / 2,
            hx: rx * cell + cell / 2,
            hy: ry * cell + cell / 2,
            vx: 0,
            vy: 0,
            ch,
          };
          flat.push(p);
          let bucket = map.get(key);
          if (!bucket) {
            bucket = { color, items: [] };
            map.set(key, bucket);
          }
          bucket.items.push(p);
        }
      }
      all = flat;
      buckets = [...map.values()];
      font = `${Math.round(cell * 0.95)}px ui-monospace, "SFMono-Regular", Menlo, monospace`;
    }

    function step() {
      let energy = 0;
      const r2 = radius * radius;
      for (const p of all) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (pointer.active && d2 < r2) {
          const d = Math.sqrt(d2) || 1;
          const push = (1 - d / radius) * force;
          p.vx += (dx / d) * push;
          p.vy += (dy / d) * push;
        }
        p.vx += (p.hx - p.x) * 0.05;
        p.vy += (p.hy - p.y) * 0.05;
        p.vx *= 0.85;
        p.vy *= 0.85;
        p.x += p.vx;
        p.y += p.vy;
        energy += Math.abs(p.vx) + Math.abs(p.vy);
      }
      return energy;
    }

    function paint() {
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const b of buckets) {
        ctx.fillStyle = b.color;
        for (const p of b.items) ctx.fillText(p.ch, p.x, p.y);
      }
    }

    function frame() {
      const energy = step();
      paint();
      // Park the loop once everything has settled; pointermove wakes it.
      if (!pointer.active && energy < all.length * 0.01) {
        running = false;
        return;
      }
      if (!stopped) raf = requestAnimationFrame(frame);
    }

    function wake() {
      if (still || running || stopped) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }

    // Same-origin proxy: canvas pixel reads stay untainted, and the slow,
    // rate-limited generation CDNs get cached behind us.
    const proxied = src.startsWith("http") ? `/api/img?src=${encodeURIComponent(src)}` : src;
    const img = new Image();
    let tries = 0;
    img.onload = () => {
      build(img);
      paint();
    };
    img.onerror = () => {
      if (++tries > 3) return;
      setTimeout(() => {
        img.src = `${proxied}${proxied.includes("?") ? "&" : "?"}r=${tries}`;
      }, 1500 * tries);
    };
    img.src = proxied;

    function onMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
      wake();
    }
    function onLeave() {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
      wake();
    }
    const onResize = () => {
      if (img.complete && img.naturalWidth) {
        build(img);
        paint();
      }
    };

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, [src, prompt, cell, radius, force, palette, ink]);

  return (
    <div ref={wrapRef} className={cn("relative touch-none select-none", className)}>
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden />
      <span className="sr-only">{prompt}</span>
    </div>
  );
}
