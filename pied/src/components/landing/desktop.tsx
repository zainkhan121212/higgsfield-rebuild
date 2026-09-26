"use client";

import { PlateCanvas } from "../plate-canvas";
import { Lines, Reveal } from "../reveal";

const GUIDES = [
  {
    os: "Windows",
    app: "Lively Wallpaper",
    note: "free · Microsoft Store",
    steps: ["Download the wallpaper kit (.zip).", "Drag it onto Lively.", "Settings → Wallpaper → Input: Mouse."],
  },
  {
    os: "Windows",
    app: "Wallpaper Engine",
    note: "Steam",
    steps: ["Unzip the wallpaper kit.", "Create Wallpaper → choose index.html.", "Save. Mouse input is on by default."],
  },
  {
    os: "macOS",
    app: "Plash",
    note: "free · App Store",
    steps: ["Unzip the wallpaper kit.", "Plash → Add Website → index.html.", "Browsing Mode lets the cursor reach the type."],
  },
];

export function Desktop() {
  return (
    <section data-section="On your desktop" className="bg-paper-2">
      <div className="mx-auto max-w-[1600px] px-4 py-28 sm:px-8 sm:py-40">
        <div className="grid gap-6 lg:grid-cols-12">
          <p className="label text-ink-3 lg:col-span-3">§ 05 — On your desktop</p>
          <div className="lg:col-span-9">
            <Lines className="font-display text-[clamp(2.6rem,5.6vw,6rem)] leading-[0.92] tracking-[-0.02em]" lines={["A wallpaper that", <em key="e" className="font-serif italic">notices you.</em>]} />
            <Reveal>
              <p className="mt-6 max-w-xl font-serif text-lg leading-snug text-ink-2">
                The download is one small HTML file with the picture and the press inside it — no account, no network, no fonts to fetch. Wallpaper
                apps run it behind your icons, and the letters still move out of your cursor&apos;s way.
              </p>
            </Reveal>
          </div>
        </div>

        <Reveal className="mt-16">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-[14px] border border-ink bg-ink p-[1.2%] shadow-[0_50px_90px_-40px_rgba(0,0,0,0.55)]">
              <div className="relative aspect-video overflow-hidden rounded-[4px]">
                <PlateCanvas
                  src="/samples/lighthouse.jpg"
                  trim={0.07}
                  label="A lighthouse at night, set in type, running as a desktop wallpaper"
                  className="absolute inset-0"
                  settings={{ format: "desktop", cols: 150, paper: "dark", contrast: 1.7, cutoff: 0.34, text: "keep the light burning — keep the light burning — ", face: "mono" }}
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 flex h-7 items-center justify-between bg-black/45 px-4 backdrop-blur-sm">
                  <span className="label text-[9px] text-paper/70">Finder  File  Edit  View  Go</span>
                  <span className="label text-[9px] text-paper/70">Pied · live</span>
                </div>
                <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 rounded-xl border border-paper/15 bg-black/40 p-2 backdrop-blur-sm">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <span key={i} className="h-7 w-7 rounded-lg bg-paper/15 sm:h-9 sm:w-9" />
                  ))}
                </div>
              </div>
            </div>
            <div className="mx-auto h-14 w-24 bg-gradient-to-b from-ink/70 to-ink/30 [clip-path:polygon(18%_0,82%_0,100%_100%,0_100%)]" />
            <div className="mx-auto h-2 w-64 rounded-full bg-ink/25" />
          </div>
        </Reveal>

        <div className="mt-20 grid gap-px border border-rule bg-rule md:grid-cols-3">
          {GUIDES.map((g, i) => (
            <Reveal key={g.app} delay={i * 120} className="bg-paper-2 p-6 sm:p-8">
              <p className="label text-ink-3">{g.os}</p>
              <h3 className="mt-3 font-display text-3xl">{g.app}</h3>
              <p className="label mt-1 text-ink-3">{g.note}</p>
              <ol className="mt-6 space-y-3 font-serif">
                {g.steps.map((s, k) => (
                  <li key={k} className="flex gap-3">
                    <span className="label pt-1 text-ink-3">{String(k + 1).padStart(2, "0")}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </Reveal>
          ))}
        </div>
        <p className="label mt-6 max-w-3xl leading-relaxed text-ink-3">
          A note on macOS: the Mac draws its desktop underneath every window and never forwards the cursor to it, so on a Mac the letters move
          while Plash is in browsing mode. Any browser in full screen works everywhere.
        </p>
      </div>
    </section>
  );
}
