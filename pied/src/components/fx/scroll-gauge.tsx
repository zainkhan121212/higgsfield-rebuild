"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A composing stick down the left margin: it fills as you read and names the
 * section you're in. Sections opt in with data-section="Name".
 */
export function ScrollGauge() {
  const bar = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [n, setN] = useState(0);
  const [total, setTotal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? scrollY / max : 0;
      if (bar.current) bar.current.style.transform = `scaleY(${p})`;
      const secs = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
      let cur = 0;
      secs.forEach((s, i) => {
        if (s.getBoundingClientRect().top < innerHeight * 0.5) cur = i;
      });
      setN(cur + 1);
      setTotal(secs.length);
      setName(secs[cur]?.dataset.section ?? "");
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", on);
      removeEventListener("resize", on);
    };
  }, []);
  return (
    <div aria-hidden className="pointer-events-none fixed bottom-6 left-3 top-24 z-40 hidden w-6 flex-col items-center gap-3 text-white mix-blend-difference xl:flex">
      <span className="label [writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-[10px]">
        {name} · {String(n).padStart(2, "0")}/{String(total).padStart(2, "0")}
      </span>
      <div className="relative w-px flex-1 bg-white/25">
        <div ref={bar} className="absolute inset-0 origin-top bg-white" style={{ transform: "scaleY(0)" }} />
      </div>
    </div>
  );
}
