// Seeds the "Higgsfield Studio" showcase account with real generations so the
// Explore feed is never empty, and warms every preset thumbnail on the image
// CDN. Idempotent. Run with DATABASE_URL pointing at the target database:
//
//   node scripts/seed.mjs            # seed feed + warm thumbs
//   node scripts/seed.mjs --warm     # only warm preset thumbs
//
import { PrismaClient } from "@prisma/client";

const SHOWCASE = [
  ["soul_cinema", "16:9", "A woman in a yellow raincoat under neon signs in Tokyo rain, anamorphic lens flare, 35mm film"],
  ["soul_2", "3:4", "Editorial fashion photo, oversized charcoal wool coat, brutalist concrete plaza, overcast light"],
  ["nano_banana_2", "1:1", "Product shot of a matte black sneaker floating above wet concrete, studio rim light"],
  ["gpt_image_2_5_sunburst", "3:2", "Sunlit kitchen with a bowl of blood oranges, harsh morning shadows, high dynamic range"],
  ["seedream_5_pro", "4:3", "Isometric tiny diner at night, warm windows, snow falling, miniature look"],
  ["recraft_v4_1", "1:1", "Flat vector poster of a monorail crossing a desert canyon at golden hour"],
  ["soul_cinema", "21:9", "Two figures on a foggy pier at dawn, teal and amber grade, shallow focus"],
  ["nano_banana_pro", "9:16", "Skateboarder mid-air over a rooftop ledge at golden hour, motion blur, vivid"],
  ["grok_imagine_2", "16:9", "A colossal whale drifting above a mountain village, dramatic clouds, bold graphic style"],
  ["soul_2", "3:4", "Close-up portrait, freckles, wet hair, silver hoop earring, soft window light"],
  ["seedream_4_5", "16:9", "Cyberpunk street market, holographic signs, rain, volumetric haze, 4K detail"],
  ["nano_banana_2_lite", "1:1", "Macro photo of a dewdrop on a fern leaf, morning light, shallow depth of field"],
  ["gpt_image_2", "1:1", "Minimal album cover, a single lime-green circle on black, typographic title 'SIGNAL'"],
  ["soul_cinema", "16:9", "A boxer wrapped in hand tape in a dim gym, single tungsten bulb, dust in the air"],
  ["nano_banana_pro", "4:3", "Retro-futurist train station, brass and glass, travellers in long coats, warm haze"],
  ["seedream_5_lite", "9:16", "Dancer in a flowing red dress on a rooftop, wind, city lights below, long exposure"],
];

const STYLE = {
  soul_cinema: "cinematic still, anamorphic, moody color grade",
  soul_2: "editorial fashion photograph, natural skin texture, 35mm film grain",
  nano_banana_2: "vivid, saturated, punchy contrast",
  nano_banana_pro: "vivid, saturated, punchy contrast",
  gpt_image_2_5_sunburst: "bright natural light, crisp detail",
  gpt_image_2: "clean product-render quality, legible typography",
  recraft_v4_1: "flat vector illustration, clean shapes, bold palette",
  grok_imagine_2: "bold graphic style, dramatic lighting",
};

const RATIO = { "1:1": [1024, 1024], "3:4": [768, 1024], "4:3": [1024, 768], "9:16": [576, 1024], "16:9": [1024, 576], "3:2": [1024, 683], "21:9": [1024, 439] };

function hash(s) {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function url(prompt, w, h, seed) {
  const q = new URLSearchParams({ width: String(w), height: String(h), seed: String(seed % 100000), model: "flux", nologo: "true", safe: "true", enhance: "false" });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${q}`;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function warm(u, label) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const t0 = Date.now();
    try {
      const res = await fetch(u);
      if (res.status === 429 || res.status >= 500) throw new Error(String(res.status));
      await res.arrayBuffer();
      console.log(`  ok   ${label} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
      return true;
    } catch (e) {
      console.log(`  retry ${label}: ${e.message}`);
      await sleep(5000 * attempt);
    }
  }
  console.log(`  FAIL ${label}`);
  return false;
}

async function warmPresets() {
  const { PRESETS, presetThumbUrl } = await import("../src/lib/catalog/presets.ts");
  console.log(`Warming ${PRESETS.length} preset thumbnails…`);
  for (const p of PRESETS) {
    await warm(presetThumbUrl(p, "card"), p.id);
    await sleep(1500);
  }
}

async function seedFeed() {
  const db = new PrismaClient();
  const handle = "higgsfield_studio";
  const user = await db.user.upsert({
    where: { handle },
    update: {},
    create: { name: "Higgsfield Studio", handle, credits: 100000, plan: "MAX" },
  });
  console.log(`Seeding feed for ${user.name} (${user.id})…`);
  for (const [i, [modelId, ratio, prompt]] of SHOWCASE.entries()) {
    const id = `seed_${i.toString().padStart(2, "0")}_${hash(prompt).toString(36)}`;
    const exists = await db.generation.findUnique({ where: { id } });
    if (exists && exists.status === "DONE") {
      console.log(`  skip ${id}`);
      continue;
    }
    const [w, h] = RATIO[ratio];
    const styled = STYLE[modelId] ? `${prompt}, ${STYLE[modelId]}` : prompt;
    const u = url(styled, w, h, hash(id));
    const ok = await warm(u, id);
    if (!ok) continue;
    await db.generation.upsert({
      where: { id },
      update: { status: "DONE", outputs: [u], thumbnailUrl: u },
      create: {
        id,
        userId: user.id,
        kind: "IMAGE",
        modelId,
        prompt,
        params: { kind: "image", modelId, prompt, ratio, resolution: "1K", batch: 1 },
        status: "DONE",
        cost: 2,
        outputs: [u],
        thumbnailUrl: u,
        width: w,
        height: h,
        simulated: false,
        isPublic: true,
        createdAt: new Date(Date.now() - (SHOWCASE.length - i) * 3_600_000),
        finishedAt: new Date(),
      },
    });
    await sleep(1500);
  }
  await db.$disconnect();
}

const warmOnly = process.argv.includes("--warm");
if (!warmOnly) await seedFeed();
await warmPresets();
console.log("done");
