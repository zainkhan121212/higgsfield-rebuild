# Pied — performance

This page goes through the checklist item by item. Some items come from native mobile apps ("recycle list cells", "profile with Instruments", "trim app launch") or from database-backed apps ("fix N+1 queries", "index the database", "paginate long lists"). Pied is a web page with no database, so those items are marked ➖ with the reason.

## The engine (where the time actually goes)

| Item | Status | How |
|---|---|---|
| Main-thread work | ✅ | The settled picture is drawn **once** into an offscreen layer. Each frame blits that layer and redraws only the letters that are moving (plus foil letters, whose shine follows the cursor). |
| Batch work | ✅ | Letters are grouped by colour, so `fillStyle` changes once per colour, not once per letter. There's one `ctx.font` per canvas, because setting the font per glyph is the most expensive thing a 2D canvas loop can do. |
| Defer non-critical work | ✅ | The animation loop parks when nothing moves; a pointer move wakes it. Physics runs only on the *active* letters, found through the grid rather than by scanning all 20k. |
| Offscreen work | ✅ | Plates start only when scrolled near (`IntersectionObserver`), and plates with idle drift pause when scrolled away (`plate-canvas.tsx`) |
| Debounce input | ✅ | Typing words or dragging a slider uses `useDeferredValue`, so the keystroke paints first and re-typesetting follows (`press.tsx`) |
| Downsample big images | ✅ | Uploads over 2048 px are scaled down once on arrival (`fitImage`), and the grid sample steps down in halves (`sample`) |
| Move parsing off main | ➖ | Sampling a 150-column grid takes a few milliseconds; a worker would cost more than it saves |

## Loading

| Item | Status | How |
|---|---|---|
| Compress image assets | ✅ | Sample pictures are 30–75 KB JPEGs |
| Preload critical data | ✅ | The hero picture is `preload`ed with `fetchPriority: high` (`app/page.tsx`) |
| Lazy-load screens | ✅ | The press's four panels render only the open one. Each live plate starts only near the viewport. |
| Loading skeletons | ✅ | The stage shows a "Setting the type…" sheet until the first plate is ready; generation shows a live composing screen with Cancel |
| Cache API responses / static assets | ✅ | Next's hashed `/_next/static` files are immutable. Samples get `max-age=86400, stale-while-revalidate`. Generated images are `no-store` on purpose: they're private and never repeat. |
| Compress API payload | ✅ | Generated images are JPEG; Vercel gzips and brotlis text |
| Cancel in-flight requests | ✅ | Cancel aborts the fetch (`AbortController`) |
| Remove unused dependencies | ✅ | Runtime deps: `next`, `react`, `react-dom`, `server-only`. No UI kit, no icon pack (icons are inline SVG), no animation library. |
| Trim launch | ✅ | Fonts are self-hosted by `next/font`. No third-party scripts, analytics or trackers. |

## Not applicable

| Item | Why |
|---|---|
| Fix N+1 queries, index the database | No database |
| Paginate long lists, recycle list cells | No long lists; the longest is six sample thumbnails |
| Batch network requests | One request per generation, nothing to batch |
| Profile with Instruments | That's Apple's native profiler. The web equivalent is Chrome DevTools' Performance panel. |
