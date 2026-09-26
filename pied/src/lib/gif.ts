// A small animated-GIF writer, so a plate can loop in a chat or on an old
// phone without a video player. No dependency: one shared palette (plates are
// a few inks on paper, so 256 colours is plenty), LZW, looping forever.

type Frame = Uint8ClampedArray; // RGBA

function palette(frames: Frame[]) {
  // Popularity over 15-bit colour: count, keep the 256 most used.
  const counts = new Uint32Array(32768);
  for (const f of frames) for (let i = 0; i < f.length; i += 16) counts[((f[i] >> 3) << 10) | ((f[i + 1] >> 3) << 5) | (f[i + 2] >> 3)]++;
  const keys = Array.from(counts.keys())
    .filter((k) => counts[k])
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, 256);
  const pal = new Uint8Array(256 * 3);
  keys.forEach((k, i) => {
    pal[i * 3] = ((k >> 10) & 31) * 8 + 4;
    pal[i * 3 + 1] = ((k >> 5) & 31) * 8 + 4;
    pal[i * 3 + 2] = (k & 31) * 8 + 4;
  });
  return { pal, n: Math.max(2, keys.length) };
}

function indexer(pal: Uint8Array, n: number) {
  const cache = new Int16Array(32768).fill(-1);
  return (r: number, g: number, b: number) => {
    const k = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    let v = cache[k];
    if (v >= 0) return v;
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < n; i++) {
      const dr = pal[i * 3] - r;
      const dg = pal[i * 3 + 1] - g;
      const db = pal[i * 3 + 2] - b;
      const d = dr * dr * 2 + dg * dg * 4 + db * db * 3;
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    v = cache[k] = best;
    return v;
  };
}

class Bytes {
  buf = new Uint8Array(1 << 20);
  len = 0;
  byte(b: number) {
    if (this.len >= this.buf.length) {
      const nb = new Uint8Array(this.buf.length * 2);
      nb.set(this.buf);
      this.buf = nb;
    }
    this.buf[this.len++] = b;
  }
  word(w: number) {
    this.byte(w & 255);
    this.byte((w >> 8) & 255);
  }
  str(s: string) {
    for (let i = 0; i < s.length; i++) this.byte(s.charCodeAt(i));
  }
}

function lzw(out: Bytes, px: Uint8Array, minSize: number) {
  out.byte(minSize);
  const clear = 1 << minSize;
  const eoi = clear + 1;
  let size = minSize + 1;
  let next = eoi + 1;
  let dict = new Map<number, number>();
  const block: number[] = [];
  let acc = 0;
  let bits = 0;
  const emit = (code: number) => {
    acc |= code << bits;
    bits += size;
    while (bits >= 8) {
      block.push(acc & 255);
      acc >>>= 8;
      bits -= 8;
      if (block.length === 255) {
        out.byte(255);
        for (const b of block) out.byte(b);
        block.length = 0;
      }
    }
  };
  emit(clear);
  let prefix = px[0];
  for (let i = 1; i < px.length; i++) {
    const k = px[i];
    const key = (prefix << 8) | k;
    const hit = dict.get(key);
    if (hit !== undefined) {
      prefix = hit;
      continue;
    }
    emit(prefix);
    if (next < 4096) {
      dict.set(key, next++);
      if (next > 1 << size && size < 12) size++;
    } else {
      emit(clear);
      dict = new Map();
      size = minSize + 1;
      next = eoi + 1;
    }
    prefix = k;
  }
  emit(prefix);
  emit(eoi);
  if (bits > 0) block.push(acc & 255);
  if (block.length) {
    out.byte(block.length);
    for (const b of block) out.byte(b);
  }
  out.byte(0);
}

export function encodeGif(frames: Frame[], w: number, h: number, delayMs: number) {
  const { pal, n } = palette(frames);
  const index = indexer(pal, n);
  const out = new Bytes();
  out.str("GIF89a");
  out.word(w);
  out.word(h);
  out.byte(0xf7); // global table, 8 bits, 256 entries
  out.byte(0);
  out.byte(0);
  for (let i = 0; i < 256 * 3; i++) out.byte(pal[i]);
  // Loop forever.
  out.byte(0x21);
  out.byte(0xff);
  out.byte(11);
  out.str("NETSCAPE2.0");
  out.byte(3);
  out.byte(1);
  out.word(0);
  out.byte(0);
  const px = new Uint8Array(w * h);
  const delay = Math.max(2, Math.round(delayMs / 10));
  for (const f of frames) {
    out.byte(0x21);
    out.byte(0xf9);
    out.byte(4);
    out.byte(0);
    out.word(delay);
    out.byte(0);
    out.byte(0);
    out.byte(0x2c);
    out.word(0);
    out.word(0);
    out.word(w);
    out.word(h);
    out.byte(0);
    for (let i = 0, j = 0; i < px.length; i++, j += 4) px[i] = index(f[j], f[j + 1], f[j + 2]);
    lzw(out, px, 8);
  }
  out.byte(0x3b);
  return new Blob([out.buf.slice(0, out.len)], { type: "image/gif" });
}
