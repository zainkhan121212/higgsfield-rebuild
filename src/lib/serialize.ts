import type { Generation } from "@prisma/client";

export type GenerationDTO = {
  id: string;
  kind: "image" | "video";
  modelId: string;
  presetId: string | null;
  prompt: string;
  params: Record<string, unknown>;
  status: "queued" | "running" | "done" | "failed";
  cost: number;
  outputs: string[];
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  durationSec: number | null;
  error: string | null;
  simulated: boolean;
  isFavorite: boolean;
  isPublic: boolean;
  folderId: string | null;
  createdAt: string;
  finishedAt: string | null;
};

export function serialize(g: Generation): GenerationDTO {
  return {
    id: g.id,
    kind: g.kind === "IMAGE" ? "image" : "video",
    modelId: g.modelId,
    presetId: g.presetId,
    prompt: g.prompt,
    params: (g.params ?? {}) as Record<string, unknown>,
    status: g.status.toLowerCase() as GenerationDTO["status"],
    cost: g.cost,
    outputs: g.outputs,
    thumbnailUrl: g.thumbnailUrl,
    width: g.width,
    height: g.height,
    durationSec: g.durationSec,
    error: g.error,
    simulated: g.simulated,
    isFavorite: g.isFavorite,
    isPublic: g.isPublic,
    folderId: g.folderId,
    createdAt: g.createdAt.toISOString(),
    finishedAt: g.finishedAt?.toISOString() ?? null,
  };
}
