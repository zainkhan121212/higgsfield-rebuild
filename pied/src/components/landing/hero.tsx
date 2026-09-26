"use client";

import Link from "next/link";
import { useRef } from "react";
import type { FieldController } from "@/lib/field";
import { useScrollProgress } from "@/lib/scroll";
import { useTilt } from "@/lib/tilt";
import { PlateCanvas } from "../plate-canvas";
import { LooseType } from "../fx/loose-type";
import { Magnetic } from "../fx/magnetic";

// The first screen is the product: a woman pouring water, set in the
// sentence that describes her. Touch her and the type scatters. Scroll and
// the whole forme is knocked over — the type is "pied" — and falls away.
export function Hero() {
  const section = useRef<HTMLElement>(null);
  const field = useRef<FieldController | null>(null);
  const copy = useRef<HTMLDivElement>(null);
  const tilt = useTilt(() => field.current);

  useScrollProgress(section, (_p, r) => {
    const p = Math.min(1, Math.max(0, -r.top / (r.height * 0.9)));
    field.current?.setSpill(p * 1.15);
    if (copy.current) {
      copy.current.style.transform = `translateY(${p * -80}px)`;
      copy.current.style.opacity = String(1 - p * 1.3);
    }
  });

  return (
    <section ref={section} data-section="Title page" className="relative min-h-svh overflow-hidden">
      <div className="mx-auto grid min-h-svh max-w-[1600px] grid-cols-1 gap-6 px-4 pb-14 pt-20 sm:px-8 lg:grid-cols-12 lg:pt-24">
        <div ref={copy} className="relative z-10 flex flex-col justify-between lg:col-span-5">
          <div>
            <p className="label reveal in text-ink-3">Vol. I — A letterpress for pictures</p>
            <LooseType
              as="h1"
              enter
              className="mt-6 font-display text-[clamp(3.4rem,8.4vw,9.5rem)] leading-[0.86] tracking-[-0.02em]"
              lines={[{ text: "Pictures," }, { text: "set in" }, { text: "loose type.", className: "font-serif italic tracking-[-0.04em]" }]}
            />
          </div>
          <div className="mt-10 max-w-md space-y-6">
            <p className="font-serif text-lg leading-snug text-ink-2">
              Give Pied a photograph or a sentence. It sets the picture in letters — thousands of them — that scatter when your cursor passes
              through and find their way home. Paint it, then keep it running on your desktop.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Magnetic>
                <Link href="/make" className="label group inline-flex items-center gap-3 bg-ink px-5 py-3.5 text-paper">
                  Set your picture <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </Link>
              </Magnetic>
              <a href="#process" className="label border-b border-ink pb-0.5">
                How it prints
              </a>
            </div>
          </div>
        </div>

        <div className="relative lg:col-span-7">
          <PlateCanvas
            src="/samples/pour.jpg"
            label="A woman pouring water, drawn entirely in letters"
            className="h-[62svh] w-full lg:h-full"
            fit="contain"
            assemble
            settings={{
              format: "original",
              cols: 118,
              text: "a woman pours water from a heavy jug into a basin — every picture is only a great many words standing close together — ",
              face: "mono",
              weight: 700,
              contrast: 1.4,
              cutoff: 0.25,
              radius: 8,
            }}
            onReady={(f) => (field.current = f)}
          />
          <p className="label pointer-events-none absolute -bottom-6 right-0 text-ink-3">
            Fig. 1 — {tilt.state === "on" ? "tilt your phone" : "move through her ↗"}
          </p>
          {tilt.state === "ask" ? (
            <button type="button" onClick={tilt.ask} className="label absolute left-0 top-0 bg-ink px-3 py-2 text-paper">
              Tilt to play
            </button>
          ) : null}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto flex max-w-[1600px] justify-between px-4 pb-4 sm:px-8">
        <span className="label text-ink-3">Scroll to pie the type</span>
        <span className="label hidden text-ink-3 sm:inline">Est. MMXXVI</span>
      </div>
    </section>
  );
}
