"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Poster with an optional clip on top. `play`: "auto" plays while on screen,
// "hover" only on pointer. HLS sources load hls.js on demand.
export function MediaTile({
  poster,
  video,
  hls,
  play = "hover",
  className,
  alt = "",
}: {
  poster?: string;
  video?: string;
  hls?: string;
  play?: "auto" | "hover";
  className?: string;
  alt?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [hover, setHover] = useState(false);
  const src = video || hls;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setNear(true); setVisible(e.isIntersecting); }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Attach the source lazily; HLS through hls.js (Safari plays m3u8 natively).
  useEffect(() => {
    const el = ref.current;
    if (!el || !src || !near) return;
    if (hls && !video) {
      if (el.canPlayType("application/vnd.apple.mpegurl")) { el.src = hls; return; }
      let instance: { destroy: () => void } | null = null;
      loadHls().then((Hls) => {
        if (!Hls || !Hls.isSupported()) return;
        const h = new Hls({ maxBufferLength: 10 });
        h.loadSource(hls);
        h.attachMedia(el);
        instance = h;
      });
      return () => instance?.destroy();
    }
    el.src = src;
  }, [src, hls, video, near]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !src || !near) return;
    const want = play === "auto" ? visible : hover;
    if (want) el.play().catch(() => {});
    else el.pause();
  }, [play, visible, hover, near, src]);

  return (
    <div
      className={cn("relative overflow-hidden bg-bg-elev", className)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt={alt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      )}
      {src && (
        <video
          ref={ref}
          muted
          loop
          playsInline
          preload="none"
          onPlaying={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-500", playing ? "opacity-100" : "opacity-0")}
        />
      )}
    </div>
  );
}

type HlsCtor = { isSupported: () => boolean; new (cfg?: object): { loadSource: (u: string) => void; attachMedia: (v: HTMLVideoElement) => void; destroy: () => void } };
let hlsPromise: Promise<HlsCtor | null> | null = null;
function loadHls(): Promise<HlsCtor | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const w = window as unknown as { Hls?: HlsCtor };
  if (w.Hls) return Promise.resolve(w.Hls);
  if (!hlsPromise) {
    hlsPromise = new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.15/hls.min.js";
      s.onload = () => resolve(w.Hls ?? null);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }
  return hlsPromise;
}
