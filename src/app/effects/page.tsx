import type { Metadata } from "next";
import Link from "next/link";
import { PRESETS } from "@/lib/catalog/presets";
import { PresetThumb } from "@/components/studio/preset-thumb";

export const metadata: Metadata = { title: "Effects — video presets" };

const CATS: { id: string; label: string }[] = [
  { id: "camera", label: "Camera" },
  { id: "vfx", label: "VFX" },
  { id: "transform", label: "Transform" },
  { id: "stunt", label: "Stunt" },
];

export default function EffectsPage() {
  return (
    <main className="mx-auto w-full max-w-[1500px] px-3 pb-24 pt-8 sm:px-5">
      <div className="border-b border-fg/20 pb-4">
        <span className="label">§ Effects · 22 recipes</span>
        <h1 className="display mt-3 text-[clamp(2.2rem,5vw,3.4rem)]">A shelf of camera moves</h1>
        <p className="mt-3 max-w-[56ch] text-[14px] leading-[1.6] text-fg-2">
          Each one writes the motion half of the prompt for you — the push, the tilt, the crash zoom — and you add
          the scene on top. Pick one and it opens in the video studio with the prompt already started.
        </p>
      </div>
      {CATS.map((c) => {
        const list = PRESETS.filter((p) => p.category === c.id);
        return (
          <section key={c.id} className="mt-12">
            <div className="flex items-baseline justify-between border-b border-line pb-2">
              <h2 className="display text-[22px]">{c.label}</h2>
              <span className="fig">{list.length} presets</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-6">
              {list.map((p, i) => (
                <Link key={p.id} href={`/ai/video?preset=${p.id}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden border border-fg/12">
                    <PresetThumb preset={p} motion="auto" className="absolute inset-0 transition-transform duration-[900ms] group-hover:scale-[1.03]" />
                  </div>
                  <div className="mt-2 border-t border-line pt-1.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="fig">{String(i + 1).padStart(2, "0")}</span>
                      <span className="display text-[15px] leading-tight group-hover:text-lime">{p.name}</span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-[11px] leading-snug text-fg-2">{p.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
