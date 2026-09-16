import { NextResponse, type NextRequest } from "next/server";

// Edge-side security layer (Next 16 "proxy", formerly middleware).
//
// 1. Cross-site write protection: browsers stamp every request with
//    Sec-Fetch-Site. Any state-changing call to /api that didn't originate
//    from this site is refused before it reaches a handler — CSRF stops here
//    regardless of cookies. (SameSite=Lax on the session cookie is the second
//    layer.)
// 2. A per-request nonce Content-Security-Policy: only scripts this page
//    emitted (nonce) or trusts (hls.js on cdnjs) can run; no inline handlers,
//    no eval, no framing. Media/images are allowed from any HTTPS origin
//    because generations and hotlinked clips come from many CDNs.
// 3. The usual transport headers: HSTS, nosniff, referrer policy, a locked
//    Permissions-Policy, COOP.

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const DEV = process.env.NODE_ENV !== "production";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/") && MUTATING.has(req.method)) {
    const site = req.headers.get("sec-fetch-site");
    const origin = req.headers.get("origin");
    const sameOrigin = site === "same-origin" || site === "none" || (site === null && (!origin || origin === req.nextUrl.origin));
    if (!sameOrigin) {
      return NextResponse.json({ error: "cross_site_request_blocked" }, { status: 403 });
    }
  }

  const nonce = btoa(crypto.getRandomValues(new Uint8Array(16)).reduce((s, b) => s + String.fromCharCode(b), ""));
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://cdnjs.cloudflare.com${DEV ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data: blob:",
    "media-src 'self' https: blob:",
    "font-src 'self' data:",
    `connect-src 'self' https:${DEV ? " ws: wss:" : ""}`,
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    ...(DEV ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()");
  if (!DEV) res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return res;
}

export const config = {
  // Skip static assets; everything else (pages + API) passes through.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|woff2?)$).*)"],
};
