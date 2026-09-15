import "server-only";
import { fal } from "@fal-ai/client";
import type { ImageModel, VideoModel } from "../catalog/models";
import { dimsFor } from "../utils";

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

  // Simulated: deterministic placeholder photos so the UI has something real
  // to lay out. Delay mimics a real queue.
  await sleep(1500 + Math.random() * 2000);
  const urls = Array.from({ length: req.batch }, (_, i) =>
    `https://picsum.photos/seed/${req.seed}-${i}/${width}/${height}`,
  );
  return { urls, width, height, simulated: true };
}

export interface VideoRequest {
  model: VideoModel;
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

// CC-licensed sample clips (Blender Foundation / Google sample bucket).
const SAMPLE_CLIPS = [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
];

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

  // Simulated: a believable wait, then a sample clip picked by seed.
  await sleep(6000 + Math.random() * 6000);
  const idx = hash(req.seed) % SAMPLE_CLIPS.length;
  return { url: SAMPLE_CLIPS[idx], width, height, simulated: true };
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
