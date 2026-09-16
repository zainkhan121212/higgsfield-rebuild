# Security measures

What this build does to protect users and the credit economy, in the order an attacker would meet them. Each item says **what**, **where in the code**, and **how to say it in an interview**. None of this is exotic; it is the current (2026) baseline for a consumer web app, implemented properly. Don't claim it's "new to the industry" — claim you did it right.

## 1. Passkeys (FIDO2 / WebAuthn) — passwordless, phishing-resistant sign-in
- **What:** users can add a passkey (Face ID, Touch ID, Windows Hello, a security key) and sign in with it; discoverable credentials mean no email is typed. Registration uses `attestation: none`, `residentKey: required`, `userVerification: preferred`. The signature counter is checked on every login (a counter that doesn't advance is the cloned-authenticator signal).
- **Where:** `src/lib/passkeys.ts`, `src/app/api/auth/passkey/*`, `src/components/shell/passkeys.tsx`.
- **Say:** "Passkeys replace the shared secret entirely. The private key never leaves the device and the signature is bound to our origin, so a look-alike domain can't replay it. That's the phishing problem gone, not mitigated."

## 2. Session hardening
- **What:** `__Host-` prefixed cookie (HTTPS-only, Path=/, no Domain → can't be planted by a subdomain), `httpOnly`, `SameSite=Lax`, HMAC-SHA256 signed token carrying `userId.issuedAt`, 30-day expiry, token rotation on every login, and a `SESSION_VERSION` salt so all sessions can be invalidated at once.
- **Where:** `src/lib/auth.ts`.
- **Say:** "The cookie is a signed, expiring token, not a raw id. The `__Host-` prefix is a browser-enforced guarantee about who could have set it."

## 3. Cross-site write protection (CSRF)
- **What:** the edge proxy refuses any `POST/PUT/PATCH/DELETE` to `/api/*` whose `Sec-Fetch-Site` isn't `same-origin`/`none`. Browsers set that header and pages can't forge it. SameSite=Lax on the cookie is the second layer.
- **Where:** `src/proxy.ts` (top).
- **Say:** "Fetch Metadata is the modern replacement for CSRF tokens — the browser tells the server where the request came from, and we refuse cross-site writes at the edge before any handler runs."

## 4. Nonce-based Content Security Policy
- **What:** every response gets a fresh nonce; `script-src 'self' 'nonce-…' 'strict-dynamic'` means only scripts the page emitted (or scripts they load) can run — no inline handlers, no eval in production, no injected `<script>` from an XSS. `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`. Plus HSTS (2 years, preload), `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a locked `Permissions-Policy`, COOP `same-origin`.
- **Where:** `src/proxy.ts`. Pages render dynamically so each gets its own nonce.
- **Say:** "Even if an XSS slipped through React's escaping, CSP stops the injected script from executing. Nonces + strict-dynamic is the strongest policy you can run with a framework like Next."

## 5. Rate limiting and lockout
- **What:** Postgres-backed fixed-window counters (`RateBucket`) so limits hold across serverless instances and regions. Login: 30/15 min per IP and **lockout after 5 failures per email or IP** (15 min). Sign-up: 10/hour per IP. Guest creation: **5 per IP per hour — this is the free-credit-farming control** (100 free credits × unlimited guests would be free compute for a bot). Checkout, preview, passkey endpoints all limited. 429s carry `Retry-After`.
- **Where:** `src/lib/security.ts`, applied in `src/lib/auth.ts` and the API routes.
- **Say:** "Free credits are money. Every path that hands them out is metered per IP, and login brute force is locked out by both email and IP so a distributed attack on one account and a spray across many accounts both stall."

## 6. Password handling
- **What:** bcrypt cost 12; refuses the most-leaked passwords and trivial patterns; unknown-email logins still run a bcrypt compare against a dummy hash so timing doesn't reveal whether an email exists; the login error is the same for both cases.
- **Where:** `src/lib/auth.ts`, `passwordProblem()` in `src/lib/security.ts`.

## 7. Input validation and safe handlers
- **What:** every JSON body is size-capped (64 KB) and validated with zod before it touches logic; errors are mapped to generic messages (`src/lib/api.ts`) — no stack traces or Prisma internals leave the server. Prisma parameterises every query (no SQL injection). Ownership is enforced on every mutation (`where: { id, userId }`), so IDs in URLs can't be used to touch other users' generations, folders or passkeys (no IDOR).
- **Where:** `src/lib/api.ts`, `src/app/api/**`.

## 8. Card data never reaches the server
- **What:** the checkout form is client-only; it validates format (Luhn) and sends *only* `{plan, credits}` to `/api/checkout`. There is no field for card data on the server at all.
- **Where:** `src/components/checkout/checkout-page.tsx`, `src/app/api/checkout/route.ts`.
- **Say:** "Scope reduction: the safest way to protect card numbers is to never have them."

## 9. Audit trail
- **What:** append-only `SecurityEvent` table: guest created, sign-up, login (password / passkey), failed login, lockout, logout, passkey added/removed, rate-limited, checkout — with IP and user-agent. Users see their own trail on `/account` (IP masked) and get notified of new sign-ins and lockouts.
- **Where:** `audit()` in `src/lib/security.ts`, `/account`, `/api/notifications`.

## 10. Bot friction
- **What:** honeypot field on sign-up (hidden from people; any value → rejected by the schema).
- **Where:** `src/components/shell/auth-dialog.tsx`, `src/app/api/auth/signup/route.ts`.

## 11. Secrets and dependencies
- `AUTH_SECRET`, database URLs and API keys live only in Vercel env / `.env.local` (git-ignored). `npm audit --omit=dev` is clean at the time of writing. Prisma is pinned to a stable major.

## What's deliberately not here (say this too — it shows judgement)
- **No OAuth**: needs provider credentials; passkeys cover the "no password" story better anyway.
- **No email verification / password reset**: no mail provider in a 24-hour build. The account page and passkeys are the recovery story.
- **No WAF / DDoS layer beyond Vercel's**: out of scope; the app-level limits are the part a developer owns.
- **Content moderation** is limited to the image provider's safety filter and prompt length caps.
