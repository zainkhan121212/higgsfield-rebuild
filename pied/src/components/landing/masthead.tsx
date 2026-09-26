"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Fixed masthead drawn in difference mode, so it stays legible over paper,
// over the dark room and over the type itself without ever changing colour.
export function Masthead() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  }, []);
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 text-white mix-blend-difference">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Link href="/" className="pointer-events-auto font-display text-2xl leading-none tracking-tight" aria-label="Pied, home">
          Pied
        </Link>
        <p className="label hidden md:block">Nº 001 — Pictures set in loose type</p>
        <nav className="pointer-events-auto flex items-center gap-5">
          <span className="label hidden tabular-nums sm:inline">{time || "--:--"}</span>
          <Link href="/make" className="label border-b border-current pb-0.5">
            Open the press →
          </Link>
        </nav>
      </div>
    </header>
  );
}
