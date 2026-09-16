import { NextResponse } from "next/server";
import { z } from "zod";
import { signUp, toSessionUser } from "@/lib/auth";
import { handle, readJson } from "@/lib/api";

const schema = z.object({
  email: z.string().max(254),
  password: z.string().max(128),
  name: z.string().max(40).optional(),
  // Honeypot: real users never see this field; bots fill everything.
  website: z.string().max(0).optional(),
});

export function POST(req: Request) {
  return handle(async () => {
    const { email, password, name } = await readJson(req, schema);
    const user = await signUp(email, password, name);
    return NextResponse.json({ user: toSessionUser(user) });
  });
}
