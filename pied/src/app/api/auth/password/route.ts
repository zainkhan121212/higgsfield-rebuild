import { z } from "zod";
import { Password, checkPassword, hashPassword, parse, requireUser, revokeSessions } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { HttpError, caller, limitDurable, readJson, securityEvent } from "@/lib/server/guard";
import { api, json } from "@/lib/server/route";

// Changing the password needs the current one, and signs out every other device.
export const POST = api(
  async (req) => {
    const s = await requireUser(req);
    const r = await limitDurable(`password:${s.user.id}`, 5, 900);
    if (!r.ok) throw new HttpError(429, "Too many tries. Wait 15 minutes.");
    const { current, next } = parse(z.object({ current: z.string().max(200), next: Password }), await readJson(req, 1024));
    const [u] = await db()`select password_hash from pied.users where id = ${s.user.id}`;
    if (!(await checkPassword(current, u?.password_hash ?? null))) {
      securityEvent("auth.password_change_failed", { userId: s.user.id, who: caller(req) });
      throw new HttpError(400, "Your current password isn't right.");
    }
    await db()`update pied.users set password_hash = ${await hashPassword(next)}, password_changed_at = now() where id = ${s.user.id}`;
    // The current session was created before the change, so refresh its start
    // time; every other session is removed.
    await db()`update pied.sessions set created_at = now() where id = ${s.id}`;
    await revokeSessions(s.user.id, s.id);
    securityEvent("auth.password_changed", { userId: s.user.id, who: caller(req) });
    return json({ ok: true });
  },
  { write: true },
);
