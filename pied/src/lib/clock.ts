import type { FieldData } from "./field";

// The clock: the time itself, set in type. The numerals are drawn large on a
// small offscreen canvas, and wherever they have ink a letter is printed.
// The letters spell the time out in words ("twenty past nine"), and the
// paper turns dark between seven in the evening and seven in the morning.
//
// Like createField, this is self-contained (no imports, no outer scope),
// because the exported wallpaper embeds `clockPlate.toString()` and builds a
// fresh plate every minute, offline.

export type ClockOptions = {
  cols: number;
  rows: number;
  cell: number;
  font: string;
  weight: number;
  /** 24-hour numerals instead of 12-hour */
  h24?: boolean;
  /** force the paper: otherwise light by day, dark by night */
  paper?: "light" | "dark";
};

export function clockPlate(now: Date, o: ClockOptions): FieldData {
  const cols = o.cols;
  const rows = o.rows;
  const N = cols * rows;
  const h = now.getHours();
  const m = now.getMinutes();
  const night = o.paper ? o.paper === "dark" : h < 7 || h >= 19;
  const paper = night ? "#0c0c0b" : "#f4f3ee";
  const ink = night ? [240, 238, 230] : [17, 17, 16];

  const NUM = ["twelve", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven"];
  const MIN = ["", "five past", "ten past", "quarter past", "twenty past", "twenty-five past", "half past", "twenty-five to", "twenty to", "quarter to", "ten to", "five to"];
  const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const five = Math.round(m / 5) % 12;
  const hourWord = NUM[(h + (Math.round(m / 5) > 6 ? 1 : 0)) % 12];
  const phrase = (five === 0 ? hourWord + " o'clock" : MIN[five] + " " + hourWord) + " · " + DAYS[now.getDay()] + " · ";

  // Draw the numerals at grid resolution, then read where the ink is.
  const c = document.createElement("canvas");
  c.width = cols;
  c.height = rows;
  const x = c.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
  const hh = o.h24 ? h : h % 12 || 12;
  const text = (o.h24 && hh < 10 ? "0" : "") + hh + ":" + (m < 10 ? "0" : "") + m;
  let size = rows * 0.72;
  x.font = "700 " + size + "px Georgia, 'Times New Roman', serif";
  const w = x.measureText(text).width;
  if (w > cols * 0.9) {
    size = (size * cols * 0.9) / w;
    x.font = "700 " + size + "px Georgia, 'Times New Roman', serif";
  }
  x.fillStyle = "#000";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(text, cols / 2, rows * 0.5);
  const px = x.getImageData(0, 0, cols, rows).data;

  const rgba = new Uint8Array(N * 4);
  const ch: string[] = new Array(N);
  let li = 0;
  for (let i = 0; i < N; i++) {
    const a = px[i * 4 + 3] / 255;
    let letter = phrase[li % phrase.length];
    if (letter === " ") letter = "·";
    ch[i] = letter;
    if (a < 0.35) continue;
    li++;
    rgba[i * 4] = ink[0];
    rgba[i * 4 + 1] = ink[1];
    rgba[i * 4 + 2] = ink[2];
    rgba[i * 4 + 3] = Math.round(255 * (0.45 + 0.55 * a));
  }
  return { cols: cols, rows: rows, cell: o.cell, ch: ch, rgba: rgba, paper: paper, font: o.font, weight: o.weight };
}
