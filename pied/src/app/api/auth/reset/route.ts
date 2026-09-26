import { z } from "zod";
import { Password, createSession, hashPassword, parse, revokeSessions, spendToken } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { HttpError, caller, limitDurable, readJson, securityEvent } from "@/lib/server/guard";
import { api, json } from "@/lib/server/route";

// A reset signs out every device (all sessions revoked), then signs this one in.
export const POST = api(
  async (req) => {
    const who = caller(req);
    const r = await limitDurable(`reset:${who}`, 10, 3600);
    if (!r.ok) throw new HttpError(429, "Too many tries. Try again later.");
    const { token, password } = parse(z.object({ token: z.string().max(100), password: Password }), await readJson(req, 1024));
    const userId = await spendToken(token, "reset");
    if (!userId) throw new HttpError(400, "That link has expired or was already used. Ask for a new one.");
    await db()`update pied.users set password_hash = ${await hashPassword(password)}, password_changed_at = now(), email_verified_at = coalesce(email_verified_at, now()) where id = ${userId}`;
    await revokeSessions(userId);
    await createSession(userId, req.headers.get("user-agent") ?? "");
    securityEvent("auth.password_reset", { userId, who });
    return json({ ok: true });
  },
  { write: true },
);
