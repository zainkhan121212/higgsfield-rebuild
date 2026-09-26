# How brag.mp4 was made

Made with the `/brag-slim` workflow from [latent-spaces/brag](https://github.com/latent-spaces/brag): the video is drawn by Pied's own engine (`src/lib/field.ts`, `led.ts`, `widgets.ts`) in a headless browser, one frame at a time on a virtual clock, and the soundtrack is synthesised (`music.mjs`), so no third-party music is used.

To re-render: bundle `entry.ts` into `site/bundle.js` next to `index.html` (with esbuild), put the site fonts in `fonts.css` and the pictures in `samples/`, serve the folder on port 8765, run `node render.mjs full`, `node music.mjs music.wav`, then encode `frames/f%04d.jpg` + `music.wav` with ffmpeg (H.264, 30 fps, AAC, loudnorm −16 LUFS).
