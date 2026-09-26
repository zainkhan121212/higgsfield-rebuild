"use client";

import { useEffect, useRef, type CSSProperties, type ElementType } from "react";

/**
 * A headline set in loose type: every letter is its own span on a spring,
 * pushed by the cursor and pulled home. Lines can carry their own class
 * (for an italic line). Reads normally for assistive tech (aria-label).
 */
export function LooseType({
  lines,
  className,
  as: Tag = "h2",
  radius = 150,
  force = 3,
  label,
  enter = false,
}: {
  lines: { text: string; className?: string }[];
  className?: string;
  as?: ElementType;
  radius?: number;
  force?: number;
  label?: string;
  /** letters drop into place one after another on first paint */
  enter?: boolean;
}) {
  const wrap = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = wrap.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(hover: hover)").matches) return;
    const spans = Array.from(root.querySelectorAll<HTMLSpanElement>("[data-l]"));
    const st = spans.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, cx: 0, cy: 0 }));
    let px = -1e5, py = -1e5, raf = 0;
    const home = () =>
      spans.forEach((s, i) => {
        const b = s.getBoundingClientRect();
        st[i].cx = b.left + b.width / 2 - st[i].x + scrollX;
        st[i].cy = b.top + b.height / 2 - st[i].y + scrollY;
      });
    const loop = () => {
      raf = 0;
      let e = 0;
      for (let i = 0; i < spans.length; i++) {
        const p = st[i];
        const x = p.cx + p.x - scrollX - px;
        const y = p.cy + p.y - scrollY - py;
        const d = Math.hypot(x, y) || 1;
        if (d < radius) {
          const f = (1 - d / radius) * force;
          p.vx += (x / d) * f;
          p.vy += (y / d) * f;
        }
        p.vx = (p.vx - p.x * 0.07) * 0.83;
        p.vy = (p.vy - p.y * 0.07) * 0.83;
        p.x += p.vx;
        p.y += p.vy;
        e += Math.abs(p.vx) + Math.abs(p.vy) + Math.abs(p.x) * 0.02 + Math.abs(p.y) * 0.02;
        spans[i].style.transform = `translate3d(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px,0) rotate(${(p.vx * 1.4).toFixed(2)}deg)`;
      }
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
  }, [radius, force]);

  const text = label ?? lines.map((l) => l.text).join(" ");
  let n = 0;
  return (
    <Tag ref={wrap} className={`${className ?? ""} ${enter ? "set-in" : ""}`} aria-label={text}>
      {lines.map((l, li) => (
        <span key={li} className={`block ${l.className ?? ""}`} aria-hidden>
          {Array.from(l.text).map((c, i) =>
            c === " " ? (
              <span key={i}> </span>
            ) : (
              <span key={i} data-l className="inline-block will-change-transform" style={enter ? ({ "--i": n++ } as CSSProperties) : undefined}>
                {c}
              </span>
            ),
          )}
        </span>
      ))}
    </Tag>
  );
}
