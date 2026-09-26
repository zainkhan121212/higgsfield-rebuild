import { z } from "zod";
import { Email, issueToken, sha256 } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { caller, limitDurable, readJson, securityEvent } from "@/lib/server/guard";
import { appUrl, sendMail } from "@/lib/server/mail";
import { api, json } from "@/lib/server/route";

// Always the same answer, whether or not the address has an account, and
// whether or not a limit was hit: nothing here can be used to find accounts.
// Links last 30 minutes and work once.
export const POST = api(
  async (req) => {
    const who = caller(req);
    const parsed = z.object({ email: Email }).safeParse(await readJson(req, 512));
    const answer = json({ ok: true, message: "If that address has an account, a reset link is on its way. It works once, for 30 minutes." });
    if (!parsed.success) return answer;
    const email = parsed.data.email;
    const a = await limitDurable(`forgot:ip:${who}`, 10, 3600);
    const b = await limitDurable(`forgot:email:${sha256(email)}`, 3, 3600);
    if (!a.ok || !b.ok) {
      securityEvent("auth.reset_limited", { who });
      return answer;
    }
    const [u] = await db()`select id from pied.users where email = ${email}`;
    if (u) {
      const t = await issueToken(u.id, "reset", 30);
      await sendMail(email, "Reset your Pied password", `Choose a new password here:\n\n${appUrl(req)}/reset?token=${t}\n\nThe link works once, for 30 minutes. If you didn't ask for this, ignore it; your password hasn't changed.`);
      securityEvent("auth.reset_requested", { userId: u.id, who });
    }
    return answer;
  },
  { write: true },
);
