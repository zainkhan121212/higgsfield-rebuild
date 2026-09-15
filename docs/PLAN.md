# Build plan — Higgsfield rebuild in 24h

Clock started ~06:17 UTC 15 Sep 2026. Recon done at ~06:50 UTC.

## Product judgement — what ships, in order

The whole product funnels into two builders and one library. Everything else on higgsfield.ai is marketing for those. So:

| # | Surface | Why first | Scope |
|---|---|---|---|
| 1 | App shell: nav, promo bar, theme, auth state, credit balance | Every page needs it; sets the visual bar | Full |
| 2 | **Image builder** `/ai/image` | The fastest path to "it works": prompt → real image in seconds | Model picker, ratio/quality/resolution/batch chips, per-model credit cost, generate → job → result grid, history |
| 3 | **Video builder** `/ai/video` | The flagship surface; same job system as image | Preset picker per model, references drop zone, prompt, duration/ratio/resolution chips, generate → job → result |
| 4 | **Assets** `/asset/all` | Where generations live; makes the app feel real | All / favorites / by type / folders, grid with size slider, empty states |
| 5 | **Explore** `/` | First thing a judge opens without signing in | Feature cards, tool tiles, effects gallery, community projects — seeded from real generations made in this app |
| 6 | **Pricing** `/pricing` | Credits need an explanation and a top-up path | Plans, monthly/annual, credit slider, "buy" = instant credit grant (no real checkout) |
| 7 | Auth | Needed for persistence per user | Email magic-link is overkill for 24h: guest session cookie + optional "sign in with email" that just names the guest. Live link works for anyone. |

Left out on purpose: Audio, MCP, ChatGPT plugin, Canvas, Edit/Layers, Marketing Studio, Academy, Community, Contests, Enterprise, Business plans. They are either separate products or content sites.

## "Better than the original"

- No promo-bar spam; one calm nav that fits on one row.
- Builders show **what a generation will cost before and after** and update the balance live.
- Generation history is a first-class timeline on every builder, with re-run / edit-prompt / open-in-assets.
- Keyboard: `⌘/Ctrl+Enter` generates, `⌘K` opens model search.
- Every asset has a public share page (`/a/<id>`) — Higgsfield's are behind login.
- Honest labels: models that are simulated say so in the UI.

## Generation strategy

- **Images: real.** fal.ai `flux/schnell` (≈1–3s, ≈$0.003/img). Model names in the picker map to a small set of real backends (schnell / dev / sdxl-lightning) plus prompt-style suffixes, so "Soul", "Nano Banana", "GPT Image" feel different without pretending to be those models.
- **Videos: real if a key + budget exist, else simulated.** fal `minimax/video-01` or `kling` takes 1–5 min and costs ~$0.3–0.5/clip. Default: a job that takes 8–20s and resolves to a preset sample clip, clearly badged "simulated". If `FAL_KEY` is set and `VIDEO_MODE=real`, it calls the real endpoint.
- Jobs are rows in Postgres (`generations`): `queued → running → done | failed`. Client polls every 1.5s. Credits are debited on submit and refunded on failure.

## Stack

Next.js 15 (App Router, RSC, server actions) · TypeScript · Tailwind v4 · Radix primitives · Prisma + Postgres (Neon) · fal.ai · Vercel.

## Data model

```
User        id, name, email?, plan, credits, createdAt
Generation  id, userId, kind(image|video), model, preset?, prompt, params(json),
            status, cost, outputUrls[], thumbnailUrl?, error?, isFavorite, folderId?, isPublic, createdAt, finishedAt
Folder      id, userId, name
Model       (static catalog in code: id, name, kind, badge, description, caps, cost table, backend)
Preset      (static catalog in code: id, modelId, name, thumb, promptSuffix)
```

## Timeline (UTC)

- 07:00–08:00 scaffold, DB, auth, shell, model/preset catalog
- 08:00–10:00 image builder end-to-end with real generation
- 10:00–12:30 video builder + presets + simulated jobs
- 12:30–14:00 assets + share page
- 14:00–16:00 explore page seeded from real output, pricing
- 16:00–17:00 deploy, polish, mobile pass
- then: walkthrough video, submit
