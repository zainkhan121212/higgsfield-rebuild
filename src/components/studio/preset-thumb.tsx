import type { Preset } from "@/lib/catalog/presets";
import { cn } from "@/lib/utils";

// Gradient tile with a subtle grain, standing in for a preset's sample clip.
export function PresetThumb({ preset, className }: { preset: Preset; className?: string }) {
  const [a, b] = preset.gradient;
  return (
    <div
      className={cn("overflow-hidden", className)}
      style={{
        background: `radial-gradient(120% 80% at 30% 20%, ${a} 0%, ${b} 70%)`,
      }}
    >
      <div
        className="h-full w-full opacity-40 mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
