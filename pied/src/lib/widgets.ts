// Things that sit on the desktop over the picture: a clock, the month, the
// weather, a countdown, a line of verse, a note, what's playing, and how
// fast the wallpaper is running. Every one of them is made the way the
// picture is: out of letters, or out of LED lamps. Nothing is plain text.
//
// Text is set in a 5×7 dot-matrix face (the one real signs use), each dot a
// cell; a cell is drawn as a letter (Type) or a round lamp (LED). The weather
// is a live scene in the same cells — the sun turning, rain falling, clouds
// drifting, snow, a storm, stars at night — looping for as long as the
// wallpaper runs. The cursor scatters the cells of every widget, and they
// spring back, like the type underneath.
//
// Self-contained like createField: the exported file embeds
// `runWidgets.toString()`, and the press's desktop box runs the same
// function, so the layout you drag is the layout you download. No imports,
// no outer references.

export type WidgetType = "clock" | "calendar" | "weather" | "countdown" | "quote" | "note" | "music" | "stats";
export type WidgetLook = "type" | "led";
export type WidgetTint = "amber" | "green" | "red" | "white" | "full";

export type Widget = {
  id: string;
  type: WidgetType;
  /** centre, 0..1 of the screen */
  x: number;
  y: number;
  /** 0.6 small · 1 medium · 1.5 large */
  size: number;
  /** letters or lamps (default letters) */
  look?: WidgetLook;
  /** the lamps' colour (LED only; default amber) */
  tint?: WidgetTint;
  /** note text, or the countdown's "to what" */
  text?: string;
  /** countdown target, YYYY-MM-DD */
  date?: string;
  /** weather place */
  place?: string;
  lat?: number;
  lon?: number;
  /** weather in °F */
  fahrenheit?: boolean;
  h24?: boolean;
};

export type WeatherMood = "clear" | "cloud" | "fog" | "rain" | "snow" | "storm" | "wind";

export type WidgetsOptions = {
  /** the press's desktop box: no host listeners */
  preview?: boolean;
  /** the letters of the picture answer the weather */
  onWeather?: (mood: WeatherMood) => void;
};

export type WidgetsHandle = {
  set(list: Widget[]): void;
  destroy(): void;
};

export function runWidgets(root: HTMLElement, initial: Widget[], opts: WidgetsOptions): WidgetsHandle {
  // ── the 5×7 face ────────────────────────────────────────────────────────
  // Each glyph is seven rows of five dots, written as five-character strings.
  const F: Record<string, string> = {
    A: "01110 10001 10001 11111 10001 10001 10001",
    B: "11110 10001 10001 11110 10001 10001 11110",
    C: "01110 10001 10000 10000 10000 10001 01110",
    D: "11110 10001 10001 10001 10001 10001 11110",
    E: "11111 10000 10000 11110 10000 10000 11111",
    F: "11111 10000 10000 11110 10000 10000 10000",
    G: "01110 10001 10000 10111 10001 10001 01111",
    H: "10001 10001 10001 11111 10001 10001 10001",
    I: "01110 00100 00100 00100 00100 00100 01110",
    J: "00111 00010 00010 00010 00010 10010 01100",
    K: "10001 10010 10100 11000 10100 10010 10001",
    L: "10000 10000 10000 10000 10000 10000 11111",
    M: "10001 11011 10101 10101 10001 10001 10001",
    N: "10001 10001 11001 10101 10011 10001 10001",
    O: "01110 10001 10001 10001 10001 10001 01110",
    P: "11110 10001 10001 11110 10000 10000 10000",
    Q: "01110 10001 10001 10001 10101 10010 01101",
    R: "11110 10001 10001 11110 10100 10010 10001",
    S: "01111 10000 10000 01110 00001 00001 11110",
    T: "11111 00100 00100 00100 00100 00100 00100",
    U: "10001 10001 10001 10001 10001 10001 01110",
    V: "10001 10001 10001 10001 10001 01010 00100",
    W: "10001 10001 10001 10101 10101 10101 01010",
    X: "10001 10001 01010 00100 01010 10001 10001",
    Y: "10001 10001 01010 00100 00100 00100 00100",
    Z: "11111 00001 00010 00100 01000 10000 11111",
    "0": "01110 10001 10011 10101 11001 10001 01110",
    "1": "00100 01100 00100 00100 00100 00100 01110",
    "2": "01110 10001 00001 00010 00100 01000 11111",
    "3": "11111 00010 00100 00010 00001 10001 01110",
    "4": "00010 00110 01010 10010 11111 00010 00010",
    "5": "11111 10000 11110 00001 00001 10001 01110",
    "6": "00110 01000 10000 11110 10001 10001 01110",
    "7": "11111 00001 00010 00100 01000 01000 01000",
    "8": "01110 10001 10001 01110 10001 10001 01110",
    "9": "01110 10001 10001 01111 00001 00010 01100",
    " ": "00000 00000 00000 00000 00000 00000 00000",
    ":": "00000 01100 01100 00000 01100 01100 00000",
    ".": "00000 00000 00000 00000 00000 01100 01100",
    ",": "00000 00000 00000 00000 01100 00100 01000",
    "-": "00000 00000 00000 11111 00000 00000 00000",
    "—": "00000 00000 00000 11111 00000 00000 00000",
    "'": "01100 00100 01000 00000 00000 00000 00000",
    "’": "01100 00100 01000 00000 00000 00000 00000",
    '"': "01010 01010 00000 00000 00000 00000 00000",
    "“": "01010 01010 00000 00000 00000 00000 00000",
    "”": "01010 01010 00000 00000 00000 00000 00000",
    "°": "01100 10010 10010 01100 00000 00000 00000",
    "/": "00001 00010 00010 00100 01000 01000 10000",
    "%": "11001 11010 00010 00100 01000 01011 10011",
    "!": "00100 00100 00100 00100 00100 00000 00100",
    "?": "01110 10001 00001 00010 00100 00000 00100",
    "&": "01100 10010 10100 01000 10101 10010 01101",
    "·": "00000 00000 00000 01100 01100 00000 00000",
    "(": "00010 00100 01000 01000 01000 00100 00010",
    ")": "01000 00100 00010 00010 00010 00100 01000",
    ";": "00000 01100 01100 00000 01100 00100 01000",
    "+": "00000 00100 00100 11111 00100 00100 00000",
    "#": "01010 01010 11111 01010 11111 01010 01010",
  };
  const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const QUOTES = [
    ["Hope is the thing with feathers.", "Emily Dickinson"],
    ["I wandered lonely as a cloud.", "Wordsworth"],
    ["Do not go gentle into that good night.", "Dylan Thomas"],
    ["The woods are lovely, dark and deep.", "Robert Frost"],
    ["What will you do with your one wild and precious life?", "Mary Oliver"],
    ["I contain multitudes.", "Walt Whitman"],
    ["We are such stuff as dreams are made on.", "Shakespeare"],
    ["Beauty is truth, truth beauty.", "John Keats"],
    ["The only way out is through.", "Robert Frost"],
    ["To see a world in a grain of sand.", "William Blake"],
    ["Not all those who wander are lost.", "Tolkien"],
    ["I dwell in possibility.", "Emily Dickinson"],
    ["Still, like air, I'll rise.", "Maya Angelou"],
    ["What you seek is seeking you.", "Rumi"],
    ["Simplicity is the ultimate sophistication.", "Da Vinci"],
    ["One must imagine Sisyphus happy.", "Albert Camus"],
    ["It is never too late to be what you might have been.", "George Eliot"],
    ["Everything you can imagine is real.", "Picasso"],
    ["Veni, vidi, vici.", "Julius Caesar"],
    ["Fortune favours the bold.", "Virgil"],
  ];
  const TINTS: Record<string, number[]> = { amber: [255, 174, 26], green: [57, 255, 106], red: [255, 59, 47], white: [244, 243, 238] };
  const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

  // ── a grid of cells ─────────────────────────────────────────────────────
  type Grid = { cols: number; rows: number; v: Float32Array; rgb: Uint8Array | null };
  const grid = (cols: number, rows: number, colour: boolean): Grid => ({ cols, rows, v: new Float32Array(cols * rows), rgb: colour ? new Uint8Array(cols * rows * 3) : null });
  const glyphOf = (c: string) => F[c] || F[c.toUpperCase()] || F["?"];
  const widthOf = (s: string, k: number) => (s.length ? s.length * 6 * k - k : 0);
  function put(g: Grid, x: number, y: number, v: number, rgb?: number[] | null) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= g.cols || y >= g.rows) return;
    const i = y * g.cols + x;
    if (v <= g.v[i]) return;
    g.v[i] = v;
    if (g.rgb && rgb) {
      g.rgb[i * 3] = rgb[0];
      g.rgb[i * 3 + 1] = rgb[1];
      g.rgb[i * 3 + 2] = rgb[2];
    }
  }
  function text(g: Grid, s: string, x: number, y: number, k: number, v = 1, rgb?: number[] | null) {
    for (let n = 0; n < s.length; n++) {
      const rows = glyphOf(s[n]).split(" ");
      for (let r = 0; r < 7; r++)
        for (let c = 0; c < 5; c++)
          if (rows[r][c] === "1") for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) put(g, x + n * 6 * k + c * k + a, y + r * k + b, v, rgb);
    }
  }
  function centre(g: Grid, s: string, y: number, k: number, v = 1, rgb?: number[] | null) {
    text(g, s, Math.floor((g.cols - widthOf(s, k)) / 2), y, k, v, rgb);
  }
  function wrap(s: string, n: number) {
    const words = s.split(/\s+/).filter(Boolean);
    const out: string[] = [];
    let line = "";
    for (const w of words) {
      if ((line + " " + w).trim().length > n) {
        if (line) out.push(line);
        line = w.slice(0, n);
      } else line = (line + " " + w).trim();
    }
    if (line) out.push(line);
    return out;
  }
  // A cheap repeatable random number for scene particles.
  const hash = (n: number) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const pad = (n: number) => (n < 10 ? "0" : "") + n;

  // ── the weather, outside and in the cells ──────────────────────────────
  const weather: Record<string, { at: number; t: number; code: number; wind: number; day: boolean } | undefined> = {};
  function sky(code: number, wind: number): [string, string] {
    let r: [string, string];
    if (code === 0) r = ["CLEAR", "clear"];
    else if (code <= 2) r = ["PARTLY CLOUDY", "part"];
    else if (code === 3) r = ["OVERCAST", "cloud"];
    else if (code === 45 || code === 48) r = ["FOG", "fog"];
    else if (code >= 51 && code <= 57) r = ["DRIZZLE", "rain"];
    else if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) r = ["RAIN", "rain"];
    else if ((code >= 71 && code <= 77) || code === 85 || code === 86) r = ["SNOW", "snow"];
    else if (code >= 95) r = ["THUNDERSTORM", "storm"];
    else r = ["—", "clear"];
    if (wind > 30) r[0] += ", WINDY";
    return r;
  }

  const SUN = [255, 196, 40];
  const RAY = [255, 150, 30];
  const CLOUD = [220, 224, 232];
  const DARK = [120, 126, 140];
  const DROP = [120, 180, 255];
  const SNOW = [245, 248, 255];
  const MOON = [236, 232, 210];
  const BOLT = [255, 255, 180];

  function blob(g: Grid, cx: number, cy: number, s: number, rgb: number[], v: number) {
    const parts = [
      [0, 0, 1],
      [-1.1, 0.35, 0.72],
      [1.1, 0.35, 0.75],
      [0.5, -0.45, 0.8],
      [-0.55, -0.3, 0.7],
    ];
    for (const [dx, dy, r] of parts) {
      const R = r * s;
      for (let y = Math.floor(cy + dy * s - R); y <= cy + dy * s + R; y++)
        for (let x = Math.floor(cx + dx * s - R); x <= cx + dx * s + R; x++) {
          const d = Math.hypot(x - cx - dx * s, (y - cy - dy * s) * 1.25);
          if (d <= R) put(g, x, y, v * (d > R - 1.2 ? 0.75 : 1), rgb);
        }
    }
  }
  function sunAt(g: Grid, cx: number, cy: number, r: number, t: number) {
    for (let y = Math.floor(cy - r * 2.2); y <= cy + r * 2.2; y++)
      for (let x = Math.floor(cx - r * 2.2); x <= cx + r * 2.2; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const d = Math.hypot(dx, dy);
        if (d <= r) put(g, x, y, 1, SUN);
        else if (d < r * 2.1) {
          // Twelve rays turning slowly, each pulsing a little.
          const a = Math.atan2(dy, dx) - t * 0.35;
          const k = Math.abs(((((a / (Math.PI * 2)) * 12) % 1) + 1) % 1 - 0.5);
          if (k > 0.36 && d > r + 1) put(g, x, y, 0.55 + 0.4 * Math.sin(t * 3 + d), RAY);
        }
      }
  }
  function scene(g: Grid, x0: number, y0: number, W: number, H: number, kind: string, day: boolean, t: number) {
    const sub: Grid = grid(W, H, true);
    if (!day && (kind === "clear" || kind === "part")) {
      // Night: a crescent moon and stars that twinkle.
      for (let s = 0; s < 22; s++) {
        const tw = 0.25 + 0.75 * Math.abs(Math.sin(t * (0.6 + hash(s) * 1.6) + s));
        put(sub, hash(s + 7) * W, hash(s + 19) * H * 0.9, tw, SNOW);
      }
      const cx = W * 0.62;
      const cy = H * 0.42;
      const r = H * 0.26;
      for (let y = Math.floor(cy - r); y <= cy + r; y++)
        for (let x = Math.floor(cx - r); x <= cx + r; x++) if (Math.hypot(x - cx, y - cy) <= r && Math.hypot(x - cx - r * 0.55, y - cy + r * 0.2) > r * 0.85) put(sub, x, y, 1, MOON);
      if (kind === "part") blob(sub, ((t * 1.2) % (W + 16)) - 8, H * 0.7, H * 0.16, DARK, 0.6);
    } else if (kind === "clear") {
      sunAt(sub, W * 0.5, H * 0.5, H * 0.2, t);
    } else if (kind === "part") {
      sunAt(sub, W * 0.62, H * 0.4, H * 0.17, t);
      blob(sub, ((t * 1.6) % (W + 20)) - 10, H * 0.66, H * 0.17, CLOUD, 0.85);
    } else if (kind === "cloud" || kind === "fog") {
      for (let c = 0; c < 3; c++) blob(sub, ((t * (1 + c * 0.5) + c * W * 0.4) % (W + 24)) - 12, H * (0.3 + c * 0.2), H * (0.2 - c * 0.03), c === 1 ? CLOUD : DARK, 0.9 - c * 0.15);
      if (kind === "fog")
        for (let y = 0; y < H; y++)
          for (let x = 0; x < W; x++) {
            const v = 0.5 + 0.5 * Math.sin(x * 0.25 + t * 0.8 + y * 0.9) * Math.sin(y * 0.5 - t * 0.3);
            if (v > 0.55) put(sub, x, y, (v - 0.4) * 0.8, CLOUD);
          }
    } else if (kind === "rain" || kind === "storm") {
      const flash = kind === "storm" && t % 5 < 0.18;
      for (let c = 0; c < 2; c++) blob(sub, ((t * 0.8 + c * W * 0.5) % (W + 24)) - 12, H * 0.18, H * 0.17, flash ? BOLT : DARK, flash ? 1 : 0.8);
      const n = kind === "storm" ? 46 : 32;
      for (let s = 0; s < n; s++) {
        const speed = 16 + hash(s) * 10;
        const y = ((hash(s + 3) * H + t * speed) % (H * 0.72)) + H * 0.28;
        const x = (hash(s + 11) * (W + 6) - y * 0.25) % W;
        put(sub, x, y, 0.95, DROP);
        put(sub, x + 0.25, y - 1, 0.6, DROP);
        if (y > H - 1.5) {
          put(sub, x - 1, H - 1, 0.5, DROP);
          put(sub, x + 1, H - 1, 0.5, DROP);
        }
      }
      if (kind === "storm" && t % 5 < 0.3) {
        // A bolt down from the cloud.
        let x = W * (0.3 + hash(Math.floor(t / 5)) * 0.4);
        for (let y = Math.floor(H * 0.3); y < H; y++) {
          x += hash(y + Math.floor(t)) > 0.5 ? 1 : -1;
          put(sub, x, y, 1, BOLT);
        }
      }
    } else if (kind === "snow") {
      blob(sub, ((t * 0.6) % (W + 24)) - 12, H * 0.16, H * 0.16, CLOUD, 0.8);
      for (let s = 0; s < 34; s++) {
        const y = ((hash(s + 5) * H + t * (2.2 + hash(s) * 2)) % (H * 0.75)) + H * 0.25;
        const x = hash(s + 13) * W + Math.sin(t * 1.3 + s) * 1.6;
        put(sub, x, y, 0.9, SNOW);
      }
    }
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (sub.v[i]) put(g, x0 + x, y0 + y, sub.v[i], [sub.rgb![i * 3], sub.rgb![i * 3 + 1], sub.rgb![i * 3 + 2]]);
      }
  }

  // ── what's playing ──────────────────────────────────────────────────────
  const track = { title: "", artist: "", playing: false, art: null as Uint8Array | null };
  function artFrom(src: string) {
    if (!src) {
      track.art = null;
      return;
    }
    const im = new Image();
    im.onload = () => {
      const c = document.createElement("canvas");
      c.width = c.height = 16;
      const x = c.getContext("2d");
      if (!x) return;
      x.drawImage(im, 0, 0, 16, 16);
      try {
        const d = x.getImageData(0, 0, 16, 16).data;
        const a = new Uint8Array(16 * 16 * 3);
        for (let i = 0; i < 256; i++) {
          a[i * 3] = d[i * 4];
          a[i * 3 + 1] = d[i * 4 + 1];
          a[i * 3 + 2] = d[i * 4 + 2];
        }
        track.art = a;
      } catch {
        track.art = null;
      }
      dirtyAll();
    };
    im.src = src;
  }
  let fps = 0;
  let sys: string[] = [];

  // ── what each widget draws ──────────────────────────────────────────────
  function compose(w: Widget, now: Date, t: number): { g: Grid; words: string; live: boolean } {
    const full = w.look === "led" && (w.tint || "amber") === "full";
    if (w.type === "clock") {
      let h = now.getHours();
      if (!w.h24) h = h % 12 || 12;
      const colon = now.getSeconds() % 2 === 0 ? ":" : " ";
      const time = (w.h24 ? pad(h) : String(h)) + colon + pad(now.getMinutes());
      const line = DAYS[now.getDay()] + " " + now.getDate() + " " + MONTHS[now.getMonth()].slice(0, 3);
      const g = grid(Math.max(widthOf("00:00", 4), widthOf(line, 1)) + 2, 28 + 4 + 7, full);
      centre(g, time, 0, 4, 1, [255, 255, 255]);
      centre(g, line, 32, 1, 0.8, [255, 200, 120]);
      return { g, words: "time " + line.toLowerCase() + " ", live: false };
    }
    if (w.type === "calendar") {
      const y = now.getFullYear();
      const m = now.getMonth();
      const title = MONTHS[m] + " " + y;
      const colW = 14;
      const g = grid(colW * 7, 7 + 4 + 7 + 3 + 6 * 10, full);
      centre(g, title, 0, 1, 1, [255, 220, 150]);
      "SMTWTFS".split("").forEach((d, i) => text(g, d, i * colW + 4, 11, 1, 0.55, [180, 190, 210]));
      const first = new Date(y, m, 1).getDay();
      const days = new Date(y, m + 1, 0).getDate();
      for (let d = 1; d <= days; d++) {
        const k = first + d - 1;
        const cx = (k % 7) * colW;
        const cy = 21 + Math.floor(k / 7) * 10;
        const s = String(d);
        const today = d === now.getDate();
        text(g, s, cx + (s.length === 1 ? 4 : 1), cy, 1, today ? 1 : 0.75, today ? [255, 90, 60] : [255, 255, 255]);
        if (today)
          for (let a = -1; a <= 12; a++) {
            put(g, cx + a, cy - 2, 0.9, [255, 90, 60]);
            put(g, cx + a, cy + 8, 0.9, [255, 90, 60]);
          }
      }
      return { g, words: MONTHS[m].toLowerCase() + " ", live: false };
    }
    if (w.type === "weather") {
      const got = weather[w.id];
      const W = 64;
      const H = 34;
      const temp = got ? Math.round(w.fahrenheit ? got.t * 1.8 + 32 : got.t) + (w.fahrenheit ? "°F" : "°C") : "--°";
      const [words, kind] = got ? sky(got.code, got.wind) : [w.lat == null ? "CHOOSE A PLACE" : "LOOKING OUT", "cloud"];
      const place = (w.place || "").toUpperCase().slice(0, 22);
      const g = grid(Math.max(W, widthOf(temp, 3), widthOf(words, 1), widthOf(place, 1)) + 2, H + 3 + 21 + 3 + 7 + 3 + 7, true);
      scene(g, Math.floor((g.cols - W) / 2), 0, W, H, kind, got ? got.day : true, t);
      centre(g, temp, H + 3, 3, 1, [255, 255, 255]);
      centre(g, words, H + 27, 1, 0.9, [255, 210, 140]);
      centre(g, place, H + 37, 1, 0.65, [200, 205, 215]);
      return { g, words: (place || "weather").toLowerCase() + " ", live: true };
    }
    if (w.type === "countdown") {
      const what = (w.text || "").trim().toUpperCase().slice(0, 36);
      const target = w.date ? new Date(w.date + "T00:00:00") : null;
      let big = "--";
      let small = "PICK A DATE";
      if (target && !isNaN(target.getTime())) {
        const ms = target.getTime() - now.getTime();
        const days = Math.ceil(ms / 86400000);
        if (ms <= 0) {
          big = "TODAY";
          small = what || "IS THE DAY";
        } else if (days <= 1) {
          const h = Math.ceil(ms / 3600000);
          big = String(h);
          small = (h === 1 ? "HOUR" : "HOURS") + (what ? " TO " + what : " TO GO");
        } else {
          big = String(days);
          small = "DAYS" + (what ? " TO " + what : " TO GO");
        }
      }
      const lines = wrap(small, 22);
      const g = grid(Math.max(widthOf(big, 4), ...lines.map((l) => widthOf(l, 1))) + 2, 28 + 4 + lines.length * 9, full);
      centre(g, big, 0, 4, 1, [255, 255, 255]);
      lines.forEach((l, i) => centre(g, l, 32 + i * 9, 1, 0.85, [255, 200, 120]));
      return { g, words: (what || "soon").toLowerCase() + " ", live: false };
    }
    if (w.type === "quote") {
      const start = new Date(now.getFullYear(), 0, 0).getTime();
      const day = Math.floor((now.getTime() - start) / 86400000);
      const q = QUOTES[(day + now.getFullYear()) % QUOTES.length];
      const lines = wrap(q[0].toUpperCase(), 24).slice(0, 5);
      const who = "— " + q[1].toUpperCase();
      const g = grid(Math.max(...lines.map((l) => widthOf(l, 1)), widthOf(who, 1)) + 2, lines.length * 9 + 5 + 7, full);
      lines.forEach((l, i) => centre(g, l, i * 9, 1, 1, [255, 255, 255]));
      centre(g, who, lines.length * 9 + 5, 1, 0.6, [255, 200, 120]);
      return { g, words: q[0].toLowerCase().replace(/[^a-z ]/g, "") + " ", live: false };
    }
    if (w.type === "note") {
      const lines = wrap((w.text || "Write a note").toUpperCase(), 14).slice(0, 4);
      const g = grid(Math.max(...lines.map((l) => widthOf(l, 2))) + 2, lines.length * 17, full);
      lines.forEach((l, i) => centre(g, l, i * 17, 2, 1, [255, 255, 255]));
      return { g, words: (w.text || "note").toLowerCase() + " ", live: false };
    }
    if (w.type === "music") {
      // A record: grooves of lamps, a highlight that turns while it plays,
      // and the cover as its label.
      const D = 40;
      const title = (track.title || "NOTHING YET").toUpperCase();
      const artist = (track.title ? track.artist : "LIVELY · WALLPAPER ENGINE").toUpperCase().slice(0, 18);
      const shown = title.length > 18 ? (title + "   " + title).slice(Math.floor(t * 3) % (title.length + 3), Math.floor(t * 3) % (title.length + 3) + 18) : title;
      const g = grid(D + 4 + widthOf("W".repeat(18), 1), D, true);
      const spin = track.playing ? t * 2.2 : 0.6;
      const c = D / 2 - 0.5;
      for (let y = 0; y < D; y++)
        for (let x = 0; x < D; x++) {
          const dx = x - c;
          const dy = y - c;
          const r = Math.hypot(dx, dy);
          if (r > D / 2) continue;
          if (r < D * 0.2) {
            if (track.art) {
              const u = Math.floor(((dx / (D * 0.4)) + 0.5) * 16);
              const v = Math.floor(((dy / (D * 0.4)) + 0.5) * 16);
              const k = (Math.max(0, Math.min(15, v)) * 16 + Math.max(0, Math.min(15, u))) * 3;
              put(g, x, y, 1, [track.art[k], track.art[k + 1], track.art[k + 2]]);
            } else if (r > 1.2) put(g, x, y, 0.8, [255, 90, 60]);
            continue;
          }
          const a = Math.atan2(dy, dx) - spin;
          const shine = Math.max(0, Math.cos(a * 2)) ** 6;
          const groove = Math.floor(r) % 2 === 0 ? 0.28 : 0.12;
          put(g, x, y, groove + shine * 0.7, [210, 210, 220]);
        }
      text(g, "NOW PLAYING", D + 4, 6, 1, 0.55, [255, 200, 120]);
      text(g, shown, D + 4, 17, 1, 1, [255, 255, 255]);
      text(g, artist, D + 4, 27, 1, 0.7, [200, 205, 215]);
      return { g, words: (track.title || "music").toLowerCase() + " ", live: track.playing || title.length > 18 };
    }
    // stats
    const top = (fps ? fps : "--") + " FPS";
    const g = grid(Math.max(widthOf(top, 2), ...sys.map((s) => widthOf(s, 1)), 10) + 2, 14 + sys.length * 9 + 2, full);
    text(g, top, 1, 0, 2, 1, [120, 255, 140]);
    sys.forEach((s, i) => text(g, s, 1, 17 + i * 9, 1, 0.8, [200, 205, 215]));
    return { g, words: "fps ", live: true };
  }

  // ── boards: one canvas per widget, its cells on springs ────────────────
  type Board = {
    w: Widget;
    el: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    g: Grid;
    words: string;
    live: boolean;
    cs: number;
    ox: Float32Array;
    oy: Float32Array;
    vx: Float32Array;
    vy: Float32Array;
    moving: boolean;
    key: string;
  };
  let list = initial.slice();
  let boards: Board[] = [];
  const timers: ReturnType<typeof setInterval>[] = [];
  const pointer = { x: -1e5, y: -1e5 };
  let alive = true;
  let raf = 0;
  let slow = 0;
  const t0 = performance.now();
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  root.style.position = root.style.position || "absolute";
  root.style.pointerEvents = "none";

  // Letters need a bigger cell than lamps to be read as letters.
  const cellFor = (w: Widget) => Math.max(1, (root.clientWidth / 100) * (w.look === "led" ? 0.17 : 0.26) * w.size);

  function layout(b: Board) {
    const g = b.g;
    const cs = cellFor(b.w);
    b.cs = cs;
    const pad = b.w.look === "led" ? 3 : 0;
    const W = (g.cols + pad * 2) * cs;
    const H = (g.rows + pad * 2) * cs;
    const cw = Math.round(W * dpr);
    const ch = Math.round(H * dpr);
    if (b.el.width !== cw || b.el.height !== ch) {
      b.el.width = cw;
      b.el.height = ch;
    }
    b.el.style.width = W + "px";
    b.el.style.height = H + "px";
    // Centred where it was placed, but never hanging off the screen.
    const RW = root.clientWidth || W;
    const RH = root.clientHeight || H;
    b.el.style.left = Math.min(RW - W / 2, Math.max(W / 2, b.w.x * RW)) + "px";
    b.el.style.top = Math.min(RH - H / 2, Math.max(H / 2, b.w.y * RH)) + "px";
    b.el.style.mixBlendMode = b.w.look === "led" ? "normal" : "difference";
    const n = g.cols * g.rows;
    if (b.ox.length !== n) {
      b.ox = new Float32Array(n);
      b.oy = new Float32Array(n);
      b.vx = new Float32Array(n);
      b.vy = new Float32Array(n);
    }
  }

  function draw(b: Board) {
    const { ctx, g, cs } = b;
    const led = b.w.look === "led";
    const pad = led ? 3 : 0;
    const tint = TINTS[b.w.tint || "amber"] || TINTS.white;
    const full = led && (b.w.tint || "amber") === "full";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, b.el.width, b.el.height);
    if (led) {
      // The sign's dark face, with every lamp faintly visible.
      const W = (g.cols + pad * 2) * cs;
      const H = (g.rows + pad * 2) * cs;
      ctx.fillStyle = "rgba(10,10,9,0.92)";
      const r = cs * 2.5;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.arcTo(W, 0, W, H, r);
      ctx.arcTo(W, H, 0, H, r);
      ctx.arcTo(0, H, 0, 0, r);
      ctx.arcTo(0, 0, W, 0, r);
      ctx.fill();
      ctx.fillStyle = "rgba(" + tint[0] + "," + tint[1] + "," + tint[2] + ",0.07)";
      if (full) ctx.fillStyle = "rgba(255,255,255,0.05)";
      if (cs >= 2)
        for (let y = 0; y < g.rows; y++)
          for (let x = 0; x < g.cols; x++) {
            ctx.beginPath();
            ctx.arc((x + pad + 0.5) * cs, (y + pad + 0.5) * cs, cs * 0.36, 0, 6.2832);
            ctx.fill();
          }
    } else {
      ctx.font = "700 " + (cs * 1.05).toFixed(2) + "px " + MONO;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
    }
    const words = b.words.replace(/\s+/g, " ") || "pied ";
    let k = 0;
    for (let i = 0; i < g.v.length; i++) {
      const v = g.v[i];
      if (v < 0.02) continue;
      const x = ((i % g.cols) + pad + 0.5) * cs + b.ox[i];
      const y = (Math.floor(i / g.cols) + pad + 0.5) * cs + b.oy[i];
      if (led) {
        let c = tint;
        if (full && g.rgb) c = [g.rgb[i * 3], g.rgb[i * 3 + 1], g.rgb[i * 3 + 2]];
        else if (g.rgb && b.w.type === "weather" && !full) {
          // A single-colour sign still shows the weather by brightness.
          c = tint;
        }
        ctx.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + (0.3 + v * 0.7).toFixed(2) + ")";
        if (v > 0.85 && cs >= 2) {
          ctx.shadowColor = "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
          ctx.shadowBlur = cs * 1.2;
        }
        ctx.beginPath();
        ctx.arc(x, y, cs * 0.4, 0, 6.2832);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = "rgba(255,255,255," + Math.min(1, 0.5 + v * 0.6).toFixed(2) + ")";
        ctx.fillText(words[k++ % words.length] === " " ? "·" : words[(k - 1) % words.length], x, y);
      }
    }
  }

  function build(w: Widget, now: Date): Board {
    const el = document.createElement("canvas");
    el.dataset.widget = w.id;
    el.style.cssText = "position:absolute;transform:translate(-50%,-50%);pointer-events:none";
    root.append(el);
    const c = compose(w, now, (performance.now() - t0) / 1000);
    const b: Board = { w, el, ctx: el.getContext("2d")!, g: c.g, words: c.words, live: c.live, cs: 1, ox: new Float32Array(0), oy: new Float32Array(0), vx: new Float32Array(0), vy: new Float32Array(0), moving: false, key: "" };
    layout(b);
    draw(b);
    return b;
  }

  function refresh(b: Board, now: Date, t: number) {
    const c = compose(b.w, now, t);
    const sameShape = c.g.cols === b.g.cols && c.g.rows === b.g.rows;
    b.g = c.g;
    b.words = c.words;
    b.live = c.live;
    if (!sameShape) layout(b);
    draw(b);
  }

  function render() {
    boards.forEach((b) => b.el.remove());
    const now = new Date();
    boards = list.map((w) => build(w, now));
    kick();
  }
  function dirtyAll() {
    const now = new Date();
    const t = (performance.now() - t0) / 1000;
    boards.forEach((b) => refresh(b, now, t));
  }

  // ── the loop: physics when disturbed, scenes at 12 frames a second ─────
  let lastScene = 0;
  let lastSecond = -1;
  function frame(ts: number) {
    raf = 0;
    slow = 0;
    if (!alive) return;
    const t = (ts - t0) / 1000;
    const now = new Date();
    let busy = false;
    const sceneTick = ts - lastScene > 83;
    if (sceneTick) lastScene = ts;
    const second = now.getSeconds();
    const newSecond = second !== lastSecond;
    lastSecond = second;
    for (const b of boards) {
      let redraw = false;
      if ((b.live && sceneTick && !document.hidden) || (newSecond && b.w.type === "clock")) {
        const c = compose(b.w, now, t);
        if (c.g.cols !== b.g.cols || c.g.rows !== b.g.rows) {
          b.g = c.g;
          layout(b);
        } else b.g = c.g;
        b.words = c.words;
        b.live = c.live;
        redraw = true;
      }
      // The cursor pushes the lit cells; they spring home.
      const r = b.el.getBoundingClientRect();
      const near = pointer.x > r.left - 60 && pointer.x < r.right + 60 && pointer.y > r.top - 60 && pointer.y < r.bottom + 60;
      if (near || b.moving) {
        const pad = b.w.look === "led" ? 3 : 0;
        const R = b.cs * 7;
        const R2 = R * R;
        const px = pointer.x - r.left;
        const py = pointer.y - r.top;
        let energy = 0;
        const g = b.g;
        for (let i = 0; i < g.v.length; i++) {
          if (g.v[i] < 0.02 && !b.ox[i] && !b.oy[i]) continue;
          const hx = ((i % g.cols) + pad + 0.5) * b.cs;
          const hy = (Math.floor(i / g.cols) + pad + 0.5) * b.cs;
          const x = hx + b.ox[i];
          const y = hy + b.oy[i];
          const dx = x - px;
          const dy = y - py;
          const d2 = dx * dx + dy * dy;
          if (near && d2 < R2) {
            const d = Math.sqrt(d2) || 1;
            const f = (1 - d / R) * b.cs * 0.9;
            b.vx[i] += (dx / d) * f;
            b.vy[i] += (dy / d) * f;
          }
          b.vx[i] = (b.vx[i] - b.ox[i] * 0.06) * 0.84;
          b.vy[i] = (b.vy[i] - b.oy[i] * 0.06) * 0.84;
          b.ox[i] += b.vx[i];
          b.oy[i] += b.vy[i];
          const e = Math.abs(b.vx[i]) + Math.abs(b.vy[i]) + Math.abs(b.ox[i]) * 0.05 + Math.abs(b.oy[i]) * 0.05;
          if (e < 0.01) b.ox[i] = b.oy[i] = b.vx[i] = b.vy[i] = 0;
          energy += e;
        }
        b.moving = energy > 0.05;
        if (b.moving || near) {
          busy = true;
          redraw = true;
        }
      }
      if (redraw) draw(b);
    }
    // Keep going at display rate while anything moves; otherwise tick
    // slowly for scenes and the clock, or stop.
    if (busy) raf = requestAnimationFrame(frame);
    else if (boards.some((b) => b.live || b.w.type === "clock"))
      slow = window.setTimeout(() => {
        slow = 0;
        if (!raf) raf = requestAnimationFrame(frame);
      }, 83) as unknown as number;
  }
  function kick() {
    if (!raf && !slow && alive) raf = requestAnimationFrame(frame);
  }
  const onMove = (e: PointerEvent) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    if (slow) {
      clearTimeout(slow);
      slow = 0;
    }
    kick();
  };
  const onLeave = () => {
    pointer.x = pointer.y = -1e5;
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerleave", onLeave);
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => boards.forEach((b) => (layout(b), draw(b)))) : null;
  if (ro) ro.observe(root);

  // ── outside: the weather service and the wallpaper hosts ───────────────
  function fetchWeather(force?: boolean) {
    list.forEach((w) => {
      if (w.type !== "weather" || w.lat == null || w.lon == null) return;
      const got = weather[w.id];
      if (!force && got && Date.now() - got.at < 20 * 60000) return;
      const url = "https://api.open-meteo.com/v1/forecast?latitude=" + w.lat.toFixed(3) + "&longitude=" + w.lon.toFixed(3) + "&current=temperature_2m,weather_code,wind_speed_10m,is_day";
      fetch(url)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (!alive || !j || !j.current) return;
          const now = { at: Date.now(), t: +j.current.temperature_2m, code: +j.current.weather_code, wind: +j.current.wind_speed_10m, day: j.current.is_day !== 0 };
          weather[w.id] = now;
          const kind = now.wind > 30 ? "wind" : sky(now.code, now.wind)[1];
          if (opts.onWeather) opts.onWeather((kind === "part" ? "cloud" : kind) as WeatherMood);
          dirtyAll();
        })
        .catch(() => {});
    });
  }

  const win = window as unknown as Record<string, unknown>;
  if (!opts.preview) {
    // Wallpaper Engine's media integration.
    const reg = (name: string, cb: (e: Record<string, unknown>) => void) => {
      const f = win[name];
      if (typeof f === "function") (f as (c: typeof cb) => void)(cb);
    };
    reg("wallpaperRegisterMediaPropertiesListener", (e) => {
      track.title = String(e.title || "");
      track.artist = String(e.artist || "");
      dirtyAll();
      kick();
    });
    reg("wallpaperRegisterMediaThumbnailListener", (e) => artFrom(typeof e.thumbnail === "string" ? e.thumbnail : ""));
    reg("wallpaperRegisterMediaPlaybackListener", (e) => {
      track.playing = e.state === 1;
      dirtyAll();
      kick();
    });
    // Lively calls these globals with JSON strings.
    win.livelyCurrentTrack = (data: string) => {
      try {
        const o = JSON.parse(data);
        track.title = o ? String(o.Title || "") : "";
        track.artist = o ? String(o.Artist || "") : "";
        track.playing = !!(o && o.Title);
        artFrom(o && o.Thumbnail ? "data:image/png;base64," + o.Thumbnail : "");
      } catch {
        track.title = "";
        track.playing = false;
      }
      dirtyAll();
      kick();
    };
    win.livelySystemInformation = (data: string) => {
      try {
        const o = JSON.parse(data);
        const s: string[] = [];
        if (o.CurrentCpu != null) s.push("CPU " + Math.round(o.CurrentCpu) + "%");
        if (o.CurrentGpu3D != null) s.push("GPU " + Math.round(o.CurrentGpu3D) + "%");
        if (o.CurrentRamAvail != null) s.push("RAM " + Math.round(o.CurrentRamAvail) + " MB FREE");
        sys = s;
      } catch {
        sys = [];
      }
    };
  }

  // Frames a second, counted only while a stats widget is on the desktop.
  let fr = 0;
  let frames = 0;
  let since = 0;
  function count(ts: number) {
    frames++;
    if (!since) since = ts;
    if (ts - since >= 1000) {
      fps = Math.round((frames * 1000) / (ts - since));
      frames = 0;
      since = ts;
    }
    fr = requestAnimationFrame(count);
  }
  function syncStats() {
    const want = list.some((w) => w.type === "stats");
    if (want && !fr) fr = requestAnimationFrame(count);
    if (!want && fr) {
      cancelAnimationFrame(fr);
      fr = 0;
      since = 0;
    }
  }

  render();
  fetchWeather();
  syncStats();
  if (!opts.preview) timers.push(setInterval(() => fetchWeather(), 5 * 60000));
  // Calendars and countdowns turn over at midnight; check once a minute.
  timers.push(setInterval(dirtyAll, 60000));

  return {
    set(next) {
      list = next.slice();
      render();
      fetchWeather();
      syncStats();
    },
    destroy() {
      alive = false;
      timers.forEach(clearInterval);
      if (raf) cancelAnimationFrame(raf);
      if (slow) clearTimeout(slow);
      if (fr) cancelAnimationFrame(fr);
      if (ro) ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      boards.forEach((b) => b.el.remove());
      boards = [];
      if (win.livelyCurrentTrack) win.livelyCurrentTrack = undefined;
      if (win.livelySystemInformation) win.livelySystemInformation = undefined;
    },
  };
}
