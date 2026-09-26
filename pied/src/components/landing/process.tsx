"use client";

import { useEffect, useRef, useState } from "react";
import { demoPaint } from "@/lib/demo";
import { cn } from "@/lib/utils";
import { PlateCanvas } from "../plate-canvas";
import { Lines, Reveal } from "../reveal";

const STEPS = [
  {
    n: "I",
    title: "Bring a picture",
    body: "Upload a photograph, or write a sentence and the press will make one. High contrast prints best — a face against a plain wall, a silhouette, a wave.",
    fig: "the source, as given",
  },
  {
    n: "II",
    title: "Set it in type",
    body: "Every cell of the picture becomes a letter, inked as dark as the pixel beneath it. Use your own words or a density ramp; choose the face, the detail, the paper.",
    fig: "set in 92 columns of mono",
  },
  {
    n: "III",
    title: "Paint over it",
    body: "Brush, spray and erase straight onto the type. Paint into the empty paper and new letters appear; erase and they're lifted out of the forme.",
    fig: "brush, spray, eraser",
  },
  {
    n: "IV",
    title: "Keep it moving",
    body: "Take it home as a live wallpaper that still scatters under your cursor, a still for your phone, or a short film of the type being disturbed.",
    fig: "running on a desktop",
  },
];

const PORTRAIT = { format: "square" as const, cols: 92, contrast: 1.7, cutoff: 0.3, text: "she closes her eyes and the letters hold still — ", radius: 9 };

// The dark room: steps scroll on the left while a single proof on the right
// changes state — photograph, type, paint, desktop.
export function Process() {
  const [at, setAt] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setAt(Number((e.target as HTMLElement).dataset.i));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);

  return (
    <section id="process" className="relative bg-night text-paper">
      <div className="mx-auto max-w-[1600px] px-4 pt-28 sm:px-8 sm:pt-36">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-paper/20 pb-8">
          <Lines className="font-display text-[clamp(2.8rem,6.5vw,7rem)] leading-[0.9] tracking-[-0.02em]" lines={["Four operations,", <em key="e" className="font-serif italic">one press.</em>]} />
          <Reveal>
            <p className="label max-w-xs text-paper/60">§ 02 — How it prints. Nothing leaves your browser but the picture you ask it to make.</p>
          </Reveal>
        </div>

        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                data-i={i}
                ref={(el) => void (refs.current[i] = el)}
                className={cn("flex min-h-[70svh] flex-col justify-center border-b border-paper/10 py-16 transition-opacity duration-700 lg:min-h-[88svh]", at === i ? "opacity-100" : "opacity-30")}
              >
                <p className="font-display text-7xl leading-none">{s.n}.</p>
                <h3 className="mt-6 font-display text-4xl sm:text-5xl">{s.title}</h3>
                <p className="mt-5 max-w-md font-serif text-lg leading-snug text-paper/70">{s.body}</p>
                {/* On small screens the proof sits under each step instead of pinned beside it. */}
                <div className="mt-8 lg:hidden">
                  <Proof at={i} solo />
                </div>
              </div>
            ))}
          </div>
          <div className="hidden lg:col-span-7 lg:block">
            <div className="sticky top-0 flex h-svh items-center">
              <Proof at={at} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Proof({ at, solo = false }: { at: number; solo?: boolean }) {
  const show = (k: number) => !solo || at === k;
  return (
    <figure className="w-full">
      <div className="relative aspect-video w-full">
        {/* I — the photograph */}
        {show(0) && (
        <Layer on={at === 0}>
          <div className="mx-auto aspect-square h-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/samples/portrait.jpg" alt="Source photograph: a woman with long dark hair, eyes closed" className="h-[104%] w-full object-cover object-top grayscale" />
          </div>
        </Layer>
        )}
        {/* II — set in type */}
        {show(1) && (
        <Layer on={at === 1} className="bg-paper">
          <PlateCanvas src="/samples/portrait.jpg" trim={0.02} label="The photograph set in type" className="h-full w-full" settings={PORTRAIT} assemble />
        </Layer>
        )}
        {/* III — painted */}
        {show(2) && (
        <Layer on={at === 2} className="bg-paper">
          <PlateCanvas src="/samples/portrait.jpg" trim={0.02} label="The type, painted with a red brush stroke and a spray of blue" className="h-full w-full" settings={PORTRAIT} transformRgba={demoPaint} />
        </Layer>
        )}
        {/* IV — on a desktop */}
        {show(3) && (
        <Layer on={at === 3}>
          <div className="flex h-full w-full flex-col items-center justify-center">
            <div className="w-[70%] rounded-[10px] border border-paper/40 bg-night-2 p-[1.4%] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]">
              <div className="relative aspect-video overflow-hidden rounded-[3px]">
                <PlateCanvas
                  src="/samples/pour.jpg"
                  label="A woman pouring water, set in type, running as a desktop wallpaper"
                  className="absolute inset-0"
                  fit="contain"
                  settings={{ format: "original", cols: 110, paper: "dark", invert: true, contrast: 1.4, cutoff: 0.25, text: "a woman pours water — ", radius: 7 }}
                  drift
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[6%] items-center gap-[2%] bg-black/40 px-[2%]">
                  <span className="h-[40%] aspect-square rounded-full bg-paper/40" />
                  <span className="label text-[8px] text-paper/60">Finder · File · Edit · View</span>
                </div>
              </div>
            </div>
            <div className="h-[7%] w-[9%] bg-gradient-to-b from-paper/25 to-paper/5" />
            <div className="h-[1.2%] w-[22%] rounded-full bg-paper/20" />
          </div>
        </Layer>
        )}
      </div>
      <figcaption className="label mt-4 flex justify-between text-paper/50">
        <span>Fig. {STEPS[at].n}</span>
        <span>{STEPS[at].fig}</span>
      </figcaption>
    </figure>
  );
}

function Layer({ on, className, children }: { on: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div
      aria-hidden={!on}
      className={cn(
        "absolute inset-0 overflow-hidden transition-[opacity,transform,clip-path] duration-[900ms] ease-[var(--ease-out-expo)]",
        on ? "pointer-events-auto opacity-100 [clip-path:inset(0_0_0_0)]" : "pointer-events-none opacity-0 [clip-path:inset(0_0_100%_0)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
