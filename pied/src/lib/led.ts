import type { FieldData } from "./field";

// LED: the plate re-lit as a board of round lamps. Every cell is a lamp; how
// bright the picture is there decides how hard it burns (in six steps, like
// a real driver), and the lamps that are off still show faintly, the way a
// dark sign shows its grid. The brightest lamps glow (the neon finish).
//
// The result is ordinary FieldData — "●" in every cell — so the engine,
// the cursor, the exports and the saved library need nothing new.

export type LedTint = "full" | "amber" | "green" | "red" | "white";

export const LED_TINTS: { value: LedTint; label: string; hex: string }[] = [
  { value: "amber", label: "Amber", hex: "#ffae1a" },
  { value: "green", label: "Green", hex: "#39ff6a" },
  { value: "red", label: "Red", hex: "#ff3b2f" },
  { value: "white", label: "White", hex: "#f4f3ee" },
  { value: "full", label: "Full colour", hex: "" },
];

export const LED_BOARD = "#0a0a09";
const LAMP = "●";
const STEPS = 6;

function rgbOf(hex: string) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

/** Light one cell of `out` from the same cell of `src`. */
function lamp(src: FieldData, out: FieldData, i: number, tint: LedTint, paper: number[], fixed: number[] | null, gain = 1) {
  const j = i * 4;
  const a = src.rgba[j + 3] / 255;
  // What the plate looks like here: its ink over its paper.
  const r = src.rgba[j] * a + paper[0] * (1 - a);
  const g = src.rgba[j + 1] * a + paper[1] * (1 - a);
  const b = src.rgba[j + 2] * a + paper[2] * (1 - a);
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const level = Math.round(Math.min(1, Math.pow(lum * gain, 1.3)) * STEPS) / STEPS;
  let cr: number, cg: number, cb: number;
  if (fixed) {
    [cr, cg, cb] = fixed;
  } else {
    // Full colour: the picture's own hue, pushed to full brightness so the
    // lamp's strength comes from `level`, not from a muddy colour.
    const m = Math.max(r, g, b, 1);
    cr = Math.round((r / m) * 255);
    cg = Math.round((g / m) * 255);
    cb = Math.round((b / m) * 255);
  }
  const on = level > 0.01;
  out.rgba[j] = cr;
  out.rgba[j + 1] = cg;
  out.rgba[j + 2] = cb;
  out.rgba[j + 3] = on ? Math.round(40 + level * 215) : 22;
  out.fx![i] = level >= 0.83 ? 1 : 0;
  (out.ch as string[])[i] = LAMP;
}

export function ledData(src: FieldData, tint: LedTint): FieldData {
  const n = src.cols * src.rows;
  const out: FieldData & { gain?: number } = {
    cols: src.cols,
    rows: src.rows,
    cell: src.cell,
    font: src.font,
    weight: 700,
    paper: LED_BOARD,
    rgba: new Uint8Array(n * 4),
    fx: new Uint8Array(n),
    ch: new Array<string>(n),
  };
  const paper = rgbOf(src.paper);
  const fixed = tint === "full" ? null : rgbOf(LED_TINTS.find((t) => t.value === tint)!.hex);
  // Auto-level: a dark painting shouldn't make a dim sign. The 98th
  // percentile of brightness is driven to full.
  const hist = new Uint32Array(64);
  for (let i = 0; i < n; i++) {
    const j = i * 4;
    const a = src.rgba[j + 3] / 255;
    const l = (0.2126 * (src.rgba[j] * a + paper[0] * (1 - a)) + 0.7152 * (src.rgba[j + 1] * a + paper[1] * (1 - a)) + 0.0722 * (src.rgba[j + 2] * a + paper[2] * (1 - a))) / 255;
    hist[Math.min(63, Math.floor(l * 64))]++;
  }
  let acc = 0;
  let top = 63;
  for (let b = 63; b >= 0; b--) {
    acc += hist[b];
    if (acc > n * 0.02) {
      top = b;
      break;
    }
  }
  const gain = Math.min(3, 64 / Math.max(8, top + 1));
  out.gain = gain;
  for (let i = 0; i < n; i++) lamp(src, out, i, tint, paper, fixed, gain);
  return out;
}

/** Re-light only the cells that changed (painting on an LED plate). */
export function ledCells(src: FieldData, out: FieldData & { gain?: number }, tint: LedTint, cells: ArrayLike<number>) {
  const paper = rgbOf(src.paper);
  const fixed = tint === "full" ? null : rgbOf(LED_TINTS.find((t) => t.value === tint)!.hex);
  for (let k = 0; k < cells.length; k++) lamp(src, out, cells[k], tint, paper, fixed, out.gain ?? 1);
}
