"use client";

import { useEffect, useRef, useState } from "react";
import { renderStill } from "@/lib/export";
import type { FieldData } from "@/lib/field";
import { cn } from "@/lib/utils";
import { runWidgets, type Widget, type WidgetType } from "@/lib/widgets";
import { Segmented, Toggle } from "./controls";

const KINDS: { type: WidgetType; label: string; note: string }[] = [
  { type: "clock", label: "Clock", note: "the time and the day" },
  { type: "calendar", label: "Calendar", note: "this month, today ringed" },
  { type: "weather", label: "Weather", note: "your city, and the letters feel it" },
  { type: "countdown", label: "Countdown", note: "days to something" },
  { type: "quote", label: "Verse", note: "a new line every morning" },
  { type: "note", label: "Note", note: "anything you write" },
  { type: "music", label: "Now playing", note: "a turning record, in Lively & Wallpaper Engine" },
  { type: "stats", label: "FPS", note: "frames a second (CPU & RAM in Lively)" },
];

const MAX = 12;
const newId = () => Math.random().toString(36).slice(2, 9);
const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const STORE = "pied:desk";

export function loadDesk(): Widget[] {
  try {
    const v = JSON.parse(localStorage.getItem(STORE) || "[]");
    return Array.isArray(v) ? v.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function saveDesk(list: Widget[]) {
  try {
    localStorage.setItem(STORE, JSON.stringify(list));
  } catch {}
}

// A place for each new widget that isn't on top of the last one.
const SPOTS = [
  [0.18, 0.2],
  [0.82, 0.2],
  [0.18, 0.8],
  [0.82, 0.8],
  [0.5, 0.14],
  [0.5, 0.86],
  [0.14, 0.5],
  [0.86, 0.5],
];

/**
 * The desktop, small: the plate as it will sit on the screen, with the
 * widgets running over it through the same code the wallpaper runs. Drag a
 * widget to place it; the arrow keys nudge the chosen one.
 */
export function DeskStudio({
  widgets,
  onChange,
  backdrop,
  backdropKey,
  fit,
}: {
  widgets: Widget[];
  onChange: (w: Widget[]) => void;
  backdrop: () => FieldData | null;
  /** changes when the picture behind the widgets does */
  backdropKey: string;
  fit: "contain" | "cover";
}) {
  const box = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const handle = useRef<ReturnType<typeof runWidgets> | null>(null);
  const [bg, setBg] = useState<{ src: string; paper: string } | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const drag = useRef<{ id: string; el: HTMLElement; dx: number; dy: number; x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  // The plate, drawn once as a still at the desktop's shape.
  useEffect(() => {
    const d = backdrop();
    if (!d) return;
    const c = renderStill(d, 960, 540, fit);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a one-off render of an external canvas
    setBg({ src: c.toDataURL("image/jpeg", 0.85), paper: d.paper });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- backdrop reads a ref; backdropKey says when to redraw
  }, [backdropKey, fit]);

  useEffect(() => {
    const el = layer.current;
    if (!el) return;
    handle.current = runWidgets(el, [], { preview: true });
    return () => {
      handle.current?.destroy();
      handle.current = null;
    };
  }, []);

  useEffect(() => {
    handle.current?.set(widgets);
    saveDesk(widgets);
  }, [widgets]);

  const selected = widgets.find((w) => w.id === sel) || null;
  const update = (id: string, patch: Partial<Widget>) => onChange(widgets.map((w) => (w.id === id ? { ...w, ...patch } : w)));

  const add = (type: WidgetType) => {
    if (widgets.length >= MAX) return;
    const used = widgets.length % SPOTS.length;
    const [x, y] = SPOTS[used];
    const w: Widget = { id: newId(), type, x, y, size: 1 };
    if (type === "countdown") {
      w.date = inDays(30);
      w.text = "the big day";
    }
    if (type === "note") w.text = "Set something loose.";
    onChange([...widgets, w]);
    setSel(w.id);
  };

  const hit = (cx: number, cy: number) => {
    const els = Array.from(layer.current?.querySelectorAll<HTMLElement>("[data-widget]") ?? []).reverse();
    return els.find((e) => {
      const r = e.getBoundingClientRect();
      return cx >= r.left - 6 && cx <= r.right + 6 && cy >= r.top - 6 && cy <= r.bottom + 6;
    });
  };

  const down = (e: React.PointerEvent) => {
    const el = hit(e.clientX, e.clientY);
    if (!el || !box.current) return setSel(null);
    const id = el.dataset.widget!;
    const w = widgets.find((v) => v.id === id);
    if (!w) return;
    const r = box.current.getBoundingClientRect();
    drag.current = { id, el, dx: (e.clientX - r.left) / r.width - w.x, dy: (e.clientY - r.top) / r.height - w.y, x: w.x, y: w.y };
    setSel(id);
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !box.current) return;
    const r = box.current.getBoundingClientRect();
    d.x = Math.min(0.98, Math.max(0.02, (e.clientX - r.left) / r.width - d.dx));
    d.y = Math.min(0.98, Math.max(0.02, (e.clientY - r.top) / r.height - d.dy));
    d.el.style.left = d.x * 100 + "%";
    d.el.style.top = d.y * 100 + "%";
  };
  const up = () => {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (d) update(d.id, { x: +d.x.toFixed(4), y: +d.y.toFixed(4) });
  };
  const key = (e: React.KeyboardEvent) => {
    if (!selected) return;
    const step = e.shiftKey ? 0.05 : 0.01;
    const m: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (m[e.key]) {
      e.preventDefault();
      update(selected.id, { x: Math.min(0.98, Math.max(0.02, selected.x + m[e.key][0])), y: Math.min(0.98, Math.max(0.02, selected.y + m[e.key][1])) });
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      onChange(widgets.filter((w) => w.id !== selected.id));
      setSel(null);
    }
  };

  // The ring around the chosen widget, measured after each render.
  const [ring, setRing] = useState<{ l: number; t: number; w: number; h: number } | null>(null);
  useEffect(() => {
    const el = sel ? layer.current?.querySelector<HTMLElement>(`[data-widget="${sel}"]`) : null;
    const b = box.current?.getBoundingClientRect();
    if (!el || !b) {
      setRing(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRing({ l: r.left - b.left - 6, t: r.top - b.top - 6, w: r.width + 12, h: r.height + 12 });
  }, [sel, widgets]);

  return (
    <div>
      <div
        ref={box}
        tabIndex={0}
        role="application"
        aria-label="Your desktop. Drag a widget to place it; arrow keys nudge the chosen one, Delete removes it."
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onKeyDown={key}
        className="relative aspect-video w-full cursor-grab touch-none select-none overflow-hidden border border-ink outline-none focus-visible:ring-2 focus-visible:ring-ink active:cursor-grabbing"
        style={{ background: bg?.paper ?? "#f4f3ee" }}
        data-cursor="none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {bg ? <img src={bg.src} alt="" className="absolute inset-0 h-full w-full" draggable={false} /> : null}
        <div ref={layer} className="absolute inset-0" />
        {ring && !dragging ? (
          <div className="pointer-events-none absolute border border-dashed border-ink mix-blend-difference invert" style={{ left: ring.l, top: ring.t, width: ring.w, height: ring.h }} />
        ) : null}
        {!widgets.length ? (
          <p className="label pointer-events-none absolute inset-x-0 bottom-3 text-center text-[9px] text-ink-3">Add a widget below, then drag it into place</p>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {KINDS.map((k) => (
          <button
            key={k.type}
            type="button"
            onClick={() => add(k.type)}
            disabled={widgets.length >= MAX}
            title={k.note}
            className="border border-rule px-2 py-1.5 text-left transition-colors hover:border-ink hover:bg-ink hover:text-paper disabled:opacity-40"
          >
            <span className="label block text-[10px]">+ {k.label}</span>
            <span className="block truncate font-serif text-[11px] opacity-70">{k.note}</span>
          </button>
        ))}
      </div>

      {selected ? <WidgetEditor key={selected.id} w={selected} update={(p) => update(selected.id, p)} remove={() => (onChange(widgets.filter((w) => w.id !== selected.id)), setSel(null))} /> : null}
    </div>
  );
}

function WidgetEditor({ w, update, remove }: { w: Widget; update: (p: Partial<Widget>) => void; remove: () => void }) {
  const [q, setQ] = useState(w.place ?? "");
  const [finding, setFinding] = useState<string | null>(null);
  const name = KINDS.find((k) => k.type === w.type)?.label ?? w.type;

  // Open-Meteo's geocoder: the city name becomes coordinates once, here, so
  // the wallpaper only ever asks for the weather.
  const find = async () => {
    const s = q.trim();
    if (s.length < 2) return;
    setFinding("Looking…");
    try {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=${encodeURIComponent(s.slice(0, 80))}`);
      const j = r.ok ? await r.json() : null;
      const hit = j?.results?.[0];
      if (!hit) return setFinding("No place by that name.");
      const place = [hit.name, hit.country_code].filter(Boolean).join(", ");
      update({ place, lat: +hit.latitude, lon: +hit.longitude });
      setQ(place);
      setFinding(null);
    } catch {
      setFinding("Couldn't reach the weather service.");
    }
  };

  const field = "w-full border-b border-ink bg-transparent py-1.5 font-serif text-[15px] outline-none";
  return (
    <div className="mt-3 border border-ink p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="label">{name}</p>
        <button type="button" onClick={remove} className="label text-[10px] text-ink-3 hover:text-ink">
          Remove ×
        </button>
      </div>
      <Segmented
        label="Size"
        value={w.size}
        onChange={(size) => update({ size })}
        options={[
          { value: 0.6, label: "Small" },
          { value: 1, label: "Medium" },
          { value: 1.5, label: "Large" },
        ]}
      />
      <div className="mt-3 space-y-3">
        {w.type === "clock" ? <Toggle label="24-hour" checked={!!w.h24} onChange={(h24) => update({ h24 })} /> : null}
        {w.type === "note" ? (
          <textarea id={`note-${w.id}`} aria-label="Note" value={w.text ?? ""} maxLength={140} rows={2} onChange={(e) => update({ text: e.target.value })} className={cn(field, "resize-none")} />
        ) : null}
        {w.type === "countdown" ? (
          <>
            <input id={`cd-what-${w.id}`} aria-label="Counting down to" placeholder="to what — results day, a birthday" value={w.text ?? ""} maxLength={40} onChange={(e) => update({ text: e.target.value })} className={field} />
            <input id={`cd-date-${w.id}`} aria-label="Date" type="date" value={w.date ?? ""} onChange={(e) => update({ date: e.target.value })} className={field} />
          </>
        ) : null}
        {w.type === "weather" ? (
          <>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                find();
              }}
            >
              <input id={`wx-${w.id}`} aria-label="City" placeholder="Your city" value={q} maxLength={80} onChange={(e) => setQ(e.target.value)} className={field} />
              <button type="submit" className="label shrink-0 bg-ink px-3 text-paper">
                Find
              </button>
            </form>
            {finding ? <p className="label normal-case tracking-normal text-ink-3">{finding}</p> : null}
            <Toggle label="Fahrenheit" checked={!!w.fahrenheit} onChange={(fahrenheit) => update({ fahrenheit })} />
            <p className="font-serif text-xs text-ink-3">Rain and snow shake the letters now and then; a storm throws them; wind keeps them drifting.</p>
          </>
        ) : null}
        {w.type === "music" ? <p className="font-serif text-xs text-ink-3">The record turns and shows the cover of whatever your PC is playing. Lively and Wallpaper Engine pass it in; a plain browser can&apos;t see it.</p> : null}
        {w.type === "stats" ? <p className="font-serif text-xs text-ink-3">Frames a second everywhere. Lively also shares CPU, GPU and free memory.</p> : null}
      </div>
    </div>
  );
}
