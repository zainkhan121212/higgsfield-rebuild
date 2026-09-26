"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createField, type FieldData } from "@/lib/field";
import { canvasBlob, download, recordClip, recordingMime, renderStill, slug, wallpaperHtml, wallpaperKit } from "@/lib/export";
import { physics, type Settings } from "@/lib/plate";
import { Button, Group, Segmented, Toggle } from "./controls";

type StillSize = "plate" | "desktop" | "phone";

export function KeepPanel({ data, settings, name }: { data: RefObject<FieldData | null>; settings: Settings; name: string }) {
  const [title, setTitle] = useState(name);
  const [drift, setDrift] = useState(false);
  // Whole picture by default: a screen shorter than the plate would otherwise
  // crop rows off the top and bottom.
  const [fit, setFit] = useState<"contain" | "cover">("contain");
  const [still, setStill] = useState<StillSize>(settings.format === "phone" ? "phone" : settings.format === "desktop" ? "desktop" : "plate");
  const [progress, setProgress] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<FieldData | null>(null);
  const canRecord = typeof window !== "undefined" && !!recordingMime();

  const phys = useMemo(() => physics(settings), [settings]);
  const closePreview = useCallback(() => setPreviewing(null), []);
  const wp = () => ({ title: title.trim() || "Untitled", ...phys, drift, fit });
  const file = slug(title);

  const need = () => {
    const d = data.current;
    if (!d) setMsg("Nothing on the plate yet.");
    return d;
  };

  const save = async (make: () => Blob | Promise<Blob>, name: string) => {
    setMsg(null);
    try {
      const ok = await download(await make(), name);
      setMsg(ok ? `Saved ${name}` : "Not saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not save the file.");
    }
  };

  const saveHtml = () => {
    const d = need();
    if (d) save(() => new Blob([wallpaperHtml(d, wp())], { type: "text/html" }), `${file}.html`);
  };
  const preview = () => {
    const d = need();
    if (d) setPreviewing(d);
  };
  const saveKit = () => {
    const d = need();
    if (d) save(() => wallpaperKit(d, wp()), `${file}-wallpaper.zip`);
  };
  const saveStill = async () => {
    const d = need();
    if (!d) return;
    const W = d.cols * d.cell;
    const H = d.rows * d.cell;
    const [w, h, how] =
      still === "desktop" ? [3840, 2160, fit] : still === "phone" ? [1290, 2796, fit] : [Math.round(W * 4), Math.round(H * 4), "contain" as const];
    save(() => canvasBlob(renderStill(d, w, h, how)), `${file}-${still}.png`);
  };
  const saveClip = async () => {
    const d = need();
    if (!d) return;
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
          value={title}
          maxLength={60}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border-b border-ink bg-transparent py-2 font-display text-2xl outline-none"
          aria-label="Title"
        />
      </Group>

      {settings.format !== "desktop" ? (
        <p className="mt-4 border-l-2 border-ink pl-3 font-serif text-sm text-ink-2">
          For a wallpaper that fills the screen edge to edge, set <span className="italic">Forme → Desktop</span> under Set. Other shapes are centred on the paper.
        </p>
      ) : null}

      <Card n="A" title="Live wallpaper" meta=".html · works offline">
        <p className="font-serif text-ink-2">One small file with the picture and the press inside it. The letters keep scattering under your cursor.</p>
        <div className="mt-4">
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
          <p className="mt-2 font-serif text-sm text-ink-3">
            {fit === "contain" ? "Every row stays visible on any screen; the paper fills the rest." : "Fills the screen edge to edge; rows that don't fit are cut off."}
          </p>
        </div>
        <div className="mt-4">
          <Toggle label="Idle drift" note="an invisible hand stirs the type when you're away" checked={drift} onChange={setDrift} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button onClick={saveHtml}>Download</Button>
          <Button variant="line" onClick={preview}>
            Try it full screen
          </Button>
        </div>
      </Card>

      <Card n="B" title="Wallpaper kit" meta=".zip · Lively · Wallpaper Engine · Plash">
        <p className="font-serif text-ink-2">The same file packed with a preview and the project files wallpaper apps look for.</p>
        <Button onClick={saveKit} className="mt-4 w-full">
          Download kit
        </Button>
      </Card>

      <Card n="C" title="Still" meta=".png">
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

      <Card n="D" title="Motion" meta={canRecord ? `${(recordingMime() ?? "").includes("mp4") ? ".mp4" : ".webm"} · 7 seconds` : "not supported here"}>
        <p className="font-serif text-ink-2">The type assembles, an invisible hand sweeps through it, and it settles again.</p>
        {progress !== null ? (
          <div className="mt-4">
            <div className="h-[3px] w-full bg-rule">
              <div className="h-full bg-ink transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <p className="label mt-2 flicker">Recording… {Math.round(progress * 100)}%</p>
          </div>
        ) : (
          <Button onClick={saveClip} disabled={!canRecord} className="mt-4 w-full">
            Record clip
          </Button>
        )}
      </Card>

      {msg ? (
        <p className="label mt-4 border-l-2 border-ink pl-3 normal-case tracking-normal" role="status">
          {msg}
        </p>
      ) : null}
      {previewing ? <Preview data={previewing} physics={phys} drift={drift} fit={fit} onClose={closePreview} /> : null}

      <Group title="Setting it as your wallpaper" className="mt-6">
        <Guide os="Windows · Lively Wallpaper (free)" steps={["Install Lively from the Microsoft Store.", "Drag the kit (.zip) onto Lively's window.", "Settings → Wallpaper → Wallpaper input: Mouse."]} />
        <Guide os="Windows · Wallpaper Engine" steps={["Unzip the kit.", "Create Wallpaper → choose index.html → Save.", "It appears under your wallpapers; apply it."]} />
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
 * The wallpaper as it will run: the whole screen, the same engine, the same
 * fit. Drawn in the page rather than a new window, so it also works where
 * pop-ups are blocked.
 */
function Preview({
  data,
  physics: p,
  drift,
  fit,
  onClose,
}: {
  data: FieldData;
  physics: { radius: number; force: number; spring: number };
  drift: boolean;
  fit: "contain" | "cover";
  onClose: () => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvas.current;
    const w = wrap.current;
    if (!c || !w) return;
    const field = createField(c, data, { fit, listen: "window", assemble: true, drift, ...p });
    w.requestFullscreen?.().catch(() => {});
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onFs = () => !document.fullscreenElement && onClose();
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      field.destroy();
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [data, p, drift, fit, onClose]);
  return (
    <div ref={wrap} className="fixed inset-0 z-[80]" style={{ background: data.paper }} data-cursor="none">
      <canvas ref={canvas} className="block h-full w-full touch-none" aria-label="Wallpaper preview" />
      <button type="button" onClick={onClose} className="label absolute right-4 top-4 bg-ink px-3 py-2 text-paper opacity-60 transition-opacity hover:opacity-100">
        Close · Esc
      </button>
    </div>
  );
}

function Card({ n, title, meta, children }: { n: string; title: string; meta: string; children: React.ReactNode }) {
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
