import { NextResponse } from "next/server";
import { z } from "zod";
import { logIn, toSessionUser } from "@/lib/auth";
import { handle, readJson } from "@/lib/api";

const schema = z.object({ email: z.string().max(254), password: z.string().max(128) });

export function POST(req: Request) {
  return handle(async () => {
    const { email, password } = await readJson(req, schema);
    const user = await logIn(email, password);
    return NextResponse.json({ user: toSessionUser(user) });
  });
}
