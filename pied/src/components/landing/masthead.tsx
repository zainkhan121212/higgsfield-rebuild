"use client";

import Link from "next/link";
import { SoundMenu } from "../fx/sound-menu";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { Scramble } from "../fx/scramble";

// Fixed masthead drawn in difference mode, so it stays legible over paper,
// over the dark room and over the type itself without ever changing colour.
export function Masthead() {
  const [time, setTime] = useState("");
  const { enabled, user } = useSession();
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
        <Scramble as="p" className="label hidden md:block" text="Nº 001 — Pictures set in loose type" />
        <nav className="pointer-events-auto flex items-center gap-5">
          <span className="label hidden tabular-nums lg:inline">{time || "--:--"}</span>
          <SoundMenu className="hidden sm:inline-flex" />
          {enabled ? (
            <Link href="/gallery" className="label hidden sm:inline">
              <Scramble text="Gallery" />
            </Link>
          ) : null}
          {enabled ? (
            <Link href={user ? "/library" : "/signin"} className="label hidden sm:inline">
              <Scramble text={user ? "Library" : "Sign in"} />
            </Link>
          ) : null}
          <Link href="/make" className="label border-b border-current pb-0.5">
            <Scramble text="Open the press →" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
