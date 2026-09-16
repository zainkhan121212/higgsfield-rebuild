# Walkthrough script (under 5 minutes, camera on)

Open the site in an incognito window so it looks the way a judge sees it.

- Live: https://higgsfield-rebuild-delta.vercel.app
- Repo: https://github.com/zainkhan121212/higgsfield-rebuild

## 0:00 — Intro (20s)
"This is my rebuild of Higgsfield.ai, done in one day. Same product: image studio, video studio, presets, assets, credits, pricing. One thing I changed on purpose: on the real site a free account cannot generate anything — every Generate button opens a paywall. Here, every visitor gets 100 credits and can generate in the first ten seconds."

## 0:20 — Home (30s)
Scroll. "Same sections as the original — feature cards, Visual Effects, Genjutsu, Seedance, projects, Supercomputer, community rows — every clip plays on its own. Every nav item works: MCP, Cinema Studio, Academy, Contests, Enterprise."

## 0:50 — Image studio (60s)
Click Image → a suggestion prompt → point at the cost on Generate → open the model picker → Generate.
"This is a real image. Credits go down live. Favorite, download, or copy a public share link."

## 1:50 — Video studio + Preview before you pay (70s)
Click Video → Change → pick Wild Ride → Preview frames ✦1.
"A video costs 45 credits. Instead of guessing, I spend 1 credit, get four stills, and pick the frame I like. That frame becomes the first frame of the video." Pick one → Generate.
"Honest note: video models are simulated in this build — credits, queue and history are real, the clip is a sample. No free video API fit in 24 hours, and the app says so on every video."

## 3:00 — Account, login, checkout (50s)
Sign up. "Sign-up upgrades the guest account, nothing is lost. Login also supports passkeys — Face ID, Windows Hello — no password to steal."
Pricing → Get Pro. "Real steps: review, card form, processing, receipt with an order number. Test card, nothing charged, card details never leave the browser."
Open the bell. "Notifications are real: finished generations, orders, new sign-ins."

## 3:50 — Security (30s)
"docs/SECURITY.md has the details. Short version: passkeys, signed sessions, cross-site request blocking at the edge, strict Content Security Policy, rate limits with login lockout, and a cap on free accounts per IP so nobody can farm credits. Every sign-in is in an audit log on the account page."

## 4:20 — Close (25s)
"Left out on purpose: audio, canvas, real payments, real video generation — listed in docs/PLAN.md with reasons. Stack: Next.js, Prisma with Supabase Postgres, Vercel. Agent logs and the capture test are committed. Thanks."

Stop at ~4:45.
