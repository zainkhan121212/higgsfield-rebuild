import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";

const dto = (u: { id: string; name: string; handle: string; plan: string; credits: number }) => ({
  id: u.id, name: u.name, handle: u.handle, plan: u.plan, credits: u.credits,
});

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
