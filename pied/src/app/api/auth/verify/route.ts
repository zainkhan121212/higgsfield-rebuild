import { z } from "zod";
import { createSession, spendToken } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { HttpError, caller, limitDurable, readJson, securityEvent } from "@/lib/server/guard";
import { api, json } from "@/lib/server/route";

export const POST = api(
  async (req) => {
    const who = caller(req);
    const r = await limitDurable(`verify:${who}`, 20, 3600);
    if (!r.ok) throw new HttpError(429, "Too many tries. Try again later.");
    const body = z.object({ token: z.string().max(100) }).safeParse(await readJson(req, 512));
    const userId = body.success ? await spendToken(body.data.token, "verify") : null;
    if (!userId) throw new HttpError(400, "That link has expired or was already used. Sign in to get a new one.");
    await db()`update pied.users set email_verified_at = coalesce(email_verified_at, now()) where id = ${userId}`;
    await createSession(userId, req.headers.get("user-agent") ?? "");
    securityEvent("auth.verified", { userId, who });
    return json({ ok: true });
  },
  { write: true },
);
