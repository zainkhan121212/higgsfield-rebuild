// The Pied launch video, drawn by the real engine. Every frame is a pure
// function of the frame number: time is virtual (see the shim in
// index.html), Math.random is seeded, and the scene script below decides
// what the engine is told at each moment.
import { createField, type FieldController, type FieldData } from "../../src/lib/field";
import { ledData, type LedTint } from "../../src/lib/led";
import { DEFAULTS, buildPlate, fieldData, gridFor, loadImage, sample, type Settings } from "../../src/lib/plate";
import { runWidgets } from "../../src/lib/widgets";

const FPS = 30;
const PAPER = "#f4f3ee";
const PAPER2 = "#ebe9e2";
const INK = "#0c0c0b";

type Kit = { mono: FieldData; colour: FieldData; light: FieldData; neon: FieldData; led: (t: LedTint) => FieldData };

async function kit(src: string, words: string, cols: number, contrast = 1.6, cutoff = 0.14): Promise<Kit> {
  const img = await loadImage(src);
  const base: Settings = { ...DEFAULTS, format: "square", cols, text: words, contrast, cutoff };
  const { cols: c, rows } = gridFor(base, { w: img.naturalWidth, h: img.naturalHeight });
  const px = sample(img, c, rows, 0);
  const mk = (s: Settings, fx?: (rgba: Uint8Array) => Uint8Array) => {
    const p = buildPlate(px, c, rows, s);
    const rgba = p.base.slice();
    return fieldData(p, rgba, s, fx?.(rgba));
  };
  // A dark painting reads best as light letters on dark paper.
  const night: Settings = { ...base, paper: "dark", invert: true, contrast: base.contrast * 1.35 };
  const colour = mk({ ...night, ink: "colour" });
  return {
    mono: mk(night),
    colour,
    light: mk({ ...base, ink: "colour" }),
    neon: mk({ ...base, ink: "colour", paper: "dark", invert: true, cutoff: 0.18 }, (rgba) => {
      const f = new Uint8Array(c * rows);
      for (let i = 0; i < f.length; i++) if (rgba[i * 4 + 3] > 150) f[i] = 1;
      return f;
    }),
    led: (t) => ledData(colour, t),
  };
}

const $ = (id: string) => document.getElementById(id)!;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const mix = (a: string, b: string, k: number) => {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const c = [0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * clamp(k)));
  return `rgb(${c.join(",")})`;
};

// ── the words on screen, per scene ─────────────────────────────────────────
type Lines = { at: number; until: number; lines: string[]; italicLast?: boolean; size: number };
const HEADS: Lines[] = [
  { at: 1.0, until: 3.05, lines: ["Pictures,", "set in", "loose type."], italicLast: true, size: 150 },
  { at: 3.35, until: 8.05, lines: ["Any picture,", "in any light."], italicLast: true, size: 128 },
  { at: 8.45, until: 12.25, lines: ["Move through it.", "The type scatters."], italicLast: true, size: 112 },
  { at: 12.65, until: 16.85, lines: ["A wallpaper that", "notices you."], italicLast: true, size: 118 },
];
const LABELS: { at: number; until: number; text: string }[] = [
  { at: 0.0, until: 0.95, text: "Fig. I — The painting" },
  { at: 1.0, until: 3.1, text: "Fig. II — Set in type" },
  { at: 3.4, until: 4.25, text: "III · In colour" },
  { at: 4.3, until: 4.95, text: "IV · Neon" },
  { at: 5.0, until: 6.15, text: "V · LED — amber" },
  { at: 6.2, until: 7.15, text: "VI · LED — green" },
  { at: 7.2, until: 8.1, text: "VII · LED — full colour" },
  { at: 9.0, until: 12.2, text: "Your cursor, a hand in the type" },
  { at: 13.0, until: 16.8, text: "Clock · weather · calendar — in lamps or letters" },
];

function words(t: number) {
  const head = $("head");
  const cur = HEADS.find((h) => t >= h.at - 0.01 && t < h.until + 0.35);
  if (!cur) {
    head.innerHTML = "";
    head.dataset.key = "";
  } else {
    const key = String(cur.at);
    if (head.dataset.key !== key) {
      head.dataset.key = key;
      head.innerHTML = cur.lines.map((l, i) => `<div class="line${cur.italicLast && i === cur.lines.length - 1 ? " it" : ""}" style="font-size:${cur.size}px">${l}</div>`).join("");
    }
    const out = clamp((t - cur.until) / 0.3);
    Array.from(head.children).forEach((el, i) => {
      const k = ease((t - cur.at - i * 0.14) / 0.5);
      (el as HTMLElement).style.opacity = String(k * (1 - out));
      (el as HTMLElement).style.transform = `translateY(${(1 - k) * 40 - out * 20}px)`;
    });
  }
  const lab = LABELS.find((l) => t >= l.at && t < l.until);
  const le = $("label");
  le.textContent = lab ? lab.text : "";
  le.style.opacity = lab ? String(clamp((t - lab.at) / 0.2) * clamp((lab.until - t) / 0.15)) : "0";
}

// ── the script ─────────────────────────────────────────────────────────────
let senate: Kit, king: Kit;
let wall: FieldData;
let field: FieldController | null = null;
let wallField: FieldController | null = null;
let deskOn = false;
const done = new Set<string>();
const once = (key: string, t: number, at: number, fn: () => void) => {
  if (t >= at && !done.has(key)) {
    done.add(key);
    fn();
  }
};

function stagePaper(t: number) {
  // Page colour follows the plate's paper, eased across each change.
  const keys: [number, string][] = [
    [0, PAPER],
    [0.45, "#0c0c0b"],
    [5.0, "#0a0a09"],
    [8.2, PAPER],
    [12.4, PAPER2],
    [17.0, PAPER],
  ];
  let c = PAPER;
  for (let i = 0; i < keys.length; i++) {
    if (t >= keys[i][0]) {
      const prev = i ? keys[i - 1][1] : PAPER;
      c = mix(prev, keys[i][1], (t - keys[i][0]) / 0.35);
    }
  }
  return c;
}

function frame(n: number) {
  const t = n / FPS;
  const stage = $("stage") as HTMLCanvasElement;

  // 1 — the painting, then its letters
  once("s1", t, 0.5, () => {
    field = createField(stage, senate.mono, { fit: "contain", listen: "none", assemble: true, radius: 70, force: 2.4, spring: 0.05 });
  });
  // 2 — any light
  once("colour", t, 3.4, () => field!.morph(senate.colour));
  once("neon", t, 4.3, () => field!.morph(senate.neon));
  once("amber", t, 5.0, () => field!.morph(senate.led("amber")));
  once("green", t, 6.2, () => field!.morph(senate.led("green")));
  once("full", t, 7.2, () => field!.morph(senate.led("full")));
  // 3 — the king, and a hand through the type
  once("s3", t, 8.2, () => {
    field!.destroy();
    stage.getContext("2d")!.clearRect(0, 0, stage.width, stage.height);
    field = null;
  });
  once("s3b", t, 8.55, () => {
    field = createField(stage, king.light, { fit: "contain", listen: "none", assemble: true, radius: 90, force: 2.6, spring: 0.05 });
  });
  if (field && t >= 9.3 && t < 11.9) {
    const d = king.light;
    const W = d.cols * d.cell;
    const H = d.rows * d.cell;
    const q = ((t - 9.3) / 2.6) * Math.PI * 2;
    field.setPointer(W * (0.5 + 0.34 * Math.sin(q)), H * (0.48 + 0.26 * Math.sin(q * 2)), true);
  }
  once("s3off", t, 11.9, () => field?.setPointer(-1e5, -1e5, false));
  // 4 — the desktop (widgets start early so the sky turns to rain on screen)
  once("desk", t, 4.8, () => {
    wallField = createField($("wall") as HTMLCanvasElement, wall, { fit: "cover", listen: "none", assemble: false, radius: 60 });
    runWidgets($("widgets"), [
      { id: "sky", type: "weather", x: 0.17, y: 0.52, size: 1.6, place: "Lahore, PK", look: "led", tint: "full" },
      { id: "clock", type: "clock", x: 0.8, y: 0.26, size: 1.9, look: "led", tint: "full" },
      { id: "cal", type: "calendar", x: 0.8, y: 0.74, size: 0.95, look: "led", tint: "full" },
    ], { preview: true, demo: true });
    deskOn = true;
  });
  if (wallField && t >= 14.2 && t < 15.9) {
    const W = wall.cols * wall.cell;
    const H = wall.rows * wall.cell;
    const k = (t - 14.2) / 1.7;
    wallField.setPointer(W * (0.3 + 0.45 * k), H * (0.7 - 0.35 * Math.sin(k * Math.PI)), true);
  }
  once("walloff", t, 15.9, () => wallField?.setPointer(-1e5, -1e5, false));

  // ── layout by time ──
  const bg = stagePaper(t);
  document.body.style.background = bg;
  const dark = t >= 0.45 && t < 8.2;
  document.body.style.color = dark ? PAPER : INK;

  // the painting over the stage, wiped away
  const paint = $("painting") as HTMLImageElement;
  const kingImg = $("king") as HTMLImageElement;
  const wipe = (from: number) => clamp((t - from) / 0.7);
  paint.style.opacity = t < 3 ? "1" : "0";
  paint.style.clipPath = `inset(${ease(wipe(0.5)) * 100}% 0 0 0)`;
  kingImg.style.opacity = t >= 8.2 && t < 10 ? "1" : "0";
  kingImg.style.clipPath = `inset(${ease(wipe(8.55)) * 100}% 0 0 0)`;

  const stageBox = $("stagebox");
  const inStage = t < 12.4;
  stageBox.style.opacity = String(inStage ? clamp((12.4 - t) / 0.25) : 0);
  // a dip through the paper between the painting scenes
  stageBox.style.transform = `scale(${1 + (t > 8.2 && t < 8.55 ? 0 : 0)})`;

  const desk = $("desk");
  desk.style.opacity = String(deskOn && t >= 12.4 ? ease((t - 12.4) / 0.5) * clamp((17 - t) / 0.3) : 0);
  desk.style.transform = `translateY(${(1 - ease((t - 12.4) / 0.6)) * 60}px)`;

  // the cursor ring in scene 3
  const ring = $("ring");
  if (t >= 9.3 && t < 11.9) {
    const q = ((t - 9.3) / 2.6) * Math.PI * 2;
    const r = stage.getBoundingClientRect();
    const d = king.light;
    const s = Math.min(r.width / (d.cols * d.cell), r.height / (d.rows * d.cell));
    const ox = r.left + (r.width - d.cols * d.cell * s) / 2;
    const oy = r.top + (r.height - d.rows * d.cell * s) / 2;
    ring.style.opacity = "1";
    ring.style.transform = `translate(${ox + d.cols * d.cell * s * (0.5 + 0.34 * Math.sin(q)) - 34}px, ${oy + d.rows * d.cell * s * (0.48 + 0.26 * Math.sin(q * 2)) - 34}px)`;
  } else ring.style.opacity = "0";

  // 5 — outro
  const outro = $("outro");
  const o = (a: number) => ease((t - a) / 0.6);
  outro.style.opacity = t >= 17 ? "1" : "0";
  (outro.children[0] as HTMLElement).style.cssText = `opacity:${o(17.1)};transform:translateY(${(1 - o(17.1)) * 50}px)`;
  (outro.children[1] as HTMLElement).style.cssText = `opacity:${o(17.55)};transform:translateY(${(1 - o(17.55)) * 30}px)`;
  (outro.children[2] as HTMLElement).style.cssText = `opacity:${o(18.0)}`;
  (outro.children[3] as HTMLElement).style.cssText = `opacity:${o(18.3)}`;

  words(t);
}

declare global {
  interface Window {
    __step(ms: number): void;
    __frame(n: number): void;
    __ready: Promise<void>;
  }
}

let at = 0;
window.__frame = (n: number) => {
  // Two engine steps per video frame, so the physics runs at 60 Hz.
  while (at <= n) {
    frame(at);
    window.__step(1000 / FPS / 2);
    window.__step(1000 / FPS / 2);
    at++;
  }
};

window.__ready = (async () => {
  [senate, king] = await Promise.all([
    kit("samples/senate.jpg", "friends, romans, countrymen, lend me your ears — ", 92),
    kit("samples/mosaic.jpg", "alexander, son of philip, king of macedon — ", 96, 1.9, 0.22),
  ]);
  const img = await loadImage("samples/lighthouse.jpg");
  const s: Settings = { ...DEFAULTS, format: "desktop", cols: 150, paper: "dark", contrast: 1.7, cutoff: 0.34, text: "keep the light burning — ", face: "mono" };
  const g = gridFor(s, { w: img.naturalWidth, h: img.naturalHeight * 0.93 });
  const p = buildPlate(sample(img, g.cols, g.rows, 0.07), g.cols, g.rows, s);
  wall = fieldData(p, p.base.slice(), s);
  await Promise.all(['400 100px "Libre Caslon Display"', 'italic 400 100px "Libre Caslon Text"', '400 100px "Libre Caslon Text"', '400 20px "Courier Prime"', '700 20px "Courier Prime"'].map((f) => document.fonts.load(f)));
  await document.fonts.ready;
  await Promise.all([($("painting") as HTMLImageElement).decode(), ($("king") as HTMLImageElement).decode()]);
})();
