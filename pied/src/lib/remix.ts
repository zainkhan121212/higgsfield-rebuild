import type { FieldData } from "./field";

/**
 * A saved plate back as a picture, so it can be set again: one pixel per
 * letter, its ink (paint included) laid over the paper, then enlarged
 * smoothly so the press samples tones, not blocks.
 */
export function plateImage(d: FieldData, scale = 8) {
  const small = document.createElement("canvas");
  small.width = d.cols;
  small.height = d.rows;
  const g = small.getContext("2d")!;
  const img = g.createImageData(d.cols, d.rows);
  const pr = parseInt(d.paper.slice(1, 3), 16);
  const pg = parseInt(d.paper.slice(3, 5), 16);
  const pb = parseInt(d.paper.slice(5, 7), 16);
  for (let i = 0, n = d.cols * d.rows; i < n; i++) {
    const a = d.rgba[i * 4 + 3] / 255;
    img.data[i * 4] = Math.round(d.rgba[i * 4] * a + pr * (1 - a));
    img.data[i * 4 + 1] = Math.round(d.rgba[i * 4 + 1] * a + pg * (1 - a));
    img.data[i * 4 + 2] = Math.round(d.rgba[i * 4 + 2] * a + pb * (1 - a));
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const big = document.createElement("canvas");
  big.width = d.cols * scale;
  big.height = d.rows * scale;
  const b = big.getContext("2d")!;
  b.imageSmoothingEnabled = true;
  b.imageSmoothingQuality = "high";
  b.drawImage(small, 0, 0, big.width, big.height);
  return big.toDataURL("image/png");
}
