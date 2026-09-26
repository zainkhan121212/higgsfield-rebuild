"use client";

// The sound of loose type, synthesised (no files to download): a typewriter
// key, metal sorts clinking against each other like a chain, or a sheet of
// paper. Every letter the cursor knocks loose asks for a sound; they are
// thinned to a few dozen a second and the louder the faster you move.
// Scrolling ticks too, softly. Off until the visitor picks one, and the
// browser only lets it start after a click or a key.

export type Voice = "off" | "typewriter" | "chains" | "paper";
export const VOICES: { value: Voice; label: string }[] = [
  { value: "off", label: "Off" },
  { value: "typewriter", label: "Typewriter" },
  { value: "chains", label: "Chains" },
  { value: "paper", label: "Paper" },
];

const KEY = "pied:sound";
let voice: Voice = "off";
let ctx: AudioContext | null = null;
let out: GainNode | null = null;
let noise: AudioBuffer | null = null;
let next = 0;
let scrollAt = 0;
const subs = new Set<(v: Voice) => void>();

export function getVoice(): Voice {
  return voice;
}

export function onVoice(fn: (v: Voice) => void) {
  subs.add(fn);
  return () => void subs.delete(fn);
}

function audio() {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  out = ctx.createGain();
  out.gain.value = 0.5;
  // A little compression so a flurry of letters never clips.
  const comp = ctx.createDynamicsCompressor();
  out.connect(comp).connect(ctx.destination);
  noise = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

function env(c: AudioContext, g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function burst(c: AudioContext, t: number, len: number, type: BiquadFilterType, freq: number, q: number, peak: number, attack = 0.002) {
  const src = c.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  env(c, g, t, peak, attack, len);
  src.connect(f).connect(g).connect(out!);
  src.start(t, Math.random() * 0.3, attack + len + 0.02);
}

function tone(c: AudioContext, t: number, f: number, len: number, peak: number, type: OscillatorType = "sine") {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.value = f;
  const g = c.createGain();
  env(c, g, t, peak, 0.001, len);
  o.connect(g).connect(out!);
  o.start(t);
  o.stop(t + len + 0.05);
}

function play(level: number) {
  const c = ctx;
  if (!c || !out || c.state !== "running") return;
  const t = c.currentTime + 0.005;
  const v = Math.min(1, Math.max(0.08, level));
  if (voice === "typewriter") {
    burst(c, t, 0.025, "bandpass", 2600 + Math.random() * 1400, 1.2, 0.5 * v);
    tone(c, t, 140 + Math.random() * 40, 0.035, 0.25 * v, "triangle");
  } else if (voice === "chains") {
    // Metal type on metal: inharmonic partials, a bright short ring.
    const f0 = 1700 + Math.random() * 1600;
    tone(c, t, f0, 0.16 + Math.random() * 0.1, 0.14 * v);
    tone(c, t, f0 * 2.76, 0.09, 0.07 * v);
    tone(c, t, f0 * 5.4, 0.05, 0.04 * v);
    burst(c, t, 0.012, "highpass", 5000, 0.7, 0.18 * v);
  } else if (voice === "paper") {
    burst(c, t, 0.07 + Math.random() * 0.05, "bandpass", 2200 + Math.random() * 2600, 0.6, 0.28 * v, 0.012);
  }
}

/** The engine calls this with how many letters it just knocked loose. */
function hit(n: number) {
  const now = performance.now();
  if (now < next) return;
  // Up to ~30 a second; the more letters at once, the louder.
  next = now + 33 + Math.random() * 20;
  play(Math.min(1, n / 18));
}

function onScroll() {
  const y = window.scrollY;
  if (Math.abs(y - scrollAt) < 140) return;
  scrollAt = y;
  play(0.18);
}

function resume() {
  const c = audio();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}

export function setVoice(v: Voice, sample = true) {
  voice = v;
  try {
    localStorage.setItem(KEY, v);
  } catch {}
  const w = window as unknown as { __piedHit?: (n: number) => void };
  if (v === "off") {
    w.__piedHit = undefined;
    window.removeEventListener("scroll", onScroll);
  } else {
    w.__piedHit = hit;
    scrollAt = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });
    if (sample) {
      resume();
      // A sample, so choosing a sound answers straight away.
      setTimeout(() => play(0.6), 30);
    }
  }
  subs.forEach((f) => f(v));
}

/** Pick up the visitor's last choice; the audio itself waits for a gesture. */
export function restoreVoice() {
  let v: Voice = "off";
  try {
    const s = localStorage.getItem(KEY);
    if (s && VOICES.some((x) => x.value === s)) v = s as Voice;
  } catch {}
  if (v === voice) return;
  setVoice(v, false);
  if (v !== "off") {
    const first = () => {
      resume();
      window.removeEventListener("pointerdown", first);
      window.removeEventListener("keydown", first);
    };
    window.addEventListener("pointerdown", first);
    window.addEventListener("keydown", first);
  }
}
