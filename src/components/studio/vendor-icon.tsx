import type { Vendor } from "@/lib/catalog/models";
import { cn } from "@/lib/utils";

// Simple monogram marks per vendor. Deliberately not the vendors' logos.
const GLYPH: Record<Vendor, { text: string; color: string }> = {
  higgsfield: { text: "H", color: "#d3ff3d" },
  openai: { text: "◎", color: "#ffffff" },
  google: { text: "G", color: "#8ab4f8" },
  bytedance: { text: "▌▌", color: "#ffffff" },
  minimax: { text: "M", color: "#ff7a59" },
  kling: { text: "K", color: "#7dd3fc" },
  flux: { text: "△", color: "#f5f5f5" },
  xai: { text: "X", color: "#e5e5e5" },
  wan: { text: "W", color: "#fbbf24" },
  recraft: { text: "R", color: "#f472b6" },
};

export function VendorIcon({ vendor, className }: { vendor: Vendor; className?: string }) {
  const g = GLYPH[vendor];
  return (
    <span
      aria-hidden
      className={cn("inline-flex items-center justify-center font-bold leading-none", className)}
      style={{ color: g.color, fontSize: "0.85em" }}
    >
      {g.text}
    </span>
  );
}
