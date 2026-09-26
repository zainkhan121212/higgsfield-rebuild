"use client";

import type { ReactNode } from "react";
import type { Finish } from "@/lib/plate";
import { cn } from "@/lib/utils";
import { Button, Group, Segmented, Slider, Toggle } from "./controls";

export type Tool = "brush" | "spray" | "eraser" | "restore";

const TOOLS: { id: Tool; label: string; key: string; note: string; icon: ReactNode }[] = [
  {
    id: "brush",
    label: "Brush",
    key: "B",
    note: "solid colour",
    icon: (
      <path d="M4 20c2.5 0 4-1.5 4-3.5S6.5 13 5 14.5 3 18 4 20Zm4.5-4.5L19 5a1.4 1.4 0 0 0-2-2L6.5 13.5" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    id: "spray",
    label: "Spray",
    key: "S",
    note: "a scatter of ink",
    icon: (
      <>
        <rect x="4" y="9" width="7" height="12" rx="1" />
        <path d="M6 9V6h3v3" />
        {[
          [15, 5],
          [18, 7],
          [15, 9],
          [19, 11],
          [16, 13],
          [20, 4],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="0.9" fill="currentColor" stroke="none" />
        ))}
      </>
    ),
  },
  {
    id: "eraser",
    label: "Eraser",
    key: "E",
    note: "lift letters out",
    icon: <path d="m7 20-4-4L14 5l6 6-9 9H7Zm0 0h13M9.5 10.5l5 5" strokeLinejoin="round" />,
  },
  {
    id: "restore",
    label: "Restore",
    key: "R",
    note: "back to the print",
    icon: <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" strokeLinecap="round" strokeLinejoin="round" />,
  },
];

// Three trays, the way a print shop keeps them: printing inks, neon tubes
// for the glow finish, and metal leaf for foil.
const TRAYS: { name: string; for: Finish; swatches: { hex: string; name: string }[] }[] = [
  {
    name: "Inks",
    for: "flat",
    swatches: [
      { hex: "#111110", name: "Ink" },
      { hex: "#f4f3ee", name: "Paper" },
      { hex: "#77756d", name: "Graphite" },
      { hex: "#c8341e", name: "Vermilion" },
      { hex: "#d19a2a", name: "Ochre" },
      { hex: "#243e96", name: "Prussian" },
      { hex: "#4f5a2c", name: "Olive" },
      { hex: "#e39aac", name: "Rose" },
      { hex: "#3aa39a", name: "Verdigris" },
    ],
  },
  {
    name: "Neon",
    for: "neon",
    swatches: [
      { hex: "#ff2d95", name: "Hot pink" },
      { hex: "#27e1ff", name: "Electric blue" },
      { hex: "#b8ff2c", name: "Acid" },
      { hex: "#ff7a1a", name: "Sodium" },
      { hex: "#a855ff", name: "Ultraviolet" },
    ],
  },
  {
    name: "Leaf",
    for: "foil",
    swatches: [
      { hex: "#c9a13b", name: "Gold leaf" },
      { hex: "#b9bdc4", name: "Silver" },
      { hex: "#b8703a", name: "Copper" },
      { hex: "#8a7fd0", name: "Oil slick" },
    ],
  },
];
const ALL = TRAYS.flatMap((t) => t.swatches);

const FINISH_NOTE: Record<Finish, string> = {
  flat: "Plain ink, like the press prints it.",
  neon: "Each letter glows in its own colour. Strongest on dark paper.",
  foil: "Metal leaf that catches the light — move the cursor and the shine slides across it.",
};

export function PaintPanel(p: {
  tool: Tool;
  setTool: (t: Tool) => void;
  size: number;
  setSize: (n: number) => void;
  strength: number;
  setStrength: (n: number) => void;
  colour: string;
  setColour: (c: string) => void;
  finish: Finish;
  setFinish: (f: Finish) => void;
  bare: boolean;
  setBare: (v: boolean) => void;
  canUndo: boolean;
  canRedo: boolean;
  hasPaint: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onNext: () => void;
}) {
  const inks = p.tool === "brush" || p.tool === "spray";
  return (
    <div>
      <p className="-mt-2 mb-5 font-serif text-ink-2">Paint straight onto the letters. The paper stays clean unless you choose to set new letters on it.</p>
      <div className="grid grid-cols-2 gap-2">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => p.setTool(t.id)}
            aria-pressed={p.tool === t.id}
            className={cn(
              "flex items-start gap-3 border p-3 text-left transition-colors",
              p.tool === t.id ? "border-ink bg-ink text-paper" : "border-rule hover:border-ink",
            )}
          >
            <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
              {t.icon}
            </svg>
            <span className="min-w-0">
              <span className="flex items-center gap-2 font-serif text-[15px]">
                {t.label}
                <kbd className="label rounded-none border border-current px-1 text-[9px] opacity-60">{t.key}</kbd>
              </span>
              <span className={cn("block font-serif text-xs italic", p.tool === t.id ? "text-paper/70" : "text-ink-3")}>{t.note}</span>
            </span>
          </button>
        ))}
      </div>

      <Group title="Nib" className="mt-6">
        <div className="space-y-4">
          <Slider label="Size" value={p.size} min={1} max={24} step={1} onChange={p.setSize} format={(v) => `${v}`} />
          <Slider label={p.tool === "eraser" ? "Pressure" : "Strength"} value={p.strength} min={0.1} max={1} step={0.05} onChange={p.setStrength} format={(v) => `${Math.round(v * 100)}%`} />
        </div>
      </Group>

      <Group title="Finish" hint={inks ? undefined : "brush and spray only"}>
        <div className={cn("transition-opacity", !inks && "opacity-40")}>
          <Segmented
            label="Finish"
            value={p.finish}
            onChange={(f) => {
              p.setFinish(f);
              // Switching finish offers that finish's tray.
              const tray = TRAYS.find((t) => t.for === f)!;
              if (!tray.swatches.some((sw) => sw.hex === p.colour)) p.setColour(tray.swatches[0].hex);
            }}
            options={[
              { value: "flat", label: "Ink" },
              { value: "neon", label: "Neon" },
              { value: "foil", label: "Foil" },
            ]}
          />
          <p className="mt-2 font-serif text-sm text-ink-3">{FINISH_NOTE[p.finish]}</p>
        </div>
      </Group>

      <Group title="Colour" hint={inks ? ALL.find((sw) => sw.hex === p.colour)?.name ?? p.colour : "not used by this tool"}>
        <div className={cn("space-y-4 transition-opacity", !inks && "opacity-40")}>
          {TRAYS.map((tray) => (
            <div key={tray.name}>
              <p className="label mb-2 text-[10px] text-ink-3">{tray.name}</p>
              <div className="grid grid-cols-5 gap-2">
                {tray.swatches.map((sw) => (
                  <button
                    key={sw.hex}
                    type="button"
                    title={sw.name}
                    aria-label={sw.name}
                    aria-pressed={p.colour === sw.hex}
                    onClick={() => {
                      p.setColour(sw.hex);
                      if (tray.for !== "flat") p.setFinish(tray.for);
                    }}
                    className={cn(
                      "aspect-square border transition-transform",
                      p.colour === sw.hex ? "scale-90 border-ink outline outline-1 outline-offset-2 outline-ink" : "border-rule hover:scale-95",
                    )}
                    style={{
                      background:
                        tray.for === "foil"
                          ? `linear-gradient(135deg, ${sw.hex} 0%, #fff8 45%, ${sw.hex} 60%, #0003 100%), ${sw.hex}`
                          : sw.hex,
                      boxShadow: tray.for === "neon" ? `0 0 10px ${sw.hex}aa` : undefined,
                    }}
                  />
                ))}
                {tray.for === "flat" ? (
                  <label className="relative flex aspect-square cursor-pointer items-center justify-center border border-dashed border-ink" title="Any colour">
                    <span className="font-display text-xl" aria-hidden>
                      +
                    </span>
                    <input id="paint-colour" type="color" value={p.colour} onChange={(e) => p.setColour(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Pick any colour" />
                  </label>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <Toggle label="Paint on bare paper" note="set new letters where there were none" checked={p.bare} onChange={p.setBare} />
        </div>
      </Group>

      <Group title="History">
        <div className="grid grid-cols-3 gap-2">
          <Button variant="line" onClick={p.onUndo} disabled={!p.canUndo}>
            ↶ Undo
          </Button>
          <Button variant="line" onClick={p.onRedo} disabled={!p.canRedo}>
            Redo ↷
          </Button>
          <Button variant="line" onClick={p.onClear} disabled={!p.hasPaint}>
            Wash
          </Button>
        </div>
      </Group>

      <Button variant="line" onClick={p.onNext} className="mt-2 w-full">
        Next — take it home →
      </Button>
    </div>
  );
}
