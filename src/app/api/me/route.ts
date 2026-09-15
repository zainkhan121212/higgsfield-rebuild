import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateUser, toSessionUser as dto } from "@/lib/auth";

export async function GET() {
  const user = await getOrCreateUser();
  return NextResponse.json({ user: dto(user) });
}

// "Sign in" on this instance is just naming your guest account.
export async function PATCH(req: Request) {
  const user = await getOrCreateUser();
  const body = (await req.json()) as { name?: string };
  const name = body.name?.trim().slice(0, 40);
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const updated = await db.user.update({ where: { id: user.id }, data: { name } });
  return NextResponse.json({ user: dto(updated) });
}
