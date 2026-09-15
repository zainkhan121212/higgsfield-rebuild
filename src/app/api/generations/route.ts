import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { serialize } from "@/lib/serialize";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ generations: [] });
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  const take = Math.min(Number(url.searchParams.get("take") ?? 40), 100);
  const gens = await db.generation.findMany({
    where: { userId: user.id, ...(kind === "image" ? { kind: "IMAGE" } : kind === "video" ? { kind: "VIDEO" } : {}) },
    orderBy: { createdAt: "desc" },
    take,
  });
  return NextResponse.json({ generations: gens.map(serialize) });
}
