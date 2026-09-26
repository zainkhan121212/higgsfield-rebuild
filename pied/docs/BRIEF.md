# Pied — project brief

*A letterpress for pictures.* You give Pied a photograph or a sentence, and it sets the picture in thousands of letters. The letters scatter when your cursor passes through and spring back home. You paint on it, then keep it as a **live desktop wallpaper** that still reacts to the cursor, morphs between pictures, keeps the time, or dances to music.

*Pie* (printing, n.): type that has been spilled and jumbled. Pied does that on purpose.

This file is written so another person or AI model can understand the project quickly and suggest what to build next. The open questions are at the end.

---

## 1. Who it's for

- **Visitors** who want a beautiful, personal desktop wallpaper that isn't a static image.
- **People making gifts:** a photo written over with a name or a song lyric (the Word Brush).
- **Reviewers:** it's a portfolio and admissions piece, so the front end has to feel original, crafted and "wow" on first contact.

## 2. What exists today

### The site

| Page | What it does |
|---|---|
| `/` | Landing page (details below) |
| `/make` | **The press**, the editor, in 4 steps: Source → Set → Paint → Keep |
| `/gallery` | Public plates people chose to share |
| `/library` | Your saved plates: publish or unpublish, copy link, delete, make a slideshow wallpaper from the ones you pick |
| `/p/[id]` | Share page: the plate live, with downloads |
| `/signin`, `/signup`, `/forgot`, `/reset`, `/verify`, `/account` | Accounts |

### The landing page (scroll-driven, black and white, vintage print-shop)

- **Hero:** a woman pouring water, drawn in letters, which scatter under the cursor. Scrolling "spills" the type off the page. The headline is loose type: its letters drop into place on load, then dodge the cursor.
- **Pie, n.:** a pinned dictionary entry that inks itself in word by word as you scroll.
- **Ticker:** two lines of huge Caslon type. Scroll speed throws them and leans them.
- **How it prints:** a dark section that "presses in" from an inset plate. Four steps scroll past while one proof changes: photo → type → paint → desktop.
- **Specimen book:** three live plates set three different ways.
- **It keeps changing:** a live slideshow morphing between pictures, and a live clock made of type.
- **On your desktop:** a monitor running a live wallpaper, with honest per-OS setup notes.
- **Colophon:** the closing line is loose type again.
- **Everywhere on the page:**
  - the cursor sheds tumbling letters, and a click bursts spilled type
  - a proof-reader's ring trails the cursor
  - magnetic buttons, scrambling labels
  - a composing-stick scroll gauge on the left margin

### The press (`/make`)

**I. Source**
- **Write:** a prompt goes to the server, which wraps it in a fixed brief and sends it to fal FLUX. The returned image is auto-framed so the subject fills the plate. Styles: Photograph, Silhouette, Ink, Engraving, Colour.
- **Upload** or **paste** a picture. It's read in the browser only.
- **Samples.**

**II. Set**
- your words, or a density ramp
- typeface (Mono / Typewriter / Serif) and weight
- detail (60–240 columns)
- format (Desktop / Phone / Square / As is)
- mono or colour ink; light or dark paper
- contrast, cut-off, invert
- motion: reach, push, spring

**III. Paint**
- **Tools:** Brush, Spray, **Word Brush**, Eraser, Restore. The Word Brush writes a phrase into the letters it passes, reading left to right.
- **Finishes:** Ink, **Neon** (a glow around a bright core), **Foil** (gold, silver or copper leaf whose shine follows the cursor like light on metal).
- Paint stays on the letters unless *Paint on bare paper* is on.
- Size, strength, colour trays, undo/redo.

**IV. Keep**
- **Live wallpaper:** one self-contained HTML file, plus a kit ZIP for Lively Wallpaper, Wallpaper Engine and Plash. It can be:
  - *This picture*
  - *Slideshow* (a tray of plates that morph into each other every 20 s to 15 min)
  - *Clock* (the time in type, spelled in words, dark paper at night)
- **Options:** whole picture or fill; idle drift; **dance to music** (Wallpaper Engine and Lively send audio to the page).
- **Full-screen preview**, where you can play a song through it.
- **Other exports:** PNG (plate ×4, 4K desktop, phone) and a 7 s video.
- **Save to library** (with an account).
- **Phones:** tilt the phone and the letters slide like sand (iOS asks permission first).

## 3. How it works

- **Engine** (`src/lib/field.ts`): every letter is a particle on a spring.
  - The settled picture is drawn once into an offscreen layer.
  - Each frame redraws only the letters that are moving. Physics touches only letters near the cursor, found through the grid.
  - The loop sleeps when nothing moves.
  - It's written self-contained, so the exported wallpaper embeds `createField.toString()`: the same code runs on the site and on the desktop.
  - It also handles morph (fly letters from picture A to picture B), kick (beats), tilt, and neon/foil finishes.
- **Picture → plate** (`src/lib/plate.ts`): cover-crop onto a grid, auto-levels, contrast, then darkness → ink per cell. Paint lives in a separate layer, so re-typesetting keeps it.
- **Wallpaper driver** (`src/lib/wallpaper.ts`): picture, slideshow or clock, plus audio listeners. Embedded in the file; the preview runs it too.
- **Clock** (`src/lib/clock.ts`): draws the numerals and sets them in letters that spell the time.
- **Prompt brief** (`src/lib/server/prompt.ts`): the "system prompt" for the image model.
- **Accounts:** Postgres through the `postgres` library, with SQL in `sql/schema.sql`. It runs on Supabase (own schema, row level security, API roles revoked).

### Stack

- **Front and back:** Next.js 16 (App Router, `proxy.ts`), React 19, TypeScript, Tailwind v4.
- **Database:** Postgres (Supabase in production, bundled local Postgres in development).
- **Auth:** bcryptjs + zod.
- **Images:** fal.ai FLUX, with keyless Pollinations as the fallback.
- **Email:** Resend (optional).
- **Deploy:** Vercel, with Root Directory `pied`.
- **Artifact build:** a claude.ai artifact build of the front end (`scripts/artifact.mjs`).

### Design system

- **Colour:** two inks only, paper `#f4f3ee` and ink `#0c0c0b`. Colour belongs to what people make, never to the chrome.
- **Type:**
  - Libre Caslon Display (headlines)
  - Libre Caslon Text (body, with a real italic)
  - Courier Prime (labels, uppercase, wide tracking)
- **Vocabulary:** printing terms throughout (§ numbers, figure captions, roman-numeral chapters, forme, plate, pie, colophon), hairline rules, paper grain.
- **Motion:** every animation is pointer- or scroll-driven, and all of it switches off under `prefers-reduced-motion`.

## 4. Security and performance

Every item on the checklist is marked done, not applicable, or needed at deploy, in [`SECURITY.md`](SECURITY.md) and [`PERFORMANCE.md`](PERFORMANCE.md). In short:
- **Page security:** a nonce CSP, HSTS and the standard security headers.
- **Sessions:** hashed tokens with CSRF protection; sign-in can't be used to check which emails are registered; lockouts and durable rate limits.
- **Data:** checks that stop anyone opening someone else's private plates, strict input validation, and parameterised SQL.
- **AI endpoint:** spend caps and a server-side prompt brief. The server never fetches arbitrary URLs.
- **Logging:** security events are recorded in logs and in the database.

## 5. Not done yet

- **Payments:** none (planned for printed posters; the approach is in SECURITY.md).
- **Webcam "mirror" mode:** set aside for now (no webcam to test with).
- **Email:** optional. Without it, sign-up can reveal whether an address is registered, though rate-limited (SECURITY.md explains).
- **macOS:** the desktop never receives the cursor, so interaction there needs Plash's browsing mode.

## 6. Questions for other models and tools

1. **Front end:** what would make the first 10 seconds of the landing page even more astonishing, while staying black-and-white, vintage and minimal?
2. **Growth:** what makes someone share their plate? Remix buttons, weekly themes, a "plate of the day"?
3. **Wallpapers:** what other *live* behaviours would people keep on their desktop? Weather, calendar, notifications as type?
4. **Monetisation:** printed letterpress posters, paid packs of typefaces or finishes, or a pro plan with 4K video?
5. **Tech:** would WebGL (instancing thousands of glyphs from a texture atlas) be worth it for 100k-letter plates at 4K?
6. **Accessibility:** how do we describe a type picture well to a screen-reader user?

## 7. Running it

```bash
cd pied
npm install
cp .env.example .env.local   # fill FAL_KEY; DATABASE_URL for accounts
npm run db:start && npm run db:migrate   # local Postgres (optional)
npm run dev                  # http://localhost:3100
```
