import type { FieldData } from "./field";

// Turning a picture into a plate of type. The image is cover-cropped onto a
// grid; each cell's darkness decides whether a letter is printed there and
// how much ink it gets.

export type Settings = {
  text: string;
  glyphs: "words" | "ramp";
  face: "mono" | "typewriter" | "serif";
  weight: 400 | 700;
  cols: number;
  format: "desktop" | "phone" | "square" | "original";
  ink: "mono" | "colour";
  paper: "light" | "dark";
  contrast: number;
  cutoff: number;
  invert: boolean;
  radius: number;
  force: number;
  spring: number;
};

export const DEFAULTS: Settings = {
  text: "pied — type that has been spilled and set loose — ",
  glyphs: "words",
  face: "mono",
  weight: 700,
  cols: 150,
  format: "desktop",
  ink: "mono",
  paper: "light",
  contrast: 1.25,
  cutoff: 0.2,
  invert: false,
  radius: 9,
  force: 2.2,
  spring: 0.05,
};

export const CELL = 10;

// System stacks only: the exported wallpaper must look the same offline, on
// a machine that has none of our web fonts.
export const FACES: Record<Settings["face"], { label: string; stack: string }> = {
  mono: { label: "Mono", stack: 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace' },
  typewriter: { label: "Typewriter", stack: '"Courier New", Courier, "Nimbus Mono PS", monospace' },
  serif: { label: "Serif", stack: 'Georgia, "Times New Roman", Times, serif' },
};

export const PAPER = {
  light: { paper: "#f4f3ee", ink: [17, 17, 16] },
  dark: { paper: "#0c0c0b", ink: [240, 238, 230] },
} as const;

const RAMP = " .:-=+*#%@";

export type Source = {
  url: string;
  name: string;
  /** fraction of height to trim from the bottom (watermarks) */
  trim?: number;
  /** crop to the subject on arrival (generated pictures) */
  frame?: boolean;
};

export function formatAspect(format: Settings["format"], img?: { w: number; h: number }) {
  if (format === "desktop") return 16 / 9;
  if (format === "phone") return 9 / 19.5;
  if (format === "square") return 1;
  return img ? img.w / img.h : 1;
}

export function gridFor(s: Settings, img?: { w: number; h: number }) {
  const aspect = formatAspect(s.format, img);
  // Portrait formats count detail along the long edge, so a phone plate is
  // as rich as a desktop one.
  let cols = s.cols;
  let rows = Math.round(cols / aspect);
  if (aspect < 1) {
    rows = s.cols;
    cols = Math.max(8, Math.round(rows * aspect));
  }
  return { cols: Math.max(8, cols), rows: Math.max(8, rows) };
}

export function letters(text: string) {
  const out = Array.from(text.replace(/\s+/g, " ").trim()).filter((c) => c.length === 1);
  return out.length ? out : Array.from("pied ");
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image failed to load"));
    img.src = url;
  });
}

/**
 * A 24-megapixel phone photo is ~100 MB decoded, and every re-typeset would
 * sample it again. Anything larger than `max` on its long edge is scaled down
 * once, on arrival; the grid never needs more than a couple of thousand px.
 */
export async function fitImage(img: HTMLImageElement, max = 2048): Promise<HTMLImageElement> {
  const long = Math.max(img.naturalWidth, img.naturalHeight);
  if (long <= max) return img;
  const k = max / long;
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * k);
  c.height = Math.round(img.naturalHeight * k);
  const cx = c.getContext("2d")!;
  cx.imageSmoothingQuality = "high";
  cx.drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.92));
  if (!blob) return img;
  const url = URL.createObjectURL(blob);
  try {
    return await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Crop away the empty background around the subject, so it fills the plate.
 * The background is whatever the border of the picture is; the subject is
 * every pixel noticeably different from it. Keeps a little air around it.
 */
export async function autoFrame(img: HTMLImageElement, trim = 0, pad = 0.05): Promise<HTMLImageElement> {
  // Work within the picture minus any watermark strip at the bottom.
  const nh = img.naturalHeight * (1 - trim);
  const S = 256;
  const k = S / Math.max(img.naturalWidth, nh);
  const w = Math.max(1, Math.round(img.naturalWidth * k));
  const h = Math.max(1, Math.round(nh * k));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const cx = c.getContext("2d", { willReadFrequently: true })!;
  cx.drawImage(img, 0, 0, img.naturalWidth, nh, 0, 0, w, h);
  const px = cx.getImageData(0, 0, w, h).data;
  const lum = (i: number) => (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
  const border: number[] = [];
  for (let x = 0; x < w; x++) border.push(lum(x * 4), lum(((h - 1) * w + x) * 4));
  for (let y = 0; y < h; y++) border.push(lum(y * w * 4), lum((y * w + w - 1) * 4));
  border.sort((a, b) => a - b);
  const bg = border[border.length >> 1];
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (Math.abs(lum((y * w + x) * 4) - bg) > 0.14) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  const bw = x1 - x0 + 1;
  const bh = y1 - y0 + 1;
  // No subject found, it already fills the frame, or it's too small to be a
  // subject: keep the whole picture (minus the watermark strip).
  const keep = x1 < 0 || bw * bh > w * h * 0.7 || bw < w * 0.05 || bh < h * 0.05;
  if (keep && !trim) return img;
  const m = Math.round(Math.max(bw, bh) * pad);
  const sx = keep ? 0 : Math.max(0, x0 - m) / k;
  const sy = keep ? 0 : Math.max(0, y0 - m) / k;
  const sw = keep ? img.naturalWidth : Math.min(w, x1 + 1 + m) / k - sx;
  const sh = keep ? nh : Math.min(h, y1 + 1 + m) / k - sy;
  const out = document.createElement("canvas");
  out.width = Math.round(sw);
  out.height = Math.round(sh);
  const ox = out.getContext("2d")!;
  // Fill with the background tone first so the crop never shows a hard edge.
  const g = Math.round(bg * 255);
  ox.fillStyle = `rgb(${g},${g},${g})`;
  ox.fillRect(0, 0, out.width, out.height);
  ox.drawImage(img, sx, sy, sw, sh, 0, 0, out.width, out.height);
  const blob = await new Promise<Blob | null>((r) => out.toBlob(r, "image/jpeg", 0.92));
  if (!blob) return img;
  const url = URL.createObjectURL(blob);
  try {
    return await loadImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Downsample the image onto the grid, returning raw RGBA per cell. */
export function sample(img: HTMLImageElement, cols: number, rows: number, trim = 0) {
  const sw = img.naturalWidth;
  const sh = Math.round(img.naturalHeight * (1 - trim));
  const scale = Math.max(cols / sw, rows / sh);
  const cw = cols / scale;
  const ch = rows / scale;
  const sx0 = (sw - cw) / 2;
  const sy0 = (sh - ch) / 2;
  // Step down in halves: a single huge downscale aliases badly.
  let srcCanvas: CanvasImageSource = img;
  let rx = sx0, ry = sy0, rw = cw, rh = ch;
  let w = rw, h = rh;
  while (w / 2 > cols * 2) {
    w /= 2;
    h /= 2;
    const c = document.createElement("canvas");
    c.width = Math.round(w);
    c.height = Math.round(h);
    const cx = c.getContext("2d")!;
    cx.imageSmoothingQuality = "high";
    cx.drawImage(srcCanvas, rx, ry, rw, rh, 0, 0, c.width, c.height);
    srcCanvas = c;
    rx = 0;
    ry = 0;
    rw = c.width;
    rh = c.height;
  }
  const out = document.createElement("canvas");
  out.width = cols;
  out.height = rows;
  const ox = out.getContext("2d", { willReadFrequently: true })!;
  ox.imageSmoothingQuality = "high";
  ox.drawImage(srcCanvas, rx, ry, rw, rh, 0, 0, cols, rows);
  return ox.getImageData(0, 0, cols, rows).data;
}

export type Plate = {
  cols: number;
  rows: number;
  /** printed ink before any paint */
  base: Uint8Array;
  ch: string;
};

export function buildPlate(pixels: Uint8ClampedArray, cols: number, rows: number, s: Settings): Plate {
  const N = cols * rows;
  const base = new Uint8Array(N * 4);
  const text = letters(s.text);
  const ink = PAPER[s.paper].ink;
  const lightPaper = s.paper === "light";
  const chars: string[] = new Array(N);
  let li = 0;
  let blank = 0;
  // Auto-levels: stretch the 2nd–98th percentile of brightness to the full
  // range first, so a washed-out grey photo prints as crisply as a sharp one
  // and the contrast slider starts from the same place for every picture.
  const hist = new Uint32Array(256);
  for (let i = 0; i < N; i++) {
    const j = i * 4;
    hist[Math.round(0.2126 * pixels[j] + 0.7152 * pixels[j + 1] + 0.0722 * pixels[j + 2])]++;
  }
  let lo = 0, hi = 255, acc = 0;
  for (let v = 0; v < 256; v++) if ((acc += hist[v]) >= N * 0.02) { lo = v; break; }
  acc = 0;
  for (let v = 255; v >= 0; v--) if ((acc += hist[v]) >= N * 0.02) { hi = v; break; }
  const span = Math.max(24, hi - lo);
  for (let i = 0; i < N; i++) {
    const j = i * 4;
    const r = pixels[j], g = pixels[j + 1], b = pixels[j + 2];
    let lum = (0.2126 * r + 0.7152 * g + 0.0722 * b - lo) / span;
    lum = Math.min(1, Math.max(0, (lum - 0.5) * s.contrast + 0.5));
    // On light paper, ink goes where the picture is dark; on dark paper the
    // letters are the light. Invert flips either.
    let depth = lightPaper ? 1 - lum : lum;
    if (s.invert) depth = 1 - depth;
    const on = depth > s.cutoff;
    const t = on ? (depth - s.cutoff) / (1 - s.cutoff) : 0;

    if (s.glyphs === "ramp") {
      chars[i] = on ? RAMP[Math.min(RAMP.length - 1, 1 + Math.floor(t * (RAMP.length - 1)))] : text[blank++ % text.length];
    } else {
      let c = on ? text[li++ % text.length] : text[blank++ % text.length];
      if (c === " ") c = "·";
      chars[i] = c;
    }
    if (!on) continue;

    // A letter at half-depth still has to read as writing, so the ramp is
    // pushed towards opaque and only the faintest cells stay grey.
    const level = Math.round(t * 8) / 8;
    const alpha = s.glyphs === "ramp" ? 0.55 + 0.45 * level : 0.3 + 0.7 * Math.pow(level, 0.7);
    if (s.ink === "mono") {
      base[j] = ink[0];
      base[j + 1] = ink[1];
      base[j + 2] = ink[2];
    } else {
      // Colour ink: the picture's own colour, pushed away from the paper so
      // it stays legible as type.
      const k = lightPaper ? 0.82 : 1.18;
      const lift = lightPaper ? 0 : 22;
      base[j] = Math.min(255, r * k + lift);
      base[j + 1] = Math.min(255, g * k + lift);
      base[j + 2] = Math.min(255, b * k + lift);
    }
    base[j + 3] = Math.round(Math.max(alpha, s.ink === "colour" ? 0.6 : 0) * 255);
  }
  return { cols, rows, base, ch: chars.join("") };
}

/**
 * Paint lives in its own layer so re-typesetting (contrast, words, ink) keeps
 * what you painted. mask: 0 = printed ink, 1 = painted, 2 = erased.
 * fx: the finish of painted letters (0 flat, 1 neon, 2 foil).
 */
export type Paint = { mask: Uint8Array; rgba: Uint8Array; fx: Uint8Array; /** word-brush letters; "" = the printed letter */ ch: string[] };

export function emptyPaint(n: number): Paint {
  return { mask: new Uint8Array(n), rgba: new Uint8Array(n * 4), fx: new Uint8Array(n), ch: new Array<string>(n).fill("") };
}

export type Finish = "flat" | "neon" | "foil";
export const FINISH_CODE: Record<Finish, number> = { flat: 0, neon: 1, foil: 2 };

/** Composed output: the colours the engine draws, and each letter's finish. */
export type Composed = { rgba: Uint8Array; fx: Uint8Array; ch: string[] };

export function composeCell(out: Composed, plate: Plate, paint: Paint, i: number) {
  const j = i * 4;
  const m = paint.mask[i];
  const src = m === 1 ? paint.rgba : plate.base;
  out.fx[i] = m === 1 ? paint.fx[i] : 0;
  out.ch[i] = paint.ch[i] || plate.ch[i];
  if (m === 2) {
    out.rgba[j + 3] = 0;
    return;
  }
  out.rgba[j] = src[j];
  out.rgba[j + 1] = src[j + 1];
  out.rgba[j + 2] = src[j + 2];
  out.rgba[j + 3] = src[j + 3];
}

export function compose(plate: Plate, paint: Paint, into?: Composed): Composed {
  const n = plate.cols * plate.rows;
  const out = into ?? { rgba: new Uint8Array(n * 4), fx: new Uint8Array(n), ch: new Array<string>(n) };
  for (let i = 0; i < n; i++) composeCell(out, plate, paint, i);
  return out;
}

export function fieldData(plate: Plate, rgba: Uint8Array, s: Settings, fx?: Uint8Array, ch?: string[]): FieldData {
  return {
    fx,
    cols: plate.cols,
    rows: plate.rows,
    cell: CELL,
    ch: ch ?? plate.ch,
    rgba,
    paper: PAPER[s.paper].paper,
    font: FACES[s.face].stack,
    weight: s.weight,
  };
}

export function physics(s: Settings) {
  return { radius: s.radius * CELL, force: s.force, spring: s.spring };
}

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [0, 0, 0];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
