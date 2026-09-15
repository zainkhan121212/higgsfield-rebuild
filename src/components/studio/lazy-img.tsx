"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Keeps a shimmer behind an image until it has actually decoded — generation
// URLs can take a few seconds on first load.
export function LazyImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <span className={cn("relative block h-full w-full", !ready && !failed && "shimmer")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setReady(true)}
        onError={() => setFailed(true)}
        className={cn("h-full w-full object-cover transition-opacity duration-500", ready ? "opacity-100" : "opacity-0", className)}
      />
      {!ready && !failed && <span className="absolute inset-0 flex items-center justify-center text-[11px] text-fg-3">Loading…</span>}
      {failed && <span className="absolute inset-0 flex items-center justify-center text-[11px] text-fg-3">Couldn&apos;t load</span>}
    </span>
  );
}
