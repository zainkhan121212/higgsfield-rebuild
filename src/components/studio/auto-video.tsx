"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Muted, looping clip that only plays while on screen (and only starts
// loading when it gets close), so a page full of them stays light.
export function AutoVideo({
  src,
  poster,
  className,
  hoverOnly = false,
}: {
  src: string;
  poster?: string;
  className?: string;
  hoverOnly?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setNear(true);
        setVisible(e.isIntersecting);
      },
      { rootMargin: "200px 0px", threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Play/pause after the src has been committed, not when the observer fires.
  useEffect(() => {
    const el = ref.current;
    if (!el || hoverOnly || !near) return;
    if (visible) el.play().catch(() => {});
    else el.pause();
  }, [near, visible, hoverOnly]);

  return (
    <video
      ref={ref}
      src={near ? src : undefined}
      poster={poster}
      muted
      loop
      playsInline
      autoPlay={!hoverOnly}
      preload="metadata"
      onPlaying={() => setPlaying(true)}
      onMouseEnter={hoverOnly ? (e) => e.currentTarget.play().catch(() => {}) : undefined}
      onMouseLeave={hoverOnly ? (e) => e.currentTarget.pause() : undefined}
      className={cn("h-full w-full object-cover transition-opacity duration-700", playing || poster ? "opacity-100" : "opacity-0", className)}
    />
  );
}
