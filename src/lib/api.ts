import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { AuthError } from "./auth";
import { RateLimited } from "./security";

// Shared request plumbing for route handlers: strict JSON parsing with a
// size cap, schema validation, and error mapping that never leaks internals.

const MAX_BODY = 64 * 1024;

export async function readJson<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BODY) throw new ApiError(413, "Request body too large");
  const text = await req.text();
  if (text.length > MAX_BODY) throw new ApiError(413, "Request body too large");
  let raw: unknown;
  try {
    raw = text ? JSON.parse(text) : {};
  } catch {
    throw new ApiError(400, "Malformed JSON");
  }
  return schema.parse(raw);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function handle(fn: () => Promise<Response>): Promise<Response> {
  return fn().catch((err: unknown) => {
    if (err instanceof RateLimited) {
      return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429, headers: { "Retry-After": String(err.retryAfterSec) } });
    }
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    if (err instanceof ApiError) return NextResponse.json({ error: err.message }, { status: err.status });
    if (err instanceof ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  });
}
