import { z } from "zod";
import { checkPassword, endSession, parse, requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { HttpError, caller, readJson, securityEvent } from "@/lib/server/guard";
import { api, json } from "@/lib/server/route";

// Deleting the account removes the user and, by cascade, every session,
// token and plate. Needs the password.
export const POST = api(
  async (req) => {
    const s = await requireUser(req);
    const { password } = parse(z.object({ password: z.string().max(200) }), await readJson(req, 512));
    const [u] = await db()`select password_hash from pied.users where id = ${s.user.id}`;
    if (!(await checkPassword(password, u?.password_hash ?? null))) throw new HttpError(400, "That password isn't right.");
    await db()`delete from pied.users where id = ${s.user.id}`;
    await endSession();
    securityEvent("auth.account_deleted", { userId: s.user.id, who: caller(req) });
    return json({ ok: true });
  },
  { write: true },
);
