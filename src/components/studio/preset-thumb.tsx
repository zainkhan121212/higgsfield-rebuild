"use client";

import { useState } from "react";
import { presetThumbUrl, type Preset } from "@/lib/catalog/presets";
import { cn } from "@/lib/utils";

// Sample frame for a preset: a generated still on top of a gradient tile, so
// the tile looks right before (or without) the image.
export function PresetThumb({ preset, className, size = "card" }: { preset: Preset; className?: string; size?: "card" | "wide" }) {
  const [a, b] = preset.gradient;
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const src = presetThumbUrl(preset, size);
  return (
    <div className={cn("overflow-hidden", className)} style={{ background: `radial-gradient(120% 80% at 30% 20%, ${a} 0%, ${b} 70%)` }}>
      {attempt < 4 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={attempt}
          src={src}
          alt=""
          loading="lazy"
          onLoad={() => setReady(true)}
          // The keyless CDN rate-limits bursts; back off and retry the same URL.
          onError={() => setTimeout(() => setAttempt((n) => n + 1), 3000 * (attempt + 1))}
          className={cn("h-full w-full object-cover transition-opacity duration-700", ready ? "opacity-100" : "opacity-0")}
        />
      )}
    </div>
  );
}
