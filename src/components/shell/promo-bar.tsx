"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

const KEY = "hf_promo_dismissed";

export function PromoBar() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      setOpen(localStorage.getItem(KEY) !== "1");
    } catch {
      setOpen(true);
    }
  }, []);
  useEffect(() => {
    document.documentElement.style.setProperty("--promo-h", open ? "36px" : "0px");
  }, [open]);
  if (!open) return null;
  return (
    <div className="relative z-40 flex h-9 items-center justify-center gap-3 bg-lime px-4 text-[13px] font-medium text-black">
      <span className="rounded-[4px] bg-black px-1.5 py-[1px] text-[10px] font-bold uppercase tracking-wide text-lime">New</span>
      <span className="truncate">
        <b>100 free credits</b> for every account — no card, no waitlist. Try Seedance 2.5 and Nano Banana 2 today.
      </span>
      <Link href="/pricing" className="hidden sm:inline-flex h-6 items-center rounded-full bg-black px-3 text-[12px] font-semibold text-white hover:bg-neutral-800">
        See plans
      </Link>
      <button
        aria-label="Dismiss"
        onClick={() => {
          try {
            localStorage.setItem(KEY, "1");
          } catch {}
          setOpen(false);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-black/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
