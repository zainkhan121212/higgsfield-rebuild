# Pied — pictures set in loose type

Give Pied a photograph or a sentence. It sets the picture in thousands of letters that scatter when the cursor passes through them and spring back home. Paint on the type with a brush, spray and eraser, then take it home as a **live desktop wallpaper** that still reacts to the cursor, a PNG, or a short video.

*Pie* (printing, n.): type that has been spilled and jumbled. Pied does that on purpose.

## Run it

```bash
cd pied
npm install
npm run dev        # http://localhost:3100
```

Nothing else is needed. Prompt → picture uses Pollinations' keyless FLUX endpoint. Set `FAL_KEY` to use fal's FLUX schnell instead, which is faster and leaves no watermark. There's no database and no account, and uploaded photographs never leave the browser.

To deploy on Vercel, import the repo and set **Root Directory** to `pied`.

### As a claude.ai artifact

`node scripts/artifact.mjs` builds both pages into one self-contained document (`artifact/index.html` plus `artifact/samples/`), for publishing as a claude.ai artifact. Inside the artifact frame a few things work differently, and the app handles each one:

- **Routes.** `/make` becomes `#make`; `next/link` is swapped for a hash link.
- **Downloads.** The frame blocks downloads a page starts itself, so files go through the viewer's `downloads` capability, which asks the viewer to confirm.
- **Prompt → picture.** The artifact has no network, so it can't reach an image model. Instead Claude draws the subject as a bold SVG through the viewer's `sample` capability.
- **Dialogs and pop-ups.** `confirm()` and `window.open` don't work in the frame. The full-screen preview and the "clear paint?" question are both built into the page, which also makes them better on the normal site.

## Pages

| Route | What it is |
|---|---|
| `/` | The landing page. The hero is the product: a woman pouring water, set in the sentence that describes her. Scrolling spills the type. |
| `/make` | The press: **I Source** (write / upload / paste / samples) → **II Set** (words, face, detail, format, ink, paper, contrast, cut-off, motion) → **III Paint** (brush, spray, eraser, restore, size, strength, colours, undo) → **IV Keep** (exports). |
| `/api/imagine` | Prompt → image bytes from our own origin, so the canvas can read the pixels. |

## How it works

**Picture → plate** (`src/lib/plate.ts`). The image is cover-cropped onto a grid by stepping down in halves, so it doesn't alias. It's auto-levelled (2nd–98th percentile), then contrast is applied. Each cell's darkness decides whether a letter is printed there and how much ink it gets. Paint lives in a separate layer (`mask`: printed / painted / erased), so re-typesetting keeps what you painted. Painting on empty paper sets new letters there.

**The engine** (`src/lib/field.ts`). Every letter is a particle on a spring. The engine holds 60fps with ~20k letters because:

- the settled picture is drawn once into an offscreen layer
- each frame blits that layer, covers the home cells of the letters that are moving, and draws only those letters
- physics runs only on the *active* set. Letters near the pointer are found through the grid, not by scanning every letter.
- the loop parks when nothing moves, and a pointer move wakes it
- the pointer is sampled at a fixed timestep, so a 144Hz monitor doesn't make the type faster

**One engine, two places.** `createField` is written with no imports and no outer-scope references. The exported wallpaper embeds `createField.toString()` verbatim, so the wallpaper runs exactly the code the site runs. It was tested by opening the exported file from disk in Chromium and moving the mouse through it.

## Research: getting it onto a desktop

A normal wallpaper is a still image. To keep the letters interactive, the wallpaper has to be a web page, and a host app has to render it behind the desktop icons and forward the mouse to it.

| Platform | Host | Cursor reaches the letters? | How |
|---|---|---|---|
| Windows | **Lively Wallpaper** (free, open source, Microsoft Store) | Yes | Drag the kit `.zip` (it has a `LivelyInfo.json`) onto Lively. Set *Settings → Wallpaper → Input* to *Mouse*. |
| Windows | **Wallpaper Engine** (Steam, paid) | Yes | *Create Wallpaper* → choose `index.html` (the kit includes a `project.json` of type `web`). |
| macOS | **Plash** (free, App Store) | Only in *Browsing Mode* | macOS draws the desktop under every window and never forwards the cursor to it, so no Mac wallpaper app can be interactive and click-through at the same time. |
| Linux | e.g. Hidamari, Komorebi (web wallpapers) | Varies by compositor | Point it at `index.html`. |
| Anywhere | Any browser, full screen | Yes | Open the `.html` and press F11 (⌃⌘F on a Mac). |

Exports (`src/lib/export.ts`), all built in the browser:

- **Live wallpaper (.html).** One ~100–300 KB self-contained file: plate data as base64, the engine inline, system fonts only, works offline. It has optional *idle drift*, a slow invisible hand that stirs the type when you're away, and it respects `prefers-reduced-motion`.
- **Wallpaper kit (.zip).** `index.html` + `LivelyInfo.json` + `project.json` + `preview.jpg` + `README.txt`. It uses a tiny store-only ZIP writer, so there's no dependency.
- **Still (.png).** Plate ×4, a 4K desktop, or a phone size.
- **Motion (.mp4 / .webm).** A 7-second `MediaRecorder` capture: the type assembles, an invisible hand sweeps a figure-eight through it, and it settles again, so it loops.

## Design

Two inks only: paper `#f4f3ee` and ink `#0c0c0b`. Colour belongs to what people make, never to the chrome. It's set in Libre Caslon (display and text, with a real italic) and Courier Prime (labels), the three voices of a print shop. It has a printed-paper grain, hairline rules, figure numbers and roman-numeral chapters.

Motion, all scroll- or pointer-driven and off under `prefers-reduced-motion`:

- **Hero.** The type assembles on load, scatters under the cursor, and spills with gravity as you scroll.
- **Definition.** A dictionary entry for *pie* inks itself in word by word while pinned.
- **Ticker.** Two lines of Caslon run in opposite directions. Scroll speed throws them and skews them.
- **Process.** In the dark room, the steps scroll while one proof changes state: photograph → type → paint → desktop.
- **Specimen book.** Three live plates set three different ways.
- **Desktop.** A monitor running a live wallpaper, with honest setup notes per OS.
- **Colophon.** The closing line is loose DOM type on springs, so the page ends the way it began.
- A proof-reader's ring trails the pointer (fine pointers only). It grows over controls and captions the plates.
