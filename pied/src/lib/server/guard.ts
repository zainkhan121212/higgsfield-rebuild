import "server-only";
import { createHash } from "node:crypto";
import { db, hasDb } from "./db";

// Request guards shared by the API routes: same-origin checks, hashed
// visitor ids, rate limits (in-memory, or durable in the database), size-
// capped JSON bodies, and the security event log.

/** Same-origin writes only. Browsers stamp every request with Sec-Fetch-Site. */
export function sameOrigin(req: Request) {
  const site = req.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  // Non-browser clients don't send Sec-Fetch-*; fall back to Origin.
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

/** The caller's IP, hashed, so logs and limits never hold a raw address. */
export function caller(req: Request) {
  const ip = (req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local").trim();
  return createHash("sha256")
    .update(`${process.env.LOG_SALT ?? "pied"}:${ip}`)
    .digest("hex")
    .slice(0, 16);
}

type Bucket = { n: number; reset: number };
const buckets = new Map<string, Bucket>();

/**
 * Fixed-window counter. In-memory, so each server instance counts on its own:
 * right for one long-lived server, a soft limit on serverless. For a hard
 * limit across instances, back this with Redis / Vercel KV (see SECURITY.md).
 */
export function limit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.reset < now) {
    b = { n: 0, reset: now + windowMs };
    buckets.set(key, b);
  }
  b.n++;
  if (buckets.size > 50_000) for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
  return { ok: b.n <= max, retryAfter: Math.ceil((b.reset - now) / 1000) };
}

/**
 * Durable fixed-window limit, shared by every server instance through the
 * database. Falls back to the in-memory limiter when there's no database.
 */
export async function limitDurable(key: string, max: number, windowSec: number) {
  if (!hasDb()) return limit(key, max, windowSec * 1000);
  const [r] = await db()`
    insert into pied.rate_limits (key, count, reset_at)
    values (${key}, 1, now() + make_interval(secs => ${windowSec}))
    on conflict (key) do update set
      count = case when pied.rate_limits.reset_at < now() then 1 else pied.rate_limits.count + 1 end,
      reset_at = case when pied.rate_limits.reset_at < now() then excluded.reset_at else pied.rate_limits.reset_at end
    returning count, extract(epoch from (reset_at - now()))::int as left`;
  return { ok: r.count <= max, retryAfter: Math.max(1, r.left) };
}

/**
 * Structured security log line (Vercel keeps these in its log drain) and,
 * when there's a database, a row in pied.security_events for the audit trail.
 * Never pass passwords, tokens, keys or prompts in `detail`.
 */
export function securityEvent(event: string, detail: Record<string, unknown> = {}) {
  console.warn(JSON.stringify({ level: "security", event, at: new Date().toISOString(), ...detail }));
  if (!hasDb()) return;
  const { userId, who, ...rest } = detail as { userId?: string; who?: string };
  db()`insert into pied.security_events (kind, user_id, who, detail) values (${event}, ${userId ?? null}, ${who ?? ""}, ${db().json(rest as never)})`.catch(() => {});
}

/** Read a JSON body with a hard size cap, whatever Content-Length claims. */
export async function readJson(req: Request, maxBytes: number): Promise<unknown> {
  if (!(req.headers.get("content-type") ?? "").startsWith("application/json")) throw new HttpError(415, "Send JSON.");
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new HttpError(413, "Request too large.");
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "Empty request.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      reader.cancel().catch(() => {});
      throw new HttpError(413, "Request too large.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "That request wasn't valid JSON.");
  }
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public headers: Record<string, string> = {},
  ) {
    super(message);
  }
}
