import type { ClockOptions } from "./clock";
import type { FieldController, FieldData, FieldOptions } from "./field";

// What a wallpaper does over time: stay one picture, morph through a
// slideshow, or keep the time. It also answers music, when the host passes
// audio in (Wallpaper Engine and Lively both do).
//
// Self-contained like createField: the exported file embeds
// `runWallpaper.toString()`, and the site's full-screen preview calls the
// same function, so what you preview is what you download.

export type WallpaperKind = "picture" | "slideshow" | "clock";

export type WallpaperRun = {
  kind: WallpaperKind;
  /** seconds between pictures in a slideshow */
  every: number;
  /** throw letters on the beat */
  audio: boolean;
  clock: ClockOptions;
  field: FieldOptions;
};

export type WallpaperHandle = {
  field: FieldController;
  /** feed audio levels (0..1 per band, low bands first) */
  hear(levels: ArrayLike<number>): void;
  /** the weather outside: rain and snow shake the type now and then, wind stirs it */
  weather(mood: string): void;
  destroy(): void;
};

type Make = (canvas: HTMLCanvasElement, d: FieldData, o: FieldOptions) => FieldController;
type Clock = (now: Date, o: ClockOptions) => FieldData;

export function runWallpaper(canvas: HTMLCanvasElement, plates: FieldData[], o: WallpaperRun, createField: Make, clockPlate: Clock): WallpaperHandle {
  const kind = o.kind;
  let idx = 0;
  let timer: ReturnType<typeof setInterval> | 0 = 0;
  const first = kind === "clock" ? clockPlate(new Date(), o.clock) : plates[0];
  const field = createField(canvas, first, o.field);

  if (kind === "slideshow" && plates.length > 1) {
    timer = setInterval(function () {
      if (document.hidden) return;
      idx = (idx + 1) % plates.length;
      field.morph(plates[idx]);
    }, Math.max(5, o.every) * 1000);
  }
  if (kind === "clock") {
    const t0 = new Date();
    let last = t0.getHours() * 60 + t0.getMinutes();
    timer = setInterval(function () {
      const now = new Date();
      const key = now.getHours() * 60 + now.getMinutes();
      if (key === last) return;
      last = key;
      field.morph(clockPlate(now, o.clock));
    }, 1000);
  }

  // Beat detection: the low bands against their own running average. A
  // spike well above the average is a beat; the size of the spike is how
  // hard the letters are thrown.
  let avg = 0;
  let cool = 0;
  function hear(levels: ArrayLike<number>) {
    const n = Math.min(8, levels.length);
    if (!n) return;
    let b = 0;
    for (let i = 0; i < n; i++) b += levels[i];
    b /= n;
    const now = Date.now();
    if (b > avg * 1.35 && b > 0.06 && now > cool) {
      field.kick(Math.min(1, (b - avg) * 4 + 0.2));
      cool = now + 90;
    }
    avg = avg * 0.92 + b * 0.08;
  }

  // Weather in the letters: a shower is a small throw every few seconds, a
  // storm a harder one, wind the idle drift. Calm weather leaves them be.
  let rain: ReturnType<typeof setInterval> | 0 = 0;
  let windy = false;
  function weather(mood: string) {
    if (rain) clearInterval(rain);
    rain = 0;
    const hard = mood === "storm" ? 0.7 : mood === "rain" ? 0.28 : mood === "snow" ? 0.16 : 0;
    if (hard)
      rain = setInterval(function () {
        if (!document.hidden) field.kick(hard * (0.6 + Math.random() * 0.4));
      }, mood === "snow" ? 5200 : 3400);
    const nowWindy = mood === "wind";
    if (nowWindy !== windy && !o.field.drift) field.setDrift(nowWindy);
    windy = nowWindy;
  }

  const w = window as unknown as {
    wallpaperRegisterAudioListener?: (cb: ((a: number[]) => void) | null) => void;
    livelyAudioListener?: (a: number[]) => void;
  };
  if (o.audio) {
    // Wallpaper Engine: 128 values, 64 per channel, low frequencies first.
    if (w.wallpaperRegisterAudioListener) w.wallpaperRegisterAudioListener(hear);
    // Lively (web-audio wallpapers): calls this global with the spectrum.
    w.livelyAudioListener = hear;
  }

  return {
    field: field,
    hear: hear,
    weather: weather,
    destroy: function () {
      if (timer) clearInterval(timer);
      if (rain) clearInterval(rain);
      if (o.audio) {
        if (w.wallpaperRegisterAudioListener) w.wallpaperRegisterAudioListener(null);
        if (w.livelyAudioListener === hear) w.livelyAudioListener = undefined;
      }
      field.destroy();
    },
  };
}
