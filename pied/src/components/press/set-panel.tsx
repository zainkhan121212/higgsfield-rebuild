"use client";

import { FACES, type Settings } from "@/lib/plate";
import { Button, Group, Segmented, Slider, Toggle } from "./controls";

export function SetPanel({
  settings: s,
  set,
  changeGrid,
  pendingGrid,
  resolveGrid,
  onNext,
}: {
  settings: Settings;
  set: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
  changeGrid: <K extends "cols" | "format">(k: K, v: Settings[K]) => void;
  pendingGrid: boolean;
  resolveGrid: (apply: boolean) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <Group title="Words" hint={s.glyphs === "ramp" ? "used for painted letters" : undefined}>
        <textarea
          value={s.text}
          maxLength={400}
          rows={3}
          onChange={(e) => set("text", e.target.value)}
          className="w-full resize-none border border-ink bg-transparent p-3 font-mono text-sm leading-relaxed outline-none focus:bg-white/40"
        />
        <div className="mt-3">
          <Segmented
            label="Letters"
            value={s.glyphs}
            onChange={(v) => set("glyphs", v)}
            options={[
              { value: "words", label: "Your words" },
              { value: "ramp", label: "Density ramp" },
            ]}
          />
        </div>
      </Group>

      <Group title="Face">
        <Segmented
          label="Typeface"
          value={s.face}
          onChange={(v) => set("face", v)}
          options={(Object.keys(FACES) as Settings["face"][]).map((k) => ({ value: k, label: FACES[k].label }))}
        />
        <div className="mt-2">
          <Segmented
            label="Weight"
            value={s.weight}
            onChange={(v) => set("weight", v)}
            options={[
              { value: 400, label: "Regular" },
              { value: 700, label: "Bold" },
            ]}
          />
        </div>
      </Group>

      <Group title="Forme">
        <Segmented
          label="Format"
          value={s.format}
          onChange={(v) => changeGrid("format", v)}
          options={[
            { value: "desktop", label: "Desktop" },
            { value: "phone", label: "Phone" },
            { value: "square", label: "Square" },
            { value: "original", label: "As is" },
          ]}
        />
        <div className="mt-4">
          <Slider label="Detail" value={s.cols} min={60} max={240} step={10} onChange={(v) => changeGrid("cols", v)} format={(v) => `${v} col`} />
        </div>
        {pendingGrid ? (
          <div role="alertdialog" aria-label="Clear the paint?" className="mt-4 border border-ink p-3">
            <p className="font-serif text-sm">A new grid can&apos;t keep your paint. Change it and wash the paint off?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button onClick={() => resolveGrid(true)}>Change grid</Button>
              <Button variant="line" onClick={() => resolveGrid(false)}>
                Keep paint
              </Button>
            </div>
          </div>
        ) : null}
      </Group>

      <Group title="Ink & paper">
        <div className="grid grid-cols-2 gap-2">
          <Segmented
            label="Ink"
            value={s.ink}
            onChange={(v) => set("ink", v)}
            options={[
              { value: "mono", label: "Mono" },
              { value: "colour", label: "Colour" },
            ]}
          />
          <Segmented
            label="Paper"
            value={s.paper}
            onChange={(v) => set("paper", v)}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
          />
        </div>
        <div className="mt-4 space-y-4">
          <Slider label="Contrast" value={s.contrast} min={0.5} max={2.5} step={0.05} onChange={(v) => set("contrast", v)} format={(v) => v.toFixed(2)} />
          <Slider label="Cut-off" value={s.cutoff} min={0} max={0.7} step={0.01} onChange={(v) => set("cutoff", v)} format={(v) => `${Math.round(v * 100)}%`} />
          <Toggle label="Invert" note="print the light instead of the dark" checked={s.invert} onChange={(v) => set("invert", v)} />
        </div>
      </Group>

      <Group title="Motion" hint="how the type answers the cursor">
        <div className="space-y-4">
          <Slider label="Reach" value={s.radius} min={3} max={22} step={1} onChange={(v) => set("radius", v)} format={(v) => `${v} cells`} />
          <Slider label="Push" value={s.force} min={0.5} max={5} step={0.1} onChange={(v) => set("force", v)} format={(v) => v.toFixed(1)} />
          <Slider label="Spring" value={s.spring} min={0.015} max={0.15} step={0.005} onChange={(v) => set("spring", v)} format={(v) => (v < 0.035 ? "lazy" : v > 0.09 ? "snappy" : "easy")} />
        </div>
      </Group>

      <Button variant="line" onClick={onNext} className="mt-2 w-full">
        Next — paint it →
      </Button>
    </div>
  );
}
