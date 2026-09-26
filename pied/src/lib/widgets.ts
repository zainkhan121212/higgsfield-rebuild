// Things that sit on the desktop over the type: a clock, the month, the
// weather, a countdown, a line of verse, a note, what's playing, and how
// fast the wallpaper is running. Each is placed by the person in the press
// and travels inside the wallpaper file.
//
// Self-contained like createField: the exported file embeds
// `runWidgets.toString()`, and the press's desktop box runs the same
// function, so the layout you drag is the layout you download. No imports,
// no outer references.
//
// Sizes are in em, and the root's font-size is 1% of its width, so a widget
// takes the same share of a 13" laptop, a 4K monitor or the little box in
// the press. Text is white with `mix-blend-mode: difference`, which reads
// as ink on light paper and as paper on dark, with no colour logic.

export type WidgetType = "clock" | "calendar" | "weather" | "countdown" | "quote" | "note" | "music" | "stats";

export type Widget = {
  id: string;
  type: WidgetType;
  /** centre, 0..1 of the screen */
  x: number;
  y: number;
  /** 0.6 small · 1 medium · 1.5 large */
  size: number;
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
  /** the press's desktop box: don't fetch the weather every render, no timers beyond the clock */
  preview?: boolean;
  /** the letters answer the weather */
  onWeather?: (mood: WeatherMood) => void;
};

export type WidgetsHandle = {
  set(list: Widget[]): void;
  destroy(): void;
};

export function runWidgets(root: HTMLElement, initial: Widget[], opts: WidgetsOptions): WidgetsHandle {
  const SERIF = 'Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif';
  const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const QUOTES = [
    ["Hope is the thing with feathers that perches in the soul.", "Emily Dickinson"],
    ["I wandered lonely as a cloud.", "William Wordsworth"],
    ["Do not go gentle into that good night.", "Dylan Thomas"],
    ["The woods are lovely, dark and deep, but I have promises to keep.", "Robert Frost"],
    ["Tell me, what is it you plan to do with your one wild and precious life?", "Mary Oliver"],
    ["I contain multitudes.", "Walt Whitman"],
    ["We are such stuff as dreams are made on.", "William Shakespeare"],
    ["Beauty is truth, truth beauty.", "John Keats"],
    ["The only way out is through.", "Robert Frost"],
    ["What we call the beginning is often the end.", "T. S. Eliot"],
    ["To see a world in a grain of sand.", "William Blake"],
    ["There is a crack in everything; that's how the light gets in.", "Leonard Cohen"],
    ["The sea, once it casts its spell, holds one in its net of wonder forever.", "Jacques Cousteau"],
    ["Not all those who wander are lost.", "J. R. R. Tolkien"],
    ["Be patient toward all that is unsolved in your heart.", "Rainer Maria Rilke"],
    ["I dwell in possibility.", "Emily Dickinson"],
    ["And miles to go before I sleep.", "Robert Frost"],
    ["Whatever our souls are made of, his and mine are the same.", "Emily Brontë"],
    ["The world is too much with us.", "William Wordsworth"],
    ["Out of the ash I rise with my red hair.", "Sylvia Plath"],
    ["Still, like air, I'll rise.", "Maya Angelou"],
    ["Yesterday I was clever, so I wanted to change the world.", "Rumi"],
    ["What you seek is seeking you.", "Rumi"],
    ["The time is always right to do what is right.", "Martin Luther King Jr."],
    ["Simplicity is the ultimate sophistication.", "Leonardo da Vinci"],
    ["One must imagine Sisyphus happy.", "Albert Camus"],
    ["It is never too late to be what you might have been.", "George Eliot"],
    ["Everything you can imagine is real.", "Pablo Picasso"],
  ];

  let list = initial.slice();
  let els: { w: Widget; el: HTMLElement; tick?: (now: Date) => void }[] = [];
  const timers: ReturnType<typeof setInterval>[] = [];
  const weather: Record<string, { at: number; t: number; code: number; wind: number } | undefined> = {};
  const track = { title: "", artist: "", art: "", playing: false };
  let fps = 0;
  let sys = "";
  let alive = true;

  root.style.position = root.style.position || "absolute";
  root.style.pointerEvents = "none";
  const sizeRoot = () => {
    root.style.fontSize = Math.max(4, root.clientWidth / 100) + "px";
  };
  sizeRoot();
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(sizeRoot) : null;
  if (ro) ro.observe(root);

  function h(tag: string, css: string, text?: string) {
    const e = document.createElement(tag);
    e.style.cssText = css;
    if (text != null) e.textContent = text;
    return e;
  }
  const LABEL = "font-family:" + MONO + ";font-size:.62em;letter-spacing:.28em;text-transform:uppercase;opacity:.75";
  const pad = (n: number) => (n < 10 ? "0" : "") + n;

  function weatherWords(code: number) {
    if (code === 0) return ["Clear", "clear"];
    if (code <= 2) return ["Partly cloudy", "cloud"];
    if (code === 3) return ["Overcast", "cloud"];
    if (code === 45 || code === 48) return ["Fog", "fog"];
    if (code >= 51 && code <= 57) return ["Drizzle", "rain"];
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return ["Rain", "rain"];
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return ["Snow", "snow"];
    if (code >= 95) return ["Thunder", "storm"];
    return ["—", "clear"];
  }

  function build(w: Widget) {
    const el = h(
      "div",
      "position:absolute;left:" + w.x * 100 + "%;top:" + w.y * 100 + "%;transform:translate(-50%,-50%);font-size:" + w.size + "em;" +
        "color:#fff;mix-blend-mode:difference;font-family:" + SERIF + ";line-height:1.1;white-space:nowrap;text-align:center;user-select:none",
    );
    el.dataset.widget = w.id;
    let tick: ((now: Date) => void) | undefined;

    if (w.type === "clock") {
      const time = h("div", "font-size:6em;letter-spacing:-.02em;font-variant-numeric:tabular-nums");
      const day = h("div", LABEL + ";margin-top:.6em");
      el.append(time, day);
      tick = (now) => {
        let hr = now.getHours();
        if (!w.h24) hr = hr % 12 || 12;
        time.textContent = (w.h24 ? pad(hr) : String(hr)) + ":" + pad(now.getMinutes());
        day.textContent = DAYS[now.getDay()] + " · " + now.getDate() + " " + MONTHS[now.getMonth()];
      };
    } else if (w.type === "calendar") {
      tick = (now) => {
        el.textContent = "";
        el.append(h("div", "font-size:2em;font-style:italic;margin-bottom:.35em", MONTHS[now.getMonth()] + " " + now.getFullYear()));
        const grid = h("div", "display:grid;grid-template-columns:repeat(7,2.1em);gap:.25em .1em;font-family:" + MONO + ";font-size:.8em");
        "SMTWTFS".split("").forEach((d) => grid.append(h("div", "opacity:.55", d)));
        const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
        const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let i = 0; i < first; i++) grid.append(h("div", ""));
        for (let d = 1; d <= days; d++) {
          const today = d === now.getDate();
          grid.append(h("div", "line-height:1.9em;" + (today ? "border:1px solid #fff;border-radius:50%" : ""), String(d)));
        }
        el.append(grid);
      };
    } else if (w.type === "weather") {
      const temp = h("div", "font-size:4em;letter-spacing:-.02em");
      const sky = h("div", "font-size:1.4em;font-style:italic");
      const where = h("div", LABEL + ";margin-top:.6em", w.place || "Choose a place");
      el.append(temp, sky, where);
      tick = () => {
        const k = w.id;
        const got = weather[k];
        if (got) {
          const t = w.fahrenheit ? got.t * 1.8 + 32 : got.t;
          temp.textContent = Math.round(t) + "°";
          const words = weatherWords(got.code);
          sky.textContent = words[0] + (got.wind > 30 ? ", windy" : "");
        } else {
          temp.textContent = "—°";
          sky.textContent = w.lat == null ? "No place yet" : "Looking outside…";
        }
      };
    } else if (w.type === "countdown") {
      const n = h("div", "font-size:5em;letter-spacing:-.02em;font-variant-numeric:tabular-nums");
      const unit = h("div", "font-size:1.4em;font-style:italic");
      el.append(n, unit);
      tick = (now) => {
        const what = (w.text || "").trim();
        const target = w.date ? new Date(w.date + "T00:00:00") : null;
        if (!target || isNaN(target.getTime())) {
          n.textContent = "—";
          unit.textContent = "pick a date";
          return;
        }
        const ms = target.getTime() - now.getTime();
        const days = Math.ceil(ms / 86400000);
        if (ms <= 0) {
          n.textContent = "Today";
          unit.textContent = what || "is the day";
        } else if (days <= 1) {
          const hrs = Math.ceil(ms / 3600000);
          n.textContent = String(hrs);
          unit.textContent = (hrs === 1 ? "hour" : "hours") + (what ? " to " + what : " to go");
        } else {
          n.textContent = String(days);
          unit.textContent = "days" + (what ? " to " + what : " to go");
        }
      };
    } else if (w.type === "quote") {
      const line = h("div", "font-size:1.8em;font-style:italic;white-space:normal;max-width:16em;line-height:1.2");
      const who = h("div", LABEL + ";margin-top:.8em");
      el.append(line, who);
      tick = (now) => {
        const start = new Date(now.getFullYear(), 0, 0).getTime();
        const day = Math.floor((now.getTime() - start) / 86400000);
        const q = QUOTES[(day + now.getFullYear()) % QUOTES.length];
        line.textContent = "“" + q[0] + "”";
        who.textContent = "— " + q[1];
      };
    } else if (w.type === "note") {
      el.append(h("div", "font-size:2em;white-space:pre-wrap;max-width:18em", (w.text || "").trim() || "Write a note"));
    } else if (w.type === "music") {
      // A record that turns while something plays, with the cover as its label.
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.gap = "1em";
      el.style.textAlign = "left";
      const disc = h(
        "div",
        "width:7em;height:7em;border-radius:50%;flex:none;position:relative;background:repeating-radial-gradient(circle,#000 0 .12em,#222 .12em .24em);" +
          "box-shadow:0 0 0 1px #fff inset;animation:pied-spin 3.2s linear infinite;animation-play-state:paused",
      );
      const label = h("div", "position:absolute;inset:32%;border-radius:50%;background:#fff center/cover no-repeat;box-shadow:0 0 0 .25em #000");
      disc.append(label, h("div", "position:absolute;left:50%;top:50%;width:.4em;height:.4em;margin:-.2em;border-radius:50%;background:#000"));
      const words = h("div", "");
      const title = h("div", "font-size:1.6em;font-style:italic;max-width:12em;overflow:hidden;text-overflow:ellipsis");
      const artist = h("div", LABEL + ";margin-top:.5em");
      words.append(h("div", LABEL + ";margin-bottom:.5em", "Now playing"), title, artist);
      el.append(disc, words);
      if (!document.getElementById("pied-spin")) {
        const st = document.createElement("style");
        st.id = "pied-spin";
        st.textContent = "@keyframes pied-spin{to{transform:rotate(360deg)}}";
        document.head.append(st);
      }
      tick = () => {
        title.textContent = track.title || "Nothing yet";
        artist.textContent = track.title ? track.artist : "Plays in Lively or Wallpaper Engine";
        label.style.backgroundImage = track.art ? 'url("' + track.art.replace(/"/g, "") + '")' : "none";
        disc.style.animationPlayState = track.playing ? "running" : "paused";
      };
    } else if (w.type === "stats") {
      const box = h("div", "font-family:" + MONO + ";font-size:.9em;text-align:left;line-height:1.6");
      el.append(box);
      tick = () => {
        box.textContent = (fps ? fps + " fps" : "— fps") + (sys ? "\n" + sys : "");
        box.style.whiteSpace = "pre";
      };
    }
    root.append(el);
    return { w: w, el: el, tick: tick };
  }

  function render() {
    els.forEach((e) => e.el.remove());
    els = list.map(build);
    const now = new Date();
    els.forEach((e) => e.tick && e.tick(now));
  }

  // ── the weather ─────────────────────────────────────────────────────────
  // Open-Meteo: free, keyless, CORS-open. One request per place every 20
  // minutes, and only when a weather widget has a place.
  function fetchWeather(force?: boolean) {
    list.forEach((w) => {
      if (w.type !== "weather" || w.lat == null || w.lon == null) return;
      const k = w.id;
      const got = weather[k];
      if (!force && got && Date.now() - got.at < 20 * 60000) return;
      const url = "https://api.open-meteo.com/v1/forecast?latitude=" + w.lat.toFixed(3) + "&longitude=" + w.lon.toFixed(3) + "&current=temperature_2m,weather_code,wind_speed_10m";
      fetch(url)
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (!alive || !j || !j.current) return;
          weather[k] = { at: Date.now(), t: +j.current.temperature_2m, code: +j.current.weather_code, wind: +j.current.wind_speed_10m };
          const got2 = weather[k]!;
          const mood = got2.wind > 30 ? "wind" : weatherWords(got2.code)[1];
          if (opts.onWeather) opts.onWeather(mood as WeatherMood);
          els.forEach((e) => e.w.type === "weather" && e.tick && e.tick(new Date()));
        })
        .catch(() => {});
    });
  }

  // ── what's playing ──────────────────────────────────────────────────────
  const win = window as unknown as Record<string, unknown>;
  const refreshMusic = () => els.forEach((e) => e.w.type === "music" && e.tick && e.tick(new Date()));
  if (!opts.preview) {
    // Wallpaper Engine's media integration.
    const reg = (name: string, cb: (e: Record<string, unknown>) => void) => {
      const f = win[name];
      if (typeof f === "function") (f as (c: typeof cb) => void)(cb);
    };
    reg("wallpaperRegisterMediaPropertiesListener", (e) => {
      track.title = String(e.title || "");
      track.artist = String(e.artist || "");
      refreshMusic();
    });
    reg("wallpaperRegisterMediaThumbnailListener", (e) => {
      track.art = typeof e.thumbnail === "string" ? e.thumbnail : "";
      refreshMusic();
    });
    reg("wallpaperRegisterMediaPlaybackListener", (e) => {
      track.playing = e.state === 1;
      refreshMusic();
    });
    // Lively: calls these globals with JSON strings.
    win.livelyCurrentTrack = (data: string) => {
      try {
        const o = JSON.parse(data);
        track.title = o ? String(o.Title || "") : "";
        track.artist = o ? String(o.Artist || "") : "";
        track.art = o && o.Thumbnail ? "data:image/png;base64," + o.Thumbnail : "";
        track.playing = !!(o && o.Title);
      } catch {
        track.title = "";
        track.playing = false;
      }
      refreshMusic();
    };
    win.livelySystemInformation = (data: string) => {
      try {
        const o = JSON.parse(data);
        const parts = [];
        if (o.CurrentCpu != null) parts.push("cpu " + Math.round(o.CurrentCpu) + "%");
        if (o.CurrentGpu3D != null) parts.push("gpu " + Math.round(o.CurrentGpu3D) + "%");
        if (o.CurrentRamAvail != null) parts.push("ram " + Math.round(o.CurrentRamAvail) + " MB free");
        sys = parts.join("\n");
      } catch {
        sys = "";
      }
    };
  }

  // ── frames per second ───────────────────────────────────────────────────
  // Counted only while a stats widget is on the desktop.
  let raf = 0;
  let frames = 0;
  let since = 0;
  function count(t: number) {
    frames++;
    if (!since) since = t;
    if (t - since >= 1000) {
      fps = Math.round((frames * 1000) / (t - since));
      frames = 0;
      since = t;
      els.forEach((e) => e.w.type === "stats" && e.tick && e.tick(new Date()));
    }
    raf = requestAnimationFrame(count);
  }
  function syncStats() {
    const want = list.some((w) => w.type === "stats");
    if (want && !raf) raf = requestAnimationFrame(count);
    if (!want && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
      since = 0;
    }
  }

  render();
  fetchWeather();
  syncStats();
  // The clock, calendar and countdown change on the minute; checking every
  // second keeps them on time after the machine wakes from sleep.
  let lastMinute = -1;
  timers.push(
    setInterval(() => {
      const now = new Date();
      if (now.getMinutes() === lastMinute) return;
      lastMinute = now.getMinutes();
      els.forEach((e) => e.w.type !== "music" && e.w.type !== "stats" && e.w.type !== "weather" && e.tick && e.tick(now));
    }, 1000),
  );
  if (!opts.preview) timers.push(setInterval(() => fetchWeather(), 5 * 60000));

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
      if (ro) ro.disconnect();
      els.forEach((e) => e.el.remove());
      els = [];
      if (win.livelyCurrentTrack) win.livelyCurrentTrack = undefined;
      if (win.livelySystemInformation) win.livelySystemInformation = undefined;
    },
  };
}
