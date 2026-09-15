import "server-only";
import { fal } from "@fal-ai/client";
import type { ImageModel, VideoModel } from "../catalog/models";
import { dimsFor } from "../utils";
import { clipForPreset, clipUrl } from "../catalog/clips";

export const hasFal = () => Boolean(process.env.FAL_KEY);
export const realVideo = () => hasFal() && process.env.VIDEO_MODE === "real";

let configured = false;
function client() {
  if (!configured) {
    fal.config({ credentials: process.env.FAL_KEY });
    configured = true;
  }
  return fal;
}

export interface ImageRequest {
  model: ImageModel;
  prompt: string;
  ratio: string;
  resolution: string;
  batch: number;
  seed: string;
}

export interface ImageResult {
  urls: string[];
  width: number;
  height: number;
  simulated: boolean;
}

function baseFor(resolution: string) {
  // fal caps flux at ~1.5MP; anything "bigger" is a label, not a pixel count.
  return resolution === "4K" || resolution === "2K" ? 1408 : resolution === "1.5K" ? 1216 : 1024;
}

export async function generateImage(req: ImageRequest): Promise<ImageResult> {
  const { width, height } = dimsFor(req.ratio, baseFor(req.resolution));
  const backend = req.model.backend;

  if (backend.type === "fal" && hasFal()) {
    const prompt = backend.styleSuffix ? `${req.prompt}, ${backend.styleSuffix}` : req.prompt;
    const input: Record<string, unknown> = {
      prompt,
      image_size: { width, height },
      num_images: req.batch,
      enable_safety_checker: true,
      output_format: "jpeg",
    };
    if (backend.endpoint === "fal-ai/flux/schnell") input.num_inference_steps = 4;
    if (backend.endpoint === "fal-ai/flux/dev") input.num_inference_steps = 28;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await client().subscribe(backend.endpoint as any, { input: input as any, logs: false });
    const data = result.data as { images: { url: string; width: number; height: number }[] };
    return {
      urls: data.images.map((i) => i.url),
      width: data.images[0]?.width ?? width,
      height: data.images[0]?.height ?? height,
      simulated: false,
    };
  }

  // No fal key: Pollinations is a keyless FLUX endpoint. The image is really
  // generated from the prompt; we fetch it server-side so the job only
  // completes once the CDN has it (subsequent loads are instant).
  if (process.env.IMAGE_MODE !== "placeholder") {
    const styled = backend.type === "fal" && backend.styleSuffix ? `${req.prompt}, ${backend.styleSuffix}` : req.prompt;
    const urls = Array.from({ length: req.batch }, (_, i) => pollinationsUrl(styled, width, height, hash(`${req.seed}-${i}`)));
    // The keyless tier rate-limits concurrent requests, so warm sequentially
    // within a time budget; whatever is left renders lazily in the browser.
    const deadline = Date.now() + 45_000;
    for (const [i, u] of urls.entries()) {
      const left = deadline - Date.now();
      if (left < 3_000) break;
      await warm(u, Math.min(left, 30_000), i === 0 ? 3 : 1);
    }
    return { urls, width, height, simulated: false };
  }

  // Placeholder photos so the UI has something to lay out.
  await sleep(1500 + Math.random() * 2000);
  const urls = Array.from({ length: req.batch }, (_, i) =>
    `https://picsum.photos/seed/${req.seed}-${i}/${width}/${height}`,
  );
  return { urls, width, height, simulated: true };
}

function pollinationsUrl(prompt: string, width: number, height: number, seed: number) {
  // Pollinations caps at ~1MP per side comfortably; keep it snappy.
  const scale = Math.min(1, 1024 / Math.max(width, height));
  const w = Math.round((width * scale) / 8) * 8;
  const h = Math.round((height * scale) / 8) * 8;
  const q = new URLSearchParams({ width: String(w), height: String(h), seed: String(seed % 1_000_000), model: "flux", nologo: "true", safe: "true", enhance: "false" });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.slice(0, 600))}?${q.toString()}`;
}

async function warm(url: string, timeoutMs: number, attempts: number) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
      if (res.status === 429 || res.status >= 500) {
        if (attempt === attempts) throw new Error(`Image backend is busy (${res.status}). Try again in a moment.`);
        await sleep(4_000 * attempt);
        continue;
      }
      if (!res.ok) throw new Error(`Image backend returned ${res.status}`);
      await res.arrayBuffer();
      return;
    } catch (err) {
      // A timeout just means the browser will wait for the CDN instead.
      if (err instanceof Error && err.name === "AbortError") return;
      if (attempt === attempts) throw err;
      await sleep(4_000 * attempt);
    } finally {
      clearTimeout(t);
    }
  }
}

export interface VideoRequest {
  model: VideoModel;
  presetId?: string | null;
  prompt: string;
  ratio: string;
  resolution: string;
  durationSec: number;
  seed: string;
}

export interface VideoResult {
  url: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  simulated: boolean;
}

// Free-license stock clips for General (no preset) simulated renders.
const SAMPLE_CLIPS = [40640, 40733, 41160, 42039, 33896, 40367, 35230, 1367].map((id) => clipUrl(id, 720));

export async function generateVideo(req: VideoRequest): Promise<VideoResult> {
  const { width, height } = dimsFor(req.ratio, req.resolution === "1080p" ? 1920 : 1280);
  const backend = req.model.backend;

  if (backend.type === "fal" && realVideo()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await client().subscribe(backend.endpoint as any, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      input: { prompt: req.prompt, aspect_ratio: req.ratio, duration: String(req.durationSec) } as any,
      logs: false,
    });
    const data = result.data as { video: { url: string } };
    return { url: data.video.url, width, height, simulated: false };
  }

  // Simulated: a believable wait, then the stock clip that matches the
  // preset (or, for General, one picked by seed).
  await sleep(6000 + Math.random() * 6000);
  const url = req.presetId && req.presetId !== "general" ? clipUrl(clipForPreset(req.presetId).id, 720) : SAMPLE_CLIPS[hash(req.seed) % SAMPLE_CLIPS.length];
  return { url, width, height, simulated: true };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
