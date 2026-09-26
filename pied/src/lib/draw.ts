import { capability, type Sample } from "./claude";

// Inside a claude.ai artifact the page can't reach an image model (its
// network is sealed), but it can ask Claude. Claude draws the subject as a
// bold black-on-white SVG, which is exactly what prints best as type.

const LOOKS: Record<string, string> = {
  photo: "a bold, recognisable black silhouette with a few interior details cut out in white",
  silhouette: "a stark, solid black silhouette with crisp edges and no interior detail",
  ink: "a bold black ink illustration with thick strokes and solid black fills",
  engraving: "a black-and-white illustration with dense parallel hatching for shadows, like an old engraving",
  colour: "a flat-colour poster illustration with a few strong, saturated colours and solid shapes",
};

export async function drawWithClaude(prompt: string, look: string, w: number, h: number): Promise<Blob> {
  const sample = await capability<Sample>("sample");
  if (!sample) throw new Error("Drawing from words isn't available in this view. Upload a picture or pick a sample.");
  const ask = [
    `Draw this as an SVG image: "${prompt}".`,
    `Style: ${LOOKS[look] ?? LOOKS.photo}, on a plain white background.`,
    `Use viewBox="0 0 ${w} ${h}" with width="${w}" height="${h}", and fill the frame: the subject should cover most of the canvas.`,
    "Make it recognisable at a glance from its outline alone. Use only <rect>, <circle>, <ellipse>, <polygon>, <path> and <g>; no text, no images, no filters, no gradients, no scripts.",
    "Reply with only the SVG, starting with <svg and ending with </svg>.",
  ].join("\n");
  let text: string;
  try {
    ({ text } = await sample(ask, { modelTier: "default", cache: false }));
  } catch (e) {
    const code = (e as { code?: string })?.code;
    if (code === "not_granted" || code === "sampling_disabled") throw new Error("Claude isn't allowed to draw here. Upload a picture or pick a sample.");
    if (code === "rate_limited") throw new Error("Too many drawings at once. Wait a moment and try again.");
    if (code === "refused") throw new Error("Claude won't draw that one. Try describing something else.");
    throw new Error("The drawing didn't come through. Try again.");
  }
  const m = /<svg[\s\S]*<\/svg>/i.exec(text);
  if (!m) throw new Error("The drawing came back empty. Try again, or describe it more simply.");
  // Drawn through <img>, an SVG can't run script or fetch anything, but strip
  // the obvious hooks anyway so nothing surprising rides along.
  let svg = m[0]
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/(href\s*=\s*)("|')(?!#)[^"']*\2/gi, "");
  if (!/\swidth=/.test(svg.slice(0, svg.indexOf(">")))) svg = svg.replace(/<svg/i, `<svg width="${w}" height="${h}"`);
  if (!/xmlns=/.test(svg)) svg = svg.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  return new Blob([svg], { type: "image/svg+xml" });
}
