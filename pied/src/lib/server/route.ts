import "server-only";
import { NextResponse } from "next/server";
import { hasDb } from "./db";
import { HttpError, caller, sameOrigin, securityEvent } from "./guard";

// Every account/library endpoint goes through this: accounts must be
// configured, writes must be same-origin, known errors become plain
// sentences, and anything unexpected becomes a generic 500 (logged with a
// short reason, never the stack or the query).

type Handler<A extends unknown[]> = (req: Request, ...args: A) => Promise<Response>;

export function api<A extends unknown[]>(fn: Handler<A>, opts: { write?: boolean } = {}): Handler<A> {
  return async (req, ...args) => {
    try {
      if (!hasDb()) throw new HttpError(503, "Accounts aren't switched on for this site yet.");
      if (opts.write && !sameOrigin(req)) {
        securityEvent("api.cross_site", { who: caller(req), path: new URL(req.url).pathname });
        throw new HttpError(403, "Requests must come from the Pied site.");
      }
      return await fn(req, ...args);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status, e.headers);
      securityEvent("api.error", { who: caller(req), path: new URL(req.url).pathname, reason: e instanceof Error ? e.message.slice(0, 120) : "unknown" });
      return json({ error: "Something went wrong on our side. Try again in a moment." }, 500);
    }
  };
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(data, { status, headers: { "cache-control": "no-store", ...headers } });
}
