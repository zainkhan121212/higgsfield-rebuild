import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "./theme";

const C = theme.colors;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ── timeline (frames at 30 fps) ────────────────────────────────────────────
export const SCENES = {
  hook: { from: 0, dur: 90 },
  sources: { from: 90, dur: 210 },
  set: { from: 300, dur: 99 },
  light: { from: 399, dur: 140 },
  paint: { from: 539, dur: 150 },
  touch: { from: 689, dur: 96 },
  desk: { from: 785, dur: 150 },
  keep: { from: 935, dur: 84 },
  craft: { from: 1019, dur: 72 },
  outro: { from: 1091, dur: 90 },
} as const;
export const TOTAL = 1181;

// ── layers ─────────────────────────────────────────────────────────────────
const BgMesh: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const f = useCurrentFrame();
  const d1 = Math.sin(f / 55) * 60;
  const d2 = Math.cos(f / 70) * 50;
  const base = dark ? C.night : C.paper;
  const blob = dark ? "rgba(244,243,238,0.07)" : "rgba(12,12,11,0.07)";
  return (
    <AbsoluteFill style={{ background: base }}>
      <div style={{ position: "absolute", width: 1400, height: 1400, borderRadius: "50%", top: -520, left: -420 + d1, filter: "blur(60px)", background: `radial-gradient(circle, ${blob}, transparent 62%)` }} />
      <div style={{ position: "absolute", width: 1100, height: 1100, borderRadius: "50%", bottom: -420, right: -360 - d2, filter: "blur(80px)", background: `radial-gradient(circle, ${blob}, transparent 65%)` }} />
    </AbsoluteFill>
  );
};

const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundColor: "#d9b98a", mixBlendMode: "soft-light", opacity: 0.12 }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.08), transparent 26%, transparent 74%, rgba(0,0,0,0.14))" }} />
  </AbsoluteFill>
);

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  const noise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`;
  return <AbsoluteFill style={{ pointerEvents: "none", backgroundImage: noise, backgroundSize: "220px", backgroundPosition: `${(f * 7) % 220}px ${(f * 13) % 220}px`, opacity: 0.07, mixBlendMode: "multiply" }} />;
};
const Vignette: React.FC = () => <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,0.22) 100%)" }} />;

// ── motion primitives ──────────────────────────────────────────────────────
const useIn = (delay: number, cfg: keyof typeof theme.spring = "smooth") => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - delay, fps, config: theme.spring[cfg] });
};

/** Scene wrapper: the whole scene leaves faster than it came (10 frames). */
const Scene: React.FC<{ dur: number; dark?: boolean; children: React.ReactNode }> = ({ dur, dark, children }) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [dur - 10, dur], [0, 1], { ...clamp, easing: theme.ease.in });
  return (
    <AbsoluteFill>
      <BgMesh dark={dark} />
      <AbsoluteFill style={{ opacity: 1 - out, transform: `translateY(${-out * 50}px) scale(${1 - out * 0.03})`, filter: `blur(${out * 6}px)`, color: dark ? C.paper : C.ink }}>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Words: React.FC<{ text: string; delay?: number; size: number; italic?: boolean; hero?: string; per?: number }> = ({ text, delay = 0, size, italic, hero, per = 3 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", columnGap: size * 0.24, fontFamily: italic ? theme.fonts.text : theme.fonts.display, fontStyle: italic ? "italic" : "normal", fontSize: size, lineHeight: 1.02, letterSpacing: italic ? "-0.035em" : "-0.02em" }}>
      {text.split(" ").map((w, i) => {
        const p = spring({ frame: f - delay - i * per, fps, config: theme.spring.snappy });
        const isHero = hero && w.replace(/[.,]/g, "") === hero;
        const u = spring({ frame: f - delay - i * per - 6, fps, config: theme.spring.smooth });
        return (
          <span key={i} style={{ position: "relative", display: "inline-block", opacity: p, transform: `translateY(${interpolate(p, [0, 1], [42, 0])}px) scale(${interpolate(p, [0, 1], [0.96, 1])})` }}>
            {w}
            {isHero ? <span style={{ position: "absolute", left: 0, right: 0, bottom: size * 0.02, height: Math.max(4, size * 0.05), background: C.hero, transformOrigin: "left", transform: `scaleX(${u})` }} /> : null}
          </span>
        );
      })}
    </div>
  );
};

const Kicker: React.FC<{ n: string; text: string; delay?: number }> = ({ n, text, delay = 0 }) => {
  const p = useIn(delay, "snappy");
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "center", fontFamily: theme.fonts.mono, fontSize: 24, letterSpacing: "0.26em", textTransform: "uppercase", opacity: p * 0.8, transform: `translateX(${(1 - p) * -30}px)` }}>
      <span style={{ fontWeight: 700 }}>{n}</span>
      <span style={{ width: 60 * p, height: 2, background: "currentColor" }} />
      <span>{text}</span>
    </div>
  );
};

const Chip: React.FC<{ label: string; delay: number; active?: boolean; dark?: boolean }> = ({ label, delay, active, dark }) => {
  const p = useIn(delay, "snappy");
  const fg = dark ? C.paper : C.ink;
  return (
    <span
      style={{
        display: "inline-block",
        fontFamily: theme.fonts.mono,
        fontWeight: 700,
        fontSize: 25,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        padding: "12px 20px",
        borderRadius: 999,
        border: `2px solid ${active ? C.hero : fg}`,
        background: active ? C.hero : "transparent",
        color: active ? C.paper : fg,
        opacity: p,
        transform: `translateY(${(1 - p) * 26}px) scale(${0.9 + p * 0.1 + (active ? 0.04 : 0)})`,
        transition: "none",
      }}
    >
      {label}
    </span>
  );
};

const Chips: React.FC<{ items: string[]; delay: number; active?: number; dark?: boolean; top: number }> = ({ items, delay, active, dark, top }) => (
  <div style={{ position: "absolute", left: 70, right: 70, top, display: "flex", flexWrap: "wrap", gap: 14 }}>
    {items.map((it, i) => (
      <Chip key={it} label={it} delay={delay + i * 4} active={active === i} dark={dark} />
    ))}
  </div>
);

/** A real screen recording in a card, with a slow camera over it. */
type Focus = { at: number; x: number; y: number; s: number };
const Screen: React.FC<{ src: string; trimBefore: number; rate?: number; focus: Focus[]; w: number; h: number; top: number; delay?: number; aspect?: number }> = ({ src, trimBefore, rate = 1, focus, w, h, top, delay = 0, aspect = 1.6 }) => {
  const f = useCurrentFrame();
  const p = useIn(delay, "smooth");
  const at = (k: "x" | "y" | "s") =>
    focus.length === 1 ? focus[0][k] : interpolate(f, focus.map((q) => q.at), focus.map((q) => q[k]), { ...clamp, easing: theme.ease.inOut });
  const s = at("s");
  const vw = w * s;
  const vh = (w / aspect) * s;
  const x = -(vw * at("x") - w / 2);
  const y = -(vh * at("y") - h / 2);
  const float = Math.sin(f / 30) * 4;
  return (
    <div style={{ position: "absolute", left: (1080 - w) / 2, top: top + float, width: w, height: h, borderRadius: 28, overflow: "hidden", border: `1px solid ${C.rule}`, boxShadow: "0 50px 90px -30px rgba(0,0,0,0.45)", background: C.paper2, opacity: p, transform: `translateY(${(1 - p) * 60}px) scale(${0.94 + p * 0.06})` }}>
      <div style={{ position: "absolute", left: Math.min(0, Math.max(w - vw, x)), top: Math.min(0, Math.max(h - vh, y)), width: vw, height: vh }}>
        <OffthreadVideo src={staticFile(src)} trimBefore={trimBefore} playbackRate={rate} muted style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
};

/** The engine's own footage, full width, no chrome. */
const Plate: React.FC<{ src: string; trimBefore?: number; rate?: number; top: number; size?: number; delay?: number; zoomTo?: number; dur: number }> = ({ src, trimBefore = 0, rate = 1, top, size = 1000, delay = 0, zoomTo = 1.06, dur }) => {
  const f = useCurrentFrame();
  const p = useIn(delay, "smooth");
  const k = interpolate(f, [0, dur], [1, zoomTo], { ...clamp, easing: theme.ease.inOut });
  return (
    <div style={{ position: "absolute", left: (1080 - size) / 2, top, width: size, height: size, overflow: "hidden", opacity: p, transform: `scale(${(0.95 + p * 0.05) * k})` }}>
      <OffthreadVideo src={staticFile(src)} trimBefore={trimBefore} playbackRate={rate} muted style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

const Label: React.FC<{ text: string; top: number; delay?: number; dark?: boolean }> = ({ text, top, delay = 0, dark }) => {
  const p = useIn(delay, "snappy");
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top, fontFamily: theme.fonts.mono, fontSize: 24, letterSpacing: "0.24em", textTransform: "uppercase", color: dark ? C.paper : C.ink2, opacity: p, transform: `translateY(${(1 - p) * 16}px)` }}>
      {text}
    </div>
  );
};

/** A timed label that swaps as the footage changes: out fast, in on a spring. */
const Steps: React.FC<{ steps: { at: number; text: string }[]; top: number; dark?: boolean; chipsFrom?: string[] }> = ({ steps, top, dark }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const i = Math.max(0, steps.filter((s) => f >= s.at).length - 1);
  const st = steps[i];
  const p = spring({ frame: f - st.at, fps, config: theme.spring.snappy });
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top, display: "flex", alignItems: "baseline", gap: 22, color: dark ? C.paper : C.ink }}>
      <span style={{ fontFamily: theme.fonts.mono, fontSize: 26, letterSpacing: "0.2em", opacity: 0.6 }}>{String(i + 1).padStart(2, "0")}</span>
      <span style={{ fontFamily: theme.fonts.text, fontStyle: "italic", fontSize: 58, letterSpacing: "-0.02em", opacity: p, transform: `translateY(${(1 - p) * 24}px)`, display: "inline-block" }}>{st.text}</span>
    </div>
  );
};

/** Progress rail: eight ticks, one per feature, across the top. */
const Rail: React.FC = () => {
  const f = useCurrentFrame();
  const marks = [SCENES.sources, SCENES.set, SCENES.light, SCENES.paint, SCENES.touch, SCENES.desk, SCENES.keep, SCENES.craft];
  const start = SCENES.sources.from;
  const end = SCENES.outro.from;
  if (f < start - 10 || f > end) return null;
  const vis = interpolate(f, [start - 10, start, end - 10, end], [0, 1, 1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top: 120, height: 4, display: "flex", gap: 8, opacity: vis }}>
      {marks.map((m, i) => {
        const k = interpolate(f, [m.from, m.from + m.dur], [0, 1], clamp);
        const dark = f >= SCENES.light.from && f < SCENES.light.from + SCENES.light.dur;
        return (
          <div key={i} style={{ flex: 1, background: dark ? "rgba(244,243,238,0.2)" : "rgba(12,12,11,0.12)", overflow: "hidden" }}>
            <div style={{ width: `${k * 100}%`, height: "100%", background: dark ? C.paper : C.ink }} />
          </div>
        );
      })}
    </div>
  );
};

const Mark: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <div style={{ position: "absolute", top: 58, left: 70, right: 70, display: "flex", justifyContent: "space-between", fontFamily: theme.fonts.mono, fontSize: 21, letterSpacing: "0.28em", textTransform: "uppercase", color: dark ? C.paper : C.ink, opacity: 0.7 }}>
    <span>Pied</span>
    <span>Nº 001 — a letterpress for pictures</span>
  </div>
);

// ── scenes ─────────────────────────────────────────────────────────────────
const Hook: React.FC = () => {
  const f = useCurrentFrame();
  // the painting, then its letters, in the first second
  const wipe = interpolate(f, [12, 34], [0, 100], { ...clamp, easing: theme.ease.inOut });
  const k = interpolate(f, [0, 90], [1.08, 1], { ...clamp, easing: theme.ease.out });
  const dark = f > 14;
  return (
    <Scene dur={SCENES.hook.dur} dark={dark}>
      <Mark dark={dark} />
      <div style={{ position: "absolute", left: 40, top: 700, width: 1000, height: 1000, overflow: "hidden", transform: `scale(${k})` }}>
        <OffthreadVideo src={staticFile("clips/hook.mp4")} muted style={{ width: "100%", height: "100%" }} />
        <Img src={staticFile("img/senate.jpg")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", clipPath: `inset(${wipe}% 0 0 0)` }} />
        <div style={{ position: "absolute", left: 0, right: 0, top: `${wipe}%`, height: 3, background: C.hero, opacity: wipe > 0 && wipe < 100 ? 1 : 0 }} />
      </div>
      <div style={{ position: "absolute", left: 70, right: 70, top: 200 }}>
        <Words text="Pictures," size={150} delay={16} />
        <Words text="set in" size={150} delay={22} />
        <Words text="loose type." size={150} delay={28} italic hero="loose" />
      </div>
    </Scene>
  );
};

const Sources: React.FC = () => {
  const f = useCurrentFrame();
  const step = f < 132 ? 0 : 1;
  return (
    <Scene dur={SCENES.sources.dur}>
      <Mark />
      <div style={{ position: "absolute", left: 70, right: 70, top: 190 }}>
        <Kicker n="01" text="Source" delay={2} />
        <div style={{ marginTop: 30 }}>
          <Words text="Bring a picture." size={112} delay={4} />
          <Words text="Three ways in." size={112} delay={10} italic hero="Three" />
        </div>
      </div>
      <Sequence from={0} durationInFrames={54} layout="none">
        <Screen src="clips/write.mp4" trimBefore={108} rate={2} w={980} h={700} top={620} delay={4} focus={[{ at: 0, x: 0.16, y: 0.3, s: 2.1 }, { at: 44, x: 0.2, y: 0.34, s: 1.9 }]} />
      </Sequence>
      <Sequence from={54} durationInFrames={78} layout="none">
        <Screen src="clips/write.mp4" trimBefore={297} rate={1.2} w={980} h={700} top={620} focus={[{ at: 0, x: 0.6, y: 0.5, s: 1.3 }, { at: 78, x: 0.6, y: 0.5, s: 1.42 }]} />
      </Sequence>
      <Sequence from={132} durationInFrames={78} layout="none">
        <Screen src="clips/draw.mp4" trimBefore={72} rate={2.8} w={980} h={700} top={620} delay={0} focus={[{ at: 0, x: 0.14, y: 0.34, s: 2.0 }, { at: 46, x: 0.14, y: 0.34, s: 2.0 }, { at: 70, x: 0.58, y: 0.48, s: 1.35 }]} />
      </Sequence>
      <Steps top={1370} steps={[{ at: 6, text: "Write it. FLUX paints it." }, { at: 132, text: "Draw it with your finger" }, { at: 176, text: "…or upload any photo" }]} />
      <Chips top={1480} delay={16} active={f < 132 ? 0 : f < 176 ? 1 : 2} items={["Write", "Draw", "Upload · paste"]} />
      <div style={{ position: "absolute", left: 70, top: 1600, fontFamily: theme.fonts.mono, fontSize: 22, letterSpacing: "0.18em", textTransform: "uppercase", color: C.ink3, opacity: step ? 0 : 1 }}>
        typed live · generated in seconds · set in type
      </div>
    </Scene>
  );
};

const SetScene: React.FC = () => {
  const f = useCurrentFrame();
  const faces = ["Mono", "Typewriter", "Serif"];
  return (
    <Scene dur={SCENES.set.dur}>
      <Mark />
      <div style={{ position: "absolute", left: 70, right: 70, top: 190 }}>
        <Kicker n="02" text="Set" />
        <div style={{ marginTop: 30 }}>
          <Words text="Set it" size={120} delay={2} />
          <Words text="your way." size={120} delay={7} italic hero="way" />
        </div>
      </div>
      <Screen src="clips/set.mp4" trimBefore={114} rate={1.4} w={980} h={720} top={600} delay={2} focus={[{ at: 0, x: 0.55, y: 0.5, s: 1.3 }, { at: 99, x: 0.58, y: 0.5, s: 1.42 }]} />
      <Chips top={1400} delay={14} active={Math.min(2, Math.floor(f / 24))} items={[...faces, "Your words", "Density ramp", "60–240 columns", "Light · dark paper"]} />
    </Scene>
  );
};

const Light: React.FC = () => (
  <Scene dur={SCENES.light.dur} dark>
    <Mark dark />
    <div style={{ position: "absolute", left: 70, right: 70, top: 190 }}>
      <Kicker n="03" text="Light" />
      <div style={{ marginTop: 30 }}>
        <Words text="Any picture," size={124} delay={2} />
        <Words text="in any light." size={124} delay={8} italic hero="light" />
      </div>
    </div>
    <Plate src="clips/lights.mp4" trimBefore={10} top={620} dur={SCENES.light.dur} />
    <Steps
      dark
      top={1660}
      steps={[
        { at: 0, text: "In colour" },
        { at: 21, text: "Neon" },
        { at: 42, text: "LED board — amber" },
        { at: 78, text: "LED board — green" },
        { at: 108, text: "LED board — full colour" },
      ]}
    />
  </Scene>
);

const Paint: React.FC = () => {
  const f = useCurrentFrame();
  const at = [0, 34, 65, 96, 127];
  const i = at.filter((a) => f >= a).length - 1;
  return (
    <Scene dur={SCENES.paint.dur}>
      <Mark />
      <div style={{ position: "absolute", left: 70, right: 70, top: 190 }}>
        <Kicker n="04" text="Paint" />
        <div style={{ marginTop: 30 }}>
          <Words text="Paint on" size={120} delay={2} />
          <Words text="the letters." size={120} delay={7} italic hero="letters" />
        </div>
      </div>
      <Screen src="clips/paint.mp4" trimBefore={108} rate={2.85} w={980} h={760} top={590} delay={2} focus={[{ at: 0, x: 0.6, y: 0.5, s: 1.32 }, { at: 150, x: 0.6, y: 0.5, s: 1.4 }]} />
      <Chips top={1410} delay={10} active={i} items={["Brush", "Spray", "Word brush", "Neon", "Stamps", "Foil"]} />
      <Label top={1560} delay={20} text="paint stays on the letters · undo · redo" />
    </Scene>
  );
};

const Touch: React.FC = () => (
  <Scene dur={SCENES.touch.dur}>
    <Mark />
    <div style={{ position: "absolute", left: 70, right: 70, top: 190 }}>
      <Kicker n="05" text="Touch" />
      <div style={{ marginTop: 30 }}>
        <Words text="Touch it." size={132} delay={2} />
        <Words text="It scatters." size={132} delay={8} italic hero="scatters" />
      </div>
    </div>
    <Plate src="clips/scatter.mp4" trimBefore={5} top={640} dur={SCENES.touch.dur} zoomTo={1.04} />
    <Label top={1680} delay={16} text="every letter on a spring · 60 frames a second" />
  </Scene>
);

const Desk: React.FC = () => {
  const f = useCurrentFrame();
  const float = Math.sin(f / 26) * 5;
  return (
    <Scene dur={SCENES.desk.dur}>
      <Mark />
      <div style={{ position: "absolute", left: 70, right: 70, top: 190 }}>
        <Kicker n="06" text="Desktop" />
        <div style={{ marginTop: 30 }}>
          <Words text="Your desktop," size={120} delay={2} />
          <Words text="awake." size={120} delay={8} italic hero="awake" />
        </div>
      </div>
      {/* the monitor, running the downloaded wallpaper */}
      <div style={{ position: "absolute", left: 50, top: 600 + float, width: 980 }}>
        <div style={{ background: C.ink, borderRadius: 24, padding: 14, boxShadow: "0 60px 90px -40px rgba(0,0,0,.55)" }}>
          <div style={{ position: "relative", aspectRatio: "16 / 9", overflow: "hidden", borderRadius: 6 }}>
            <OffthreadVideo src={staticFile("clips/wall.mp4")} playbackRate={0.87} muted style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
        <div style={{ margin: "0 auto", width: 120, height: 60, background: "linear-gradient(#0c0c0bcc,#0c0c0b55)", clipPath: "polygon(18% 0,82% 0,100% 100%,0 100%)" }} />
      </div>
      {/* the Desktop Studio, where they were placed */}
      <Sequence from={30} layout="none">
        <Screen src="clips/desk.mp4" trimBefore={78} rate={1.75} w={560} h={420} top={1140} delay={0} aspect={1.6} focus={[{ at: 0, x: 0.15, y: 0.3, s: 2.5 }, { at: 120, x: 0.15, y: 0.34, s: 2.5 }]} />
      </Sequence>
      <div style={{ position: "absolute", left: 70, top: 1600, right: 70 }}>
        <Chips top={0} delay={40} items={["Clock", "Weather", "Calendar", "Countdown", "Now playing", "FPS"]} />
      </div>
      <Label top={1790} delay={60} text="drag anywhere · lamps or letters · Lively · Wallpaper Engine" />
    </Scene>
  );
};

const Keep: React.FC = () => {
  const tiles = [
    ["Live wallpaper", ".html"],
    ["Wallpaper kit", ".zip"],
    ["Still, 4K", ".png"],
    ["Film", ".mp4"],
    ["Loop", ".gif"],
    ["Gallery · Remix", "share"],
  ];
  return (
    <Scene dur={SCENES.keep.dur}>
      <Mark />
      <div style={{ position: "absolute", left: 70, right: 70, top: 190 }}>
        <Kicker n="07" text="Keep" />
        <div style={{ marginTop: 30 }}>
          <Words text="Take it" size={124} delay={2} />
          <Words text="home." size={124} delay={7} italic hero="home" />
        </div>
      </div>
      <div style={{ position: "absolute", left: 70, right: 70, top: 640, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
        {tiles.map(([a, b], i) => (
          <Tile key={a} title={a} ext={b} delay={10 + i * 5} hero={i === 0} />
        ))}
      </div>
      <Label top={1560} delay={44} text="accounts · library · share links · plate of the day" />
    </Scene>
  );
};
const Tile: React.FC<{ title: string; ext: string; delay: number; hero?: boolean }> = ({ title, ext, delay, hero }) => {
  const p = useIn(delay, "snappy");
  return (
    <div style={{ height: 250, border: `2px solid ${C.ink}`, borderRadius: 22, padding: 30, display: "flex", flexDirection: "column", justifyContent: "space-between", background: hero ? C.ink : "transparent", color: hero ? C.paper : C.ink, opacity: p, transform: `translateY(${(1 - p) * 40}px) scale(${0.94 + p * 0.06})` }}>
      <span style={{ fontFamily: theme.fonts.mono, fontSize: 24, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.7 }}>{ext}</span>
      <span style={{ fontFamily: theme.fonts.display, fontSize: 58, lineHeight: 1 }}>{title}</span>
    </div>
  );
};

const Craft: React.FC = () => {
  const lines = ["One engine: the site and the wallpaper", "Letters on springs, drawn on canvas", "fal.ai FLUX, briefed on the server", "CSP · CSRF · hashed sessions · rate limits"];
  return (
    <Scene dur={SCENES.craft.dur} dark>
      <Mark dark />
      <div style={{ position: "absolute", left: 70, right: 70, top: 420 }}>
        <Kicker n="08" text="Under the hood" />
        <div style={{ marginTop: 30 }}>
          <Words text="Built end" size={128} delay={2} />
          <Words text="to end." size={128} delay={7} italic hero="end." />
        </div>
      </div>
      <div style={{ position: "absolute", left: 70, right: 70, top: 900 }}>
        {lines.map((l, i) => (
          <Line key={l} text={l} delay={12 + i * 5} />
        ))}
      </div>
    </Scene>
  );
};
const Line: React.FC<{ text: string; delay: number }> = ({ text, delay }) => {
  const p = useIn(delay, "snappy");
  return (
    <div style={{ display: "flex", gap: 22, alignItems: "baseline", borderTop: "1px solid rgba(244,243,238,0.2)", padding: "26px 0", opacity: p, transform: `translateX(${(1 - p) * 50}px)` }}>
      <span style={{ fontFamily: theme.fonts.mono, fontSize: 24, opacity: 0.5 }}>—</span>
      <span style={{ fontFamily: theme.fonts.text, fontSize: 44 }}>{text}</span>
    </div>
  );
};

const Outro: React.FC = () => {
  const f = useCurrentFrame();
  const p = useIn(4, "bouncy");
  const t = useIn(16, "smooth");
  const u = useIn(28, "smooth");
  const s = useIn(38, "smooth");
  const breathe = 1 + Math.sin(f / 22) * 0.012;
  return (
    <AbsoluteFill>
      <BgMesh />
      <Mark />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", color: C.ink }}>
        <div style={{ fontFamily: theme.fonts.display, fontSize: 320, lineHeight: 0.9, letterSpacing: "-0.03em", opacity: p, transform: `translateY(${(1 - p) * 60}px) scale(${(0.9 + p * 0.1) * breathe})` }}>Pied</div>
        <div style={{ fontFamily: theme.fonts.text, fontStyle: "italic", fontSize: 64, marginTop: 36, opacity: t, transform: `translateY(${(1 - t) * 30}px)` }}>Pictures, set in loose type.</div>
        <div style={{ width: 540 * u, height: 3, background: C.hero, margin: "70px 0 38px" }} />
        <div style={{ fontFamily: theme.fonts.mono, fontWeight: 700, fontSize: 36, letterSpacing: "0.1em", opacity: u }}>pied-topaz.vercel.app</div>
        <div style={{ fontFamily: theme.fonts.mono, fontSize: 21, letterSpacing: "0.22em", textTransform: "uppercase", marginTop: 40, opacity: s * 0.6 }}>Next.js · React · Canvas · Postgres · fal.ai</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Reel: React.FC = () => (
  <AbsoluteFill style={{ background: C.paper }}>
    <Sequence from={SCENES.hook.from} durationInFrames={SCENES.hook.dur}><Hook /></Sequence>
    <Sequence from={SCENES.sources.from} durationInFrames={SCENES.sources.dur}><Sources /></Sequence>
    <Sequence from={SCENES.set.from} durationInFrames={SCENES.set.dur}><SetScene /></Sequence>
    <Sequence from={SCENES.light.from} durationInFrames={SCENES.light.dur}><Light /></Sequence>
    <Sequence from={SCENES.paint.from} durationInFrames={SCENES.paint.dur}><Paint /></Sequence>
    <Sequence from={SCENES.touch.from} durationInFrames={SCENES.touch.dur}><Touch /></Sequence>
    <Sequence from={SCENES.desk.from} durationInFrames={SCENES.desk.dur}><Desk /></Sequence>
    <Sequence from={SCENES.keep.from} durationInFrames={SCENES.keep.dur}><Keep /></Sequence>
    <Sequence from={SCENES.craft.from} durationInFrames={SCENES.craft.dur}><Craft /></Sequence>
    <Sequence from={SCENES.outro.from} durationInFrames={SCENES.outro.dur}><Outro /></Sequence>
    <Audio src={staticFile("music.wav")} volume={0.9} />
    <Rail />
    <Grade />
    <Grain />
    <Vignette />
  </AbsoluteFill>
);
