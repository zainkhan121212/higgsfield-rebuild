import { NextResponse, after } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth";
import { handle, readJson } from "@/lib/api";
import { rateLimit } from "@/lib/security";
import { submit, run, InsufficientCredits } from "@/lib/generate";
import { getPreset } from "@/lib/catalog/presets";
import { serialize } from "@/lib/serialize";

export const maxDuration = 60;

// "Preview before you pay": four cheap stills of the shot the video prompt
// describes, so the user picks a frame before spending 40+ credits on the
// render. It's a normal image generation under the hood (batch of 4, 1
// credit, tagged as a preview) — the chosen frame becomes the video's first
// frame.

const schema = z.object({
  modelId: z.string().max(40),
  presetId: z.string().max(40).optional(),
  prompt: z.string().trim().max(2000).default(""),
  ratio: z.string().max(10).default("16:9"),
});

export const PREVIEW_COST = 1;

export function POST(req: Request) {
  return handle(async () => {
    const user = await getOrCreateUser();
    await rateLimit("preview", user.id, 30, 3600);
    const input = await readJson(req, schema);
    const preset = getPreset(input.presetId);
    const prompt = [input.prompt || preset.name, preset.promptSuffix, "cinematic film still, first frame"].filter(Boolean).join(", ");
    try {
      const gen = await submit(user, {
        kind: "image",
        modelId: "nano_banana_2_lite", // cheapest image model: 1 credit for the batch
        prompt,
        ratio: input.ratio === "9:16" || input.ratio === "16:9" || input.ratio === "1:1" ? input.ratio : "16:9",
        resolution: "1K",
        batch: 4,
        style: "Cinematic",
        quality: "Standard",
        preview: { for: input.modelId, presetId: preset.id },
      } as Parameters<typeof submit>[1]);
      after(() => run(gen.id).catch(() => {}));
      return NextResponse.json({ generation: serialize(gen), credits: user.credits - gen.cost });
    } catch (err) {
      if (err instanceof InsufficientCredits) return NextResponse.json({ error: "insufficient_credits", needed: err.needed, have: err.have }, { status: 402 });
      throw err;
    }
  });
}
