import type { FieldData } from "./field";

// One wire format for a plate: saved to the library, embedded in wallpaper
// files, sent to the share page. Bytes travel as base64.

export type Packed = { cols: number; rows: number; cell: number; ch: string; paper: string; font: string; weight: number; rgba: string; fx: string };

export function toBase64(bytes: Uint8Array) {
  let s = "";
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CH)));
  return btoa(s);
}

export function fromBase64(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function pack(d: FieldData): Packed {
  return {
    cols: d.cols,
    rows: d.rows,
    cell: d.cell,
    ch: typeof d.ch === "string" ? d.ch : d.ch.join(""),
    paper: d.paper,
    font: d.font,
    weight: d.weight,
    rgba: toBase64(d.rgba),
    fx: d.fx && d.fx.some((v) => v !== 0) ? toBase64(d.fx) : "",
  };
}

export function unpack(p: Packed): FieldData {
  return { cols: p.cols, rows: p.rows, cell: p.cell, ch: p.ch, paper: p.paper, font: p.font, weight: p.weight, rgba: fromBase64(p.rgba), fx: p.fx ? fromBase64(p.fx) : undefined };
}
