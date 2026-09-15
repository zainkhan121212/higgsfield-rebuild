// Warms every generated still referenced by the landing page so first paint
// on production is instant. Usage: node scripts/warm-landing.mjs [baseUrl]
const base = process.argv[2] || "http://localhost:3000";
const html = await (await fetch(base + "/")).text();
const urls = [...new Set(html.match(/https:\/\/image\.pollinations\.ai\/prompt\/[^"'\s<>]+/g) || [])].map((u) => u.replace(/&amp;/g, "&"));
console.log(`${urls.length} stills to warm`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = 0;
for (const u of urls) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    const t0 = Date.now();
    try {
      const res = await fetch(u);
      if (res.status === 429 || res.status >= 500) throw new Error(String(res.status));
      await res.arrayBuffer();
      ok++;
      console.log(`ok ${((Date.now() - t0) / 1000).toFixed(1)}s ${decodeURIComponent(u.split("/prompt/")[1]).slice(0, 50)}`);
      break;
    } catch (e) {
      console.log(`retry ${e.message}`);
      await sleep(5000 * attempt);
    }
  }
  await sleep(1200);
}
console.log(`done ${ok}/${urls.length}`);
