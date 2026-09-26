"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { runWidgets, type Widget, type WidgetLook, type WidgetTint } from "@/lib/widgets";

// The monitor on the front page, dressed the way people dress their own:
// a clock, the weather over Lahore running through its skies, the month and
// a countdown — each made of lamps or letters, changing colour every few
// seconds to show what the Desktop Studio can do.

const LOOKS: { look: WidgetLook; tint: WidgetTint; label: string }[] = [
  { look: "led", tint: "amber", label: "Amber lamps" },
  { look: "led", tint: "full", label: "Full-colour lamps" },
  { look: "led", tint: "green", label: "Green lamps" },
  { look: "type", tint: "amber", label: "Letters" },
  { look: "led", tint: "red", label: "Red lamps" },
  { look: "led", tint: "white", label: "White lamps" },
];

const BASE: Widget[] = [
  { id: "clock", type: "clock", x: 0.84, y: 0.22, size: 1.1 },
  { id: "sky", type: "weather", x: 0.13, y: 0.3, size: 1, place: "Lahore, PK" },
  { id: "month", type: "calendar", x: 0.13, y: 0.76, size: 0.75 },
  { id: "count", type: "countdown", x: 0.85, y: 0.76, size: 0.9, text: "results day", date: "" },
];

export function DeskDemo({ className }: { className?: string }) {
  const layer = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);

  useEffect(() => {
    const el = layer.current;
    if (!el) return;
    const inTwelve = new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10);
    const make = (i: number) => BASE.map((w) => ({ ...w, look: LOOKS[i].look, tint: LOOKS[i].tint, date: w.type === "countdown" ? inTwelve : w.date }));
    const h = runWidgets(el, make(0), { preview: true, demo: true });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => h.destroy();
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % LOOKS.length;
      h.set(make(i));
      setK(i);
    }, 5200);
    return () => {
      clearInterval(t);
      h.destroy();
    };
  }, []);

  return (
    <>
      <div ref={layer} className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden />
      <p className="sr-only">The wallpaper with a clock, the weather in Lahore, this month&apos;s calendar and a countdown, drawn in LED lamps and letters.</p>
      <div className="label pointer-events-none absolute bottom-16 left-1/2 hidden -translate-x-1/2 gap-3 rounded-full bg-black/55 px-4 py-1.5 text-[9px] text-paper/80 backdrop-blur-sm sm:flex">
        {LOOKS.map((l, i) => (
          <span key={l.label} className={cn("whitespace-nowrap transition-opacity", i === k ? "opacity-100" : "opacity-35")}>
            {l.label}
          </span>
        ))}
      </div>
    </>
  );
}
