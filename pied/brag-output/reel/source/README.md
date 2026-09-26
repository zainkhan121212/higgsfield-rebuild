# How pied-reel.mp4 was made

A Remotion project (`src/`): `Root.tsx` registers the 1080×1920, 30 fps composition, `Reel.tsx` holds the ten scenes and `theme.ts` the palette, fonts, easings and springs. It follows the rules of the Remotion Agent Skills and the remotion-motion-graphics skill (see ../reel-plan.md).

- `capture.mjs` records the real app in use (Chrome DevTools screencast of the running site, driven by Playwright) into `public/clips/*.mp4`; the engine clips are cut from the frames of the first video.
- `music.mjs` synthesises the soundtrack into `public/music.wav`, with every effect placed on the cut list.
- Render: `npx remotion render src/index.ts PiedReel out/reel.mp4 --codec=h264`, then a final ffmpeg pass bakes the poster into frame 0 and sets loudness to −15 LUFS.
