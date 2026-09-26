import { NextResponse } from "next/server";
import { HttpError, caller, limitDurable, readJson, sameOrigin, securityEvent } from "@/lib/server/guard";
import { LOOKS, cleanSubject, composePrompt, type Look } from "@/lib/server/prompt";

// Prompt → picture. POST {prompt, look, format} → image bytes from our own
// origin (so the canvas can read the pixels).
//
// With FAL_KEY set, fal's FLUX runs the press's brief (lib/server/prompt.ts)
// around the visitor's words. Without it, Pollinations' keyless FLUX does the
// same brief and stamps a small mark in the corner; x-trim-bottom tells the
// client how much to crop.

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const FORMATS = {
  desktop: { width: 1344, height: 768 },
  phone: { width: 720, height: 1440 },
  square: { width: 1024, height: 1024 },
  original: { width: 1024, height: 1024 },
} as const;
type Format = keyof typeof FORMATS;

// Spend caps. Per visitor: a burst limit and a daily limit. For the whole
// site: a daily ceiling on paid generations, so a flood can't drain the fal
// balance. Set the fal dashboard's own spending limit as the final backstop.
const PER_10_MIN = Number(process.env.IMAGINE_PER_10_MIN ?? 8);
const PER_DAY = Number(process.env.IMAGINE_PER_DAY ?? 40);
const SITE_PER_DAY = Number(process.env.IMAGINE_SITE_PER_DAY ?? 500);
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

function fail(status: number, error: string, headers: Record<string, string> = {}) {
  return NextResponse.json({ error }, { status, headers: { "cache-control": "no-store", ...headers } });
}

export async function POST(req: Request) {
  const who = caller(req);
  try {
    if (!sameOrigin(req)) {
      securityEvent("imagine.cross_site", { who });
      throw new HttpError(403, "Requests must come from the Pied site.");
    }
    for (const [key, max, win] of [
      [`imagine:m:${who}`, PER_10_MIN, 600],
      [`imagine:d:${who}`, PER_DAY, 86400],
      ["imagine:site", SITE_PER_DAY, 86400],
    ] as const) {
      // Durable (database-backed) when accounts are set up, so the caps hold
      // across every serverless instance; in-memory otherwise.
      const r = await limitDurable(key, max, win);
      if (!r.ok) {
        securityEvent("imagine.rate_limited", { who, bucket: key.split(":")[1] });
        throw new HttpError(
          429,
          key === "imagine:site" ? "The press has made all the pictures it can today. Upload one of your own, or try tomorrow." : "That's a lot of pictures. Give it a few minutes.",
          { "retry-after": String(r.retryAfter) },
        );
      }
    }

    const body = (await readJson(req, 2048)) as { prompt?: unknown; look?: unknown; format?: unknown };
    const subject = cleanSubject(body?.prompt);
    if (subject.length < 2) throw new HttpError(400, "Write a few words first.");
    const look: Look = typeof body.look === "string" && body.look in LOOKS ? (body.look as Look) : "photo";
    const format: Format = typeof body.format === "string" && body.format in FORMATS ? (body.format as Format) : "desktop";
    const { width, height } = FORMATS[format];
    const prompt = composePrompt(subject, look);

    const out = process.env.FAL_KEY ? await viaFal(prompt, width, height) : await viaPollinations(prompt, width, height);
    return new NextResponse(out.buf, {
      headers: {
        "content-type": out.type,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "x-trim-bottom": String(out.trim),
      },
    });
  } catch (e) {
    if (e instanceof HttpError) return fail(e.status, e.message, e.headers);
    // Never echo upstream errors: they can carry request details. Log a
    // short reason for ourselves, give the visitor a plain sentence.
    securityEvent("imagine.upstream_error", { who, reason: e instanceof Error ? e.message.slice(0, 120) : "unknown" });
    return fail(502, "The press couldn't make that picture just now. Try again in a moment.");
  }
}

export function GET() {
  return fail(405, "Use POST.", { allow: "POST" });
}

async function viaFal(prompt: string, width: number, height: number) {
  const model = process.env.FAL_MODEL ?? "fal-ai/flux/schnell";
  if (!/^fal-ai\/[a-z0-9./-]+$/.test(model)) throw new Error("bad FAL_MODEL");
  const res = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: { authorization: `Key ${process.env.FAL_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      prompt,
      image_size: { width, height },
      num_images: 1,
      enable_safety_checker: true,
      output_format: "jpeg",
      // Return the image inline: no second fetch to a URL we'd have to trust.
      sync_mode: true,
      ...(model.endsWith("/schnell") ? { num_inference_steps: 4 } : {}),
    }),
    signal: AbortSignal.timeout(55_000),
  });
  if (!res.ok) throw new Error(`fal ${res.status}`);
  const data = (await res.json()) as { images?: { url?: string }[]; has_nsfw_concepts?: boolean[] };
  if (data.has_nsfw_concepts?.[0]) {
    securityEvent("imagine.nsfw_blocked");
    throw new HttpError(422, "The press won't print that one. Try describing something else.");
  }
  const url = data.images?.[0]?.url ?? "";
  return { ...(await imageFrom(url)), trim: 0 };
}

// Accept only an inline data: image, or an https URL on fal's own media
// domain. Anything else is refused rather than fetched (no SSRF).
async function imageFrom(url: string) {
  const inline = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(url);
  if (inline) {
    const buf = Buffer.from(inline[2], "base64");
    if (buf.byteLength > MAX_IMAGE_BYTES) throw new Error("image too large");
    return { buf: new Uint8Array(buf), type: inline[1] };
  }
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    throw new Error("fal returned no image");
  }
  if (u.protocol !== "https:" || !(u.hostname === "fal.media" || u.hostname.endsWith(".fal.media"))) throw new Error("unexpected image host");
  const res = await fetch(u, { signal: AbortSignal.timeout(20_000) });
  const type = res.headers.get("content-type") ?? "";
  if (!res.ok || !/^image\/(jpeg|png|webp)/.test(type)) throw new Error("image fetch failed");
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength > MAX_IMAGE_BYTES) throw new Error("image too large");
  return { buf, type };
}

async function viaPollinations(prompt: string, width: number, height: number) {
  const seed = Math.floor(Math.random() * 1e9);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux&safe=true`;
  // The keyless tier answers bursts with 5xx; back off and retry.
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { headers: { accept: "image/*" }, cache: "no-store", signal: AbortSignal.timeout(40_000) }).catch(() => null);
    const type = res?.headers.get("content-type") ?? "";
    if (res?.ok && /^image\/(jpeg|png|webp)/.test(type)) {
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength > MAX_IMAGE_BYTES) throw new Error("image too large");
      return { buf, type, trim: 0.07 };
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
  throw new Error("pollinations busy");
}
