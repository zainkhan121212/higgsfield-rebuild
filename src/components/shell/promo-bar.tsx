"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

const KEY = "fl_masthead_dismissed";

// The original site stacks two rows of promo. This is one 28px rule of ink
// with the only fact a first-time visitor actually needs.
export function Masthead() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(KEY) === "1";
    } catch {}
    // Deferred so the first paint matches the server, then it appears.
    const t = setTimeout(() => setOpen(!dismissed), 0);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    document.documentElement.style.setProperty("--promo-h", open ? "28px" : "0px");
  }, [open]);
  if (!open) return null;
  return (
    <div className="relative z-40 flex h-7 items-center justify-center gap-2 bg-fg px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-paper">
      <span className="hidden sm:inline text-paper/55">No.01</span>
      <span className="hidden sm:inline text-paper/30">/</span>
      <span className="truncate">
        100 credits on arrival — no card, no waitlist
      </span>
      <Link href="/pricing" className="hidden text-paper/55 underline decoration-paper/30 underline-offset-2 hover:text-paper sm:inline">
        Plans
      </Link>
      <button
        aria-label="Dismiss"
        onClick={() => {
          try {
            localStorage.setItem(KEY, "1");
          } catch {}
          setOpen(false);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-paper/50 hover:text-paper"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
