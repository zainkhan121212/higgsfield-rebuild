import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";

export async function GET() {
  const user = await getOrCreateUser();
  return NextResponse.json({ user: { id: user.id, name: user.name, handle: user.handle, plan: user.plan, credits: user.credits } });
}
