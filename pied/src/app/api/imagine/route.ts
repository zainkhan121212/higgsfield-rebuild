import { NextResponse } from "next/server";

// Prompt → picture. Returns the image bytes from our own origin, so the
// browser can read its pixels (a cross-origin image would taint the canvas).
//
// With FAL_KEY set this uses fal's FLUX schnell; otherwise Pollinations'
// keyless FLUX endpoint, which stamps a small mark in the bottom corner —
// the response says how much to trim (x-trim-bottom) and the client crops it.

export const maxDuration = 60;

const hits = new Map<string, { n: number; reset: number }>();
function limited(key: string, max = 20, windowMs = 10 * 60_000) {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    return false;
  }
  h.n++;
  return h.n > max;
}

const clampDim = (v: string | null, def: number) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.round(Math.min(1440, Math.max(256, n)) / 16) * 16;
};

async function viaFal(prompt: string, width: number, height: number, seed: number) {
  const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: { authorization: `Key ${process.env.FAL_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ prompt, image_size: { width, height }, num_inference_steps: 4, seed, enable_safety_checker: true, output_format: "jpeg" }),
  });
  if (!res.ok) throw new Error(`fal ${res.status}`);
  const data = (await res.json()) as { images?: { url: string }[] };
  const url = data.images?.[0]?.url;
  if (!url) throw new Error("fal returned no image");
  const img = await fetch(url);
  if (!img.ok) throw new Error(`fal image ${img.status}`);
  return { buf: await img.arrayBuffer(), type: img.headers.get("content-type") ?? "image/jpeg", trim: 0 };
}

async function viaPollinations(prompt: string, width: number, height: number, seed: number) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
  // The keyless tier answers bursts with 5xx; back off and retry.
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, { headers: { accept: "image/*" }, cache: "no-store" }).catch(() => null);
    if (res?.ok && (res.headers.get("content-type") ?? "").startsWith("image/")) {
      return { buf: await res.arrayBuffer(), type: res.headers.get("content-type") ?? "image/jpeg", trim: 0.07 };
    }
    if (attempt < 4) await new Promise((r) => setTimeout(r, 2500 * attempt));
  }
  throw new Error("image service busy");
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const prompt = (q.get("prompt") ?? "").replace(/\s+/g, " ").trim().slice(0, 500);
  if (prompt.length < 2) return NextResponse.json({ error: "Write a few words first." }, { status: 400 });
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  if (limited(ip)) return NextResponse.json({ error: "That's a lot of pictures — give it a few minutes." }, { status: 429 });

  const width = clampDim(q.get("w"), 1344);
  const height = clampDim(q.get("h"), 768);
  const seed = Math.abs(Math.floor(Number(q.get("seed")) || Math.random() * 1e9)) % 1e9;

  try {
    const out = process.env.FAL_KEY ? await viaFal(prompt, width, height, seed) : await viaPollinations(prompt, width, height, seed);
    return new NextResponse(out.buf, {
      headers: {
        "content-type": out.type,
        "cache-control": "private, max-age=3600",
        "x-content-type-options": "nosniff",
        "x-trim-bottom": String(out.trim),
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error && e.message === "image service busy" ? "The image service is busy. Try again in a moment." : "Could not make that picture." }, { status: 502 });
  }
}
