import { NextResponse } from "next/server";

// Same-origin image proxy for canvas work (the hero samples pixels, which
// needs a same-origin or CORS-clean source) and for caching: the generation
// CDNs are slow and rate-limit bursts, so we cache one copy at our edge.
//
// Security: strictly allowlisted hosts and https only — an open proxy would
// be an SSRF hole and a bandwidth donation.
const ALLOWED = new Set(["image.pollinations.ai", "cdn.higgsfield.ai", "static.higgsfield.ai", "assets.mixkit.co"]);
// fal serves results from rotating subdomains (v3.fal.media, v3b.fal.media …),
// so match the registrable domain rather than listing each one. The leading
// dot matters: it stops "evil-fal.media" from passing.
const ALLOWED_SUFFIX = [".fal.media"];
const hostAllowed = (host: string) => ALLOWED.has(host) || ALLOWED_SUFFIX.some((s) => host.endsWith(s));
const MAX_BYTES = 12 * 1024 * 1024;

export async function GET(req: Request) {
  const src = new URL(req.url).searchParams.get("src");
  if (!src) return NextResponse.json({ error: "missing src" }, { status: 400 });
  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return NextResponse.json({ error: "bad src" }, { status: 400 });
  }
  if (target.protocol !== "https:" || !hostAllowed(target.hostname)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 403 });
  }

  // The generation endpoints 429 on bursts; a couple of retries makes the
  // first paint reliable without the client knowing.
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(target, { headers: { accept: "image/*" }, cache: "no-store" }).catch(() => null);
    if (res?.ok) {
      const type = res.headers.get("content-type") ?? "image/jpeg";
      if (!type.startsWith("image/")) return NextResponse.json({ error: "not an image" }, { status: 415 });
      const buf = await res.arrayBuffer();
      if (buf.byteLength > MAX_BYTES) return NextResponse.json({ error: "too large" }, { status: 413 });
      return new NextResponse(buf, {
        headers: {
          "content-type": type,
          "cache-control": "public, max-age=31536000, s-maxage=31536000, immutable",
          "x-content-type-options": "nosniff",
        },
      });
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt));
  }
  return NextResponse.json({ error: "upstream unavailable" }, { status: 502 });
}
