# Higgsfield.ai — product recon (2026-09-15)

Captured by walking the live site logged-out (Chrome) and logged-in (in-app browser, account `zain khan`, free plan, 0 assets).

## What the product is

An AI-native creative suite: one account, one credit balance, many models. Two core builders (Image, Video), a preset library ("Effects"), an asset library, and a big marketing/explore surface that funnels everyone into the builders. Everything is priced in **credits** that show right on the Generate button.

## Global chrome

- Top promo bar (lime): "Personal 54% OFF on Max. Nano Banana Pro & 2, Kling 3.0 Unlimited" + countdown + CTA + close.
- Top nav, one row, dark:
  - Logo · **Explore** (`/`) · **Image** (`/ai/image?model=gpt_image_2`) · **Video** (`/ai/video`) · **Audio** (`/audio`) · **MCP** (`/mcp`) · | · ChatGPT Plugin `New` · Genjutsu `New` (`/ai/video?model=genjutsu`) · Effects `Free` (`/effects/use`) · Cinema Studio (`/generate`) · Marketing Studio · Supercomputer · 3D Jutsu `New` · Edit (`/layers`) · Academy · Community · Contests · Plugins · Canvas · Originals (overflow scrolls)
  - Right: search icon · **Pricing** (with "30% OFF" pink pill) · Enterprise · globe · | · logged-out: `Login` (black pill) `Sign up` (lime pill) / logged-in: **Assets** (`/asset/all`) · bell · avatar.
- Palette: near-black page (`#0a0a0a`–`#000`), cards `#141414`/`#1a1a1a` with 1px `#262626` borders, text white / `#a3a3a3`, **lime accent ≈ `#d3ff3d` / `#c8ff00`**, pink accent for discounts (`#ff2d8a`), radius 12–16px. Headings: condensed uppercase grotesque (Higgsfield's brand face); body Inter-like.

## Explore / landing (`/`)

Sections top → bottom (logged out; logged in swaps the "sign up" card for a promo):

1. **Feature carousel** — 4 wide cards, horizontal scroll: "Higgsfield AI Motion Designer" (ChatGPT can now do motion design in After Effects), "Higgsfield Effects" (Viral video presets now in ChatGPT, with free generations), "Higgsfield Genjutsu" (One upload in. Endless new visions out.), "GPT Image 2.5 Sunburst" (Sharper edits with more natural light and texture), "Higgsfield × GPT-6 Astra" (Turn a single prompt into a playable 3D game).
2. **Discount card + 6 tool tiles** — left: "SIGN UP AND GET YOUR EXTRA DISCOUNT" card with checklist + lime CTA. Right 3×2 tiles: Seedance 2.5 `TOP` (Video · The most advanced video model), Nano Banana Pro `Top` (Image · Generate high-quality visuals), Higgsfield Genjutsu `NEW` (One video, many versions), MCP & CLI `New` (Turn Claude into a creative engine), Cinema Studio 4.0 (Create cinematic scenes effortlessly), Supercomputer (Agent powered by GPT-6 Astra).
3. **MCP banner** — "Higgsfield MCP with GPT-6 ASTRA", two CTAs (Install Higgsfield plugin / Explore use cases).
4. **Visual Effects** — heading + "Big-budget visual effects…" + "Try for free" CTA; masonry of autoplaying preset clips. Preset names: Incline, Act Natural, Lacewalker, Burning Man, Melting, World Morphing, High Flip, Street Colossus, Selfception, Cutout, Floating Fall, Eyes In, Wild Ride, Smash and Grab, Studio Slide. "View all presets ↗" overlay.
5. **Higgsfield Genjutsu** — "New model" pill, "Reality Manipulation — transfer motion into new scenes, or swap details while everything else stays as filmed." CTAs Start generating / Learn more; 5×2 clip grid.
6. **Explore the inside of every project** — community projects with "Public" tag and "by Higgsfield Studio": Cully Hill Boys, Red Flag, Kok Boru, Adiliada, ONEIRIC, ZEPHYR: Special, HELL GRIND.
7. **Supercomputer** — "One superagent for your entire creative stack", "4K images with near-perfect text rendering."
8. **Canvas** — "ONE CANVAS. EVERY WORKFLOW." Moodboard, chain workflows, share with team.
9. **Marketing Studio** gallery, **Community** gallery, **Different scenes same star** (character consistency), **Soul** ("A culture-native photo model built for fashion, aesthetics, and creative expression"), **Explore more AI features**, footer.

## Video builder (`/ai/video?model=<id>`)

Two-column app layout under the nav.

**Left panel (≈300px):**
- Tabs: Create Video · Edit Video · Motion Control
- Preset card: thumbnail, `GENERAL`, model subtitle, "✎ Change" → opens **preset picker** (full-width modal): tabs per model (Seedance 2.5 `NEW`, Higgsfield Genjutsu `NEW`, FLUX.3 Video, Kling 3.0, Kling 3.0 Turbo, Seedance 2.0 Fast, Exclusive…), search box, grid of preset cards (GENERAL, BASEBALL GAME, NIGHTLINE, NEON CITY, SOUL FIGHTER, …).
- Segmented: References | Extend Video
- "Add references — Image, Video or Audio" drop zone with 3 icon buttons
- Prompt textarea (placeholder: Describe the visual change you want — e.g., "Make it snow"…). Footer chips: `@ Elements` · `🔊 On`
- Model row (name + icon, chevron) → **model picker** popover with search, "Featured models" / "All models":
  - Featured: Seedance 2.5 `TOP` (1080p · 4s–30s), Higgsfield Genjutsu `NEW`, Seedance 2.5 Edit `TOP` (480p–720p · Edit Video · Audio), Seedance 2.0 (4K · 4s–15s), Seedance 2.0 Fast (720p), Seedance 2.0 Mini (720p), MiniMax H3 (2K · 5s–15s), MiniMax H3 Max (768p), Gemini Omni Flash 1.1 (+ Extend), Kling 3.0, Kling 3.0 Motion Control, FLUX.3 Video, Grok Imagine 1.5, Wan 3.0
  - All: Minimax Hailuo, FLUX.3 Video, Kling, OpenAI Sora 2, Google Veo, …
- Setting chips row: `⏱ 5s` · `▭ 16:9` · `◇ 1080p`; then `Bitrate — High`
- **Generate ✦ ~~80~~ 45** (full-width lime button, struck-through original cost, discounted cost)

**Right panel:** tabs `History` · `How it works`. Empty state: "MAKE VIDEOS IN ONE CLICK — 250+ presets for camera control, framing, and high-quality VFX - or use the general preset for manual control." 3 steps: ADD IMAGE / CHOOSE PRESET / GET VIDEO. Card: "Don't know where to start? Go to the Academy". Floating "Live now · $1,000,000 · Join Higgsfield Global Film Festival" promo card (closable).

## Image builder (`/ai/image?model=<id>`)

Single centered canvas. Hero: 4 sample cards fanned out, "START CREATING WITH **HIGGSFIELD SOUL CINEMA**", "Describe a scene, character, mood, or style — and watch it come to life". Top-right: grid-size slider.

**Bottom prompt bar (floating, full width, dark rounded):** `+` attach · "Describe the scene you imagine" · chips: model (icon + name + chevron), `Auto` ratio, `High` quality, `2K` resolution, `Auto` style, `− 1/4 +` batch count, `Draw` (for Nano Banana) · **Generate ✦ ~~8.5~~ 6.5** (lime). Cost changes per model (Nano Banana = 1).

Model picker (same component as video): Featured — Higgsfield Soul 2.0, Higgsfield Soul Cinema, GPT Image 2.5 Sunburst `NEW`, GPT Image 2.5 Flare `NEW`, GPT Image 2 `PREMIUM` (4K images with near-perfect text rendering), Seedream 5.0 Pro `PREMIUM`, Seedream 5.0 lite, Seedream 4.5 `PREMIUM`, Nano Banana Pro, Nano Banana 2 `PREMIUM`, Nano Banana 2 Lite, Recraft V4.1. All — Nano Banana, Higgsfield Soul, Face Swap, Character Swap, Seedream 4.0, GPT Image 1.5, Grok Imagine, Grok Imagine 2.0, …

## Assets (`/asset/all`, logged in)

Left sidebar: search · All Assets (0) · Favorites (0) · **Tools**: Image (0) · Video (0) · Audio (0) · **Folders** under the user's name ("Create one to stay organized", + button). Main: "All assets" title, view-size slider, empty state (fanned thumbnails, "Your generations will appear here", "Use folders to keep your work organized.", `✦ Generate` CTA).

## Pricing (`/pricing`)

- Promo hero (pink): "Nano Banana Pro, Nano Banana 2 & Kling 3.0 Unlimited — sign up and get your additional discount".
- "Upgrade your plan" · toggle **Individual plans / Business plans** · "Not sure which plan?" · **Monthly / Annual** switch.
- Cards: **Basic** $9/mo (120 credits ≈ 60 Nano Banana Pro gens ≈ 7 Seedance 2.0 Fast videos, fixed) · **Pro** ~~$29~~ $23 `21% OFF` (600–900 credits slider) · **Max** ~~$79~~ $59 `25% OFF · BEST VALUE` (1,800–5,400 credits) · Ultra (off-screen). Each: "Unlimited & free gens" block (Nano Banana Pro / Nano Banana 2 / Kling 3.0 with 7-day unlimited tags), model access rows (Seedance 2.0 4K Full access), feature checklist (parallel generations, Supercomputer, all models, early access, marketplace, lowest cost per credit).
- "Find the best plan for you" wizard: 1) What are you here to make (Social media videos, Talking-avatar, UGC & product ads, Marketing product photos, Cinematic, Personal) 2) How many content items per month (≈14 credits per Kling 3.0 8s 720p, ≈2 per Nano Banana Pro) → recommends a plan.
- Footnotes: unlimited models only on higgsfield.ai, prices exclude VAT.

## Auth

Login / Sign up open a modal (Google + email). Free accounts get a small credit balance; the Generate button always shows the cost.

## What I could NOT capture

- The actual "generating → done" state and the result card in History (input events in the in-app browser did not reach the React app; the account has 0 generations). Inferred from the empty-state copy and the credit UI. Will verify once logged in on Chrome.
- Audio, MCP, Edit (`/layers`), Canvas, Marketing Studio, Academy, Community pages — marketing/secondary surfaces, deliberately skipped for the 24h scope.
