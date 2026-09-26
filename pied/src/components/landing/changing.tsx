"use client";

import { useEffect, useRef, useState } from "react";
import { clockPlate } from "@/lib/clock";
import { createField, type FieldController, type FieldData } from "@/lib/field";
import { DEFAULTS, buildPlate, fieldData, loadImage, sample, type Settings } from "@/lib/plate";
import { Lines, Reveal } from "../reveal";

const SHOW: { src: string; trim: number; name: string; s: Partial<Settings> }[] = [
  { src: "/samples/pour.jpg", trim: 0, name: "Pour", s: { contrast: 1.4, cutoff: 0.25, text: "a woman pours water — " } },
  { src: "/samples/cat.jpg", trim: 0.07, name: "Cat", s: { contrast: 1.6, cutoff: 0.35, text: "a cat at night — ", glyphs: "ramp" } },
  { src: "/samples/portrait.jpg", trim: 0.02, name: "Portrait", s: { contrast: 1.7, cutoff: 0.3, text: "she closes her eyes — " } },
  { src: "/samples/lighthouse.jpg", trim: 0.07, name: "Lighthouse", s: { contrast: 1.7, cutoff: 0.34, paper: "light", invert: true, text: "keep the light — " } },
];
const COLS = 96;
const ROWS = 72;

async function plates(): Promise<FieldData[]> {
  const out: FieldData[] = [];
  for (const p of SHOW) {
    const img = await loadImage(p.src);
    const s: Settings = { ...DEFAULTS, ...p.s, format: "square", cols: COLS };
    const cols = COLS;
    const rows = ROWS;
    const plate = buildPlate(sample(img, cols, rows, p.trim), cols, rows, s);
    out.push(fieldData(plate, plate.base, s));
  }
  return out;
}

// § — It keeps changing: the slideshow and the clock, running.
export function Changing() {
  const show = useRef<HTMLCanvasElement>(null);
  const clock = useRef<HTMLCanvasElement>(null);
  const [at, setAt] = useState(0);
  const [time, setTime] = useState("");

  useEffect(() => {
    const c = show.current;
    if (!c) return;
    let field: FieldController | null = null;
    let timer = 0;
    let seen = false;
    let all: FieldData[] = [];
    let i = 0;
    let dead = false;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    plates().then((ps) => {
      if (dead) return;
      all = ps;
      field = createField(c, ps[0], { fit: "contain", listen: "canvas", mode: still ? "still" : "scatter", radius: 80 });
    });
    // Morph only while someone is looking.
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
    });
    io.observe(c);
    timer = window.setInterval(() => {
      if (!seen || !field || all.length < 2 || document.hidden || still) return;
      i = (i + 1) % all.length;
      field.morph(all[i]);
      setAt(i);
    }, 4200);
    return () => {
      dead = true;
      clearInterval(timer);
      io.disconnect();
      field?.destroy();
    };
  }, []);

  useEffect(() => {
    const c = clock.current;
    if (!c) return;
    const opts = { cols: 96, rows: 54, cell: 10, font: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', weight: 700 };
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const now = new Date();
    const field = createField(c, clockPlate(now, opts), { fit: "contain", listen: "canvas", mode: still ? "still" : "scatter", radius: 70 });
    let last = now.getMinutes();
    const t0 = setTimeout(() => setTime(now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })), 0);
    const id = setInterval(() => {
      const d = new Date();
      if (d.getMinutes() === last) return;
      last = d.getMinutes();
      field.morph(clockPlate(d, opts));
      setTime(d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    }, 1000);
    return () => {
      clearTimeout(t0);
      clearInterval(id);
      field.destroy();
    };
  }, []);

  return (
    <section data-section="It keeps changing" className="mx-auto max-w-[1600px] px-4 py-28 sm:px-8 sm:py-40">
      <div className="grid gap-6 border-b border-rule pb-8 lg:grid-cols-12">
        <p className="label text-ink-3 lg:col-span-3">§ 04 — It keeps changing</p>
        <div className="lg:col-span-9">
          <Lines className="font-display text-[clamp(2.6rem,5.6vw,6rem)] leading-[0.92] tracking-[-0.02em]" lines={["A wallpaper that", <em key="e" className="font-serif italic">never sits still.</em>]} />
          <Reveal>
            <p className="mt-6 max-w-xl font-serif text-lg leading-snug text-ink-2">
              Put several pictures in a slideshow and every so often the letters fly apart and reassemble as the next one. Or set the clock: the time
              itself, in type, spelled out in words, rearranging every minute. With music on, the letters jump to the beat.
            </p>
          </Reveal>
        </div>
      </div>
      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <Reveal as="figure">
          <div className="aspect-[4/3] bg-paper-2 p-4">
            <canvas ref={show} className="block h-full w-full touch-pan-y" role="img" aria-label="A slideshow: four pictures in type, each turning into the next" data-cursor="play" />
          </div>
          <figcaption className="mt-4 flex items-baseline justify-between border-t border-ink pt-3">
            <span className="font-display text-2xl">The slideshow</span>
            <span className="label flex gap-2 text-ink-3">
              {SHOW.map((s, k) => (
                <span key={s.name} className={k === at ? "text-ink" : ""}>
                  {k === at ? "●" : "○"}
                </span>
              ))}
              <span className="ml-2">{SHOW[at].name}</span>
            </span>
          </figcaption>
        </Reveal>
        <Reveal as="figure" delay={140}>
          <div className="aspect-[4/3] bg-paper-2 p-4">
            <canvas ref={clock} className="block h-full w-full touch-pan-y" role="img" aria-label={`The time, ${time}, set in type`} data-cursor="play" />
          </div>
          <figcaption className="mt-4 flex items-baseline justify-between border-t border-ink pt-3">
            <span className="font-display text-2xl">The clock</span>
            <span className="label text-ink-3">{time ? `${time} · watch the minute turn` : ""}</span>
          </figcaption>
        </Reveal>
      </div>
    </section>
  );
}
