"use client";

import { useEffect, useRef, useState } from "react";
import type { Source } from "@/lib/plate";
import { Button, Slider } from "./controls";

// Draw the picture yourself. Ink on paper, with a pen that thickens as it
// slows (or with pressure, on a stylus). Each stroke goes to the press as it
// lifts, so the drawing is set in type while you draw.
export function DrawPad({ w, h, onSource }: { w: number; h: number; onSource: (s: Source) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<ImageData[]>([]);
  const pen = useRef<{ x: number; y: number; w: number; t: number } | null>(null);
  const [nib, setNib] = useState(14);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext("2d")!;
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, c.width, c.height);
  }, [w, h]);

  const at = (e: React.PointerEvent) => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };

  const send = () => {
    const c = ref.current;
    if (c) onSource({ url: c.toDataURL("image/png"), name: "Your drawing" });
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ref.current;
    if (!c) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const g = c.getContext("2d")!;
    strokes.current.push(g.getImageData(0, 0, c.width, c.height));
    if (strokes.current.length > 30) strokes.current.shift();
    const p = at(e);
    pen.current = { ...p, w: nib, t: performance.now() };
    g.fillStyle = "#0c0c0b";
    g.beginPath();
    g.arc(p.x, p.y, nib / 2, 0, Math.PI * 2);
    g.fill();
  };
  const move = (e: React.PointerEvent) => {
    const c = ref.current;
    const last = pen.current;
    if (!c || !last) return;
    const g = c.getContext("2d")!;
    const p = at(e);
    const now = performance.now();
    const speed = Math.hypot(p.x - last.x, p.y - last.y) / Math.max(1, now - last.t);
    // Pressure when the device has it; otherwise slower is thicker, like a brush pen.
    const target = e.pressure && e.pointerType === "pen" ? nib * (0.3 + e.pressure * 1.4) : nib * Math.max(0.35, Math.min(1.3, 1.3 - speed * 0.35));
    const width = last.w + (target - last.w) * 0.35;
    g.strokeStyle = "#0c0c0b";
    g.lineCap = "round";
    g.lineJoin = "round";
    g.lineWidth = width;
    g.beginPath();
    g.moveTo(last.x, last.y);
    g.lineTo(p.x, p.y);
    g.stroke();
    pen.current = { ...p, w: width, t: now };
  };
  const up = () => {
    if (!pen.current) return;
    pen.current = null;
    setCount((n) => n + 1);
    send();
  };

  const undo = () => {
    const c = ref.current;
    const prev = strokes.current.pop();
    if (!c || !prev) return;
    c.getContext("2d")!.putImageData(prev, 0, 0);
    setCount((n) => Math.max(0, n - 1));
    send();
  };
  const clear = () => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext("2d")!;
    strokes.current.push(g.getImageData(0, 0, c.width, c.height));
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, c.width, c.height);
    setCount(0);
    send();
  };

  return (
    <div className="mt-5">
      <canvas
        ref={ref}
        width={w}
        height={h}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="block w-full cursor-crosshair touch-none border border-ink bg-white"
        style={{ aspectRatio: `${w} / ${h}` }}
        aria-label="Drawing pad. Draw with the mouse, a finger or a stylus; the press sets it in type as you go."
        data-cursor="none"
      />
      <div className="mt-3">
        <Slider label="Pen" value={nib} min={4} max={48} step={1} onChange={setNib} format={(v) => `${v}`} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="line" onClick={undo} disabled={!count}>
          Undo stroke
        </Button>
        <Button variant="line" onClick={clear} disabled={!count}>
          Clear
        </Button>
      </div>
      <p className="mt-3 font-serif text-sm text-ink-3">Bold shapes print best — a face, a flower, your name in big letters. Every stroke is set in type as you lift the pen.</p>
    </div>
  );
}
