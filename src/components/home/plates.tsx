"use client";

import Link from "next/link";
import { LazyImg } from "@/components/studio/lazy-img";

export type Plate = {
  id: string;
  kind: "image" | "video";
  prompt: string;
  url: string;
  width: number | null;
  height: number | null;
  model: string;
};

// Real generations out of the database, hung like plates in a book: numbered,
// captioned with the sentence that made them. No hover-to-reveal — the caption
// is part of the work.
export function Plates({ items }: { items: Plate[] }) {
  if (items.length === 0) {
    return (
      <p className="border border-dashed border-line-2 p-10 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-fg-3">
        The plates fill up as people generate. Yours would be the first.
      </p>
    );
  }
  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it, i) => (
        <figure key={it.id} className="group">
          <Link href={`/a/${it.id}`} className="block">
            <div
              className="relative overflow-hidden border border-fg/12 bg-card"
              style={{ aspectRatio: it.width && it.height ? `${it.width}/${it.height}` : "1/1" }}
            >
              {it.kind === "video" ? (
                <video src={it.url} muted loop playsInline autoPlay preload="metadata" className="h-full w-full object-cover" />
              ) : (
                <LazyImg src={it.url} alt={it.prompt} className="transition-transform duration-[900ms] group-hover:scale-[1.02]" />
              )}
            </div>
          </Link>
          <figcaption className="mt-3 border-t border-line pt-2">
            <div className="flex items-baseline gap-2">
              <span className="fig shrink-0">Pl. {String(i + 1).padStart(2, "0")}</span>
              <span className="fig truncate">{it.model}</span>
            </div>
            <p className="mt-1.5 line-clamp-3 text-[13px] leading-[1.45] text-fg-2">
              <span className="text-fg-3">&ldquo;</span>
              {it.prompt}
              <span className="text-fg-3">&rdquo;</span>
            </p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
