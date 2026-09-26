// Scripted paint for the marketing plates: one brush stroke, one burst of
// spray and one pass of the eraser — the three things the press can do.
export function demoPaint(rgba: Uint8Array, cols: number, rows: number) {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = (r * cols + c) * 4;
      const u = c / cols;
      const v = r / rows;
      const stroke = 0.7 + 0.1 * Math.sin(u * Math.PI * 2.1 + 0.4);
      const sd = Math.hypot(u - 0.26, (v - 0.3) * (rows / cols));
      const ed = Math.hypot(u - 0.78, (v - 0.22) * (rows / cols));
      if (Math.abs(v - stroke) < 0.045 + 0.015 * Math.sin(u * 19)) {
        rgba[i] = 200;
        rgba[i + 1] = 52;
        rgba[i + 2] = 30;
        rgba[i + 3] = 255;
      } else if (sd < 0.2 && rnd() < 0.5 * (1 - sd / 0.2)) {
        rgba[i] = 36;
        rgba[i + 1] = 62;
        rgba[i + 2] = 150;
        rgba[i + 3] = 235;
      } else if (ed < 0.12) {
        rgba[i + 3] = 0;
      }
    }
  }
}
