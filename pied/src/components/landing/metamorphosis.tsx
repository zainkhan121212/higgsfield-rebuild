"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createField, type FieldController, type FieldData } from "@/lib/field";
import { ledData, type LedTint } from "@/lib/led";
import { DEFAULTS, buildPlate, fieldData, gridFor, loadImage, sample, type Settings } from "@/lib/plate";
import { cn } from "@/lib/utils";
import { Lines } from "../reveal";

// What Pied does, shown before it's explained: an old painting dissolves
// into type, the type takes colour, burns as neon, lights up as an LED board
// in four inks, and the painting comes back. Then the next painting.

const WORKS = [
  { src: "/samples/senate.jpg", title: "The orator", words: "friends, romans, countrymen, lend me your ears — " },
  { src: "/samples/mosaic.jpg", title: "The young king", words: "alexander, son of philip, king of macedon — " },
];

type Stage = { n: string; name: string; note: string; make?: (k: Kit) => FieldData };
type Kit = { mono: FieldData; colour: FieldData; neon: FieldData; led: (t: LedTint) => FieldData };

const STAGES: Stage[] = [
  { n: "I", name: "The painting", note: "as it was made" },
  { n: "II", name: "Set in type", note: "black ink on paper", make: (k) => k.mono },
  { n: "III", name: "In colour", note: "each letter inked from the paint beneath", make: (k) => k.colour },
  { n: "IV", name: "Neon", note: "every letter a glowing tube", make: (k) => k.neon },
  { n: "V", name: "LED · amber", note: "the letters become lamps", make: (k) => k.led("amber") },
  { n: "VI", name: "LED · green", note: "an old terminal", make: (k) => k.led("green") },
  { n: "VII", name: "LED · red", note: "a station sign", make: (k) => k.led("red") },
  { n: "VIII", name: "LED · white", note: "a stadium board", make: (k) => k.led("white") },
  { n: "IX", name: "LED · full colour", note: "every lamp its own colour", make: (k) => k.led("full") },
];
const HOLD = 2600;

async function kitFor(src: string, words: string): Promise<Kit> {
  const img = await loadImage(src);
  const base: Settings = { ...DEFAULTS, format: "original", cols: 104, text: words, contrast: 1.6, cutoff: 0.14 };
  const { cols, rows } = gridFor(base, { w: img.naturalWidth, h: img.naturalHeight });
  const px = sample(img, cols, rows, 0);
  const mk = (s: Settings, fx?: (rgba: Uint8Array) => Uint8Array) => {
    const p = buildPlate(px, cols, rows, s);
    const rgba = p.base.slice();
    return fieldData(p, rgba, s, fx?.(rgba));
  };
  const mono = mk(base);
  const colour = mk({ ...base, ink: "colour" });
  const neon = mk({ ...base, ink: "colour", paper: "dark", invert: true, cutoff: 0.18 }, (rgba) => {
    const f = new Uint8Array(cols * rows);
    for (let i = 0; i < f.length; i++) if (rgba[i * 4 + 3] > 150) f[i] = 1;
    return f;
  });
  const cache: Partial<Record<LedTint, FieldData>> = {};
  return { mono, colour, neon, led: (t) => (cache[t] ??= ledData(colour, t)) };
}

export function Metamorphosis() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [work, setWork] = useState(0);
  const [stage, setStage] = useState(0);
  const [paper, setPaper] = useState("#f4f3ee");

  useEffect(() => {
    const c = canvas.current;
    const box = wrap.current;
    if (!c || !box) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let field: FieldController | null = null;
    let kits: Kit[] = [];
    let timer = 0;
    let visible = false;
    let dead = false;
    let w = 0;
    let s = 0;

    const show = (wi: number, si: number) => {
      setWork(wi);
      setStage(si);
      const make = STAGES[si].make;
      if (!make) return;
      const d = make(kits[wi]);
      setPaper(d.paper);
      if (!field) field = createField(c, d, { fit: "contain", listen: "canvas", assemble: !still, mode: still ? "still" : "scatter", radius: 90, force: 2.4, spring: 0.05 });
      else if (still) field.update(d);
      else field.morph(d);
    };
    // I → IX on one painting, back to I (the same painting returns), then
    // across to the next painting, and round again.
    let swap = false;
    const tick = () => {
      if (dead) return;
      if (!visible) {
        timer = window.setTimeout(tick, 400);
        return;
      }
      if (swap) {
        swap = false;
        w = (w + 1) % WORKS.length;
        show(w, 0);
      } else if (++s >= STAGES.length) {
        s = 0;
        swap = true;
        field?.destroy();
        field = null;
        setPaper("#f4f3ee");
        show(w, 0);
      } else show(w, s);
      timer = window.setTimeout(tick, HOLD);
    };

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.25 });
    io.observe(box);
    Promise.all(WORKS.map((x) => kitFor(x.src, x.words)))
      .then((k) => {
        if (dead) return;
        kits = k;
        timer = window.setTimeout(tick, HOLD);
      })
      .catch(() => {});
    return () => {
      dead = true;
      clearTimeout(timer);
      io.disconnect();
      field?.destroy();
    };
  }, []);

  const painting = stage === 0;
  return (
    <section data-section="Metamorphosis" className="mx-auto max-w-[1600px] px-4 py-24 sm:px-8 sm:py-32">
      <div className="grid gap-6 border-b border-rule pb-8 lg:grid-cols-12">
        <p className="label text-ink-3 lg:col-span-3">§ 00 — What it does</p>
        <Lines className="font-display text-[clamp(2.6rem,5.6vw,6rem)] leading-[0.92] tracking-[-0.02em] lg:col-span-9" lines={["Any picture,", <em key="e" className="font-serif italic">in any light.</em>]} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-center">
        <ol className="order-2 space-y-1 lg:order-1 lg:col-span-4" aria-label="Stages">
          {STAGES.map((st, i) => (
            <li key={st.n} className={cn("flex items-baseline gap-4 border-b border-rule py-2 transition-opacity duration-500", i === stage ? "opacity-100" : "opacity-35")}>
              <span className="label w-10 shrink-0 text-ink-3">{st.n}.</span>
              <span className="min-w-0">
                <span className="block font-display text-2xl leading-tight">{st.name}</span>
                <span className={cn("block overflow-hidden font-serif text-sm italic text-ink-3 transition-[max-height] duration-500", i === stage ? "max-h-6" : "max-h-0")}>{st.note}</span>
              </span>
              {i === stage ? <span key={`${work}-${stage}`} className="ml-auto h-px w-12 origin-left animate-[grow_2.6s_linear_forwards] self-center bg-ink" /> : null}
            </li>
          ))}
          <li className="pt-6">
            <Link href="/make" className="label inline-block bg-ink px-5 py-3 text-paper">
              Try it with your own picture →
            </Link>
          </li>
        </ol>

        <figure className="order-1 lg:order-2 lg:col-span-8">
          <div ref={wrap} className="relative mx-auto aspect-square max-h-[82svh] w-full overflow-hidden transition-colors duration-700" style={{ background: painting ? "#1a1612" : paper }}>
            <canvas ref={canvas} className={cn("absolute inset-0 h-full w-full transition-opacity duration-700", painting ? "opacity-0" : "opacity-100")} role="img" aria-label={`${WORKS[work].title}, ${STAGES[stage].name.toLowerCase()}`} data-cursor="play" />
            {WORKS.map((x, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={x.src}
                src={x.src}
                alt={i === work ? `${x.title}: the original painting` : ""}
                className={cn(
                  "pointer-events-none absolute inset-0 h-full w-full object-contain transition-[opacity,clip-path] duration-[1100ms] ease-[var(--ease-out-expo)]",
                  painting && i === work ? "opacity-100 [clip-path:inset(0_0_0_0)]" : "opacity-0 [clip-path:inset(0_0_100%_0)]",
                )}
              />
            ))}
          </div>
          <figcaption className="label mt-4 flex justify-between text-ink-3">
            <span>
              Fig. {STAGES[stage].n} — {WORKS[work].title}
            </span>
            <span>{painting ? "the original" : "move through it"}</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
