import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { run, STALE_AFTER_MS } from "@/lib/generate";
import { serialize } from "@/lib/serialize";

export const maxDuration = 60;

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let gen = await db.generation.findUnique({ where: { id } });
  if (!gen) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // If the background task never ran (cold function killed), pick it up here.
  const age = Date.now() - gen.createdAt.getTime();
  if (gen.status === "QUEUED" && age > 5_000) {
    gen = await run(id);
  } else if (gen.status === "RUNNING" && gen.startedAt && Date.now() - gen.startedAt.getTime() > STALE_AFTER_MS) {
    await db.generation.update({ where: { id }, data: { status: "QUEUED", startedAt: null } });
    gen = await run(id);
  }
  return NextResponse.json({ generation: serialize(gen) });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json()) as { isFavorite?: boolean; folderId?: string | null; isPublic?: boolean };
  const gen = await db.generation.update({
    where: { id, userId: user.id },
    data: {
      ...(typeof body.isFavorite === "boolean" ? { isFavorite: body.isFavorite } : {}),
      ...(typeof body.isPublic === "boolean" ? { isPublic: body.isPublic } : {}),
      ...(body.folderId !== undefined ? { folderId: body.folderId } : {}),
    },
  });
  return NextResponse.json({ generation: serialize(gen) });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await db.generation.delete({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
