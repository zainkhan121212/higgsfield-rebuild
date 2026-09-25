import { PromptImage } from "@/components/hero/prompt-image";

// Scratch page for trying the hero interaction in isolation.
export const dynamic = "force-dynamic";

const PROMPT =
  "a woman pouring water, caught mid-pour, silhouette against white, water breaking into a thousand drops, shot on 85mm, high contrast black and white";

export default function Lab() {
  return (
    <main className="min-h-screen w-full bg-white text-black">
      <div className="mx-auto w-full max-w-6xl px-8 py-12">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-black/50">Prompt → picture</span>
          <span className="font-mono text-[11px] text-black/40">move your cursor through it</span>
        </div>
        <PromptImage
          src="/hero/pour.jpg"
          prompt={PROMPT}
          palette="ink"
          cell={9}
          radius={130}
          force={2.8}
          className="mx-auto mt-6 aspect-[718/775] w-full max-w-[720px]"
        />
      </div>
    </main>
  );
}
