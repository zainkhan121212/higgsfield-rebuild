import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth";
import { handle, readJson } from "@/lib/api";
import { registrationOptions, verifyRegistration } from "@/lib/passkeys";
import { clientIp, rateLimit } from "@/lib/security";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";

// GET  → registration options (challenge in a signed cookie)
// POST → verify the authenticator's response and store the credential
export function GET() {
  return handle(async () => {
    const user = await getOrCreateUser();
    await rateLimit("passkey-register", user.id, 10, 3600);
    return NextResponse.json(await registrationOptions(user));
  });
}

const schema = z.object({ response: z.custom<RegistrationResponseJSON>((v) => typeof v === "object" && v !== null && "id" in v), label: z.string().max(40).optional() });

export function POST(req: Request) {
  return handle(async () => {
    const user = await getOrCreateUser();
    await rateLimit("passkey-register", await clientIp(), 20, 3600);
    const { response, label } = await readJson(req, schema);
    await verifyRegistration(user.id, response, label);
    return NextResponse.json({ ok: true });
  });
}
