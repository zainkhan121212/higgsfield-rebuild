"use client";

import { useRef } from "react";
import { useScrollProgress } from "@/lib/scroll";

const ENTRY =
  "Type that has been spilled — knocked out of its forme and jumbled into a heap of loose letters, waiting to be set again. Printers dreaded it. We built a press that does it on purpose.";

// A dictionary entry that inks itself in as you scroll: each word goes from a
// ghost of grey to full black while the section is pinned.
export function Definition() {
  const wrap = useRef<HTMLElement>(null);
  const words = useRef<(HTMLSpanElement | null)[]>([]);
  const list = ENTRY.split(" ");

  useScrollProgress(
    wrap,
    (p) => {
      const n = list.length;
      const at = p * 1.25 * n;
      words.current.forEach((w, i) => {
        if (!w) return;
        const t = Math.min(1, Math.max(0, at - i));
        w.style.opacity = String(0.12 + 0.88 * t);
        w.style.filter = t < 1 ? `blur(${(1 - t) * 2}px)` : "none";
      });
    },
    "pinned",
  );

  return (
    <section ref={wrap} className="relative h-[240vh]">
      <div className="sticky top-0 flex h-svh items-center">
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-8">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <p className="font-display text-6xl leading-none sm:text-7xl">pie</p>
              <p className="mt-3 font-serif italic text-ink-2">
                also <span className="not-italic">pi</span> · /paɪ/
              </p>
              <p className="label mt-6 text-ink-3">noun · printing · 1650s</p>
            </div>
            <p className="font-display text-[clamp(1.9rem,4.1vw,4.4rem)] leading-[1.06] tracking-[-0.01em] lg:col-span-9">
              {list.map((w, i) => (
                <span key={i} ref={(el) => void (words.current[i] = el)} className="inline-block pr-[0.25em] opacity-[0.12] will-change-[opacity]">
                  {w}
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
