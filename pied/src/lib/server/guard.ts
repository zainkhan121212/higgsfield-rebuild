import "server-only";
import { createHash } from "node:crypto";

// Request guards shared by the API routes. Pied has no accounts, no
// database and no payments, so the attack surface is one thing: an endpoint
// that spends money (fal credits) on behalf of anonymous visitors. These
// guards keep it from being abused.

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

/** Structured security log line; Vercel keeps these in its log drain. */
export function securityEvent(event: string, detail: Record<string, unknown> = {}) {
  console.warn(JSON.stringify({ level: "security", event, at: new Date().toISOString(), ...detail }));
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
