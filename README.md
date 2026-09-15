# Higgsfield — rebuilt in 24 hours

A working rebuild of [higgsfield.ai](https://higgsfield.ai): image and video generation studios, a preset library, an asset library, credits, and pricing — with one deliberate improvement: **every account can actually generate** (100 free credits, no paywall on the Generate button).

- Live: see the link in the submission
- Recon of the original: [`docs/recon/notes.md`](docs/recon/notes.md)
- What was built first and what was left out: [`docs/PLAN.md`](docs/PLAN.md)
- Agent capture proof: [`CAPTURE-TEST.md`](CAPTURE-TEST.md), logs in [`.agent-logs/`](.agent-logs/)

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Radix · Prisma + Postgres (Supabase) · fal.ai · Vercel

## Run locally

```bash
npm install
cp .env.example .env.local     # then fill DATABASE_URL / DIRECT_URL (or use the embedded DB below)
npm run db:start               # embedded PostgreSQL 17 on 127.0.0.1:54322, no Docker
cp .env.local .env             # Prisma CLI reads .env
npm run db:push
npm run dev
```

Set `FAL_KEY` to get real image generation (FLUX schnell/dev). Without it, images and videos are **simulated**: the job pipeline, credits, polling and history are all real; the media is a placeholder and is labelled "simulated" in the UI.

## How generation works

`POST /api/generate` prices the request from the model catalog, debits credits and creates a `Generation` row inside one transaction, then runs the job after the response is flushed (`after()`). The client polls `GET /api/generations/:id`; if a serverless instance died mid-job the poller picks the job up again. Failures refund credits.

## Layout

- `src/lib/catalog/` — models, presets, plans (static; the product's "content")
- `src/lib/generate/` — pricing, job lifecycle, fal / simulated providers
- `src/lib/auth.ts` — guest-first sessions (cookie → user row with credits)
- `src/components/studio/` — image & video studios, model/preset pickers, generation cards
- `src/app/` — routes: `/` explore · `/ai/image` · `/ai/video` · `/asset/[filter]` · `/effects` · `/pricing` · `/a/[id]` share page
