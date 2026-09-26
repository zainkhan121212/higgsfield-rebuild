// Builds Pied as a single self-contained page for publishing as a claude.ai
// artifact: the landing page and the press in one document, CSS and JS
// inline, sample pictures alongside. Usage: node scripts/artifact.mjs [outDir]
import { build } from "esbuild";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const out = path.resolve(process.argv[2] ?? path.join(root, "artifact"));
await fs.mkdir(path.join(out, "samples"), { recursive: true });

const js = await build({
  entryPoints: [path.join(root, "src/artifact/entry.tsx")],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  logLevel: "error",
  define: { "process.env.NODE_ENV": '"production"', "process.env.NEXT_PUBLIC_PIED_STATIC": '"1"' },
  alias: { "@": path.join(root, "src"), "next/link": path.join(root, "src/artifact/link.tsx") },
  plugins: [
    {
      // Sample pictures are published next to the page, so paths go relative.
      name: "relative-samples",
      setup(b) {
        b.onLoad({ filter: /src\/.*\.tsx?$/ }, async (a) => {
          const src = await fs.readFile(a.path, "utf8");
          return { contents: src.replaceAll('"/samples/', '"samples/'), loader: a.path.endsWith("x") ? "tsx" : "ts" };
        });
      },
    },
  ],
});
const bundle = js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

const cssSrc = await fs.readFile(path.join(root, "src/app/globals.css"), "utf8");
const css = (await postcss([tailwind({ base: root, optimize: true })]).process(cssSrc, { from: path.join(root, "src/app/globals.css") })).css;

const html = `<title>Pied Letterpress</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&display=swap">
<style>
:root{--font-caslon-display:"Libre Caslon Display";--font-caslon-text:"Libre Caslon Text";--font-courier:"Courier Prime";color-scheme:light}
body{font-size:16px;line-height:1.5}
${css}
</style>
<div id="pied-root"></div>
<script>${bundle}</script>
`;
await fs.writeFile(path.join(out, "index.html"), html);
for (const f of await fs.readdir(path.join(root, "public/samples"))) await fs.copyFile(path.join(root, "public/samples", f), path.join(out, "samples", f));
console.log(`wrote ${path.join(out, "index.html")} (${(html.length / 1024).toFixed(0)} KB)`);
