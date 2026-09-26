import { capability, type Downloads } from "./claude";
import { createField, type FieldData } from "./field";

// Everything a plate can leave the site as. All of it is built in the
// browser; nothing is uploaded.

function toBase64(bytes: Uint8Array) {
  let s = "";
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CH)));
  return btoa(s);
}

// JSON is not script-safe on its own: "</script>" inside a string would end
// the element. Escaping "<" makes any string inert.
const scriptSafe = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

export type WallpaperOptions = {
  title: string;
  radius: number;
  force: number;
  spring: number;
  drift: boolean;
  /** "contain" shows the whole picture on any screen; "cover" fills it and crops */
  fit: "contain" | "cover";
};

/**
 * A single, self-contained HTML file: the plate's data inline and the same
 * engine the site runs (`createField.toString()`), so the wallpaper behaves
 * exactly like the preview. No network, no fonts to fetch.
 */
export function wallpaperHtml(d: FieldData, w: WallpaperOptions) {
  const meta = { cols: d.cols, rows: d.rows, cell: d.cell, ch: d.ch, paper: d.paper, font: d.font, weight: d.weight };
  const hasFx = !!d.fx && d.fx.some((v) => v !== 0);
  const opts = { fit: w.fit, listen: "window", assemble: true, radius: w.radius, force: w.force, spring: w.spring, drift: w.drift };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${w.title.replace(/[<>&"]/g, "")} — Pied</title>
<style>
html,body{margin:0;height:100%;overflow:hidden;background:${d.paper}}
canvas{display:block;width:100vw;height:100vh;touch-action:none}
</style>
</head>
<body>
<canvas id="pied" aria-label="${w.title.replace(/[<>&"]/g, "")}, set in type"></canvas>
<script>
(function () {
  var D = ${scriptSafe(meta)};
  var bin = atob(${scriptSafe(toBase64(d.rgba))});
  var rgba = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) rgba[i] = bin.charCodeAt(i);
  D.rgba = rgba;${
    hasFx
      ? `
  var fxb = atob(${scriptSafe(toBase64(d.fx!))});
  var fx = new Uint8Array(fxb.length);
  for (var k = 0; k < fxb.length; k++) fx[k] = fxb.charCodeAt(k);
  D.fx = fx;`
      : ""
  }
  var createField = (${createField.toString()});
  var o = ${scriptSafe(opts)};
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { o.mode = "still"; o.assemble = false; o.drift = false; }
  createField(document.getElementById("pied"), D, o);
})();
</script>
</body>
</html>
`;
}

// ── zip (store only) ─────────────────────────────────────────────────────
// Enough of the format for a handful of files; saves a dependency.

let CRC: Uint32Array | null = null;
function crc32(buf: Uint8Array) {
  if (!CRC) {
    CRC = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function zip(files: { name: string; data: Uint8Array }[]) {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  for (const f of files) {
    const name = enc.encode(f.name);
    const crc = crc32(f.data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // utf-8 names
    local.setUint16(8, 0, true); // stored
    local.setUint16(10, dosTime, true);
    local.setUint16(12, dosDate, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, f.data.length, true);
    local.setUint32(22, f.data.length, true);
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true);
    parts.push(new Uint8Array(local.buffer), name, f.data);

    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true);
    cen.setUint16(6, 20, true);
    cen.setUint16(8, 0x0800, true);
    cen.setUint16(10, 0, true);
    cen.setUint16(12, dosTime, true);
    cen.setUint16(14, dosDate, true);
    cen.setUint32(16, crc, true);
    cen.setUint32(20, f.data.length, true);
    cen.setUint32(24, f.data.length, true);
    cen.setUint16(28, name.length, true);
    cen.setUint32(42, offset, true);
    central.push(new Uint8Array(cen.buffer), name);
    offset += 30 + name.length + f.data.length;
  }
  const cenSize = central.reduce((n, p) => n + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cenSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)] as BlobPart[], { type: "application/zip" });
}

// ── stills ───────────────────────────────────────────────────────────────

export function renderStill(d: FieldData, w: number, h: number, fit: "contain" | "cover" | "auto") {
  const canvas = document.createElement("canvas");
  const f = createField(canvas, d, { size: { w, h }, fit, mode: "still", listen: "none" });
  f.destroy();
  return canvas;
}

export function canvasBlob(c: HTMLCanvasElement, type = "image/png", q?: number) {
  return new Promise<Blob>((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), type, q));
}

export async function wallpaperKit(d: FieldData, w: WallpaperOptions) {
  const enc = new TextEncoder();
  const html = wallpaperHtml(d, w);
  const preview = new Uint8Array(await (await canvasBlob(renderStill(d, 1280, 720, w.fit), "image/jpeg", 0.88)).arrayBuffer());
  const lively = {
    AppVersion: "2.0.0.0",
    Title: w.title,
    Thumbnail: "preview.jpg",
    Preview: "preview.jpg",
    Desc: "An interactive type wallpaper made with Pied. Move the cursor through it.",
    Author: "Pied",
    License: "",
    Contact: "",
    Type: 1, // web
    FileName: "index.html",
    Arguments: null,
    IsAbsolutePath: false,
  };
  const wallpaperEngine = {
    file: "index.html",
    preview: "preview.jpg",
    title: w.title,
    type: "web",
    description: "An interactive type wallpaper made with Pied.",
    general: { properties: {} },
  };
  const readme = [
    `${w.title} — a live type wallpaper made with Pied`,
    "",
    "WINDOWS · Lively Wallpaper (free, Microsoft Store)",
    "  1. Open Lively, drag this .zip onto the window (or + → choose file).",
    "  2. Settings → Wallpaper → Input: set to Mouse so the cursor reaches the letters.",
    "",
    "WINDOWS · Wallpaper Engine (Steam)",
    "  1. Unzip this folder.",
    "  2. Wallpaper Engine → Create Wallpaper → pick index.html, then Save.",
    "     (or copy the folder into …/wallpaper_engine/projects/myprojects)",
    "",
    "macOS · Plash (free, App Store)",
    "  1. Unzip, then Plash → Add Website → choose index.html.",
    "  2. Hold the menu-bar toggle for Browsing Mode to let the cursor reach the letters.",
    "",
    "ANYWHERE",
    "  Open index.html in a browser and press F11 / ⌃⌘F for fullscreen.",
    "",
  ].join("\r\n");
  return zip([
    { name: "index.html", data: enc.encode(html) },
    { name: "LivelyInfo.json", data: enc.encode(JSON.stringify(lively, null, 2)) },
    { name: "project.json", data: enc.encode(JSON.stringify(wallpaperEngine, null, 2)) },
    { name: "preview.jpg", data: preview },
    { name: "README.txt", data: enc.encode(readme) },
  ]);
}

// ── motion ───────────────────────────────────────────────────────────────

export function recordingMime() {
  if (typeof MediaRecorder === "undefined") return null;
  const options = ["video/mp4;codecs=avc1", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
  return options.find((m) => MediaRecorder.isTypeSupported(m)) ?? null;
}

/**
 * Record a short clip: an invisible hand sweeps a figure-eight through the
 * type, then lets go so the letters settle — a loop-friendly ending.
 */
export function recordClip(
  d: FieldData,
  w: number,
  h: number,
  physics: { radius: number; force: number; spring: number },
  seconds: number,
  onProgress: (p: number) => void,
): Promise<{ blob: Blob; ext: string }> {
  const mime = recordingMime();
  if (!mime) return Promise.reject(new Error("This browser cannot record video."));
  const canvas = document.createElement("canvas");
  // Keep the canvas in the document (off-screen) so every browser keeps
  // painting it while it is captured.
  canvas.style.cssText = "position:fixed;left:-99999px;top:0;pointer-events:none";
  document.body.appendChild(canvas);
  const field = createField(canvas, d, { size: { w, h }, fit: "contain", listen: "none", assemble: true, ...physics });
  const W = d.cols * d.cell;
  const H = d.rows * d.cell;
  const stream = canvas.captureStream(60);
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 10_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  return new Promise((resolve, reject) => {
    let raf = 0;
    const start = performance.now();
    const total = seconds * 1000;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / total);
      onProgress(p);
      // hand sweeps between 15% and 75% of the clip
      if (p > 0.15 && p < 0.75) {
        const q = ((p - 0.15) / 0.6) * Math.PI * 2;
        field.setPointer(W * (0.5 + 0.36 * Math.sin(q)), H * (0.5 + 0.3 * Math.sin(q * 2)), true);
      } else if (p >= 0.75) {
        field.setPointer(-1e5, -1e5, false);
      }
      if (p < 1) raf = requestAnimationFrame(tick);
      else rec.stop();
    };
    rec.onstop = () => {
      cancelAnimationFrame(raf);
      field.destroy();
      canvas.remove();
      const type = mime.split(";")[0];
      resolve({ blob: new Blob(chunks, { type }), ext: type.includes("mp4") ? "mp4" : "webm" });
    };
    rec.onerror = () => {
      field.destroy();
      canvas.remove();
      reject(new Error("Recording failed."));
    };
    rec.start(250);
    raf = requestAnimationFrame(tick);
  });
}

/**
 * Save a file. Inside a claude.ai artifact the frame blocks page-started
 * downloads, so the file goes through the viewer's `downloads` capability
 * (the viewer confirms it); everywhere else a plain link click does it.
 * Resolves false when the viewer declined.
 */
export async function download(blob: Blob, name: string): Promise<boolean> {
  const dl = await capability<Downloads>("downloads");
  if (dl) {
    try {
      await dl.save({ filename: name, data: blob });
      return true;
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === "declined") return false;
      throw new Error("This view can't save files.");
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}

export function slug(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "pied"
  );
}
