import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
const mode = process.argv[2] || "stills";
const OUT = "/tmp/claude-0/vid/frames/";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
const errs = []; p.on("pageerror", e => errs.push(String(e))); p.on("console", m => m.type() === "error" && errs.push(m.text()));
await p.goto("http://localhost:8765/index.html", { waitUntil: "load" });
await p.evaluate(() => window.__ready);
const TOTAL = 630;
const want = mode === "stills" ? [0, 15, 30, 45, 75, 105, 120, 140, 160, 180, 200, 230, 250, 262, 280, 310, 330, 360, 390, 420, 450, 470, 500, 520, 540, 560, 600, 629] : [...Array(TOTAL).keys()];
for (const n of want) {
  await p.evaluate((n) => window.__frame(n), n);
  await p.screenshot({ path: `${OUT}${mode === "stills" ? "s" : "f"}${String(n).padStart(4, "0")}.jpg`, type: "jpeg", quality: 93 });
}
console.log("done", want.length, "errors", errs.slice(0, 5));
await b.close();
