"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

// A contact strip running through the dark room: real generations, sprocket
// holes, frame numbers. Two copies of the same list slide past at a constant
// rate, so the loop has no seam. Hover to stop it; reduced motion parks it.

export type Frame = { id: string; url: string; prompt: string; model: string };

export function Filmstrip({ frames }: { frames: Frame[] }) {
  if (frames.length === 0) return null;
  const strip = [...frames, ...frames];

  return (
    <div className="group relative overflow-hidden py-2">
      <div
        className={cn(
          "flex w-max gap-3 will-change-transform",
          "motion-safe:animate-[strip_46s_linear_infinite] motion-safe:group-hover:[animation-play-state:paused]",
        )}
      >
        {strip.map((f, i) => (
          <Link
            key={`${f.id}-${i}`}
            href={`/a/${f.id}`}
            className="relative block w-[190px] shrink-0 sm:w-[230px]"
            title={f.prompt}
          >
            <div className="relative aspect-[4/5] overflow-hidden border border-amber/20 bg-night-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.url}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover opacity-85 transition duration-700 hover:opacity-100 hover:saturate-125"
              />
            </div>
            <div className="mt-1.5 flex items-baseline justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-amber/55">
              <span>{String((i % frames.length) + 1).padStart(3, "0")}</span>
              <span className="truncate text-paper/35">{f.model}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Sprocket holes, top and bottom, the way a strip of film is edged. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2 opacity-70"
        style={{ backgroundImage: "repeating-linear-gradient(to right, rgba(232,163,61,0.30) 0 10px, transparent 10px 26px)" }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2 opacity-70"
        style={{ backgroundImage: "repeating-linear-gradient(to right, rgba(232,163,61,0.30) 0 10px, transparent 10px 26px)" }} />

      {/* Fade the ends so the strip runs out of the frame rather than stopping. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-night to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-night to-transparent" />
    </div>
  );
}
