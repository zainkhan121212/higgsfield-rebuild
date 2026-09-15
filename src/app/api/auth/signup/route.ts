import { NextResponse } from "next/server";
import { AuthError, signUp, toSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password, name } = (await req.json()) as { email?: string; password?: string; name?: string };
  try {
    const user = await signUp(email ?? "", password ?? "", name);
    return NextResponse.json({ user: toSessionUser(user) });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
}
