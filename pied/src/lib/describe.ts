import type { FieldData } from "./field";

// Words for a plate, for people who hear the page instead of seeing it: what
// it is, how many letters, what colours the ink and paint are, and where the
// picture sits. Read out by screen readers as the canvas's label.

const NAMES: [string, number][] = [
  ["red", 0],
  ["orange", 28],
  ["gold", 45],
  ["yellow", 58],
  ["green", 120],
  ["teal", 175],
  ["blue", 220],
  ["violet", 270],
  ["pink", 320],
  ["red", 360],
];

function colourName(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 510;
  const sat = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
  if (sat < 0.22) return l < 0.25 ? "black" : l > 0.8 ? "white" : "grey";
  let h = 0;
  const d = max - min;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  let best = NAMES[0];
  for (const n of NAMES) if (Math.abs(n[1] - h) < Math.abs(best[1] - h)) best = n;
  return best[0];
}

const list = (a: string[]) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);

export function describePlate(d: FieldData, title: string) {
  const n = d.cols * d.rows;
  const counts = new Map<string, number>();
  let letters = 0;
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i++) {
    const a = d.rgba[i * 4 + 3];
    const ch = typeof d.ch === "string" ? d.ch[i] : d.ch[i];
    if (!a || !ch || ch === " ") continue;
    letters++;
    sx += i % d.cols;
    sy += Math.floor(i / d.cols);
    const name = colourName(d.rgba[i * 4], d.rgba[i * 4 + 1], d.rgba[i * 4 + 2]);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  if (!letters) return `${title}: an empty plate.`;
  const colours = [...counts.entries()].filter(([, c]) => c / letters > 0.04).sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, 3);
  const cx = sx / letters / d.cols;
  const cy = sy / letters / d.rows;
  const across = cx < 0.4 ? "left" : cx > 0.6 ? "right" : "";
  const down = cy < 0.4 ? "top" : cy > 0.6 ? "bottom" : "";
  const where = across || down ? `towards the ${[down, across].filter(Boolean).join(" ")}` : "in the middle";
  const dark = parseInt(d.paper.slice(1, 3), 16) < 90;
  const fx = d.fx ? { neon: 0, foil: 0 } : null;
  if (d.fx && fx) for (let i = 0; i < n; i++) if (d.fx[i] === 1) fx.neon++; else if (d.fx[i] > 1) fx.foil++;
  const finish = fx && fx.neon > letters * 0.03 ? ", some of it glowing neon" : fx && fx.foil > letters * 0.03 ? ", some of it in metal foil" : "";
  return `${title}: a picture set in ${letters.toLocaleString("en")} letters, in ${list(colours) || "ink"}${finish}, on ${dark ? "dark" : "light"} paper, sitting ${where}. Moving the cursor through it scatters the letters.`;
}
