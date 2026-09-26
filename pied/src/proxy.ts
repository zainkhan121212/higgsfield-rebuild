import { NextResponse, type NextRequest } from "next/server";

// Edge security layer (Next 16 "proxy", formerly middleware).
//
// · A per-request nonce Content-Security-Policy: only scripts this server
//   emitted can run — an injected <script> or inline handler is inert. The
//   page talks only to its own origin; images and video only from itself
//   and the blob:/data: URLs the press makes in the browser.
// · Transport and isolation headers: HSTS, nosniff, no framing, a strict
//   referrer policy, a locked-down Permissions-Policy, COOP/CORP.
// · Cross-site writes to /api are refused before any handler runs (CSRF).

const DEV = process.env.NODE_ENV !== "production";
const WRITE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/") && WRITE.has(req.method)) {
    const site = req.headers.get("sec-fetch-site");
    if (site && site !== "same-origin") return NextResponse.json({ error: "Cross-site requests are not allowed." }, { status: 403 });
  }

  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${DEV ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "media-src 'self' blob:",
    "font-src 'self'",
    // Open-Meteo: the desktop's weather widget (city search and the forecast).
    `connect-src 'self' https://api.open-meteo.com https://geocoding-api.open-meteo.com${DEV ? " ws: wss:" : ""}`,
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
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), fullscreen=(self)");
  if (!DEV) res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return res;
}

export const config = {
  // Documents and API routes; static files get their headers from next.config.
  matcher: [{ source: "/((?!_next/static|_next/image|samples/|favicon.ico).*)" }],
};
