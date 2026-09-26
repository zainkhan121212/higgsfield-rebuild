"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { createField, type FieldController, type FieldData } from "@/lib/field";
import {
  CELL,
  DEFAULTS,
  FACES,
  buildPlate,
  compose,
  composeCell,
  emptyPaint,
  fieldData,
  fitImage,
  autoFrame,
  gridFor,
  hexToRgb,
  loadImage,
  physics,
  sample,
  FINISH_CODE,
  type Composed,
  type Finish,
  type Paint,
  type Settings,
  type Source,
} from "@/lib/plate";
import { cn } from "@/lib/utils";
import { SourcePanel } from "./source-panel";
import { SetPanel } from "./set-panel";
import { PaintPanel, type Tool } from "./paint-panel";
import { KeepPanel } from "./keep-panel";

export type Tab = "source" | "set" | "paint" | "keep";
const TABS: { id: Tab; n: string; label: string }[] = [
  { id: "source", n: "I", label: "Source" },
  { id: "set", n: "II", label: "Set" },
  { id: "paint", n: "III", label: "Paint" },
  { id: "keep", n: "IV", label: "Keep" },
];

export const FIRST: Source = { url: "/samples/pour.jpg", name: "Pour" };

export function Press() {
  const [tab, setTab] = useState<Tab>("source");
  const [source, setSource] = useState<Source>(FIRST);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [settings, setSettings] = useState<Settings>({ ...DEFAULTS, format: "original", cols: 120, text: "a woman pours water from a heavy jug — " });
  const [job, setJob] = useState<{ label: string; cancel?: () => void } | null>(null);
  const busy = job?.label ?? null;
  const setBusy = useCallback((label: string | null, cancel?: () => void) => setJob(label ? { label, cancel } : null), []);
  const [error, setError] = useState<string | null>(null);

  // paint tools
  const [tool, setTool] = useState<Tool>("brush");
  const [size, setSize] = useState(4);
  const [strength, setStrength] = useState(1);
  const [colour, setColour] = useState("#c8341e");
  const [finish, setFinish] = useState<Finish>("flat");
  // Paint goes on the letters only, unless the painter asks to set new
  // letters on bare paper.
  const [bare, setBare] = useState(false);
  const [hist, setHist] = useState({ undo: 0, redo: 0, painted: false });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const brushRef = useRef<HTMLDivElement>(null);
  const field = useRef<FieldController | null>(null);
  const paint = useRef<Paint>(emptyPaint(0));
  const composed = useRef<Composed>({ rgba: new Uint8Array(0), fx: new Uint8Array(0) });
  const data = useRef<FieldData | null>(null);
  const undo = useRef<Paint[]>([]);
  const redo = useRef<Paint[]>([]);

  const set = useCallback(<K extends keyof Settings>(k: K, v: Settings[K]) => setSettings((s) => ({ ...s, [k]: v })), []);

  // ── source → image ──────────────────────────────────────────────────────
  useEffect(() => {
    let live = true;
    const frame = !!source.frame;
    const cut = source.trim ?? 0;
    loadImage(source.url)
      .then(fitImage)
      .then((i) => (frame ? autoFrame(i, cut) : i))
      .then((i) => {
        if (!live) return;
        setError(null);
        setImg(i);
      })
      .catch(() => live && setError("That picture could not be opened. Try another."));
    return () => {
      live = false;
    };
  }, [source.url, source.frame, source.trim]);

  // ── image + settings → plate ────────────────────────────────────────────
  // A framed picture already had its watermark strip cropped off.
  const trim = source.frame ? 0 : (source.trim ?? 0);
  const grid = useMemo(
    () => (img ? gridFor(settings, { w: img.naturalWidth, h: img.naturalHeight * (1 - trim) }) : null),
    [img, trim, settings],
  );
  const cols = grid?.cols ?? 0;
  const rows = grid?.rows ?? 0;
  const pixels = useMemo(() => (img && cols ? sample(img, cols, rows, trim) : null), [img, cols, rows, trim]);
  // Typing in the words box or dragging a slider re-sets thousands of letters;
  // let React finish the keystroke first and typeset with the latest value.
  const typeset = useDeferredValue(settings);
  const { text, glyphs, ink, paper, contrast, cutoff, invert } = typeset;
  const plate = useMemo(
    () => (pixels ? buildPlate(pixels, cols, rows, { ...DEFAULTS, text, glyphs, ink, paper, contrast, cutoff, invert }) : null),
    [pixels, cols, rows, text, glyphs, ink, paper, contrast, cutoff, invert],
  );

  const { face, weight } = settings;
  const lastGrid = useRef("");
  const url = source.url;
  useEffect(() => {
    if (!plate) return;
    // A new grid (or a new picture) starts with clean paper; re-typesetting
    // the same grid keeps the paint.
    const gridKey = `${url}|${plate.cols}x${plate.rows}`;
    if (lastGrid.current !== gridKey) {
      lastGrid.current = gridKey;
      paint.current = emptyPaint(plate.cols * plate.rows);
      undo.current = [];
      redo.current = [];
      setHist({ undo: 0, redo: 0, painted: false });
    }
    composed.current = compose(plate, paint.current);
    const d = fieldData(plate, composed.current.rgba, { ...DEFAULTS, paper, face, weight }, composed.current.fx);
    data.current = d;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!field.current) {
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      field.current = createField(canvas, d, { fit: "contain", listen: "canvas", assemble: !still, mode: still ? "still" : "scatter" });
    } else field.current.update(d);
  }, [plate, paper, face, weight, url]);

  useEffect(() => () => field.current?.destroy(), []);

  const { radius, force, spring } = settings;
  useEffect(() => {
    field.current?.setPhysics(physics({ ...DEFAULTS, radius, force, spring }));
  }, [radius, force, spring, plate]);

  useEffect(() => {
    field.current?.setMode(tab === "paint" ? "paint" : "scatter");
  }, [tab]);

  // ── fit the sheet to the stage ──────────────────────────────────────────
  useEffect(() => {
    const stage = stageRef.current;
    const sheet = sheetRef.current;
    if (!stage || !sheet || !cols) return;
    const fitSheet = () => {
      const r = stage.getBoundingClientRect();
      const pad = r.width < 640 ? 16 : 48;
      const aw = r.width - pad * 2;
      const ah = r.height - pad * 2;
      const aspect = cols / rows;
      let w = aw;
      let h = w / aspect;
      if (h > ah) {
        h = ah;
        w = h * aspect;
      }
      sheet.style.width = `${Math.max(1, Math.floor(w))}px`;
      sheet.style.height = `${Math.max(1, Math.floor(h))}px`;
    };
    fitSheet();
    const ro = new ResizeObserver(fitSheet);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [cols, rows]);

  // ── painting ────────────────────────────────────────────────────────────
  const snapshot = (p: Paint): Paint => ({ mask: p.mask.slice(), rgba: p.rgba.slice(), fx: p.fx.slice() });
  const syncHist = useCallback(() => {
    setHist({ undo: undo.current.length, redo: redo.current.length, painted: paint.current.mask.some((m) => m !== 0) });
  }, []);
  const refresh = useCallback(() => {
    if (!plate) return;
    compose(plate, paint.current, composed.current);
    const all = new Int32Array(cols * rows);
    for (let i = 0; i < all.length; i++) all[i] = i;
    field.current?.changed(all);
  }, [plate, cols, rows]);

  const stroke = useRef<{ down: boolean; x: number; y: number }>({ down: false, x: 0, y: 0 });
  const stamp = useCallback(
    (x: number, y: number) => {
      if (!plate) return;
      const R = size * CELL;
      const c0 = Math.max(0, Math.floor((x - R) / CELL));
      const c1 = Math.min(cols - 1, Math.floor((x + R) / CELL));
      const r0 = Math.max(0, Math.floor((y - R) / CELL));
      const r1 = Math.min(rows - 1, Math.floor((y + R) / CELL));
      const [cr, cg, cb] = hexToRgb(colour);
      const fxCode = FINISH_CODE[finish];
      const p = paint.current;
      const out = composed.current;
      const changed: number[] = [];
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const dx = (c + 0.5) * CELL - x;
          const dy = (r + 0.5) * CELL - y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > R) continue;
          const i = r * cols + c;
          const j = i * 4;
          if (tool === "brush" || tool === "spray") {
            if (!bare && !out.rgba[j + 3]) continue;
            if (tool === "spray" && Math.random() > 0.16 * (1 - d / R) + 0.02) continue;
            p.mask[i] = 1;
            p.fx[i] = fxCode;
            p.rgba[j] = cr;
            p.rgba[j + 1] = cg;
            p.rgba[j + 2] = cb;
            p.rgba[j + 3] = Math.round(255 * strength * (tool === "spray" ? 0.55 + Math.random() * 0.45 : 1));
          } else if (tool === "eraser") {
            if (strength < 1 && Math.random() > strength) continue;
            p.mask[i] = 2;
          } else {
            p.mask[i] = 0;
          }
          composeCell(out, plate, p, i);
          changed.push(i);
        }
      }
      if (changed.length) field.current?.changed(changed);
    },
    [plate, cols, rows, size, colour, tool, strength, finish, bare],
  );

  const placeBrush = (e: React.PointerEvent) => {
    const b = brushRef.current;
    const sheet = sheetRef.current;
    if (!b || !sheet) return;
    const r = sheet.getBoundingClientRect();
    const scale = r.width / (cols * CELL);
    const d = size * CELL * scale * 2;
    b.style.width = `${d}px`;
    b.style.height = `${d}px`;
    b.style.transform = `translate(${e.clientX - r.left - d / 2}px, ${e.clientY - r.top - d / 2}px)`;
    b.style.opacity = "1";
  };

  const onDown = (e: React.PointerEvent) => {
    if (tab !== "paint" || !field.current) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    undo.current.push(snapshot(paint.current));
    if (undo.current.length > 40) undo.current.shift();
    redo.current = [];
    setHist({ undo: undo.current.length, redo: 0, painted: true });
    const p = field.current.toLogical(e.clientX, e.clientY);
    stroke.current = { down: true, x: p.x, y: p.y };
    stamp(p.x, p.y);
  };
  const onMove = (e: React.PointerEvent) => {
    if (tab !== "paint" || !field.current) return;
    placeBrush(e);
    if (!stroke.current.down) return;
    const p = field.current.toLogical(e.clientX, e.clientY);
    const s = stroke.current;
    const dist = Math.hypot(p.x - s.x, p.y - s.y);
    const spacing = Math.max(CELL * 0.6, size * CELL * 0.35);
    const n = Math.max(1, Math.ceil(dist / spacing));
    for (let k = 1; k <= n; k++) stamp(s.x + ((p.x - s.x) * k) / n, s.y + ((p.y - s.y) * k) / n);
    stroke.current = { down: true, x: p.x, y: p.y };
  };
  const onUp = () => {
    stroke.current.down = false;
  };
  const onLeave = () => {
    if (brushRef.current) brushRef.current.style.opacity = "0";
  };

  const doUndo = useCallback(() => {
    const prev = undo.current.pop();
    if (!prev) return;
    redo.current.push(snapshot(paint.current));
    paint.current = prev;
    refresh();
    syncHist();
  }, [refresh, syncHist]);
  const doRedo = useCallback(() => {
    const next = redo.current.pop();
    if (!next) return;
    undo.current.push(snapshot(paint.current));
    paint.current = next;
    refresh();
    syncHist();
  }, [refresh, syncHist]);
  const clearPaint = useCallback(() => {
    undo.current.push(snapshot(paint.current));
    paint.current = emptyPaint(cols * rows);
    redo.current = [];
    refresh();
    syncHist();
  }, [cols, rows, refresh, syncHist]);

  // keyboard: B S E R tools, [ ] size, ⌘Z / ⇧⌘Z
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) doRedo();
        else doUndo();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const tools: Record<string, Tool> = { b: "brush", s: "spray", e: "eraser", r: "restore" };
      if (tools[k]) {
        setTool(tools[k]);
        setTab("paint");
      } else if (k === "[") setSize((v) => Math.max(1, v - 1));
      else if (k === "]") setSize((v) => Math.min(24, v + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doUndo, doRedo]);

  // A new grid can't carry the paint over, so ask first — in the page, since
  // browser dialogs are unavailable inside an artifact.
  const [pendingGrid, setPendingGrid] = useState<{ k: "cols" | "format"; v: Settings["cols"] | Settings["format"] } | null>(null);
  const changeGrid = useCallback(
    <K extends "cols" | "format">(k: K, v: Settings[K]) => {
      if (hist.painted) setPendingGrid({ k, v });
      else set(k, v);
    },
    [set, hist.painted],
  );
  const resolveGrid = useCallback(
    (apply: boolean) => {
      if (apply && pendingGrid) setSettings((s) => ({ ...s, [pendingGrid.k]: pendingGrid.v }));
      setPendingGrid(null);
    },
    [pendingGrid],
  );

  const letterCount = useMemo(() => {
    if (!plate) return 0;
    let n = 0;
    for (let i = 3; i < plate.base.length; i += 4) if (plate.base[i]) n++;
    return n;
  }, [plate]);

  return (
    <div className="flex min-h-svh flex-col bg-paper lg:h-svh lg:overflow-hidden">
      {/* masthead */}
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-ink px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-2xl leading-none">
          Pied
        </Link>
        <nav aria-label="Steps" className="flex items-center">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "step" : undefined}
              className={cn("label flex items-center gap-2 px-2 py-1.5 transition-colors sm:px-3", tab === t.id ? "bg-ink text-paper" : "text-ink-3 hover:text-ink")}
            >
              <span className="font-display text-base normal-case tracking-normal">{t.n}</span>
              <span className="hidden sm:inline">{t.label}</span>
              {i < TABS.length - 1 ? <span className="sr-only">,</span> : null}
            </button>
          ))}
        </nav>
        <span className="label hidden text-ink-3 md:inline">The press</span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* panel */}
        <aside className="scrollbar-thin order-2 min-h-0 w-full shrink-0 border-t border-ink px-5 pb-10 lg:order-1 lg:w-[380px] lg:overflow-y-auto lg:border-r lg:border-t-0">
          <div className="py-6">
            <p className="label text-ink-3">
              {TABS.find((t) => t.id === tab)!.n} — {TABS.find((t) => t.id === tab)!.label}
            </p>
            <h1 className="mt-2 font-display text-4xl leading-none">
              {tab === "source" && "Bring a picture."}
              {tab === "set" && "Set the type."}
              {tab === "paint" && "Paint on it."}
              {tab === "keep" && "Take it home."}
            </h1>
          </div>
          {tab === "source" && (
            <SourcePanel
              format={settings.format}
              busy={busy}
              setBusy={setBusy}
              onSource={(s, prompt) => {
                setSource(s);
                if (prompt) set("text", `${prompt} — `);
              }}
              current={source}
              onNext={() => setTab("set")}
            />
          )}
          {tab === "set" && <SetPanel settings={settings} set={set} changeGrid={changeGrid} pendingGrid={!!pendingGrid} resolveGrid={resolveGrid} onNext={() => setTab("paint")} />}
          {tab === "paint" && (
            <PaintPanel
              tool={tool}
              setTool={setTool}
              size={size}
              setSize={setSize}
              strength={strength}
              setStrength={setStrength}
              colour={colour}
              setColour={setColour}
              finish={finish}
              setFinish={setFinish}
              bare={bare}
              setBare={setBare}
              canUndo={hist.undo > 0}
              canRedo={hist.redo > 0}
              hasPaint={hist.painted}
              onUndo={doUndo}
              onRedo={doRedo}
              onClear={clearPaint}
              onNext={() => setTab("keep")}
            />
          )}
          {tab === "keep" && <KeepPanel data={data} settings={settings} name={source.name} />}
        </aside>

        {/* stage */}
        <main className="sticky top-0 z-10 order-1 flex h-[50svh] flex-col bg-paper-2 lg:relative lg:order-2 lg:h-auto lg:flex-1">
          <div ref={stageRef} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
            <CropMarks />
            <div
              ref={sheetRef}
              className={cn("relative shadow-[0_1px_0_rgba(0,0,0,0.08),0_30px_60px_-30px_rgba(0,0,0,0.35)]", tab === "paint" ? "touch-none" : "touch-pan-y")}
              data-cursor={tab === "paint" ? "none" : "play"}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onPointerLeave={onLeave}
              style={{ cursor: tab === "paint" ? "none" : undefined }}
            >
              <canvas ref={canvasRef} className="block h-full w-full" role="img" aria-label={`${source.name}, set in type`} />
              {tab === "paint" && (
                <div
                  ref={brushRef}
                  aria-hidden
                  className="pointer-events-none absolute left-0 top-0 rounded-full border border-ink opacity-0 mix-blend-difference outline outline-1 outline-white/70"
                />
              )}
              {job ? <Composing label={job.label} onCancel={job.cancel} /> : null}
            </div>
            {!plate ? <Skeleton /> : null}
            {error ? <p className="label absolute bottom-4 left-1/2 -translate-x-1/2 bg-ink px-3 py-2 text-paper">{error}</p> : null}
          </div>
          <div className="label flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-rule px-4 py-2.5 text-ink-3 sm:px-6">
            <span>
              Plate — {cols} × {rows} · {letterCount.toLocaleString()} letters · {FACES[settings.face].label} {settings.weight === 700 ? "Bold" : "Regular"}
            </span>
            <span className="text-ink">
              {tab === "paint" ? `${tool}${finish !== "flat" && (tool === "brush" || tool === "spray") ? ` · ${finish}` : ""} · ${size} · [ ] to resize · ⌘Z to undo` : "Move through it — the type scatters"}
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}

function CropMarks() {
  const m = "pointer-events-none absolute h-6 w-6 border-ink/40";
  return (
    <>
      <span className={cn(m, "left-3 top-3 border-l border-t")} />
      <span className={cn(m, "right-3 top-3 border-r border-t")} />
      <span className={cn(m, "bottom-3 left-3 border-b border-l")} />
      <span className={cn(m, "bottom-3 right-3 border-b border-r")} />
    </>
  );
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ&@#%*";
function Skeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center" role="status" aria-label="Setting the type">
      <div className="flex aspect-[4/5] h-[70%] max-w-[80%] flex-col justify-center gap-[3%] bg-paper p-[6%] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)]">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="flicker h-[2.5%] bg-ink/10" style={{ width: `${55 + ((i * 37) % 45)}%`, animationDelay: `${i * 70}ms` }} />
        ))}
        <p className="label mt-4 text-ink-3">Setting the type…</p>
      </div>
    </div>
  );
}

function Composing({ label, onCancel }: { label: string; onCancel?: () => void }) {
  const [s, setS] = useState("PIED");
  useEffect(() => {
    const id = setInterval(() => {
      setS(Array.from({ length: 7 }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]).join(""));
    }, 90);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-paper/85 backdrop-blur-[2px]">
      <p className="font-mono text-4xl font-bold tracking-[0.3em] sm:text-6xl" aria-hidden>
        {s}
      </p>
      <p className="label flicker" role="status">
        {label}
      </p>
      {onCancel ? (
        <button type="button" onClick={onCancel} className="label border-b border-ink pb-0.5">
          Cancel
        </button>
      ) : null}
    </div>
  );
}
