import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "./db";
import { HttpError } from "./guard";

// Accounts: email + password, server-side sessions, CSRF tokens.
//
// · Passwords: bcrypt, cost 12. Never logged, never returned.
// · Sessions: a random 256-bit token in an HttpOnly, Secure, SameSite=Lax
//   cookie (__Host- prefixed in production, so no subdomain can set it). The
//   database stores only the token's SHA-256, so a leaked table can't be
//   replayed. 30-day expiry, sliding; all of a user's sessions are revoked
//   when the password changes or is reset.
// · CSRF: every session has its own random token. State-changing requests
//   must send it back in `x-csrf-token`, compared in constant time — on top
//   of the SameSite cookie and the Sec-Fetch-Site check in proxy.ts.

const PROD = process.env.NODE_ENV === "production";
export const COOKIE = PROD ? "__Host-pied" : "pied";
const SESSION_DAYS = 30;

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const token = (bytes = 32) => randomBytes(bytes).toString("base64url");

// ── validation ────────────────────────────────────────────────────────────

// A short list of the passwords every credential-stuffing list starts with.
const COMMON = new Set([
  "password", "password1", "password12", "password123", "1234567890", "12345678910", "qwertyuiop", "iloveyou12", "letmein123", "welcome123",
  "abc1234567", "qwerty1234", "1q2w3e4r5t", "passw0rd12", "admin12345", "football12", "baseball12", "princess12", "sunshine12", "0987654321",
]);

export const Email = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email({ message: "That doesn't look like an email address." }));

export const Password = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(200, "That password is too long.")
  .refine((p) => !COMMON.has(p.toLowerCase()), "That password is too common. Pick something only you would use.");

export const DisplayName = z
  .string()
  .trim()
  .max(60)
  .transform((s) => s.replace(/[\u0000-\u001f\u007f-\u009f<>]/g, ""));

export function parse<T>(schema: z.ZodType<T>, v: unknown): T {
  const r = schema.safeParse(v);
  if (!r.success) throw new HttpError(400, r.error.issues[0]?.message ?? "Check the form and try again.");
  return r.data;
}

// ── passwords ─────────────────────────────────────────────────────────────

export const hashPassword = (p: string) => bcrypt.hash(p, 12);
// Compared against when the email has no account, so a login for an unknown
// address takes as long as one for a real address (no timing enumeration).
const DUMMY = bcrypt.hashSync("pied-dummy-password-for-timing", 12);
export async function checkPassword(p: string, hash: string | null) {
  const ok = await bcrypt.compare(p, hash ?? DUMMY);
  return !!hash && ok;
}

// ── sessions ──────────────────────────────────────────────────────────────

export type SessionUser = { id: string; email: string; displayName: string; verified: boolean };
export type Session = { id: string; csrf: string; user: SessionUser };

export async function createSession(userId: string, userAgent: string) {
  const t = token();
  const csrf = token(24);
  await db()`
    insert into pied.sessions (id, user_id, csrf, user_agent, expires_at)
    values (${sha256(t)}, ${userId}, ${csrf}, ${userAgent.slice(0, 200)}, now() + make_interval(days => ${SESSION_DAYS}))`;
  const jar = await cookies();
  jar.set(COOKIE, t, { httpOnly: true, secure: PROD, sameSite: "lax", path: "/", maxAge: SESSION_DAYS * 86400 });
  return csrf;
}

export async function currentSession(): Promise<Session | null> {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (!t || t.length > 100) return null;
  const id = sha256(t);
  const [row] = await db()`
    select s.id, s.csrf, s.last_seen_at, u.id as user_id, u.email, u.display_name, u.email_verified_at
    from pied.sessions s join pied.users u on u.id = s.user_id
    where s.id = ${id} and s.expires_at > now() and s.created_at >= u.password_changed_at - interval '1 second'`;
  if (!row) return null;
  // Slide the expiry at most once an hour.
  if (Date.now() - new Date(row.last_seen_at).getTime() > 3600_000) {
    db()`update pied.sessions set last_seen_at = now(), expires_at = now() + make_interval(days => ${SESSION_DAYS}) where id = ${id}`.catch(() => {});
  }
  return { id, csrf: row.csrf, user: { id: row.user_id, email: row.email, displayName: row.display_name, verified: !!row.email_verified_at } };
}

export async function endSession() {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (t) await db()`delete from pied.sessions where id = ${sha256(t)}`;
  jar.delete(COOKIE);
}

/** The signed-in user for a state-changing request: session + CSRF token. */
export async function requireUser(req: Request): Promise<Session> {
  const s = await currentSession();
  if (!s) throw new HttpError(401, "Sign in first.");
  const sent = req.headers.get("x-csrf-token") ?? "";
  const a = Buffer.from(sent);
  const b = Buffer.from(s.csrf);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new HttpError(403, "This page is out of date. Reload it and try again.");
  return s;
}

/** Revoke every session of a user, optionally keeping one (the current). */
export async function revokeSessions(userId: string, keep?: string) {
  if (keep) await db()`delete from pied.sessions where user_id = ${userId} and id <> ${keep}`;
  else await db()`delete from pied.sessions where user_id = ${userId}`;
}

// ── one-time tokens (email verification, password reset) ─────────────────

export async function issueToken(userId: string, kind: "verify" | "reset", minutes: number) {
  const t = token();
  // One live token per kind: issuing a new one retires the old.
  await db()`update pied.tokens set used_at = now() where user_id = ${userId} and kind = ${kind} and used_at is null`;
  await db()`insert into pied.tokens (id, user_id, kind, expires_at) values (${sha256(t)}, ${userId}, ${kind}, now() + make_interval(mins => ${minutes}))`;
  return t;
}

/** Spend a token: valid only once, only before it expires. Returns the user id. */
export async function spendToken(t: unknown, kind: "verify" | "reset"): Promise<string | null> {
  if (typeof t !== "string" || t.length < 20 || t.length > 100) return null;
  const [row] = await db()`
    update pied.tokens set used_at = now()
    where id = ${sha256(t)} and kind = ${kind} and used_at is null and expires_at > now()
    returning user_id`;
  return row?.user_id ?? null;
}
