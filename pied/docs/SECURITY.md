# Pied — security

## What there is to protect

- **Accounts:** email and password, stored as bcrypt hashes. Sessions are cookies.
- **Libraries:** plates people save, private by default. Public ones appear in the gallery.
- **`POST /api/imagine`:** spends **fal credits** for anonymous visitors.
- **Pages** that must not run anyone else's script.

There are **no payments**. Uploaded photographs are read in the browser and never sent to the server; only finished plates are, when someone saves one.

**Status key:**
- ✅ **done** — in the code, with the file named, and **tested** where it says so
- ➖ **N/A** — the feature doesn't exist, with the reason
- ⚠️ **deploy** — something you set in Vercel, Supabase, fal or GitHub

"Tested" means checked against the running app and a real Postgres, with `curl` and a headless browser, while this was built.

## Accounts and sessions

| Item | Status | Where / how |
|---|---|---|
| Password storage | ✅ | bcrypt, cost 12 (`lib/server/auth.ts`). Never logged, never returned. |
| Password policy | ✅ | 10–200 characters, not a common password, and not built from the email's name part. Tested: `password123` refused. |
| Sessions | ✅ | A random 256-bit token in a `__Host-pied` cookie: HttpOnly, Secure, SameSite=Lax, Path=/. The database stores only its SHA-256, so a leaked table can't be replayed. 30-day sliding expiry. Tested: stored ids are hashes. |
| CSRF tokens | ✅ | Each session has its own random token (`/api/auth/me`), which must be sent back as `x-csrf-token` on every write. It's compared in constant time. This sits on top of SameSite cookies, JSON-only bodies and the `Sec-Fetch-Site` check. Tested: saving without the token → 403. |
| Reset sessions on password change | ✅ | A change signs out every other device; a reset signs out every device. Tested: the second device is signed out. |
| Expire reset links | ✅ | Single use, 30 minutes, stored hashed, and a new link cancels the old. Tested: a reused link is refused. |
| Broken password reset | ✅ | Token in the URL is removed from the address bar on load. Links are built from `APP_URL`, never the `Host` header (no host-header injection). No third-party resources on the page to leak the referrer to. |
| Prevent user enumeration | ✅ | Forgot-password always gives the same answer (tested). Login uses one message for a wrong email or a wrong password, and an unknown email is checked against a dummy hash so timing matches (tested: 0.37 s vs 0.40 s). The lockout is counted per address whether or not it exists. With email configured, sign-up always says "check your inbox" (see note below). |
| Rate-limit password resets | ✅ | 3 per address and 10 per visitor per hour; hitting the limit gives the same answer as success |
| Lock accounts after failed logins | ✅ | 5 failures per address or 30 per visitor locks for 15 minutes. Tested: the 6th try gets 429. |
| Weak session management | ✅ | Sign out, sign out everywhere, and sessions that end on password change, reset and account deletion |
| Email verification | ✅ | Optional: with `RESEND_API_KEY` + `MAIL_FROM` set, sign-up sends a 24-hour, single-use link, and sign-in requires it |
| Delete account | ✅ | Needs the password, and removes the user, sessions, tokens and plates (cascade) |
| Weak / missing auth, missing auth checks, misconfigured auth | ✅ | Every write goes through `requireUser()` (session + CSRF). Reads of private data check ownership in the SQL itself. |
| JWT secrets | ➖ | No JWTs: server-side sessions instead, which can be revoked |
| Default credentials | ✅ | No built-in or seeded accounts. The local dev database password (`pied-local-only`) only works on 127.0.0.1. |

**About the sign-up note:** without an email service there's no way to tell a new person "check your inbox". Sign-up then has to say "that address already has an account", which lets someone test whether an email is registered. That case is rate-limited (5 sign-ups per visitor per hour) and logged. **Set up email (Resend) for production** and the gap closes.

## Data and access

| Item | Status | Where / how |
|---|---|---|
| IDOR / cross-user access | ✅ | Plate queries include the owner in the `WHERE`. Someone else's private plate answers 404, the same as a missing one, so ids can't be probed. Tested: read, edit and delete by another user → 404. |
| Mass assignment | ✅ | PATCH accepts only `title` and `isPublic` (strict zod). Tested: `user_id` → 400. |
| Input validation / sanitize before storing | ✅ | Plates are checked before storage (`lib/server/plates.ts`): grid size limits; letters, colours and finishes must match the grid exactly; hex paper colour; one of our fonts; a real JPEG thumbnail (magic bytes); titles stripped of control and bidi characters. Tested: a mismatched plate is refused. |
| XSS | ✅ | A nonce CSP (only our scripts run), React escaping, and no `dangerouslySetInnerHTML`. Tested: a title of `<script>x</script>` is shown as text. |
| SQL / NoSQL injection | ✅ | Every query is a `postgres` tagged template, so values are sent as parameters, never spliced into SQL. Tested: `' or 1=1--` as an id → 404. |
| Excessive / open DB permissions, poor tenant isolation | ✅ | Tables live in their own `pied` schema with row level security on and **no policies**. Supabase's `anon` and `authenticated` roles are revoked (`sql/schema.sql`), so the public Supabase API can't reach a row. The server connects as the owner and checks access itself. |
| Quotas | ✅ | 200 plates per account, 30 saves an hour, 4 MB per plate (a DB `check` as well as the code) |
| Pagination | ✅ | Keyset cursors, 12 per page, for the library and the gallery |
| Encrypt data | ✅ / ⚠️ | TLS in transit (HSTS; `sslmode=require` to Supabase). Supabase encrypts storage at rest. Passwords are hashed and tokens hashed. |
| Backups and restore | ⚠️ | Supabase: turn on daily backups / PITR, and do a test restore once |
| Gallery privacy | ✅ | Public cards carry only title, display name, date and thumbnail, never an email or user id (tested) |

## The AI endpoint

| Item | Status | Where / how |
|---|---|---|
| Cap AI usage | ✅ | Per visitor: 8 per 10 minutes, 40 per day. Whole site: 500 per day. **Durable in the database**, so the caps hold across serverless instances. |
| Block prompt injection | ✅ | The visitor supplies only the subject. The brief is composed on the server (`lib/server/prompt.ts`) and placed after their words, and control, bidi and zero-width characters are stripped. |
| Unpermissioned AI access | ✅ | The key stays server-only, and the model is set by the server |
| Content safety | ✅ | fal's safety checker is on, NSFW results are refused, and Pollinations is called with `safe=true` |
| SSRF | ✅ | The image comes back inline. A URL is accepted only as https on `*.fal.media`; anything else is refused, not fetched. |
| Limit request size | ✅ | Hard body caps on every endpoint: 2 KB for prompts and auth, 1.6 MB for plates |

## Headers, browser, platform

| Item | Status | Where / how |
|---|---|---|
| HSTS | ✅ | 2 years, includeSubDomains, preload |
| Missing security headers | ✅ | Nonce CSP, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy, COOP, CORP (`src/proxy.ts`). Tested. |
| CSRF (platform) | ✅ | Cross-site writes to `/api` are refused in `proxy.ts` before any handler runs |
| Insecure cookie settings | ✅ | `__Host-` prefix, HttpOnly, Secure, SameSite=Lax |
| Exposed source maps | ✅ | Off; `.map` returns 404 (tested) |
| Verbose production errors | ✅ | Plain sentences only. Unexpected errors log a short reason and return a generic 500. The error page shows no stack. |
| Disable directory listing / exposed env files | ✅ | `/.env` and unknown paths return 404 (tested) |
| Client-only security | ✅ | Every rule that matters is enforced on the server |
| Open redirects | ✅ | `?next=` accepts only same-site paths (`safeNext`) |
| Uploads | ✅ | JPEG, PNG, WebP, GIF, AVIF or BMP only, up to 25 MB, decoded in the browser, never uploaded |
| Path traversal | ➖ | The server never reads a file path from a request |
| Command injection, insecure deserialisation | ➖ | No shell; nothing but `JSON.parse` of size-capped bodies |
| Admin routes, internal dashboards, debug tools | ➖ | None exist, and production has no debug endpoints. If you add admin, put it behind auth and an IP allowlist. |

## Secrets

| Item | Status | Where / how |
|---|---|---|
| Hard-coded secrets / secrets in JS / in Git | ✅ | Everything comes from environment variables, and `.env*` is ignored (only `.env.example` is committed). `server-only` fails the build if server code reaches the browser. |
| Logs leak secrets | ✅ | Logs hold an event name, a time, a **hashed** visitor id, the user id and a short reason. Never a password, token, key, prompt or IP. |

## Monitoring

| Item | Status | Where / how |
|---|---|---|
| Log security events / audit logs | ✅ | JSON log lines **and** rows in `pied.security_events`. Events: sign-ups, logins, failures, lockouts, password changes and resets, account deletion, plates saved, published and deleted, cross-site attempts, rate limits, blocked content. Tested. |
| Security monitoring | ⚠️ | Add a Vercel log drain (Axiom, Datadog) and alert on spikes of `auth.login_failed` or `api.cross_site` |

## Supply chain

| Item | Status | Where / how |
|---|---|---|
| Vulnerable dependencies | ✅ | `npm audit`: 0 vulnerabilities at the time of this change |
| Malicious packages | ✅ | Small tree: `next`, `react`, `postgres`, `bcryptjs`, `zod`, `server-only`. Lockfile committed. |
| Unreviewed code | ⚠️ | Branch protection on `main`, and Dependabot or Renovate |

## Payments

➖ Not built. When posters or paid plans come:
- Stripe Checkout, with the price looked up on the server from a product id (never sent by the browser)
- fulfilment only from the `checkout.session.completed` webhook, verified with `Stripe-Signature`
- idempotency on event ids
- no card data ever touches the server

## Before you go live — the ⚠️ list

1. **Supabase:** create a project. Copy *Settings → Database → Connection string → Transaction pooler* into `DATABASE_URL`. Run `npm run db:migrate` once. Turn on backups.
2. **Vercel env vars:** `DATABASE_URL`, `APP_URL` (your real https address), `LOG_SALT`, `FAL_KEY`, and ideally `RESEND_API_KEY` + `MAIL_FROM`.
3. **fal:** set a monthly spending limit.
4. **GitHub:** branch protection, secret scanning, Dependabot.
5. **Monitoring:** a log drain with alerts on security events.
