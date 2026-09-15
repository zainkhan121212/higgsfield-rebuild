import { NextResponse } from "next/server";
import { AuthError, logIn, toSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = (await req.json()) as { email?: string; password?: string };
  try {
    const user = await logIn(email ?? "", password ?? "");
    return NextResponse.json({ user: toSessionUser(user) });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
}
