"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Keeps a shimmer behind an image until it has actually decoded — generation
// URLs can take a few seconds on first load.
export function LazyImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const failed = attempt >= 6;
  const imgRef = useRef<HTMLImageElement>(null);
  // Cached images can finish before hydration attaches onLoad.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) setReady(true);
  }, [attempt]);
  return (
    <span className={cn("relative block h-full w-full", !ready && !failed && "shimmer")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        key={attempt}
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setReady(true)}
        onError={() => setTimeout(() => setAttempt((n) => n + 1), 4000 * (attempt + 1))}
        className={cn("h-full w-full object-cover transition-opacity duration-500", ready ? "opacity-100" : "opacity-0", className)}
      />
      {!ready && !failed && <span className="absolute inset-0 flex items-center justify-center text-[11px] text-fg-3">Loading…</span>}
      {failed && <span className="absolute inset-0 flex items-center justify-center text-[11px] text-fg-3">Couldn&apos;t load</span>}
    </span>
  );
}
