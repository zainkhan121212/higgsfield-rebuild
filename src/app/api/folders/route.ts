import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateUser, getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ folders: [] });
  const folders = await db.folder.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { generations: true } } },
  });
  return NextResponse.json({ folders: folders.map((f) => ({ id: f.id, name: f.name, count: f._count.generations })) });
}

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  const { name } = (await req.json()) as { name?: string };
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const folder = await db.folder.create({ data: { userId: user.id, name: name.trim().slice(0, 60) } });
  return NextResponse.json({ folder: { id: folder.id, name: folder.name } });
}
