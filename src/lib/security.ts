import "server-only";
import { headers } from "next/headers";
import { db } from "./db";
import type { Prisma } from "@prisma/client";

// Rate limiting, audit logging and request-origin checks. Limits live in
// Postgres (fixed windows keyed by scope+subject) so they hold across
// serverless instances; a burst on one region can't slip past another.

export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : h.get("x-real-ip")) || "0.0.0.0";
}

export async function userAgent(): Promise<string> {
  return (await headers()).get("user-agent")?.slice(0, 200) ?? "";
}

export class RateLimited extends Error {
  constructor(public retryAfterSec: number) {
    super("Too many requests");
  }
}

/**
 * Fixed-window counter. `limit` hits per `windowSec` for `scope:subject`.
 * Throws RateLimited when exceeded. Cheap: one upsert per call.
 */
export async function rateLimit(scope: string, subject: string, limit: number, windowSec: number): Promise<void> {
  const key = `${scope}:${subject}`;
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSec * 1000);
  const bucket = await db.rateBucket.upsert({
    where: { key },
    create: { key, count: 1, resetAt },
    update: {},
  });
  if (bucket.resetAt <= now) {
    await db.rateBucket.update({ where: { key }, data: { count: 1, resetAt } });
    return;
  }
  if (bucket.count >= limit) {
    await audit("rate_limited", { meta: { scope, subject } });
    throw new RateLimited(Math.max(1, Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000)));
  }
  await db.rateBucket.update({ where: { key }, data: { count: { increment: 1 } } });
}

/** Login lockout: 5 failures per email or IP in 15 minutes. */
export async function checkLoginAllowed(email: string, ip: string) {
  const [e, i] = await Promise.all([
    db.rateBucket.findUnique({ where: { key: `login-fail:${email}` } }),
    db.rateBucket.findUnique({ where: { key: `login-fail-ip:${ip}` } }),
  ]);
  const now = Date.now();
  const locked = [e, i].some((b) => b && b.resetAt.getTime() > now && b.count >= 5);
  if (locked) {
    await audit("login_locked", { meta: { email } });
    throw new RateLimited(900);
  }
}

export async function recordLoginFailure(email: string, ip: string) {
  const resetAt = new Date(Date.now() + 15 * 60 * 1000);
  for (const key of [`login-fail:${email}`, `login-fail-ip:${ip}`]) {
    const b = await db.rateBucket.findUnique({ where: { key } });
    if (!b || b.resetAt.getTime() <= Date.now()) await db.rateBucket.upsert({ where: { key }, create: { key, count: 1, resetAt }, update: { count: 1, resetAt } });
    else await db.rateBucket.update({ where: { key }, data: { count: { increment: 1 } } });
  }
}

export async function clearLoginFailures(email: string) {
  await db.rateBucket.deleteMany({ where: { key: `login-fail:${email}` } });
}

/** Append-only security audit trail. Never throws. */
export async function audit(kind: string, opts: { userId?: string | null; meta?: Record<string, unknown> } = {}) {
  try {
    const [ip, ua] = await Promise.all([clientIp(), userAgent()]);
    await db.securityEvent.create({ data: { kind, userId: opts.userId ?? null, ip, userAgent: ua, meta: (opts.meta ?? undefined) as Prisma.InputJsonValue | undefined } });
  } catch {
    /* logging must never break the request */
  }
}

// A short list of the most common leaked passwords; anything here is refused
// even if it meets the length rule.
const COMMON = new Set([
  "password", "password1", "password123", "12345678", "123456789", "1234567890", "qwerty123", "qwertyuiop", "11111111", "iloveyou",
  "admin123", "letmein1", "welcome1", "sunshine", "princess", "football", "baseball", "trustno1", "dragon123", "monkey123",
  "abc12345", "passw0rd", "p@ssw0rd", "changeme", "superman", "starwars", "whatever", "computer", "internet", "michael1",
]);

export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return "Password needs at least 8 characters.";
  if (pw.length > 128) return "Password is too long.";
  if (COMMON.has(pw.toLowerCase())) return "That password is on the most-leaked list. Pick something less common.";
  if (/^(.)\1+$/.test(pw)) return "Password can't be one repeated character.";
  return null;
}
