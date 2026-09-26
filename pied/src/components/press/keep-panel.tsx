"use client";

import { useState, type RefObject } from "react";
import type { FieldData } from "@/lib/field";
import { canvasBlob, download, recordClip, recordingMime, renderStill, slug, wallpaperHtml, wallpaperKit } from "@/lib/export";
import { physics, type Settings } from "@/lib/plate";
import { Button, Group, Segmented, Toggle } from "./controls";

type StillSize = "plate" | "desktop" | "phone";

export function KeepPanel({ data, settings, name }: { data: RefObject<FieldData | null>; settings: Settings; name: string }) {
  const [title, setTitle] = useState(name);
  const [drift, setDrift] = useState(false);
  const [still, setStill] = useState<StillSize>(settings.format === "phone" ? "phone" : settings.format === "desktop" ? "desktop" : "plate");
  const [progress, setProgress] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const canRecord = typeof window !== "undefined" && !!recordingMime();

  const phys = physics(settings);
  const wp = () => ({ title: title.trim() || "Untitled", ...phys, drift });
  const file = slug(title);

  const need = () => {
    const d = data.current;
    if (!d) setMsg("Nothing on the plate yet.");
    return d;
  };

  const saveHtml = () => {
    const d = need();
    if (!d) return;
    download(new Blob([wallpaperHtml(d, wp())], { type: "text/html" }), `${file}.html`);
  };
  const preview = () => {
    const d = need();
    if (!d) return;
    const url = URL.createObjectURL(new Blob([wallpaperHtml(d, wp())], { type: "text/html" }));
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };
  const saveKit = async () => {
    const d = need();
    if (!d) return;
    download(await wallpaperKit(d, wp()), `${file}-wallpaper.zip`);
  };
  const saveStill = async () => {
    const d = need();
    if (!d) return;
    const W = d.cols * d.cell;
    const H = d.rows * d.cell;
    const [w, h, fit] =
      still === "desktop" ? [3840, 2160, "auto" as const] : still === "phone" ? [1290, 2796, "auto" as const] : [Math.round(W * 4), Math.round(H * 4), "contain" as const];
    download(await canvasBlob(renderStill(d, w, h, fit)), `${file}-${still}.png`);
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
      download(blob, `${file}.${ext}`);
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
          <Toggle label="Idle drift" note="an invisible hand stirs the type when you're away" checked={drift} onChange={setDrift} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button onClick={saveHtml}>Download</Button>
          <Button variant="line" onClick={preview}>
            Full-screen ↗
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

      {msg ? <p className="label mt-4 border-l-2 border-ink pl-3 normal-case tracking-normal">{msg}</p> : null}

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

function Card({ n, title, meta, children }: { n: string; title: string; meta: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 border border-ink p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-2xl">
          <span className="label mr-2 align-middle text-ink-3">{n}</span>
          {title}
        </h3>
        <span className="label text-right text-[10px] text-ink-3">{meta}</span>
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
