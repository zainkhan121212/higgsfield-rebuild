"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Toast = { id: number; title: string; body?: string; tone?: "default" | "error" | "success" };
type Listener = (t: Toast) => void;

let listeners: Listener[] = [];
let seq = 0;

export function toast(title: string, opts: { body?: string; tone?: Toast["tone"] } = {}) {
  const t: Toast = { id: ++seq, title, ...opts };
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    const l: Listener = (t) => {
      setItems((xs) => [...xs, t]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== t.id)), 4200);
    };
    listeners.push(l);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto min-w-[260px] max-w-[360px] rounded-lg border bg-card-2 px-4 py-3 text-sm shadow-xl",
            t.tone === "error" && "border-danger/40",
            t.tone === "success" && "border-lime/40",
          )}
        >
          <div className="font-medium">{t.title}</div>
          {t.body && <div className="mt-0.5 text-fg-2">{t.body}</div>}
        </div>
      ))}
    </div>
  );
}
