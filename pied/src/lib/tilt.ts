"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FieldController } from "./field";

type Permissioned = { requestPermission?: () => Promise<"granted" | "denied"> };

/**
 * Tilt a phone and the letters slide, each at its own depth. Android sends
 * orientation events straight away; iOS needs a tap first (the returned
 * `ask` must run inside a click handler).
 */
export function useTilt(field: () => FieldController | null) {
  const [state, setState] = useState<"off" | "ask" | "on">("off");
  const smooth = useRef({ x: 0, y: 0 });
  const getField = useRef(field);
  useEffect(() => {
    getField.current = field;
  });

  const listen = useCallback(() => {
    let live = false;
    const on = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      if (!live) {
        live = true;
        setState("on");
      }
      // Holding a phone naturally is ~45° back; that's "level".
      const tx = Math.max(-1, Math.min(1, e.gamma / 30));
      const ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
      const s = smooth.current;
      s.x += (tx - s.x) * 0.25;
      s.y += (ty - s.y) * 0.25;
      getField.current()?.setTilt(s.x, s.y);
    };
    window.addEventListener("deviceorientation", on);
    return () => window.removeEventListener("deviceorientation", on);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return;
    if (!window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const DOE = window.DeviceOrientationEvent as unknown as Permissioned;
    if (typeof DOE.requestPermission === "function") {
      const t = setTimeout(() => setState("ask"), 0);
      return () => clearTimeout(t);
    }
    return listen();
  }, [listen]);

  const ask = useCallback(async () => {
    const DOE = window.DeviceOrientationEvent as unknown as Permissioned;
    try {
      if ((await DOE.requestPermission?.()) === "granted") listen();
      else setState("off");
    } catch {
      setState("off");
    }
  }, [listen]);

  return { state, ask };
}
