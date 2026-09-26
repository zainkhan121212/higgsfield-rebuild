// Records the real Pied app in use, as smooth video clips: CDP screencast
// frames with their own timestamps, turned into constant-frame-rate MP4s.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const FF = "/tmp/claude-0/vid/node_modules/ffmpeg-static/ffmpeg";
const OUT = "/tmp/claude-0/reel/public/clips/";
const TMP = "/tmp/claude-0/reel/tmp/";
fs.mkdirSync(OUT, { recursive: true });
const B = "http://localhost:3100";
const only = process.argv[2];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--ignore-certificate-errors"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1.5 });
const page = await ctx.newPage();
await page.addInitScript(() => {
  try {
    localStorage.removeItem("pied:desk");
    localStorage.setItem("pied:sound", "off");
  } catch {}
});
const hideDev = () => page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
const markers = {};

async function record(name, fn) {
  if (only && only !== name) return;
  const dir = TMP + name + "/";
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", async (f) => {
    const file = dir + String(frames.length).padStart(5, "0") + ".jpg";
    fs.writeFileSync(file, Buffer.from(f.data, "base64"));
    frames.push({ file, t: f.metadata.timestamp });
    cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, everyNthFrame: 1 });
  const t0 = Date.now() / 1000;
  const mark = (k) => ((markers[name] ??= {})[k] = +(Date.now() / 1000 - t0).toFixed(2));
  await fn(mark);
  await page.waitForTimeout(300);
  await cdp.send("Page.stopScreencast");
  await cdp.detach();
  // Hold each frame until the next one arrived: variable-rate frames to a 30 fps clip.
  const start = frames[0].t;
  const lines = [];
  for (let i = 0; i < frames.length; i++) {
    const d = i + 1 < frames.length ? frames[i + 1].t - frames[i].t : 0.1;
    lines.push(`file '${frames[i].file}'`, `duration ${Math.max(0.001, d).toFixed(4)}`);
  }
  lines.push(`file '${frames[frames.length - 1].file}'`);
  fs.writeFileSync(dir + "list.txt", lines.join("\n"));
  execFileSync(FF, ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", dir + "list.txt", "-vf", "fps=30,scale=1920:-2,format=yuv420p", "-c:v", "libx264", "-crf", "16", "-preset", "fast", OUT + name + ".mp4"]);
  markers[name] = { ...(markers[name] || {}), offset: +(start - t0).toFixed(2), frames: frames.length };
  console.log(name, frames.length, "frames", JSON.stringify(markers[name]));
}

async function glide(x, y, steps = 20, wait = 12) {
  const from = await page.evaluate(() => [window.__mx || 640, window.__my || 400]);
  for (let i = 1; i <= steps; i++) {
    const k = i / steps;
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    await page.mouse.move(from[0] + (x - from[0]) * e, from[1] + (y - from[1]) * e);
    await page.waitForTimeout(wait);
  }
  await page.evaluate(([x, y]) => ((window.__mx = x), (window.__my = y)), [x, y]);
}
async function clickOn(loc) {
  const b = await loc.boundingBox();
  await glide(b.x + b.width / 2, b.y + b.height / 2, 14);
  await page.waitForTimeout(120);
  await loc.click();
  await page.waitForTimeout(250);
}
async function sweep(box, secs = 2.5) {
  const n = Math.round(secs * 40);
  for (let i = 0; i <= n; i++) {
    const q = (i / n) * Math.PI * 2;
    await page.mouse.move(box.x + box.width * (0.5 + 0.34 * Math.sin(q)), box.y + box.height * (0.5 + 0.28 * Math.sin(q * 2)));
    await page.waitForTimeout(25);
  }
}
const stage = () => page.locator("canvas[role=img]").first();

// 1 · write a sentence, get a picture, set in type
await record("write", async (mark) => {
  await page.goto(B + "/make", { waitUntil: "networkidle" });
  await hideDev();
  await page.waitForTimeout(1200);
  const box = page.locator("textarea").first();
  await clickOn(box);
  mark("type");
  await page.keyboard.type("a lion's face in the dark, lit from one side", { delay: 55 });
  mark("typed");
  await clickOn(page.getByRole("button", { name: /Make the picture/ }));
  mark("asked");
  await page.waitForFunction(() => !document.body.innerText.includes("Composing") && !/Asking|Drawing|Making/.test(document.body.innerText), null, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(600);
  mark("arrived");
  await page.waitForTimeout(2600);
  mark("scatter");
  await sweep(await stage().boundingBox(), 2.4);
  mark("end");
});

// 2 · draw it
await record("draw", async (mark) => {
  await page.goto(B + "/make", { waitUntil: "networkidle" });
  await hideDev();
  await clickOn(page.getByRole("radio", { name: "Draw", exact: true }));
  const pad = await page.getByLabel(/Drawing pad/).boundingBox();
  mark("start");
  const cx = pad.x + pad.width / 2, cy = pad.y + pad.height / 2, R = pad.width * 0.3;
  // a heart, then a smile inside
  await page.mouse.move(cx, cy + R * 0.9);
  await page.mouse.down();
  for (let a = 0; a <= 90; a++) {
    const t = (a / 90) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    await page.mouse.move(cx + (x / 17) * R, cy + (y / 17) * R);
    await page.waitForTimeout(14);
  }
  await page.mouse.up();
  await page.waitForTimeout(700);
  await page.mouse.move(cx - R * 0.45, cy - R * 0.05);
  await page.mouse.down();
  for (let a = 0; a <= 24; a++) {
    await page.mouse.move(cx - R * 0.45 + (a / 24) * R * 0.9, cy - R * 0.05 + Math.sin((a / 24) * Math.PI) * R * 0.35);
    await page.waitForTimeout(16);
  }
  await page.mouse.up();
  mark("drawn");
  await page.waitForTimeout(1600);
  await sweep(await stage().boundingBox(), 1.6);
  mark("end");
});

// 3 · set the type, then light it
await record("set", async (mark) => {
  await page.goto(B + "/make", { waitUntil: "networkidle" });
  await hideDev();
  await page.getByRole("radio", { name: "Samples" }).click();
  await page.getByRole("button", { name: /Rose/ }).click();
  await page.waitForTimeout(1500);
  await clickOn(page.getByRole("button", { name: /^II/ }).first());
  mark("start");
  for (const f of ["Typewriter", "Serif", "Mono"]) {
    await clickOn(page.getByLabel("Typeface").getByRole("radio", { name: f, exact: true }));
    await page.waitForTimeout(700);
  }
  mark("faces");
  await clickOn(page.getByRole("radio", { name: "LED board" }));
  await page.waitForTimeout(900);
  for (const t of ["Green", "Red", "Full colour"]) {
    await clickOn(page.getByRole("radio", { name: t }));
    await page.waitForTimeout(900);
  }
  mark("end");
});

// 4 · paint
await record("paint", async (mark) => {
  await page.goto(B + "/make", { waitUntil: "networkidle" });
  await hideDev();
  await page.getByRole("radio", { name: "Samples" }).click();
  await page.getByRole("button", { name: /Portrait/ }).click();
  await page.waitForTimeout(1500);
  await clickOn(page.getByRole("button", { name: /^III/ }).first());
  const s = await stage().boundingBox();
  const stroke = async (pts, step = 10) => {
    await glide(s.x + s.width * pts[0][0], s.y + s.height * pts[0][1], 10);
    await page.mouse.down();
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      for (let k = 1; k <= step; k++) {
        await page.mouse.move(s.x + s.width * (ax + (bx - ax) * (k / step)), s.y + s.height * (ay + (by - ay) * (k / step)));
        await page.waitForTimeout(12);
      }
    }
    await page.mouse.up();
  };
  mark("brush");
  await stroke([[0.2, 0.3], [0.35, 0.22], [0.5, 0.3], [0.65, 0.22], [0.8, 0.3]], 12);
  await clickOn(page.getByRole("button", { name: /Spray/ }));
  mark("spray");
  await clickOn(page.getByRole("button", { name: /Prussian/ }).first()).catch(() => {});
  await stroke([[0.2, 0.75], [0.5, 0.82], [0.8, 0.75]], 14);
  await clickOn(page.getByRole("button", { name: /Word brush/ }));
  await page.locator("#word-brush").fill("PIED ");
  mark("words");
  await stroke([[0.15, 0.55], [0.85, 0.55]], 26);
  await clickOn(page.getByRole("radio", { name: "Neon" }));
  await clickOn(page.getByRole("button", { name: /Brush/ }).first());
  mark("neon");
  await stroke([[0.25, 0.45], [0.5, 0.4], [0.75, 0.45]], 14);
  await clickOn(page.getByRole("button", { name: /Stamp/ }));
  await clickOn(page.getByRole("radio", { name: "★" }));
  mark("stamp");
  for (const [x, y] of [[0.18, 0.12], [0.82, 0.12], [0.5, 0.93]]) {
    await glide(s.x + s.width * x, s.y + s.height * y, 10);
    await page.mouse.click(s.x + s.width * x, s.y + s.height * y);
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(800);
  mark("end");
});

// 5 · the desktop studio
await record("desk", async (mark) => {
  await page.goto(B + "/make", { waitUntil: "networkidle" });
  await hideDev();
  await clickOn(page.getByRole("button", { name: /^IV/ }).first());
  const studio = page.getByRole("application");
  await studio.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  mark("start");
  for (const n of ["Clock", "Weather", "Calendar", "Now playing"]) {
    await clickOn(page.getByRole("button", { name: new RegExp("\\+ " + n) }));
    await page.waitForTimeout(250);
  }
  mark("added");
  const b = await studio.boundingBox();
  const w = await page.locator("[data-widget]").first().boundingBox();
  await glide(w.x + w.width / 2, w.y + w.height / 2, 12);
  await page.mouse.down();
  await glide(b.x + b.width * 0.5, b.y + b.height * 0.42, 26, 16);
  await page.mouse.up();
  mark("dragged");
  for (const t of ["Green", "Colour"]) {
    await clickOn(page.getByRole("radio", { name: t }));
    await page.waitForTimeout(700);
  }
  await clickOn(page.getByRole("radio", { name: "Letters" }));
  await page.waitForTimeout(900);
  await clickOn(page.getByRole("radio", { name: "LED lamps" }));
  await page.waitForTimeout(700);
  mark("end");
});

// 6 · the front page: the hero, scattered by a hand
await record("hero", async (mark) => {
  await page.goto(B + "/", { waitUntil: "networkidle" });
  await hideDev();
  await page.waitForTimeout(2600);
  mark("start");
  const c = await page.locator("canvas").first().boundingBox();
  await sweep({ x: c.x + c.width * 0.45, y: c.y + c.height * 0.1, width: c.width * 0.55, height: c.height * 0.8 }, 2.6);
  mark("end");
});

fs.writeFileSync("/tmp/claude-0/reel/markers" + (only ? "-" + only : "") + ".json", JSON.stringify(markers, null, 2));
await browser.close();
