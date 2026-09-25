// Pre-generate every still the marketing surfaces need, with the same model
// the app generates with, and write them into public/media.
//
// Why: the catalog used to point at a keyless public endpoint that rate-limits
// hard, so a judge loading the site could meet a wall of broken tiles. Now
// every picture on the site came out of this app's own pipeline and is served
// from our own origin.
//
//   node --env-file=.env.local scripts/generate-media.mjs [--limit N] [--force]
//
// The dev server must be running (it serves the media plan from the catalog).

import { fal } from "@fal-ai/client";
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "media");
const MANIFEST = path.join(process.cwd(), "src", "lib", "catalog", "media-manifest.json");
const ORIGIN = process.env.DEV_ORIGIN || "http://localhost:3000";
const LIMIT = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] || 0);
const FORCE = process.argv.includes("--force");
const CONCURRENCY = 4;

fal.config({ credentials: process.env.FAL_KEY });
fs.mkdirSync(OUT, { recursive: true });

/** Pull prompt + size back out of a catalog image URL. */
function parse(url) {
  const u = new URL(url);
  const prompt = decodeURIComponent(u.pathname.replace(/^\/prompt\//, ""));
  return {
    prompt,
    width: Number(u.searchParams.get("width") || 768),
    height: Number(u.searchParams.get("height") || 1024),
    seed: Number(u.searchParams.get("seed") || 0),
  };
}

const res = await fetch(`${ORIGIN}/api/media-plan`);
if (!res.ok) {
  console.error(`Could not read the media plan from ${ORIGIN} (${res.status}). Is the dev server running?`);
  process.exit(1);
}
let { plan } = await res.json();
if (LIMIT) plan = plan.slice(0, LIMIT);

const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
const todo = plan.filter((p) => FORCE || !manifest[p.key] || !fs.existsSync(path.join(OUT, `${p.key}.jpg`)));
console.log(`${plan.length} stills in the plan, ${todo.length} to generate, ${CONCURRENCY} at a time.`);

let done = 0;
let failed = 0;

async function one(item) {
  const { prompt, width, height, seed } = parse(item.url);
  try {
    const r = await fal.subscribe("fal-ai/flux/schnell", {
      input: { prompt, image_size: { width, height }, num_images: 1, num_inference_steps: 4, seed, enable_safety_checker: true },
    });
    const url = r.data?.images?.[0]?.url;
    if (!url) throw new Error("no image returned");
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    fs.writeFileSync(path.join(OUT, `${item.key}.jpg`), buf);
    manifest[item.key] = `/media/${item.key}.jpg`;
    done++;
    process.stdout.write(`\r  ${done + failed}/${todo.length}  ok:${done} fail:${failed}   `);
  } catch (e) {
    failed++;
    console.log(`\n  ! ${item.key}: ${e.body ? JSON.stringify(e.body) : e.message}`);
  }
}

// A small worker pool: fal is happy with a handful in flight and this keeps a
// ninety-image run to about a minute.
const queue = [...todo];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) await one(queue.shift());
  }),
);

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`\nWrote ${Object.keys(manifest).length} entries to media-manifest.json (${failed} failed).`);
