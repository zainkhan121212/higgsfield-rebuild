# Pied — security

## What there is to protect

Pied has **no accounts, no passwords, no database, no payments and no file storage.** Uploaded photographs are read in the visitor's browser and never leave it. The server does two things:

1. serves the pages
2. runs one endpoint, `POST /api/imagine`, which spends **fal credits** to turn a sentence into a picture

So the real risks are someone draining the fal balance, abusing the endpoint (CSRF, oversized input, prompt tricks, SSRF through the image URL), leaking the fal key, and script injection into the pages. Everything below is checked against that surface.

**Status key:**
- ✅ **done** — in the code, with the file named
- ➖ **N/A** — the feature it protects doesn't exist in Pied, with the reason
- ⚠️ **deploy** — something you set in Vercel or fal

## Transport, headers, browser

| Item | Status | Where / how |
|---|---|---|
| HSTS | ✅ | `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (`src/proxy.ts`, `next.config.ts`) |
| Missing security headers | ✅ | CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP, CORP (`src/proxy.ts`) |
| XSS | ✅ | **Nonce CSP**: only scripts this server issued run, and inline handlers and injected `<script>` are inert. React escapes all text. No `dangerouslySetInnerHTML` anywhere. Visitor text is only ever drawn on a canvas as characters. |
| CSRF | ✅ | The single write endpoint only accepts JSON (so a cross-site form can't send it). It refuses any request whose `Sec-Fetch-Site` isn't `same-origin` (`src/proxy.ts` and `sameOrigin()` in `src/lib/server/guard.ts`). There are no cookies to ride. |
| Clickjacking | ✅ | `frame-ancestors 'none'` + `X-Frame-Options: DENY` |
| Insecure cookie settings | ➖ | Pied sets no cookies |
| Exposed source maps | ✅ | `productionBrowserSourceMaps: false`; `/_next/…/*.map` returns 404 (tested) |
| Framework fingerprinting | ✅ | `poweredByHeader: false` |
| Verbose production errors | ✅ | The API returns plain sentences and never forwards upstream error bodies (`route.ts`). `app/error.tsx` shows no stack or message. |
| Disable directory listing | ✅ | Next/Vercel never list directories; `/.env` and unknown paths return the 404 page (tested) |
| Client-only security | ✅ | Every limit that matters (size, rate, spend, validation, the prompt brief) is enforced on the server. The browser's checks are only for convenience. |

## The AI endpoint

| Item | Status | Where / how |
|---|---|---|
| Cap AI usage | ✅ | Per visitor: 8 per 10 minutes and 40 per day. Whole site: 500 per day (`IMAGINE_*` env vars override). |
| Rate limits | ✅ | Same limiter, keyed on a salted hash of the IP (`limit()` in `guard.ts`) |
| Limit request size | ✅ | The body is read with a hard 2 KB cap, whatever `Content-Length` claims; 413 above it (tested) |
| Input validation | ✅ | Prompt: string, 2–300 characters. `look` and `format` must be one of a fixed list; anything else falls back to the default. |
| Block prompt injection | ✅ | The visitor supplies only the *subject*. The brief (look, contrast, "no text, no watermark") is composed on the server in `src/lib/server/prompt.ts` and placed **after** their words, so the brief always has the last word. Control characters, bidi overrides, zero-width characters and brackets are stripped. |
| Unpermissioned AI access | ✅ | The fal key never reaches the browser. The client can't pick the model (`FAL_MODEL` is server-only and checked against a pattern). |
| Content safety | ✅ | fal's safety checker is on, and `has_nsfw_concepts` results are refused. Pollinations is called with `safe=true`. |
| SSRF | ✅ | The image comes back inline (`sync_mode`). If fal ever returns a URL instead, it's fetched only if it's `https` on `*.fal.media`; anything else is refused, not fetched. Returned bytes must be JPEG/PNG/WebP and under 12 MB. |
| Upstream timeouts | ✅ | fal 55 s, image fetch 20 s, Pollinations 40 s; `maxDuration = 60` |
| Cancel in-flight request | ✅ | The Cancel button aborts the fetch |

## Secrets

| Item | Status | Where / how |
|---|---|---|
| Hard-coded secrets / secrets in JS / secrets in Git | ✅ | The only secret is `FAL_KEY`, read from the environment on the server. `.env*` is git-ignored. `server-only` makes the build fail if server code is ever imported into the browser. |
| Exposed environments / `public.env` files | ✅ | No `NEXT_PUBLIC_` secrets. `NEXT_PUBLIC_PIED_STATIC` is only a build flag. |
| Logs leak secrets | ✅ | Security logs hold an event name, a time, a **hashed** visitor ID and a short reason (e.g. `fal 401`). Never the key, the prompt or the IP. |
| JWT secrets | ➖ | No JWTs |
| Exposed DB credentials | ➖ | No database |
| Default credentials | ➖ | No accounts of any kind |

## Uploads

| Item | Status | Where / how |
|---|---|---|
| Whitelist upload types | ✅ | JPEG, PNG, WebP, GIF, AVIF, BMP; no SVG (`source-panel.tsx`) |
| Insecure file uploads | ✅ | Files are never uploaded: they're decoded in the browser, capped at 25 MB, and downsampled to 2048 px on arrival (`fitImage` in `plate.ts`) |
| Path traversal | ➖ | The server never reads a path from a request |
| Sanitize before storing | ➖ | Nothing is stored. Exported wallpaper files embed data as `JSON.stringify` with `<` escaped, so a title can't break out of the script (`export.ts`). |

## Things Pied doesn't have (so they can't be misconfigured)

| Item | Why it's N/A | If you add it later |
|---|---|---|
| Reset sessions on password change, expire reset links, rate-limit password resets, lock accounts after failed logins, prevent user enumeration, broken password reset, weak session management, weak/missing auth, misconfigured auth | No accounts | Use a vetted library (Auth.js / Clerk / Supabase Auth). Hash with argon2/bcrypt, reset tokens single-use and ≤ 30 min, the same response for "no such user", lockout with backoff. |
| Verify payment webhooks, set price server-side, frontend payment checks, unsigned webhooks | No payments | Verify Stripe's `Stripe-Signature`, compute the price on the server from a product ID, and fulfil only from the webhook. |
| IDOR, cross-user access, poor tenant isolation, missing auth checks, mass assignment, excessive DB permissions, open DB permissions | No user data or records | Check ownership on every read and write, and allowlist writable fields (zod). Use a least-privilege DB role with row-level security. |
| SQL / NoSQL injection | No database | Parameterised queries only (Prisma, Drizzle) |
| Command injection, insecure deserialisation | The server never runs a shell or deserialises anything but `JSON.parse` of a 2 KB body | — |
| Remove default admin routes, unprotected admin routes, exposed internal dashboards, exposed prod debug tools | None exist; production has no debug endpoints | Keep admin behind auth and an IP allowlist, or on a separate deploy |
| Encrypt data | Nothing at rest; TLS in transit (HSTS) | — |
| Backups and restores | Nothing to back up except the Git repo | — |

## Supply chain

| Item | Status | Where / how |
|---|---|---|
| Vulnerable dependencies | ✅ | `npm audit`: **0 vulnerabilities** (checked for this change). Runtime deps are only `next`, `react`, `react-dom`, `server-only`. |
| Malicious packages | ✅ | A minimal dependency tree and a committed lockfile; `esbuild`, `postcss` and `tailwind` are dev-only |
| Unreviewed code | ⚠️ | Turn on branch protection so `main` needs a reviewed PR. Add Dependabot or Renovate for updates. |

## Monitoring

| Item | Status | Where / how |
|---|---|---|
| Log security events | ✅ | `securityEvent()` writes JSON lines for cross-site attempts, rate-limit hits, blocked content and upstream failures (`guard.ts`) |
| Missing audit logs / no security monitoring | ⚠️ | Add a Vercel log drain, e.g. to Axiom or Datadog, and alert on `"level":"security"` spikes |

## Before you go live — the ⚠️ items

1. **Vercel → Settings → Environment Variables:** add `FAL_KEY` (Production only) and `LOG_SALT` (any random string). Optionally set `IMAGINE_SITE_PER_DAY` to match your budget.
2. **fal dashboard → Billing:** set a monthly spending limit. It's the backstop if everything else fails.
3. **Durable rate limits.** The built-in limiter is in-memory, so on serverless each instance counts on its own. For a hard limit, add a Vercel Firewall rate-limit rule on `/api/imagine`, or back `limit()` with Upstash Redis or Vercel KV.
4. **GitHub:** enable branch protection, secret scanning and Dependabot.
