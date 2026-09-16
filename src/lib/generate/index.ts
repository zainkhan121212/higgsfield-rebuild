import "server-only";
import { z } from "zod";
import { db } from "../db";
import { getImageModel, getVideoModel, imageCost, videoCost } from "../catalog/models";
import { getPreset } from "../catalog/presets";
import { generateImage, generateVideo } from "./providers";
import type { Generation, User } from "@prisma/client";

export const imageInput = z.object({
  kind: z.literal("image"),
  modelId: z.string(),
  prompt: z.string().trim().min(1, "Describe what you want to see").max(2000),
  ratio: z.string().default("1:1"),
  resolution: z.string().default("1K"),
  batch: z.number().int().min(1).max(4).default(1),
  quality: z.string().optional(),
  style: z.string().optional(),
  /** set when this batch is a "preview before you pay" for a video job */
  preview: z.object({ for: z.string(), presetId: z.string() }).optional(),
});

export const PREVIEW_COST = 1;

export const videoInput = z.object({
  kind: z.literal("video"),
  modelId: z.string(),
  presetId: z.string().optional(),
  prompt: z.string().trim().max(2000).default(""),
  ratio: z.string().default("16:9"),
  resolution: z.string().default("1080p"),
  durationSec: z.number().int().min(2).max(30).default(5),
  bitrate: z.string().optional(),
  referenceUrl: z.string().url().optional(),
});

export const generateInput = z.discriminatedUnion("kind", [imageInput, videoInput]);
export type GenerateInput = z.infer<typeof generateInput>;

export class InsufficientCredits extends Error {
  constructor(public needed: number, public have: number) {
    super("Not enough credits");
  }
}

/** Price a request without running it. */
export function priceFor(input: GenerateInput): number {
  if (input.kind === "image") {
    if (input.preview) return PREVIEW_COST;
    return imageCost(getImageModel(input.modelId), input.resolution, input.batch);
  }
  return videoCost(getVideoModel(input.modelId), input.durationSec, input.resolution);
}

/** Create the job row and debit credits atomically. Does not run it. */
export async function submit(user: User, input: GenerateInput): Promise<Generation> {
  const cost = priceFor(input);
  const prompt = input.kind === "video" && !input.prompt ? getPreset(input.presetId).name : input.prompt;

  return db.$transaction(async (tx) => {
    const fresh = await tx.user.findUniqueOrThrow({ where: { id: user.id }, select: { credits: true } });
    if (fresh.credits < cost) throw new InsufficientCredits(cost, fresh.credits);

    const gen = await tx.generation.create({
      data: {
        userId: user.id,
        kind: input.kind === "image" ? "IMAGE" : "VIDEO",
        modelId: input.modelId,
        presetId: input.kind === "video" ? input.presetId ?? "general" : input.preview ? `preview:${input.preview.for}:${input.preview.presetId}` : null,
        prompt,
        params: input as object,
        cost,
        isPublic: !(input.kind === "image" && input.preview),
        durationSec: input.kind === "video" ? input.durationSec : null,
      },
    });
    await tx.user.update({ where: { id: user.id }, data: { credits: { decrement: cost } } });
    await tx.creditEntry.create({ data: { userId: user.id, delta: -cost, reason: `generate:${input.kind}`, refId: gen.id } });
    return gen;
  });
}

/** Run a queued job to completion. Safe to call twice; second call no-ops. */
export async function run(id: string): Promise<Generation> {
  const claimed = await db.generation.updateMany({
    where: { id, status: "QUEUED" },
    data: { status: "RUNNING", startedAt: new Date() },
  });
  if (claimed.count === 0) return db.generation.findUniqueOrThrow({ where: { id } });

  const gen = await db.generation.findUniqueOrThrow({ where: { id } });
  const params = gen.params as GenerateInput;

  try {
    if (params.kind === "image") {
      const model = getImageModel(params.modelId);
      const res = await generateImage({
        model, prompt: gen.prompt, ratio: params.ratio, resolution: params.resolution, batch: params.batch, seed: gen.id, small: !!params.preview,
      });
      return await db.generation.update({
        where: { id },
        data: {
          status: "DONE", outputs: res.urls, thumbnailUrl: res.urls[0], width: res.width, height: res.height,
          simulated: res.simulated, finishedAt: new Date(),
        },
      });
    }

    const model = getVideoModel(params.modelId);
    const preset = getPreset(params.presetId);
    const fullPrompt = [gen.prompt, preset.promptSuffix].filter(Boolean).join(", ");
    const res = await generateVideo({
      model, presetId: params.presetId, prompt: fullPrompt, ratio: params.ratio, resolution: params.resolution, durationSec: params.durationSec, seed: gen.id,
      imageUrl: params.referenceUrl,
    });
    return await db.generation.update({
      where: { id },
      data: {
        status: "DONE", outputs: [res.url], thumbnailUrl: res.thumbnailUrl ?? params.referenceUrl ?? null, width: res.width, height: res.height,
        simulated: res.simulated, finishedAt: new Date(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    // Refund on failure.
    await db.$transaction([
      db.generation.update({ where: { id }, data: { status: "FAILED", error: message.slice(0, 500), finishedAt: new Date() } }),
      db.user.update({ where: { id: gen.userId }, data: { credits: { increment: gen.cost } } }),
      db.creditEntry.create({ data: { userId: gen.userId, delta: gen.cost, reason: "refund:failed", refId: id } }),
    ]);
    return db.generation.findUniqueOrThrow({ where: { id } });
  }
}

/** Jobs stuck in QUEUED/RUNNING (serverless function died) get retried by the poller. */
export const STALE_AFTER_MS = 90_000;
