"use client";

import { useEffect, useRef, useState } from "react";
import { STATIC } from "@/lib/claude";
import { drawWithClaude } from "@/lib/draw";
import type { Settings, Source } from "@/lib/plate";
import { cn } from "@/lib/utils";
import { Button, Group, Segmented } from "./controls";
import { DrawPad } from "./draw-pad";

const SAMPLES: (Source & { thumb: string })[] = [
  { url: "/samples/pour.jpg", thumb: "/samples/pour.jpg", name: "Pour" },
  { url: "/samples/portrait.jpg", thumb: "/samples/portrait.jpg", name: "Portrait", trim: 0.02 },
  { url: "/samples/cat.jpg", thumb: "/samples/cat.jpg", name: "Cat", trim: 0.07 },
  { url: "/samples/hand.jpg", thumb: "/samples/hand.jpg", name: "Rose", trim: 0.07 },
  { url: "/samples/lighthouse.jpg", thumb: "/samples/lighthouse.jpg", name: "Lighthouse", trim: 0.07 },
  { url: "/samples/wave.jpg", thumb: "/samples/wave.jpg", name: "Wave", trim: 0.07 },
];

// The look is chosen here; the words that describe each look to the model
// live on the server (lib/server/prompt.ts), so the browser can't rewrite
// the brief.
const STYLES = [
  { id: "photo", label: "Photograph" },
  { id: "silhouette", label: "Silhouette" },
  { id: "ink", label: "Ink" },
  { id: "engraving", label: "Engraving" },
  { id: "colour", label: "Colour" },
] as const;

// Uploads: raster formats a browser can decode, up to 25 MB. The picture is
// read locally and never sent anywhere.
const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/bmp"];
const UPLOAD_MAX = 25 * 1024 * 1024;

const IDEAS = ["a lighthouse on a cliff under a full moon", "a ballerina mid-leap", "an astronaut's helmet reflecting the earth", "a tiger's face in the dark", "a hand releasing a paper bird"];

function dims(format: Settings["format"]) {
  if (format === "phone") return { w: 704, h: 1440 };
  if (format === "square" || format === "original") return { w: 1024, h: 1024 };
  return { w: 1344, h: 768 };
}

function drawSize(format: Settings["format"]) {
  if (format === "phone") return { w: 540, h: 1100 };
  if (format === "desktop") return { w: 960, h: 540 };
  return { w: 800, h: 800 };
}

export function SourcePanel({
  format,
  busy,
  setBusy,
  onSource,
  current,
  onNext,
}: {
  format: Settings["format"];
  busy: string | null;
  setBusy: (s: string | null, cancel?: () => void) => void;
  onSource: (s: Source, prompt?: string) => void;
  current: Source;
  onNext: () => void;
}) {
  const [mode, setMode] = useState<"write" | "upload" | "draw" | "samples">("write");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<(typeof STYLES)[number]["id"]>("photo");
  const [err, setErr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef<string[]>([]);

  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const takeFile = (f: File | undefined | null) => {
    if (!f) return;
    if (!UPLOAD_TYPES.includes(f.type)) {
      setErr("Use a JPEG, PNG, WebP, GIF or AVIF picture.");
      return;
    }
    if (f.size > UPLOAD_MAX) {
      setErr("That picture is over 25 MB. Try a smaller copy.");
      return;
    }
    setErr(null);
    const url = URL.createObjectURL(f);
    objectUrls.current.push(url);
    onSource({ url, name: f.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 40) || "Upload" });
  };

  // Paste an image from anywhere on the page.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      if (item) takeFile(item.getAsFile());
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  const generate = async () => {
    const p = prompt.trim();
    if (p.length < 2) {
      setErr("Write a few words first.");
      return;
    }
    setErr(null);
    const ctl = new AbortController();
    setBusy(STATIC ? "Claude is drawing it" : "Composing your picture", () => ctl.abort());
    try {
      const { w, h } = dims(format);
      if (STATIC) {
        const url = URL.createObjectURL(await drawWithClaude(p, style, w, h));
        if (ctl.signal.aborted) return;
        objectUrls.current.push(url);
        onSource({ url, name: p.slice(0, 40), frame: true }, p);
        return;
      }
      const res = await fetch("/api/imagine", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: p, look: style, format }),
        signal: ctl.signal,
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? "Could not make that picture.");
      }
      const trim = Number(res.headers.get("x-trim-bottom") ?? 0) || 0;
      const url = URL.createObjectURL(await res.blob());
      objectUrls.current.push(url);
      onSource({ url, name: p.slice(0, 40), trim, frame: true }, p);
    } catch (e) {
      if (ctl.signal.aborted) return;
      setErr(e instanceof Error ? e.message : "Could not make that picture.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <Segmented
        label="Source"
        value={mode}
        onChange={setMode}
        options={[
          { value: "write", label: "Write" },
          { value: "upload", label: "Upload" },
          { value: "draw", label: "Draw" },
          { value: "samples", label: "Samples" },
        ]}
      />

      {mode === "write" && (
        <div className="mt-5">
          <Group title="Describe it" hint={`${prompt.length}/300`}>
            <textarea
              id="prompt"
              value={prompt}
              maxLength={300}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
              }}
              rows={4}
              placeholder={IDEAS[0]}
              className="w-full resize-none border border-ink bg-transparent p-3 font-serif text-lg leading-snug outline-none placeholder:text-ink-3 focus:bg-white/40"
            />
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {IDEAS.slice(1).map((i) => (
                <button key={i} type="button" onClick={() => setPrompt(i)} className="font-serif text-sm italic text-ink-3 underline-offset-4 hover:text-ink hover:underline">
                  {i}
                </button>
              ))}
            </div>
          </Group>
          <Group title="Look">
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  aria-pressed={style === s.id}
                  className={cn("label border px-3 py-2 transition-colors", style === s.id ? "border-ink bg-ink text-paper" : "border-rule hover:border-ink")}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="mt-3 font-serif text-sm text-ink-3">
              {STATIC
                ? "In this version Claude draws your picture as a bold illustration, which prints well as type. It uses your Claude account and asks you first."
                : "Strong contrast and a plain background print best."}
            </p>
          </Group>
          <Button onClick={generate} disabled={!!busy} className="mt-2 w-full py-4">
            {busy ? "Composing…" : STATIC ? "Draw it with Claude →" : "Make the picture →"}
          </Button>
          <p className="label mt-2 text-center text-ink-3">⌘ + Enter</p>
        </div>
      )}

      {mode === "upload" && (
        <div className="mt-5">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              takeFile(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-3 border border-dashed border-ink p-6 text-center transition-colors",
              drag && "bg-ink text-paper",
            )}
          >
            <span className="font-display text-5xl">↓</span>
            <span className="font-serif text-lg">Drop a picture here</span>
            <span className="label text-ink-3">or click to choose · or paste</span>
            <input id="upload" ref={fileRef} type="file" accept={UPLOAD_TYPES.join(",")} className="sr-only" onChange={(e) => takeFile(e.target.files?.[0])} />
          </label>
          <p className="mt-4 font-serif text-sm text-ink-3">Your picture is read in this browser and never uploaded anywhere.</p>
        </div>
      )}

      {mode === "draw" && <DrawPad {...drawSize(format)} onSource={(s) => onSource(s)} />}

      {mode === "samples" && (
        <div className="mt-5 grid grid-cols-3 gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s.url}
              type="button"
              onClick={() => onSource(s)}
              className={cn("group relative aspect-square overflow-hidden border", current.url === s.url ? "border-ink" : "border-transparent")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.thumb} alt="" className="h-full w-full object-cover grayscale transition-[filter,transform] duration-500 group-hover:scale-105 group-hover:grayscale-0" />
              <span className="label absolute inset-x-0 bottom-0 bg-paper/90 py-1 text-[10px]">{s.name}</span>
            </button>
          ))}
        </div>
      )}

      {err ? <p className="label mt-4 border-l-2 border-ink pl-3 normal-case tracking-normal">{err}</p> : null}

      <div className="mt-8 border-t border-rule pt-5">
        <p className="font-serif text-sm text-ink-3">
          On the plate: <span className="italic text-ink">{current.name}</span>
        </p>
        <Button variant="line" onClick={onNext} className="mt-3 w-full">
          Next — set the type →
        </Button>
      </div>
    </div>
  );
}
