// Static model catalog: house models plus the real third-party ones; `backend` is
// what this app actually runs. Anything without a real backend is simulated
// and says so in the UI.

export type Kind = "image" | "video";
export type Badge = "TOP" | "NEW" | "PREMIUM" | "FREE";
export type Vendor = "frameline" | "openai" | "google" | "bytedance" | "minimax" | "kling" | "flux" | "xai" | "wan" | "recraft";

export type ImageBackend =
  | { type: "fal"; endpoint: "fal-ai/flux/schnell" | "fal-ai/flux/dev" | "fal-ai/fast-sdxl"; styleSuffix?: string }
  | { type: "simulated" };

export type VideoBackend =
  | { type: "fal"; endpoint: "fal-ai/minimax/video-01" | "fal-ai/kling-video/v1/standard/text-to-video" }
  | { type: "simulated" };

export interface ImageModel {
  kind: "image";
  id: string;
  name: string;
  vendor: Vendor;
  badge?: Badge;
  description: string;
  featured: boolean;
  cost: number; // credits per image
  ratios: string[];
  resolutions: string[];
  maxBatch: number;
  backend: ImageBackend;
}

export interface VideoModel {
  kind: "video";
  id: string;
  name: string;
  vendor: Vendor;
  badge?: Badge;
  description: string;
  featured: boolean;
  caps: string[]; // pills shown in picker e.g. "1080p", "4s-30s"
  durations: number[];
  ratios: string[];
  resolutions: string[];
  costPerSecond: number;
  backend: VideoBackend;
}

export type Model = ImageModel | VideoModel;

const schnell = (styleSuffix?: string): ImageBackend => ({ type: "fal", endpoint: "fal-ai/flux/schnell", styleSuffix });
const dev = (styleSuffix?: string): ImageBackend => ({ type: "fal", endpoint: "fal-ai/flux/dev", styleSuffix });

export const IMAGE_MODELS: ImageModel[] = [
  { kind: "image", id: "soul_2", name: "Frameline Portrait 2.0", vendor: "frameline", featured: true, description: "Next generation ultra-realistic fashion visuals", cost: 2, ratios: ["1:1", "3:4", "4:3", "9:16", "16:9"], resolutions: ["1K", "1.5K"], maxBatch: 4, backend: dev("editorial fashion photograph, natural skin texture, 35mm film grain, soft daylight") },
  { kind: "image", id: "soul_cinema", name: "Frameline Cinema", vendor: "frameline", featured: true, description: "Cinema-grade visual creation", cost: 2, ratios: ["16:9", "21:9", "3:4", "1:1"], resolutions: ["1K", "2K"], maxBatch: 4, backend: dev("cinematic still, anamorphic lens, shallow depth of field, moody color grade") },
  { kind: "image", id: "gpt_image_2_5_sunburst", name: "GPT Image 2.5 Sunburst", vendor: "openai", badge: "NEW", featured: true, description: "Exceptional quality, precise edits", cost: 8, ratios: ["Auto", "1:1", "3:2", "2:3"], resolutions: ["1K", "2K", "4K"], maxBatch: 4, backend: dev("bright natural light, crisp detail, high dynamic range") },
  { kind: "image", id: "gpt_image_2_5_flare", name: "GPT Image 2.5 Flare", vendor: "openai", badge: "NEW", featured: true, description: "Stunning everyday images, fast", cost: 4, ratios: ["Auto", "1:1", "3:2", "2:3"], resolutions: ["1K", "2K"], maxBatch: 4, backend: schnell() },
  { kind: "image", id: "gpt_image_2", name: "GPT Image 2", vendor: "openai", badge: "PREMIUM", featured: true, description: "4K images with near-perfect text rendering", cost: 8, ratios: ["Auto", "1:1", "3:2", "2:3"], resolutions: ["2K", "4K"], maxBatch: 4, backend: dev("clean product-render quality, legible typography") },
  { kind: "image", id: "seedream_5_pro", name: "Seedream 5.0 Pro", vendor: "bytedance", badge: "PREMIUM", featured: true, description: "Logically consistent images with intelligent visual reasoning", cost: 6, ratios: ["1:1", "4:3", "3:4", "16:9", "9:16"], resolutions: ["2K", "4K"], maxBatch: 4, backend: dev() },
  { kind: "image", id: "seedream_5_lite", name: "Seedream 5.0 lite", vendor: "bytedance", featured: true, description: "Intelligent visual reasoning", cost: 2, ratios: ["1:1", "4:3", "3:4", "16:9", "9:16"], resolutions: ["1K", "2K"], maxBatch: 4, backend: schnell() },
  { kind: "image", id: "seedream_4_5", name: "Seedream 4.5", vendor: "bytedance", badge: "PREMIUM", featured: true, description: "ByteDance's next-gen 4K image model", cost: 5, ratios: ["1:1", "4:3", "3:4", "16:9", "9:16"], resolutions: ["2K", "4K"], maxBatch: 4, backend: dev() },
  { kind: "image", id: "nano_banana_pro", name: "Nano Banana Pro", vendor: "google", featured: true, description: "Google's flagship generation model", cost: 2, ratios: ["1:1", "3:4", "4:3", "9:16", "16:9"], resolutions: ["1K", "2K"], maxBatch: 4, backend: dev("vivid, saturated, punchy contrast") },
  { kind: "image", id: "nano_banana_2", name: "Nano Banana 2", vendor: "google", badge: "PREMIUM", featured: true, description: "Pro quality at Flash speed", cost: 2, ratios: ["1:1", "3:4", "4:3", "9:16", "16:9"], resolutions: ["1K", "2K"], maxBatch: 4, backend: schnell("vivid, saturated, punchy contrast") },
  { kind: "image", id: "nano_banana_2_lite", name: "Nano Banana 2 Lite", vendor: "google", featured: true, description: "Fast everyday generations", cost: 1, ratios: ["1:1", "3:4", "4:3", "9:16", "16:9"], resolutions: ["1K"], maxBatch: 4, backend: schnell() },
  { kind: "image", id: "recraft_v4_1", name: "Recraft V4.1", vendor: "recraft", featured: true, description: "Vector-clean illustration and design", cost: 3, ratios: ["1:1", "4:3", "3:4", "16:9"], resolutions: ["1K", "2K"], maxBatch: 4, backend: schnell("flat vector illustration, clean shapes, bold palette") },
  { kind: "image", id: "nano_banana", name: "Nano Banana", vendor: "google", featured: false, description: "Fast, playful, good enough", cost: 1, ratios: ["1:1", "3:4", "4:3", "9:16", "16:9"], resolutions: ["1K"], maxBatch: 4, backend: schnell() },
  { kind: "image", id: "soul", name: "Frameline Portrait", vendor: "frameline", featured: false, description: "Ultra-realistic fashion visuals", cost: 1, ratios: ["3:4", "1:1", "9:16"], resolutions: ["1K", "1.5K"], maxBatch: 4, backend: schnell("editorial fashion photograph, film grain") },
  { kind: "image", id: "seedream_4", name: "Seedream 4.0", vendor: "bytedance", featured: false, description: "Previous-generation Seedream", cost: 2, ratios: ["1:1", "4:3", "3:4", "16:9", "9:16"], resolutions: ["1K", "2K"], maxBatch: 4, backend: schnell() },
  { kind: "image", id: "gpt_image_1_5", name: "GPT Image 1.5", vendor: "openai", featured: false, description: "Reliable all-rounder", cost: 4, ratios: ["Auto", "1:1", "3:2", "2:3"], resolutions: ["1K", "2K"], maxBatch: 4, backend: schnell() },
  { kind: "image", id: "grok_imagine_2", name: "Grok Imagine 2.0", vendor: "xai", featured: false, description: "Bold, stylised output", cost: 3, ratios: ["1:1", "16:9", "9:16"], resolutions: ["1K", "2K"], maxBatch: 4, backend: schnell("bold graphic style, dramatic lighting") },
];

export const VIDEO_MODELS: VideoModel[] = [
  { kind: "video", id: "seedance_2_5", name: "Seedance 2.5", vendor: "bytedance", badge: "TOP", featured: true, description: "The most advanced video model", caps: ["1080p", "4s–30s"], durations: [4, 5, 8, 10, 15, 30], ratios: ["16:9", "9:16", "1:1"], resolutions: ["720p", "1080p"], costPerSecond: 9, backend: { type: "simulated" } },
  { kind: "video", id: "genjutsu", name: "Frameline Restage", vendor: "frameline", badge: "NEW", featured: true, description: "Reality manipulation — transfer motion into new scenes", caps: ["1080p", "4s–30s"], durations: [4, 5, 8, 10], ratios: ["16:9", "9:16"], resolutions: ["720p", "1080p"], costPerSecond: 9, backend: { type: "simulated" } },
  { kind: "video", id: "seedance_2_5_edit", name: "Seedance 2.5 Edit", vendor: "bytedance", badge: "TOP", featured: true, description: "Edit existing footage with a prompt", caps: ["480p–720p", "Edit Video", "Audio"], durations: [4, 5, 8], ratios: ["16:9", "9:16"], resolutions: ["480p", "720p"], costPerSecond: 6, backend: { type: "simulated" } },
  { kind: "video", id: "seedance_2", name: "Seedance 2.0", vendor: "bytedance", featured: true, description: "4K cinematic motion", caps: ["4K", "4s–15s"], durations: [4, 5, 8, 10, 15], ratios: ["16:9", "9:16", "1:1"], resolutions: ["1080p", "4K"], costPerSecond: 7, backend: { type: "simulated" } },
  { kind: "video", id: "seedance_2_fast", name: "Seedance 2.0 Fast", vendor: "bytedance", featured: true, description: "Quick drafts", caps: ["720p", "4s–15s"], durations: [4, 5, 8, 10], ratios: ["16:9", "9:16", "1:1"], resolutions: ["720p"], costPerSecond: 3, backend: { type: "simulated" } },
  { kind: "video", id: "seedance_2_mini", name: "Seedance 2.0 Mini", vendor: "bytedance", featured: true, description: "Cheapest way to test an idea", caps: ["720p", "4s–15s"], durations: [4, 5, 8], ratios: ["16:9", "9:16"], resolutions: ["720p"], costPerSecond: 2, backend: { type: "simulated" } },
  { kind: "video", id: "minimax_h3", name: "MiniMax H3", vendor: "minimax", featured: true, description: "Strong physics and character motion", caps: ["2K", "5s–15s"], durations: [5, 10, 15], ratios: ["16:9", "9:16"], resolutions: ["1080p", "2K"], costPerSecond: 8, backend: { type: "fal", endpoint: "fal-ai/minimax/video-01" } },
  { kind: "video", id: "minimax_h3_max", name: "MiniMax H3 Max", vendor: "minimax", featured: true, description: "Longest, most detailed MiniMax", caps: ["768p", "5s–15s"], durations: [5, 10, 15], ratios: ["16:9", "9:16"], resolutions: ["768p"], costPerSecond: 10, backend: { type: "simulated" } },
  { kind: "video", id: "kling_3", name: "Kling 3.0", vendor: "kling", featured: true, description: "Smooth camera moves, great for people", caps: ["1080p", "5s–10s"], durations: [5, 8, 10], ratios: ["16:9", "9:16", "1:1"], resolutions: ["720p", "1080p"], costPerSecond: 7, backend: { type: "fal", endpoint: "fal-ai/kling-video/v1/standard/text-to-video" } },
  { kind: "video", id: "kling_3_motion", name: "Kling 3.0 Motion Control", vendor: "kling", featured: true, description: "Drive motion from a reference clip", caps: ["1080p", "5s–10s"], durations: [5, 8, 10], ratios: ["16:9", "9:16"], resolutions: ["720p", "1080p"], costPerSecond: 8, backend: { type: "simulated" } },
  { kind: "video", id: "flux_3_video", name: "FLUX.3 Video", vendor: "flux", featured: true, description: "Painterly, stylised motion", caps: ["1080p", "4s–8s"], durations: [4, 5, 8], ratios: ["16:9", "9:16", "1:1"], resolutions: ["720p", "1080p"], costPerSecond: 6, backend: { type: "simulated" } },
  { kind: "video", id: "grok_imagine_1_5", name: "Grok Imagine 1.5", vendor: "xai", featured: true, description: "Fast, expressive", caps: ["720p", "4s–8s"], durations: [4, 5, 8], ratios: ["16:9", "9:16"], resolutions: ["720p"], costPerSecond: 4, backend: { type: "simulated" } },
  { kind: "video", id: "wan_3", name: "Wan 3.0", vendor: "wan", featured: true, description: "Open-weights workhorse", caps: ["720p", "4s–8s"], durations: [4, 5, 8], ratios: ["16:9", "9:16", "1:1"], resolutions: ["480p", "720p"], costPerSecond: 3, backend: { type: "simulated" } },
  { kind: "video", id: "sora_2", name: "OpenAI Sora 2", vendor: "openai", featured: false, description: "Long, coherent scenes", caps: ["1080p", "5s–20s"], durations: [5, 10, 15, 20], ratios: ["16:9", "9:16", "1:1"], resolutions: ["720p", "1080p"], costPerSecond: 12, backend: { type: "simulated" } },
  { kind: "video", id: "veo", name: "Google Veo", vendor: "google", featured: false, description: "Photoreal, native audio", caps: ["1080p", "8s"], durations: [8], ratios: ["16:9", "9:16"], resolutions: ["720p", "1080p"], costPerSecond: 12, backend: { type: "simulated" } },
];

export const MODELS: Model[] = [...IMAGE_MODELS, ...VIDEO_MODELS];

export function getModel(id: string): Model | undefined {
  return MODELS.find((m) => m.id === id);
}

export function getImageModel(id?: string | null): ImageModel {
  return IMAGE_MODELS.find((m) => m.id === id) ?? IMAGE_MODELS.find((m) => m.id === "nano_banana_2_lite")!;
}

export function getVideoModel(id?: string | null): VideoModel {
  return VIDEO_MODELS.find((m) => m.id === id) ?? VIDEO_MODELS[0];
}

export function videoCost(model: VideoModel, durationSec: number, resolution: string): number {
  const resMul = resolution === "4K" || resolution === "2K" ? 1.5 : resolution === "1080p" ? 1 : 0.7;
  return Math.max(1, Math.round(model.costPerSecond * durationSec * resMul));
}

export function imageCost(model: ImageModel, resolution: string, batch: number): number {
  const resMul = resolution === "4K" ? 2 : resolution === "2K" ? 1.5 : 1;
  return Math.max(1, Math.round(model.cost * resMul * batch));
}

// A struck-through "list" price next to the discounted one.
export const LIST_PRICE_MULTIPLIER = 1.6;

export const VENDOR_LABEL: Record<Vendor, string> = {
  frameline: "Frameline",
  openai: "OpenAI",
  google: "Google",
  bytedance: "ByteDance",
  minimax: "MiniMax",
  kling: "Kling",
  flux: "Black Forest Labs",
  xai: "xAI",
  wan: "Alibaba",
  recraft: "Recraft",
};
