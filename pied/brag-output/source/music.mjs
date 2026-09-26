// The soundtrack, synthesised: a slow piano-and-pad progression in A minor,
// with the effects (typewriter patter, key-clacks, a paper rustle, a swell
// and a bell) tuned to the same key and mixed under the music.
import fs from "node:fs";

const SR = 44100;
const DUR = 21;
const N = SR * DUR;
const L = new Float32Array(N);
const R = new Float32Array(N);
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

function add(t0, fn, len, pan = 0, gain = 1) {
  const s0 = Math.floor(t0 * SR);
  const n = Math.floor(len * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < n && s0 + i < N; i++) {
    if (s0 + i < 0) continue;
    const v = fn(i / SR);
    L[s0 + i] += v * gl;
    R[s0 + i] += v * gr;
  }
}

// ── instruments ──
function piano(t0, midi, vel, pan) {
  const f = hz(midi);
  add(t0, (t) => {
    const env = Math.min(1, t / 0.004) * Math.exp(-t * 2.2);
    return env * (Math.sin(2 * Math.PI * f * t) * 0.6 + Math.sin(4 * Math.PI * f * t) * 0.22 * Math.exp(-t * 3) + Math.sin(6 * Math.PI * f * t) * 0.08 * Math.exp(-t * 5));
  }, 2.6, pan, vel);
}
function pad(t0, len, midis, vel) {
  for (const m of midis)
    for (const d of [-0.07, 0.07]) {
      const f = hz(m) * Math.pow(2, d / 12);
      add(t0, (t) => {
        const env = Math.min(1, t / 0.9) * Math.min(1, (len - t) / 0.8);
        // soft triangle, a little breath
        const ph = (f * t) % 1;
        const tri = 4 * Math.abs(ph - 0.5) - 1;
        return env * (tri * 0.5 + Math.sin(2 * Math.PI * f * t) * 0.5);
      }, len, d < 0 ? -0.5 : 0.5, vel / midis.length);
    }
}
function bass(t0, midi, len, vel) {
  const f = hz(midi);
  add(t0, (t) => Math.min(1, t / 0.02) * Math.exp(-t * 0.9) * Math.min(1, (len - t) / 0.2) * (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t)), len, 0, vel);
}
function pulse(t0, vel) {
  add(t0, (t) => {
    const f = 55 + 70 * Math.exp(-t * 30);
    return Math.exp(-t * 14) * Math.sin(2 * Math.PI * f * t);
  }, 0.35, 0, vel);
}
// Filtered noise: a one-pole band around `centre`.
function noise(t0, len, centre, q, envFn, pan, vel) {
  let lp = 0, bp = 0;
  const w = 2 * Math.sin((Math.PI * centre) / SR);
  add(t0, (t) => {
    const x = rnd() * 2 - 1;
    lp += w * bp;
    const hp = x - lp - q * bp;
    bp += w * hp;
    return bp * envFn(t);
  }, len, pan, vel);
}
function click(t0, vel, pan) {
  noise(t0, 0.05, 2800 + rnd() * 1600, 0.7, (t) => Math.exp(-t * 90), pan, vel);
  add(t0, (t) => Math.exp(-t * 60) * Math.sin(2 * Math.PI * 180 * t), 0.06, pan, vel * 0.5);
}
function clack(t0, vel) {
  // a type key hitting, pitched to A
  click(t0, vel, (rnd() - 0.5) * 0.4);
  add(t0, (t) => Math.exp(-t * 18) * Math.sin(2 * Math.PI * hz(81) * t) * 0.35, 0.3, 0, vel * 0.5);
}
function bell(t0, midi, vel) {
  const f = hz(midi);
  add(t0, (t) => Math.min(1, t / 0.003) * (Math.exp(-t * 0.9) * Math.sin(2 * Math.PI * f * t) + 0.4 * Math.exp(-t * 1.6) * Math.sin(2 * Math.PI * f * 2.76 * t) + 0.2 * Math.exp(-t * 3) * Math.sin(2 * Math.PI * f * 5.4 * t)), 4, 0, vel);
}

// ── the music ──
const BAR = 2.4; // 100 bpm, four beats
const CHORDS = [
  [57, [57, 60, 64]], // Am
  [57, [57, 60, 64]], // Am
  [53, [53, 57, 60]], // F
  [48, [55, 60, 64]], // C
  [55, [55, 59, 62]], // G
  [57, [57, 60, 64]], // Am
  [53, [53, 57, 60, 64]], // Fmaj7
  [48, [55, 60, 64, 67]], // C, the outro
];
CHORDS.forEach(([root, tones], b) => {
  const t = b * BAR;
  const last = b === CHORDS.length - 1;
  const len = last ? DUR - t : BAR + 0.6;
  pad(t, len, tones.map((m) => m - 12), 0.05);
  if (b >= 1) bass(t, root - 24, Math.min(len, BAR + 0.3), 0.16);
  // the piano: a quiet broken chord, eighth notes, from the second second
  if (t + BAR > 1.0 && !last) {
    const arp = [tones[0] + 12, tones[1] + 12, tones[2] + 12, tones[1] + 12 + (tones[3] ? 0 : 12)];
    for (let k = 0; k < 8; k++) {
      const at = t + k * (BAR / 8);
      if (at < 1.0) continue;
      piano(at, arp[k % arp.length] + (k >= 4 ? 0 : 0), k % 4 === 0 ? 0.11 : 0.07, k % 2 ? 0.3 : -0.3);
    }
  }
  // a soft pulse on beats one and three, from scene two to the outro
  if (t >= 2.4 && !last) {
    pulse(t, 0.22);
    pulse(t + BAR / 2, 0.14);
  }
});
// outro: the chord struck once, on the piano, and left to ring
[48, 55, 60, 64, 67, 72].forEach((m, i) => piano(17.0 + i * 0.035, m, 0.13, (i - 2.5) * 0.15));

// ── the effects, under the music ──
// the painting dissolving: typewriter patter, dense then thinning
for (let k = 0; k < 22; k++) click(0.5 + Math.pow(k / 22, 1.6) * 1.3 + rnd() * 0.02, 0.1 * (1 - k / 30), (rnd() - 0.5) * 0.8);
// each style change
for (const t of [3.4, 4.3, 5.0, 6.2, 7.2]) clack(t, 0.16);
// the king assembling
for (let k = 0; k < 16; k++) click(8.55 + Math.pow(k / 16, 1.5) * 1.0 + rnd() * 0.02, 0.08, (rnd() - 0.5) * 0.8);
// the hand through the type: a paper rustle that follows the cursor's speed
noise(9.3, 2.6, 2400, 0.9, (t) => 0.5 * Math.abs(Math.cos((t / 2.6) * Math.PI * 2)) * Math.min(1, t / 0.2) * Math.min(1, (2.6 - t) / 0.3), 0, 0.12);
// into the desktop: a short airy whoosh
noise(12.1, 0.7, 1200, 1.2, (t) => Math.sin((t / 0.7) * Math.PI) ** 2, 0, 0.1);
// the wallpaper noticing the cursor
noise(14.2, 1.7, 3000, 0.9, (t) => 0.4 * Math.sin((t / 1.7) * Math.PI), 0.2, 0.08);
// swell into the outro, and a bell on the name
noise(16.0, 1.0, 900, 1.0, (t) => (t / 1.0) ** 3, 0, 0.12);
bell(17.0, 81, 0.12);

// ── master: gentle high cut, soft limiter, fade ──
let pl = 0, pr = 0;
let peak = 0;
for (let i = 0; i < N; i++) {
  pl += 0.55 * (L[i] - pl);
  pr += 0.55 * (R[i] - pr);
  L[i] = pl;
  R[i] = pr;
  peak = Math.max(peak, Math.abs(pl), Math.abs(pr));
}
const g = 0.9 / peak;
const out = Buffer.alloc(44 + N * 4);
out.write("RIFF", 0);
out.writeUInt32LE(36 + N * 4, 4);
out.write("WAVEfmt ", 8);
out.writeUInt32LE(16, 16);
out.writeUInt16LE(1, 20);
out.writeUInt16LE(2, 22);
out.writeUInt32LE(SR, 24);
out.writeUInt32LE(SR * 4, 28);
out.writeUInt16LE(4, 32);
out.writeUInt16LE(16, 34);
out.write("data", 36);
out.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const fade = Math.min(1, i / (SR * 0.05), (N - i) / (SR * 1.2));
  const l = Math.tanh(L[i] * g * 1.2) * fade;
  const r = Math.tanh(R[i] * g * 1.2) * fade;
  out.writeInt16LE(Math.round(l * 32000), 44 + i * 4);
  out.writeInt16LE(Math.round(r * 32000), 46 + i * 4);
}
fs.writeFileSync(process.argv[2] || "music.wav", out);
console.log("peak", peak.toFixed(3));
