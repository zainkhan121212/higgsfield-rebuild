import { z } from "zod";
import { DisplayName, Email, Password, createSession, hashPassword, issueToken, parse } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { HttpError, caller, limitDurable, readJson, securityEvent } from "@/lib/server/guard";
import { appUrl, mailConfigured, sendMail } from "@/lib/server/mail";
import { api, json } from "@/lib/server/route";

const Body = z.object({ email: Email, password: Password, name: DisplayName.optional() });

// With email set up, signing up never reveals whether an address already has
// an account: the answer is always "check your inbox", and the inbox gets
// either a verification link or a note that the account already exists.
// Without email (a demo deploy), the account is ready at once; the duplicate
// case then has to say so, and is rate-limited to make probing slow.
export const POST = api(
  async (req) => {
    const who = caller(req);
    const r = await limitDurable(`signup:${who}`, 5, 3600);
    if (!r.ok) throw new HttpError(429, "Too many sign-ups from here. Try again later.", { "retry-after": String(r.retryAfter) });
    const { email, password, name } = parse(Body, await readJson(req, 2048));
    if (password.toLowerCase().includes(email.split("@")[0])) throw new HttpError(400, "Don't use your email in your password.");

    const hash = await hashPassword(password);
    const verified = !mailConfigured();
    const [row] = await db()`
      insert into pied.users (email, password_hash, display_name, email_verified_at)
      values (${email}, ${hash}, ${name ?? ""}, ${verified ? new Date() : null})
      on conflict (email) do nothing
      returning id`;

    if (mailConfigured()) {
      const base = appUrl(req);
      if (row) {
        const t = await issueToken(row.id, "verify", 24 * 60);
        await sendMail(email, "Confirm your Pied account", `Confirm your email to finish signing up:\n\n${base}/verify?token=${t}\n\nThe link works once, for 24 hours. If you didn't sign up, ignore this.`);
        securityEvent("auth.signup", { userId: row.id, who });
      } else {
        await sendMail(email, "You already have a Pied account", `Someone (hopefully you) tried to sign up with this address. You already have an account:\n\nSign in: ${base}/signin\nForgot your password? ${base}/forgot`);
        securityEvent("auth.signup_existing", { who });
      }
      return json({ ok: true, next: "check-email" });
    }

    if (!row) {
      securityEvent("auth.signup_existing", { who });
      throw new HttpError(409, "Couldn't create an account with those details. If you already have one, sign in instead.");
    }
    await createSession(row.id, req.headers.get("user-agent") ?? "");
    securityEvent("auth.signup", { userId: row.id, who });
    return json({ ok: true, next: "signed-in" });
  },
  { write: true },
);
