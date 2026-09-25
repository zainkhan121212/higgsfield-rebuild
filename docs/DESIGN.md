# Design — Frameline

The brief changed after the first submission: keep the idea and the backend,
bring your own layout and visual identity. This is the record of what I chose
and why, so the design can be argued rather than just looked at.

## The thesis

A prompt is writing. A generation is what the writing became. Everything else
in this category dresses that up as a dark control panel with neon accents —
the site I rebuilt first is lime on black, and so is nearly every competitor.

So Frameline is a **page**: warm paper, black ink, hairline rules, figure
numbers in the margin, one vermilion accent used the way a proof-reader uses a
red pen. It is the opposite of the room everyone else is standing in, and it is
the honest shape of the product, because what you actually do here is write.

## The hero is the argument

The first thing on the home page is a picture of a woman pouring water that is
made **out of the sentence that generated it** — the image is sampled to a
grid, and at each cell one character of the prompt is printed at that pixel's
darkness. Move a cursor through her and the writing scatters; a spring pulls it
back into the picture.

It is not decoration. It says the whole product in one object: the words are
the picture. `src/components/hero/prompt-image.tsx`.

Performance, because a marketing page has no excuse:

- one `ctx.font` for the whole canvas — setting it per glyph is the single most
  expensive thing you can do in a 2D loop (it took the first version from 60fps
  to 21fps)
- colours quantised into buckets, so `fillStyle` changes about a hundred times
  a frame instead of three thousand
- the RAF loop parks itself when the energy settles and wakes on `pointermove`
- `prefers-reduced-motion` or a device with no hover draws once and never
  animates
- the source is read through a same-origin proxy so the canvas stays untainted

## The overture

Four seconds of dark room before the page, on a first visit.

1. **Ignition** — a slit of amber light opens on black, the way a projector
   strikes up.
2. **Welcome** — one word, set enormous in the serif with a chromatic fringe,
   over a line of mono: *take your time · it is only a page*. Casual on purpose.
   Nothing is being sold yet.
3. **The plate** — the futurist half arrives: a night-blue ground, an amber
   technical grid, scanlines, crop marks at the corners, and a spec block of the
   kind stencilled on a film can — ORIGIN TEXT / FORMAT 35 MM / GRAIN ON /
   CREDITS 100. The headline, *the words come first*, is the thesis again.
4. **Dissolve** — the whole panel lifts and the paper page is already underneath.

The two halves are the point: **vintage** is the serif, the reel number, the
crop marks, 35 mm, the warmth of a bulb; **futurist** is the grid, the
scanlines, the telemetry, the cold blue. Neither alone would be interesting.

An entrance that traps someone is a bad entrance, so:

- once per tab (`sessionStorage`) — a reload never replays it
- any click, key, scroll or touch skips straight to the dissolve
- `prefers-reduced-motion` never sees it at all
- the page beneath is fully server-rendered the whole time, so a crawler, a
  reader mode, or a failed JS bundle loses nothing
- `/?intro=1` replays it deliberately; the colophon links to that, which is also
  how it gets demoed in the walkthrough video

## Paper and dark room

The home page alternates: you read on paper, you watch in the dark. Odd
sections are printed, even sections are projected.

- **§ 02 — Lately, in the dark room.** A contact strip of the newest real
  generations running past on night ground, edged with sprocket holes, each
  frame numbered and captioned with its model. Two copies of the list slide at a
  constant rate so the loop has no seam; hover stops it, reduced motion parks it.
- **§ 04 — The difference.** The credits argument, on night ground with an amber
  lamp glow from the upper left and the headline in chromatic fringe.
- **§ 06 — Two rooms.** The two studios shown in the dark, where moving images
  belong.

That rhythm is what makes the paper read as a deliberate choice rather than an
absence of design — and it is where the colour lives, because the generated work
is colourful and a dark ground is what lets it glow.

## The system

| | |
|---|---|
| Ground | `#f2f0e9` paper, with a 3.5% tiled noise so it reads as printed |
| Ink | `#14120e`, with two lighter greys for secondary and tertiary text |
| Accent | `#bc3318` vermilion — links on hover, the current section, one CTA |
| Display | Instrument Serif, mixed case, tight leading, real italic |
| Labels | IBM Plex Mono, uppercase, wide tracking — figure numbers, costs, meta |
| Text | Inter |
| Corners | 2–3px. Nothing is a pill except the things that must read as toggles |
| Rules | 1px hairlines carry the structure instead of cards and shadows |

All of it lives in `@theme` in `src/app/globals.css`. Retuning a surface is a
token change, not a sweep through fifty components — which is how the entire
app moved from dark to paper in one pass.

## Layout decisions worth defending

**The nav is a masthead, not a toolbar.** The original stacks a promo bar over
a sixteen-item rail. Here: wordmark, three verbs (Image, Video, Library), and
an **Index** — a full-width table of contents holding every secondary page,
numbered. Every page still exists and is one click away; none of them shout.

**Sections are numbered like a document** (§ 02, § 03) and captions sit under
plates, not on top of them. No text is ever laid over an image, so nothing is
ever muddied by a scrim.

**One inverted band.** The credits argument (§ 03) is the only ink-filled block
on the home page, so the one thing worth remembering is the one thing that
changes colour.

**Real work, real captions.** The Plates section is not art direction — it is
the last nine public generations out of Postgres, each captioned with the
prompt that made it and the model that ran it. If the app is empty, the section
says so instead of faking it.

## Media

Every still on the marketing surfaces was generated by this app through fal and
is served from our own origin (`public/media`, 80 images, regenerate with
`scripts/generate-media.mjs`). Before, the catalog pointed at a keyless public
endpoint that rate-limits hard — a reviewer could have met a wall of broken
tiles. Motion tiles are Mixkit free-license footage, labelled as such.

Higgsfield's own media is switched off (`src/lib/catalog/hf-media.json`).

## What I did not change

The backend. It was real before and it is real now: Postgres through Prisma,
credits as transactions with refunds on failure, fal for image generation,
passkeys and the rest of `docs/SECURITY.md`. The brief asked for a new front
end, not a new product.
