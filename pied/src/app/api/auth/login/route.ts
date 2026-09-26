import { z } from "zod";
import { Email, checkPassword, createSession, parse, sha256 } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { HttpError, caller, limitDurable, readJson, securityEvent } from "@/lib/server/guard";
import { mailConfigured } from "@/lib/server/mail";
import { api, json } from "@/lib/server/route";

const Body = z.object({ email: Email, password: z.string().max(200) });
const WRONG = "That email and password don't match. Check them, or reset your password.";

// Brute force: 5 tries per address per 15 minutes (counted whether or not the
// address has an account, so the lockout itself reveals nothing) and 30 per
// visitor. Unknown addresses are checked against a dummy hash, so the timing
// is the same either way.
export const POST = api(
  async (req) => {
    const who = caller(req);
    const { email, password } = parse(Body, await readJson(req, 2048));
    const byIp = await limitDurable(`login:ip:${who}`, 30, 900);
    const byEmail = await limitDurable(`login:email:${sha256(email)}`, 5, 900);
    if (!byIp.ok || !byEmail.ok) {
      securityEvent("auth.login_locked", { who });
      throw new HttpError(429, "Too many attempts. Wait 15 minutes, or reset your password.", { "retry-after": String(Math.max(byIp.retryAfter, byEmail.retryAfter)) });
    }
    const [u] = await db()`select id, password_hash, email_verified_at from pied.users where email = ${email}`;
    const ok = await checkPassword(password, u?.password_hash ?? null);
    if (!ok) {
      securityEvent("auth.login_failed", { who, userId: u?.id });
      throw new HttpError(401, WRONG);
    }
    if (mailConfigured() && !u.email_verified_at) throw new HttpError(403, "Confirm your email first. We sent you a link when you signed up.");
    await createSession(u.id, req.headers.get("user-agent") ?? "");
    securityEvent("auth.login", { userId: u.id, who });
    return json({ ok: true });
  },
  { write: true },
);
