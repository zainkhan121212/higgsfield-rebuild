// The letter field: a picture set in type, where every letter is a particle on
// a spring. The pointer pushes letters away; the spring pulls them home.
//
// `createField` is deliberately self-contained — no imports, no outer-scope
// references, no syntax that needs a compiler helper — because the exported
// live wallpaper embeds `createField.toString()` verbatim. The app and the
// wallpaper therefore run the exact same code.
//
// Rendering strategy (this has to hold 60fps with ~20k letters at 4K):
//   · the settled picture is drawn once into an offscreen layer
//   · each frame blits that layer, then paints paper over the home cells of
//     the few letters that are moving and draws those letters where they are
//   · the physics only touches the "active" set: letters near the pointer
//     (found through the grid, not a full scan) and letters still returning
//   · the loop parks itself when nothing moves; a pointer move wakes it
//
// Paint finishes (fx, one byte per letter):
//   · 1 neon — drawn with a glow of its own colour, baked into the layer
//   · 2 foil — a metal leaf that catches the light: its shade is worked out
//     every frame from where the cursor (the lamp) is, so the sheen slides
//     across the letters as the cursor moves. Only foil letters are redrawn.

export type FieldData = {
  cols: number;
  rows: number;
  /** logical cell size; the grid is cols*cell × rows*cell logical px */
  cell: number;
  /** one character per cell, row-major */
  ch: string;
  /** r,g,b,a per cell; a = 0 means the cell is empty */
  rgba: Uint8Array;
  paper: string;
  /** CSS font-family stack */
  font: string;
  weight: number;
  /** optional finish per cell: 0 flat ink, 1 neon, 2 foil */
  fx?: Uint8Array;
};

export type FieldOptions = {
  /** how the plate maps onto the canvas box; "auto" covers when the shapes
   *  are close (a 16:9 plate on a 16:10 screen) and contains otherwise */
  fit?: "contain" | "cover" | "auto";
  radius?: number;
  force?: number;
  spring?: number;
  mode?: "scatter" | "paint" | "still";
  /** start with the letters thrown across the canvas and let them fly home */
  assemble?: boolean;
  /** when the pointer is idle, a slow invisible hand keeps disturbing the type */
  drift?: boolean;
  /** where pointer input comes from */
  listen?: "canvas" | "window" | "none";
  /** fixed pixel size (offscreen rendering) instead of measuring the box */
  size?: { w: number; h: number };
};

export type FieldController = {
  setMode(m: "scatter" | "paint" | "still"): void;
  setPhysics(p: { radius?: number; force?: number; spring?: number }): void;
  setPointer(x: number, y: number, on: boolean): void;
  setSpill(v: number): void;
  setDrift(on: boolean): void;
  toLogical(clientX: number, clientY: number): { x: number; y: number };
  /** the given cells changed colour/alpha in data.rgba */
  changed(cells: ArrayLike<number>): void;
  update(d: FieldData): void;
  render(): void;
  resize(): void;
  destroy(): void;
};

export function createField(canvas: HTMLCanvasElement, data: FieldData, opts: FieldOptions): FieldController {
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const layer = document.createElement("canvas");
  const lx = layer.getContext("2d") as CanvasRenderingContext2D;
  const o = opts || {};
  let mode = o.mode || "scatter";
  const fit = o.fit || "contain";
  let d = data;
  let cols = 0, rows = 0, cell = 0, N = 0, W = 0, H = 0, font = "";
  let R = 0, F = 0, K = 0;
  const DAMP = 0.84;
  let px = new Float32Array(0), py = px, vx = px, vy = px, sx = px, sy = px;
  let styles: string[] = [];
  let order = new Int32Array(0);
  let orderDirty = false;
  let active = new Int32Array(0), inAct = new Uint8Array(0), nAct = 0;
  let dpr = 1, s = 1, ox = 0, oy = 0;
  const pointer = { x: -1e5, y: -1e5, on: false };
  let raf = 0, running = false, dead = false, last = 0, spill = 0;
  let drift = !!o.drift, ghost = false, lastReal = Date.now();
  let foil = new Int32Array(0);
  const light = { x: 0, y: 0 };
  const foilCache: Record<string, string> = {};

  function hx(i: number) {
    return ((i % cols) + 0.5) * cell;
  }
  function hy(i: number) {
    return (Math.floor(i / cols) + 0.5) * cell;
  }
  function styleOf(i: number) {
    const j = i * 4;
    const a = d.rgba[j + 3];
    if (!a) return "";
    return "rgba(" + d.rgba[j] + "," + d.rgba[j + 1] + "," + d.rgba[j + 2] + "," + (a / 255).toFixed(3) + ")";
  }
  function fxOf(i: number) {
    return d.fx ? d.fx[i] : 0;
  }
  // Foil: mix the ink towards white where the lamp is close, with bands that
  // run diagonally across the leaf and shift as the lamp moves.
  function foilStyle(i: number) {
    const j = i * 4;
    const x = hx(i);
    const y = hy(i);
    const reach = Math.max(W, H) * 0.3;
    const dx = (x - light.x) / reach;
    const dy = (y - light.y) / reach;
    const near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
    const band = 0.5 + 0.5 * Math.sin((x + y) / (cell * 5) - (light.x + light.y) / (cell * 9));
    const lvl = Math.round(Math.min(1, near * near * 1.1 + band * 0.35) * 12);
    const key = d.rgba[j] + "," + d.rgba[j + 1] + "," + d.rgba[j + 2] + "," + d.rgba[j + 3] + "," + lvl;
    let st = foilCache[key];
    if (!st) {
      // dull metal in shadow, bright metal in the light, a white glint at the peak
      const t = lvl / 12;
      const shade = 0.45 + t * 0.95;
      const mix = Math.max(0, t - 0.72) * 2.6;
      const c = function (v: number) {
        return Math.round(Math.min(255, v * shade * (1 - mix) + 255 * mix));
      };
      st = foilCache[key] = "rgba(" + c(d.rgba[j]) + "," + c(d.rgba[j + 1]) + "," + c(d.rgba[j + 2]) + "," + (d.rgba[j + 3] / 255).toFixed(3) + ")";
    }
    return st;
  }
  // Neon: a glow of the tube's colour around a core that burns almost white.
  function glowOn(c: CanvasRenderingContext2D, i: number) {
    const j = i * 4;
    c.shadowColor = "rgb(" + d.rgba[j] + "," + d.rgba[j + 1] + "," + d.rgba[j + 2] + ")";
    c.shadowBlur = cell * s * dpr * 1.3;
  }
  function neonCore(i: number) {
    const j = i * 4;
    const w = function (v: number) {
      return Math.round(v + (255 - v) * 0.5);
    };
    return "rgba(" + w(d.rgba[j]) + "," + w(d.rgba[j + 1]) + "," + w(d.rgba[j + 2]) + "," + (d.rgba[j + 3] / 255).toFixed(3) + ")";
  }
  function glowOff(c: CanvasRenderingContext2D) {
    c.shadowBlur = 0;
    c.shadowColor = "transparent";
  }
  function setPhysics(p: { radius?: number; force?: number; spring?: number }) {
    if (p.radius) R = p.radius;
    if (p.force) F = p.force;
    if (p.spring) K = p.spring;
  }

  function init(dd: FieldData) {
    d = dd;
    cols = d.cols;
    rows = d.rows;
    cell = d.cell;
    N = cols * rows;
    W = cols * cell;
    H = rows * cell;
    font = d.weight + " " + (cell * 0.92).toFixed(2) + "px " + d.font;
    if (!R) {
      R = o.radius || cell * 9;
      F = o.force || 2.2;
      K = o.spring || 0.05;
    }
    px = new Float32Array(N);
    py = new Float32Array(N);
    vx = new Float32Array(N);
    vy = new Float32Array(N);
    sx = new Float32Array(N);
    sy = new Float32Array(N);
    active = new Int32Array(N);
    inAct = new Uint8Array(N);
    nAct = 0;
    styles = new Array(N);
    for (let i = 0; i < N; i++) {
      px[i] = hx(i);
      py[i] = hy(i);
      styles[i] = styleOf(i);
      // a fixed random direction per letter, used when the type is spilled
      const ang = Math.random() * Math.PI * 2;
      const dist = 0.15 + Math.random() * Math.random() * 0.9;
      sx[i] = Math.cos(ang) * dist * W;
      sy[i] = Math.sin(ang) * dist * H * 0.6 + Math.random() * H * 0.9;
    }
    light.x = W * 0.25;
    light.y = H * 0.15;
    rebuildOrder();
  }

  // Visible cells grouped by style, so a full draw changes fillStyle once per
  // colour rather than once per letter.
  function rebuildOrder() {
    orderDirty = false;
    const groups: Record<string, number[]> = {};
    const keys: string[] = [];
    let n = 0;
    for (let i = 0; i < N; i++) {
      const st = styles[i];
      if (!st) continue;
      let g = groups[st];
      if (!g) {
        g = groups[st] = [];
        keys.push(st);
      }
      g.push(i);
      n++;
    }
    order = new Int32Array(n);
    let k = 0;
    for (let q = 0; q < keys.length; q++) {
      const list = groups[keys[q]];
      for (let m = 0; m < list.length; m++) order[k++] = list[m];
    }
    let nf = 0;
    if (d.fx) for (let i = 0; i < N; i++) if (d.fx[i] === 2 && styles[i]) nf++;
    foil = new Int32Array(nf);
    if (nf) {
      let f = 0;
      for (let i = 0; i < N; i++) if (d.fx![i] === 2 && styles[i]) foil[f++] = i;
    }
  }

  function measure() {
    let w, h;
    if (o.size) {
      w = o.size.w;
      h = o.size.h;
      dpr = 1;
    } else {
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
    }
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    layer.width = canvas.width;
    layer.height = canvas.height;
    let f = fit;
    if (f === "auto") {
      const ratio = w / h / (W / H);
      f = ratio > 0.85 && ratio < 1.18 ? "cover" : "contain";
    }
    s = f === "cover" ? Math.max(w / W, h / H) : Math.min(w / W, h / H);
    ox = (w - W * s) / 2;
    oy = (h - H * s) / 2;
  }

  function tf(c: CanvasRenderingContext2D) {
    c.setTransform(s * dpr, 0, 0, s * dpr, ox * dpr, oy * dpr);
    c.font = font;
    c.textAlign = "center";
    c.textBaseline = "middle";
  }

  function paintLayer() {
    lx.setTransform(1, 0, 0, 1, 0, 0);
    lx.fillStyle = d.paper;
    lx.fillRect(0, 0, layer.width, layer.height);
    tf(lx);
    if (orderDirty) rebuildOrder();
    let cur = "";
    for (let k = 0; k < order.length; k++) {
      const i = order[k];
      const st = styles[i];
      if (st !== cur) {
        lx.fillStyle = st;
        cur = st;
      }
      lx.fillText(d.ch[i], hx(i), hy(i));
    }
    // neon: a second pass with a glow of the letter's own colour
    if (d.fx) {
      for (let k = 0; k < order.length; k++) {
        const i = order[k];
        if (d.fx[i] !== 1) continue;
        glowOn(lx, i);
        lx.fillStyle = neonCore(i);
        lx.fillText(d.ch[i], hx(i), hy(i));
      }
      glowOff(lx);
    }
  }

  function drawFoil() {
    if (!foil.length) return;
    tf(ctx);
    const half = cell / 2 + 0.5;
    ctx.fillStyle = d.paper;
    for (let k = 0; k < foil.length; k++) {
      const i = foil[k];
      if (!inAct[i]) ctx.fillRect(hx(i) - half, hy(i) - half, half * 2, half * 2);
    }
    for (let k = 0; k < foil.length; k++) {
      const i = foil[k];
      if (inAct[i]) continue;
      ctx.fillStyle = foilStyle(i);
      ctx.fillText(d.ch[i], hx(i), hy(i));
    }
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (spill > 0.001) {
      ctx.fillStyle = d.paper;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      tf(ctx);
      if (orderDirty) rebuildOrder();
      const e = spill * spill;
      let cur = "";
      for (let k = 0; k < order.length; k++) {
        const i = order[k];
        const st = styles[i];
        if (st !== cur) {
          ctx.fillStyle = st;
          cur = st;
        }
        ctx.fillText(d.ch[i], px[i] + sx[i] * e, py[i] + sy[i] * e);
      }
      return;
    }
    ctx.drawImage(layer, 0, 0);
    drawFoil();
    if (!nAct) return;
    tf(ctx);
    ctx.fillStyle = d.paper;
    const half = cell / 2 + 0.5;
    for (let a = 0; a < nAct; a++) {
      const ia = active[a];
      if (styles[ia]) ctx.fillRect(hx(ia) - half, hy(ia) - half, half * 2, half * 2);
    }
    let cur2 = "";
    for (let b = 0; b < nAct; b++) {
      const ib = active[b];
      const sb = styles[ib];
      if (!sb) continue;
      const f = fxOf(ib);
      if (f === 2) {
        ctx.fillStyle = cur2 = foilStyle(ib);
      } else if (sb !== cur2) {
        ctx.fillStyle = sb;
        cur2 = sb;
      }
      if (f === 1) {
        glowOn(ctx, ib);
        ctx.fillStyle = cur2 = neonCore(ib);
      }
      ctx.fillText(d.ch[ib], px[ib], py[ib]);
      if (f === 1) glowOff(ctx);
    }
  }

  function activate(i: number) {
    if (inAct[i] || !styles[i]) return;
    inAct[i] = 1;
    active[nAct++] = i;
  }

  function wakeNear() {
    const c0 = Math.max(0, Math.floor((pointer.x - R) / cell));
    const c1 = Math.min(cols - 1, Math.floor((pointer.x + R) / cell));
    const r0 = Math.max(0, Math.floor((pointer.y - R) / cell));
    const r1 = Math.min(rows - 1, Math.floor((pointer.y + R) / cell));
    const R2 = R * R;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const i = r * cols + c;
        if (inAct[i] || !styles[i]) continue;
        const dx = (c + 0.5) * cell - pointer.x;
        const dy = (r + 0.5) * cell - pointer.y;
        if (dx * dx + dy * dy < R2) activate(i);
      }
    }
  }

  function step() {
    if (pointer.on) wakeNear();
    let energy = 0;
    const R2 = R * R;
    for (let k = 0; k < nAct; k++) {
      const i = active[k];
      const x = px[i];
      const y = py[i];
      if (pointer.on) {
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const dist = Math.sqrt(d2) || 1;
          const push = (1 - dist / R) * F;
          vx[i] += (dx / dist) * push;
          vy[i] += (dy / dist) * push;
        }
      }
      const tx = hx(i);
      const ty = hy(i);
      vx[i] = (vx[i] + (tx - x) * K) * DAMP;
      vy[i] = (vy[i] + (ty - y) * K) * DAMP;
      px[i] = x + vx[i];
      py[i] = y + vy[i];
      const sp = Math.abs(vx[i]) + Math.abs(vy[i]);
      energy += sp;
      if (sp < 0.02 && Math.abs(px[i] - tx) + Math.abs(py[i] - ty) < 0.15) {
        px[i] = tx;
        py[i] = ty;
        vx[i] = 0;
        vy[i] = 0;
        inAct[i] = 0;
        active[k] = active[--nAct];
        k--;
      }
    }
    return energy;
  }

  function frame(t: number) {
    raf = 0;
    if (dead) return;
    const dt = last ? t - last : 16.7;
    last = t;
    if (drift && Date.now() - lastReal > 2500) {
      ghost = true;
      pointer.on = true;
      pointer.x = W * (0.5 + 0.42 * Math.sin(t * 0.00031));
      pointer.y = H * (0.5 + 0.38 * Math.sin(t * 0.00047 + 1.3));
      light.x = pointer.x;
      light.y = pointer.y;
    }
    const n = Math.min(3, Math.max(1, Math.round(dt / 16.7)));
    let e = 0;
    for (let q = 0; q < n; q++) e = step();
    render();
    if (!ghost && (nAct === 0 || e < 0.01 * nAct)) {
      running = false;
      last = 0;
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function wake() {
    if (dead || running || mode !== "scatter") return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  function releaseAll() {
    for (let k = 0; k < nAct; k++) {
      const i = active[k];
      px[i] = hx(i);
      py[i] = hy(i);
      vx[i] = 0;
      vy[i] = 0;
      inAct[i] = 0;
    }
    nAct = 0;
  }

  function toLogical(cx: number, cy: number) {
    const r = canvas.getBoundingClientRect();
    return { x: (cx - r.left - ox) / s, y: (cy - r.top - oy) / s };
  }

  function onMove(e: PointerEvent | MouseEvent) {
    if (mode !== "scatter") return;
    const p = toLogical(e.clientX, e.clientY);
    pointer.x = light.x = p.x;
    pointer.y = light.y = p.y;
    pointer.on = true;
    ghost = false;
    lastReal = Date.now();
    wake();
  }
  function onLeave() {
    pointer.on = false;
    pointer.x = -1e5;
    pointer.y = -1e5;
    ghost = false;
    lastReal = Date.now();
    wake();
  }
  function onDocOut(e: MouseEvent) {
    if (!e.relatedTarget) onLeave();
  }

  const target: EventTarget | null = o.listen === "window" ? window : o.listen === "none" ? null : canvas;
  if (target) {
    target.addEventListener("pointermove", onMove as EventListener);
    target.addEventListener("pointerdown", onMove as EventListener);
    if (target === window) {
      // Wallpaper hosts forward the mouse as plain mouse events; listen to
      // both, the handler is idempotent.
      window.addEventListener("mousemove", onMove as EventListener);
      document.addEventListener("mouseout", onDocOut as EventListener);
      window.addEventListener("blur", onLeave);
    } else {
      canvas.addEventListener("pointerleave", onLeave);
      canvas.addEventListener("pointercancel", onLeave);
    }
  }

  let ro: ResizeObserver | null = null;
  function resize() {
    measure();
    paintLayer();
    render();
  }
  if (!o.size && typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(function () {
      if (!dead) resize();
    });
    ro.observe(canvas);
  }
  const idleTimer = setInterval(function () {
    if (drift && !running && Date.now() - lastReal > 2500) wake();
  }, 1000);

  init(data);
  measure();
  paintLayer();
  if (o.assemble && mode === "scatter") {
    for (let i = 0; i < N; i++) {
      if (!styles[i]) continue;
      px[i] = Math.random() * W;
      py[i] = hy(i) + (Math.random() - 0.5) * H * 0.6;
      activate(i);
    }
    wake();
  }
  render();

  return {
    setMode: function (m) {
      mode = m;
      if (m !== "scatter") {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        pointer.on = false;
        ghost = false;
        releaseAll();
        render();
      }
    },
    setPhysics: setPhysics,
    setPointer: function (x, y, on) {
      pointer.x = x;
      pointer.y = y;
      if (on) {
        light.x = x;
        light.y = y;
      }
      pointer.on = on;
      lastReal = Date.now();
      ghost = false;
      wake();
    },
    setSpill: function (v) {
      spill = v;
      render();
    },
    setDrift: function (on) {
      drift = on;
      ghost = false;
      lastReal = Date.now() - (on ? 3000 : 0);
      if (on) wake();
    },
    toLogical: toLogical,
    changed: function (cells) {
      tf(lx);
      const half = cell / 2 + 0.5;
      for (let k = 0; k < cells.length; k++) {
        const i = cells[k];
        styles[i] = styleOf(i);
        lx.fillStyle = d.paper;
        lx.fillRect(hx(i) - half, hy(i) - half, half * 2, half * 2);
      }
      for (let k2 = 0; k2 < cells.length; k2++) {
        const j = cells[k2];
        if (!styles[j]) continue;
        const f = fxOf(j);
        if (f === 1) glowOn(lx, j);
        lx.fillStyle = f === 1 ? neonCore(j) : styles[j];
        lx.fillText(d.ch[j], hx(j), hy(j));
        if (f === 1) glowOff(lx);
      }
      rebuildOrder();
      orderDirty = true;
      render();
    },
    update: function (dd) {
      releaseAll();
      init(dd);
      measure();
      paintLayer();
      render();
    },
    render: render,
    resize: resize,
    destroy: function () {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      clearInterval(idleTimer);
      if (ro) ro.disconnect();
      if (target) {
        target.removeEventListener("pointermove", onMove as EventListener);
        target.removeEventListener("pointerdown", onMove as EventListener);
        window.removeEventListener("mousemove", onMove as EventListener);
        document.removeEventListener("mouseout", onDocOut as EventListener);
        window.removeEventListener("blur", onLeave);
        canvas.removeEventListener("pointerleave", onLeave);
        canvas.removeEventListener("pointercancel", onLeave);
      }
    },
  };
}
