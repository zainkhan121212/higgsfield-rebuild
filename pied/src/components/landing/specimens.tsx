"use client";

import Link from "next/link";
import type { Settings } from "@/lib/plate";
import { PlateCanvas } from "../plate-canvas";
import { Lines, Reveal } from "../reveal";

const PLATES: { src: string; title: string; spec: string; settings: Partial<Settings>; alt: string; tall?: boolean }[] = [
  {
    src: "/samples/cat.jpg",
    title: "Cat, at night",
    spec: "Typewriter · density ramp",
    alt: "A cat's eye drawn in typewriter characters",
    settings: { format: "square", cols: 72, glyphs: "ramp", face: "typewriter", contrast: 1.7, cutoff: 0.4, weight: 700 },
  },
  {
    src: "/samples/hand.jpg",
    title: "A rose, held",
    spec: "Serif · the words of a poem",
    alt: "A hand holding a rose, drawn in serif letters",
    tall: true,
    settings: { format: "original", cols: 96, face: "serif", text: "rose is a rose is a rose is a rose — ", contrast: 1.9, cutoff: 0.42, weight: 700 },
  },
  {
    src: "/samples/wave.jpg",
    title: "The wave",
    spec: "Mono · colour ink · light paper",
    alt: "A great ocean wave drawn in blue letters",
    settings: { format: "square", cols: 72, ink: "colour", contrast: 1.6, cutoff: 0.28, text: "the sea the sea the sea — " },
  },
];

// The specimen book: three plates set three different ways, each one live.
export function Specimens() {
  return (
    <section className="mx-auto max-w-[1600px] px-4 py-28 sm:px-8 sm:py-40">
      <div className="grid gap-6 border-b border-rule pb-8 lg:grid-cols-12">
        <p className="label text-ink-3 lg:col-span-3">§ 03 — Specimen book</p>
        <Lines className="font-display text-[clamp(2.6rem,5.6vw,6rem)] leading-[0.92] tracking-[-0.02em] lg:col-span-9" lines={["One press,", <em key="e" className="font-serif italic">many hands.</em>]} />
      </div>
      <div className="mt-12 grid gap-8 md:grid-cols-3 md:items-end">
        {PLATES.map((p, i) => (
          <Reveal key={p.src} delay={i * 140} as="figure">
            <div className={p.tall ? "aspect-[4/6]" : "aspect-square"}>
              <PlateCanvas src={p.src} trim={0.07} settings={p.settings} label={p.alt} fit="contain" className="h-full w-full" />
            </div>
            <figcaption className="mt-4 border-t border-ink pt-3">
              <span className="flex items-baseline justify-between gap-4">
                <span className="font-display text-2xl">{p.title}</span>
                <span className="label text-ink-3">Fig. {i + 2}</span>
              </span>
              <span className="label mt-1 block text-ink-3">{p.spec}</span>
            </figcaption>
          </Reveal>
        ))}
      </div>
      <Reveal className="mt-10 flex justify-end">
        <Link href="/make" className="label border-b border-ink pb-0.5">
          Set your own →
        </Link>
      </Reveal>
    </section>
  );
}
