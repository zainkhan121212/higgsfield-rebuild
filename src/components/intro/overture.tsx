"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// The overture: four seconds of dark room before the page.
//
//   I   ignition — a projector slit opens on black
//   II  welcome  — one word, set large, and who is speaking
//   III the plate — the futurist half: night grid, scanlines, a technical
//       label block of the kind stencilled on a film can
//   IV  dissolve — it lifts and the paper page is already there underneath
//
// Rules it obeys, because an entrance that traps someone is a bad entrance:
//   · once per tab (sessionStorage), never again on a reload
//   · any click, key, scroll or touch skips straight to the dissolve
//   · prefers-reduced-motion never sees it at all
//   · the page beneath is fully server-rendered the whole time, so a crawler,
//     a reader-mode, or a broken JS bundle loses nothing

const KEY = "fl_overture_seen";

const SPEC: [string, string][] = [
  ["ORIGIN", "TEXT"],
  ["FORMAT", "35 MM"],
  ["GRAIN", "ON"],
  ["CREDITS", "100 / FREE"],
];

export function Overture() {
  // Starts null so the server and the first client paint agree on "nothing".
  const [phase, setPhase] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const finish = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase(4);
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
    // Matches the dissolve duration below.
    timers.current.push(setTimeout(() => setPhase(5), 650));
  }, []);

  useEffect(() => {
    const force = new URLSearchParams(window.location.search).has("intro");
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
    } catch {}
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Every transition is scheduled rather than set inline: the component
    // renders nothing on its first pass either way, so deferring costs a tick
    // and keeps the effect free of cascading renders.
    const at = (ms: number, p: number) => timers.current.push(setTimeout(() => setPhase(p), ms));

    if ((seen && !force) || still) {
      at(0, 5);
      return () => timers.current.forEach(clearTimeout);
    }

    document.documentElement.style.overflow = "hidden";
    at(0, 0); // ignition
    at(260, 1); // welcome
    at(1750, 2); // the plate
    at(3650, 3); // hold, then leave
    timers.current.push(setTimeout(finish, 3900));

    return () => {
      timers.current.forEach(clearTimeout);
      document.documentElement.style.overflow = "";
    };
  }, [finish]);

  // Release the scroll lock as soon as the curtain starts moving.
  useEffect(() => {
    if (phase !== null && phase >= 4) document.documentElement.style.overflow = "";
  }, [phase]);

  useEffect(() => {
    if (phase === null || phase >= 4) return;
    const skip = () => finish();
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    window.addEventListener("wheel", skip, { passive: true });
    window.addEventListener("touchstart", skip, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchstart", skip);
    };
  }, [phase, finish]);

  if (phase === null || phase === 5) return null;

  const leaving = phase >= 4;

  return (
    <div
      aria-hidden
      className={cn(
        "fixed inset-0 z-[200] overflow-hidden bg-night text-paper",
        "grain vignette transition-[opacity,transform] duration-[650ms] ease-[cubic-bezier(0.7,0,0.3,1)]",
        leaving ? "pointer-events-none -translate-y-full opacity-0" : "opacity-100",
      )}
    >
      {/* The night grid only exists from the plate onward. */}
      <div
        className={cn(
          "absolute inset-0 grid-field transition-opacity duration-[1100ms]",
          phase >= 2 ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-[900ms]",
          phase >= 2 ? "opacity-100" : "opacity-0",
        )}
        style={{ background: "radial-gradient(90% 60% at 50% 40%, rgba(232,163,61,0.10), transparent 70%)" }}
      />
      <div className={cn("absolute inset-0 scanlines transition-opacity duration-700", phase >= 2 ? "opacity-60" : "opacity-0")} />

      {/* I — the slit of light */}
      {phase === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="slit block h-px w-[42vw] bg-amber shadow-[0_0_24px_6px_rgba(232,163,61,0.45)]" />
        </div>
      )}

      {/* II — welcome */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center px-6 text-center transition-all duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          phase === 1 ? "opacity-100 blur-0" : phase < 1 ? "opacity-0 blur-[6px]" : "-translate-y-10 opacity-0 blur-[4px]",
        )}
      >
        <span className="display fringe flicker text-[clamp(3.2rem,13vw,9rem)] leading-none">Welcome</span>
        <span className="mt-6 font-mono text-[10px] uppercase tracking-[0.42em] text-paper/45 sm:text-[11px]">
          Take your time · it is only a page
        </span>
      </div>

      {/* III — the plate */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center px-6 transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          phase >= 2 ? "opacity-100 blur-0" : "translate-y-8 opacity-0 blur-[6px]",
        )}
      >
        <div className="crop-marks relative w-full max-w-[1020px] text-amber/70">
          <div className="grid items-end gap-8 px-8 py-10 sm:px-12 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:gap-14">
            <div>
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-amber">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber" />
                Reel 01
                <span className="hidden h-px flex-1 bg-amber/30 sm:block" />
              </div>
              <h1 className="display fringe mt-5 text-[clamp(2.4rem,7.2vw,5.4rem)] leading-[0.95] text-paper">
                The words
                <br />
                come <em className="text-amber">first</em>.
              </h1>
              <p className="mt-6 max-w-[42ch] font-mono text-[11px] leading-relaxed tracking-[0.06em] text-paper/55">
                An image here is a sentence that kept going. Write the line, watch it
                print, and keep the frame that was worth it.
              </p>
            </div>

            <dl className="border-t border-amber/25 pt-4 font-mono text-[10px] uppercase tracking-[0.18em]">
              {SPEC.map(([k, v], i) => (
                <div
                  key={k}
                  className="flex items-baseline justify-between border-b border-amber/15 py-2 text-paper/60"
                  style={{ animation: phase >= 2 ? `rise 0.6s cubic-bezier(0.16,1,0.3,1) ${0.15 + i * 0.09}s both` : undefined }}
                >
                  <dt className="text-amber/70">{k}</dt>
                  <dd className="text-paper/85">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Running foot: always there, quietly counting down. */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-5 pb-5 font-mono text-[9px] uppercase tracking-[0.28em] text-paper/35 sm:px-8">
        <span>Frameline</span>
        <span className="hidden sm:block">Est. 2026 · Paper &amp; light</span>
        <span>{phase >= 3 ? "Enter" : "Skip — click anywhere"}</span>
      </div>
    </div>
  );
}
