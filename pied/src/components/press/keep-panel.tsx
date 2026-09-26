"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { clockPlate } from "@/lib/clock";
import { createField, type FieldData } from "@/lib/field";
import { canvasBlob, download, recordClip, recordGif, recordingMime, renderStill, runOptions, slug, wallpaperHtml, wallpaperKit, type WallpaperOptions } from "@/lib/export";
import { physics, type Settings } from "@/lib/plate";
import type { TrayItem } from "@/lib/tray";
import { cn } from "@/lib/utils";
import { runWallpaper, type WallpaperKind } from "@/lib/wallpaper";
import { Button, Group, Segmented, Toggle } from "./controls";
import { DeskStudio, loadDesk } from "./desk-studio";
import { runWidgets, type Widget } from "@/lib/widgets";

type StillSize = "plate" | "desktop" | "phone";

const EVERY = [
  { value: 20, label: "20 s" },
  { value: 60, label: "1 min" },
  { value: 300, label: "5 min" },
  { value: 900, label: "15 min" },
];

export function KeepPanel({
  data,
  settings,
  name,
  tray,
  onKeep,
  onDrop,
  extra,
}: {
  data: RefObject<FieldData | null>;
  settings: Settings;
  name: string;
  tray: TrayItem[];
  onKeep: (title: string) => void;
  onDrop: (id: string) => void;
  /** slot for the library card (accounts) */
  extra?: ReactNode;
}) {
  const [title, setTitle] = useState(name);
  const [kind, setKind] = useState<WallpaperKind>("picture");
  const [every, setEvery] = useState(60);
  const [audio, setAudio] = useState(false);
  const [h24, setH24] = useState(false);
  const [drift, setDrift] = useState(false);
  // Whole picture by default: a screen shorter than the plate would otherwise
  // crop rows off the top and bottom.
  const [fit, setFit] = useState<"contain" | "cover">("contain");
  const [still, setStill] = useState<StillSize>(settings.format === "phone" ? "phone" : settings.format === "desktop" ? "desktop" : "plate");
  const [progress, setProgress] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>(loadDesk);
  const [previewing, setPreviewing] = useState<{ plates: FieldData[]; w: WallpaperOptions } | null>(null);
  const canRecord = typeof window !== "undefined" && !!recordingMime();

  const phys = useMemo(() => physics(settings), [settings]);
  const closePreview = useCallback(() => setPreviewing(null), []);
  const wp = (): WallpaperOptions => ({ title: title.trim() || "Untitled", ...phys, drift, fit, kind, every, audio, h24, widgets });
  const file = slug(title);
  // What the desktop box shows behind the widgets.
  const backdrop = (): FieldData | null => {
    if (kind === "clock") return clockPlate(new Date(), runOptions({ ...phys, title: "", drift: false, fit, kind, every, audio: false, h24 }).clock);
    if (kind === "slideshow" && tray.length) return tray[0].data;
    return data.current;
  };

  // The plates this wallpaper carries.
  const plates = (): FieldData[] | null => {
    if (kind === "clock") return [];
    if (kind === "slideshow") {
      if (tray.length < 2) {
        setMsg("A slideshow needs at least two plates. Add this one, set another picture, and add that too.");
        return null;
      }
      return tray.map((t) => t.data);
    }
    const d = data.current;
    if (!d) setMsg("Nothing on the plate yet.");
    return d ? [d] : null;
  };

  const save = async (make: () => Blob | Promise<Blob>, fname: string) => {
    setMsg(null);
    try {
      const ok = await download(await make(), fname);
      setMsg(ok ? `Saved ${fname}` : "Not saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not save the file.");
    }
  };

  const suffix = kind === "clock" ? "-clock" : kind === "slideshow" ? "-slideshow" : "";
  const saveHtml = () => {
    const ps = plates();
    if (ps) save(() => new Blob([wallpaperHtml(ps, wp())], { type: "text/html" }), `${file}${suffix}.html`);
  };
  const saveKit = () => {
    const ps = plates();
    if (ps) save(() => wallpaperKit(ps, wp()), `${file}${suffix}-wallpaper.zip`);
  };
  const preview = () => {
    const ps = plates();
    if (ps) setPreviewing({ plates: ps, w: wp() });
  };
  const saveStill = async () => {
    const d = data.current;
    if (!d) return setMsg("Nothing on the plate yet.");
    const W = d.cols * d.cell;
    const H = d.rows * d.cell;
    const [w, h, how] =
      still === "desktop" ? [3840, 2160, fit] : still === "phone" ? [1290, 2796, fit] : [Math.round(W * 4), Math.round(H * 4), "contain" as const];
    save(() => canvasBlob(renderStill(d, w, h, how)), `${file}-${still}.png`);
  };
  const saveGif = async () => {
    const d = data.current;
    if (!d) return setMsg("Nothing on the plate yet.");
    setMsg(null);
    try {
      setProgress(0);
      const blob = await recordGif(d, 640, phys, setProgress);
      setProgress(null);
      await save(() => blob, `${file}.gif`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Couldn't make the GIF.");
    } finally {
      setProgress(null);
    }
  };
  const saveClip = async () => {
    const d = data.current;
    if (!d) return setMsg("Nothing on the plate yet.");
    setMsg(null);
    const aspect = d.cols / d.rows;
    const h = aspect >= 1 ? 1080 : 1920;
    const w = Math.round((h * aspect) / 2) * 2;
    try {
      setProgress(0);
      const { blob, ext } = await recordClip(d, w, h, phys, 7, setProgress);
      setProgress(null);
      await save(() => blob, `${file}.${ext}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Recording failed.");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div>
      <Group title="Title">
        <input
          id="keep-title"
          value={title}
          maxLength={60}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border-b border-ink bg-transparent py-2 font-display text-2xl outline-none"
          aria-label="Title"
        />
      </Group>

      <Card n="A" title="Live wallpaper" meta=".html + kit for Lively · Wallpaper Engine · Plash">
        <Segmented
          label="What the wallpaper does"
          value={kind}
          onChange={setKind}
          options={[
            { value: "picture", label: "This picture" },
            { value: "slideshow", label: "Slideshow" },
            { value: "clock", label: "Clock" },
          ]}
        />
        {kind === "picture" ? (
          <p className="mt-3 font-serif text-sm text-ink-2">This plate, scattering under your cursor.</p>
        ) : null}
        {kind === "slideshow" ? (
          <div className="mt-3">
            <p className="font-serif text-sm text-ink-2">Every so often the letters fly apart and reassemble as the next picture.</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {tray.map((t, i) => (
                <figure key={t.id} className="group relative border border-rule">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.thumb} alt={t.title} className="block aspect-video w-full object-cover" />
                  <figcaption className="label truncate px-1 py-0.5 text-[9px] text-ink-3">
                    {i + 1}. {t.title}
                  </figcaption>
                  <button
                    type="button"
                    onClick={() => onDrop(t.id)}
                    aria-label={`Remove ${t.title}`}
                    className="label absolute right-0 top-0 bg-ink px-1.5 text-paper opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  >
                    ×
                  </button>
                </figure>
              ))}
              <button
                type="button"
                onClick={() => onKeep(title.trim() || "Untitled")}
                className="flex aspect-video flex-col items-center justify-center border border-dashed border-ink text-center transition-colors hover:bg-ink hover:text-paper"
              >
                <span className="font-display text-2xl leading-none">+</span>
                <span className="label text-[9px]">Add this plate</span>
              </button>
            </div>
            <p className="mt-2 font-serif text-xs text-ink-3">Add this plate, go back to Source for another picture, and add that too.</p>
            <div className="mt-3">
              <Segmented label="Change picture every" value={every} onChange={setEvery} options={EVERY} />
            </div>
          </div>
        ) : null}
        {kind === "clock" ? (
          <div className="mt-3 space-y-3">
            <p className="font-serif text-sm text-ink-2">
              The time, set in type and spelled out in words. Every minute the letters rearrange, and the paper turns dark from seven at night to seven in the morning.
            </p>
            <Toggle label="24-hour clock" checked={h24} onChange={setH24} />
          </div>
        ) : null}

        <div className="mt-4 border-t border-rule pt-4">
          <p className="font-serif text-[15px]">On the desktop</p>
          <p className="mb-2 font-serif text-xs text-ink-3">Add a clock, the weather, a countdown and more, then drag each where you want it. They go in the download.</p>
          <DeskStudio widgets={widgets} onChange={setWidgets} backdrop={backdrop} backdropKey={`${kind}:${tray.map((t) => t.id).join(",")}:${h24}`} fit={fit} />
        </div>

        <div className="mt-4 border-t border-rule pt-4">
          <p className="mb-2 font-serif text-[15px]">On the screen</p>
          <Segmented
            label="On the screen"
            value={fit}
            onChange={setFit}
            options={[
              { value: "contain", label: "Whole picture" },
              { value: "cover", label: "Fill, crop edges" },
            ]}
          />
        </div>
        <div className="mt-4 space-y-3">
          <Toggle label="Idle drift" note="an invisible hand stirs the type when you're away" checked={drift} onChange={setDrift} />
          <Toggle label="Dance to music" note="letters jump on the beat in Wallpaper Engine and Lively" checked={audio} onChange={setAudio} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button onClick={saveHtml}>.html</Button>
          <Button onClick={saveKit}>Kit .zip</Button>
          <Button variant="line" onClick={preview} className="col-span-2">
            Try it full screen
          </Button>
        </div>
      </Card>

      {extra}

      <Card n="B" title="Still" meta=".png">
        <Segmented
          label="Still size"
          value={still}
          onChange={setStill}
          options={[
            { value: "plate", label: "Plate ×4" },
            { value: "desktop", label: "4K desktop" },
            { value: "phone", label: "Phone" },
          ]}
        />
        <Button onClick={saveStill} className="mt-3 w-full">
          Download PNG
        </Button>
      </Card>

      <Card n="C" title="Motion" meta={`${canRecord ? `${(recordingMime() ?? "").includes("mp4") ? ".mp4" : ".webm"} · 7 seconds · ` : ""}looping .gif`}>
        <p className="font-serif text-ink-2">The type assembles, an invisible hand sweeps through it, and it settles again.</p>
        {progress !== null ? (
          <div className="mt-4">
            <div className="h-[3px] w-full bg-rule">
              <div className="h-full bg-ink transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <p className="label mt-2 flicker">{progress < 0.85 ? "Recording" : "Printing the frames"}… {Math.round(progress * 100)}%</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button onClick={saveClip} disabled={!canRecord}>
              Record clip
            </Button>
            <Button variant="line" onClick={saveGif}>
              Looping GIF
            </Button>
          </div>
        )}
      </Card>

      {msg ? (
        <p className="label mt-4 border-l-2 border-ink pl-3 normal-case tracking-normal" role="status">
          {msg}
        </p>
      ) : null}
      {previewing ? <Preview plates={previewing.plates} w={previewing.w} onClose={closePreview} /> : null}

      <Group title="Setting it as your wallpaper" className="mt-6">
        <Guide
          os="Windows · Lively Wallpaper (free)"
          steps={["Install Lively from the Microsoft Store.", "Drag the kit (.zip) onto Lively's window.", "Settings → Wallpaper → Wallpaper input: Mouse.", "With Dance to music on, Lively feeds the wallpaper whatever your PC is playing."]}
        />
        <Guide os="Windows · Wallpaper Engine" steps={["Unzip the kit.", "Create Wallpaper → choose index.html → Save.", "Apply it. Audio reaches it automatically when Dance to music is on."]} />
        <Guide
          os="macOS · Plash (free)"
          steps={["Unzip the kit.", "Plash → Add Website → pick index.html.", "Toggle Browsing Mode to let the cursor reach the type — macOS doesn't pass the cursor to the desktop otherwise."]}
        />
        <Guide os="Anywhere" steps={["Open the .html in any browser.", "Press F11 (or ⌃⌘F on a Mac)."]} />
      </Group>
    </div>
  );
}

/**
 * The wallpaper as it will run: the whole screen and the same code
 * (runWallpaper), so a slideshow morphs and a clock ticks here exactly as on
 * the desktop. A song can be played through it to see the music mode.
 */
function Preview({ plates, w, onClose }: { plates: FieldData[]; w: WallpaperOptions; onClose: () => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const deskRef = useRef<HTMLDivElement>(null);
  const handle = useRef<ReturnType<typeof runWallpaper> | null>(null);
  const audio = useRef<{ ctx: AudioContext; el: HTMLAudioElement; raf: number; url: string } | null>(null);
  const [song, setSong] = useState<string | null>(null);

  useEffect(() => {
    const c = canvas.current;
    const el = wrap.current;
    if (!c || !el) return;
    handle.current = runWallpaper(c, plates, { ...runOptions(w), audio: true }, createField, clockPlate);
    const wx = handle.current.weather;
    const desk = deskRef.current && w.widgets?.length ? runWidgets(deskRef.current, w.widgets, { onWeather: wx }) : null;
    el.requestFullscreen?.().catch(() => {});
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onFs = () => !document.fullscreenElement && onClose();
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      desk?.destroy();
      handle.current?.destroy();
      handle.current = null;
      stopSong(audio);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [plates, w, onClose]);

  // The same levels a wallpaper host would send: low bands first, 0..1.
  async function playSong(f: File | undefined) {
    if (!f || !f.type.startsWith("audio/")) return;
    stopSong(audio);
    const url = URL.createObjectURL(f);
    const el = new Audio(url);
    const ctx = new AudioContext();
    const an = ctx.createAnalyser();
    an.fftSize = 256;
    ctx.createMediaElementSource(el).connect(an);
    an.connect(ctx.destination);
    const bins = new Uint8Array(an.frequencyBinCount);
    const levels = new Float32Array(bins.length);
    const loop = () => {
      an.getByteFrequencyData(bins);
      for (let i = 0; i < bins.length; i++) levels[i] = bins[i] / 255;
      handle.current?.hear(levels);
      if (audio.current) audio.current.raf = requestAnimationFrame(loop);
    };
    audio.current = { ctx, el, raf: 0, url };
    await el.play().catch(() => {});
    setSong(f.name);
    loop();
  }

  const paper = w.kind === "clock" ? (new Date().getHours() < 7 || new Date().getHours() >= 19 ? "#0c0c0b" : "#f4f3ee") : plates[0]?.paper;
  return (
    <div ref={wrap} className="fixed inset-0 z-[80]" style={{ background: paper }} data-cursor="none">
      <canvas ref={canvas} className="block h-full w-full touch-none" aria-label="Wallpaper preview" />
      <div ref={deskRef} className="pointer-events-none absolute inset-0 overflow-hidden" />
      <div className="absolute right-4 top-4 flex gap-2 opacity-60 transition-opacity hover:opacity-100">
        <label className={cn("label cursor-pointer bg-ink px-3 py-2 text-paper", song && "max-w-56 truncate")}>
          {song ? `♪ ${song}` : "♪ Play a song through it"}
          <input id="preview-song" type="file" accept="audio/*" className="sr-only" onChange={(e) => playSong(e.target.files?.[0])} />
        </label>
        <button type="button" onClick={onClose} className="label bg-ink px-3 py-2 text-paper">
          Close · Esc
        </button>
      </div>
    </div>
  );
}

type SongRef = { current: { ctx: AudioContext; el: HTMLAudioElement; raf: number; url: string } | null };
function stopSong(audio: SongRef) {
  const a = audio.current;
  if (!a) return;
  cancelAnimationFrame(a.raf);
  a.el.pause();
  a.ctx.close().catch(() => {});
  URL.revokeObjectURL(a.url);
  audio.current = null;
}

function Card({ n, title, meta, children }: { n: string; title: string; meta: string; children: ReactNode }) {
  return (
    <section className="mt-4 border border-ink p-4">
      <div className="mb-3">
        <h3 className="font-display text-2xl">
          <span className="label mr-2 align-middle text-ink-3">{n}</span>
          {title}
        </h3>
        <p className="label mt-1 text-[10px] text-ink-3">{meta}</p>
      </div>
      {children}
    </section>
  );
}

function Guide({ os, steps }: { os: string; steps: string[] }) {
  return (
    <details className="group border-b border-rule py-3 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between font-serif">
        {os}
        <span className="label transition-transform duration-300 group-open:rotate-45">+</span>
      </summary>
      <ol className="mt-3 space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 font-serif text-sm text-ink-2">
            <span className="label pt-0.5 text-ink-3">{String(i + 1).padStart(2, "0")}</span>
            {s}
          </li>
        ))}
      </ol>
    </details>
  );
}
