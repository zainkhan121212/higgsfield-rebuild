"use client";

import { useEffect, useRef, useState } from "react";
import { VOICES, getVoice, onVoice, restoreVoice, setVoice, type Voice } from "@/lib/sound";
import { cn } from "@/lib/utils";

// "♪ Sound" in the header. Opens to four words — Off, Typewriter, Chains,
// Paper — set inline in the header's own ink, so it reads on light paper,
// dark paper and the difference-blended masthead alike.
export function SoundMenu({ className }: { className?: string }) {
  const [v, setV] = useState<Voice>("off");
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    restoreVoice();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the visitor's stored choice after mount
    setV(getVoice());
    return onVoice(setV);
  }, []);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <span ref={wrap} className={cn("label inline-flex items-center gap-3", className)}>
      <button type="button" aria-expanded={open} aria-label={`Sound: ${v}`} onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5">
        <span aria-hidden className="text-[1.15em] leading-none">
          {v === "off" ? "♪̸" : "♪"}
        </span>
        <span className={open ? "sr-only" : ""}>{v === "off" ? "Sound" : VOICES.find((x) => x.value === v)?.label}</span>
      </button>
      {open ? (
        <span role="radiogroup" aria-label="Sound" className="inline-flex items-center gap-3">
          {VOICES.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={v === o.value}
              onClick={() => {
                setVoice(o.value);
                if (o.value === "off") setOpen(false);
              }}
              className={cn("border-b pb-0.5", v === o.value ? "border-current" : "border-transparent opacity-60 hover:opacity-100")}
            >
              {o.label}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}
