import { PromptImage } from "@/components/hero/prompt-image";

// Scratch page for trying the hero interaction in isolation.
export const dynamic = "force-dynamic";

const PROMPT = "a woman in a yellow raincoat under neon signs in tokyo rain, anamorphic lens flare, 35mm film, shallow depth of field, cinematic still";
const SRC = "/hero/tokyo.jpg";

export default function Lab() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-lg font-semibold">Prompt → picture</h1>
      <p className="mt-1 text-[13px] text-fg-3">Move the cursor across it.</p>
      <PromptImage src={SRC} prompt={PROMPT} className="mt-6 aspect-[16/9] w-full rounded-2xl border border-line bg-black" />
    </main>
  );
}
