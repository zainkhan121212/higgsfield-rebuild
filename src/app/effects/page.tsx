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
      <h1 className="display text-4xl text-lime sm:text-5xl">Effects</h1>
      <p className="mt-2 max-w-xl text-[14px] text-fg-2">Camera control, framing and VFX recipes. Pick one and it writes the motion prompt for you — add your own details on top.</p>
      {CATS.map((c) => {
        const list = PRESETS.filter((p) => p.category === c.id);
        return (
          <section key={c.id} className="mt-10">
            <h2 className="display text-2xl">{c.label}</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {list.map((p) => (
                <Link key={p.id} href={`/ai/video?preset=${p.id}`} className="group relative aspect-[3/4] overflow-hidden rounded-xl">
                  <PresetThumb preset={p} motion="hover" className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="display text-[15px]">{p.name}</div>
                    <div className="mt-0.5 line-clamp-2 text-[11px] text-fg-2">{p.description}</div>
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
