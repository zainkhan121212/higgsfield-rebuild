import { NextResponse } from "next/server";
import { z } from "zod";
import { logInWithUserId, toSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { handle, readJson } from "@/lib/api";
import { authenticationOptions, verifyAuthentication } from "@/lib/passkeys";
import { clientIp, rateLimit } from "@/lib/security";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";

export function GET() {
  return handle(async () => {
    await rateLimit("passkey-login", await clientIp(), 30, 900);
    return NextResponse.json(await authenticationOptions());
  });
}

const schema = z.object({ response: z.custom<AuthenticationResponseJSON>((v) => typeof v === "object" && v !== null && "id" in v) });

export function POST(req: Request) {
  return handle(async () => {
    await rateLimit("passkey-login", await clientIp(), 30, 900);
    const { response } = await readJson(req, schema);
    const userId = await verifyAuthentication(response);
    await logInWithUserId(userId);
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    return NextResponse.json({ user: toSessionUser(user) });
  });
}
