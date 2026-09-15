"use client";

import Link from "next/link";
import { Film } from "lucide-react";
import { LazyImg } from "@/components/studio/lazy-img";

export type FeedItem = {
  id: string;
  kind: "image" | "video";
  prompt: string;
  url: string;
  thumb: string | null;
  width: number | null;
  height: number | null;
  model: string;
  by: string;
};

export function FeedGrid({ items }: { items: FeedItem[] }) {
  if (items.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-line-2 p-10 text-center text-[13px] text-fg-3">
        Nothing public yet. The first generation on this instance shows up here.
      </div>
    );
  }
  return (
    <div className="mt-4 columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5">
      {items.map((it) => (
        <Link key={it.id} href={`/a/${it.id}`} className="group relative mb-3 block break-inside-avoid overflow-hidden rounded-xl bg-card">
          {it.kind === "video" ? (
            <video src={it.url} muted loop playsInline autoPlay preload="metadata" className="w-full" style={{ aspectRatio: it.width && it.height ? `${it.width}/${it.height}` : "16/9" }} />
          ) : (
            <div className="w-full" style={{ aspectRatio: it.width && it.height ? `${it.width}/${it.height}` : "1/1" }}>
              <LazyImg src={it.url} alt={it.prompt} className="transition-transform duration-500 group-hover:scale-[1.03]" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/90 to-transparent p-3 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
            <p className="line-clamp-2 text-[12px] leading-snug">{it.prompt}</p>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-fg-2">
              {it.kind === "video" && <Film className="h-3 w-3" />}
              <span>{it.model}</span>
              <span>· {it.by}</span>
            </div>
          </div>
          <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium backdrop-blur">Public</span>
        </Link>
      ))}
    </div>
  );
}
