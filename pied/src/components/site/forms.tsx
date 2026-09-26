"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  hint,
  required = true,
  maxLength = 200,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  hint?: ReactNode;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="label mb-1.5 flex justify-between">
        <span>{label}</span>
        {hint ? <span className="text-ink-3 normal-case tracking-normal">{hint}</span> : null}
      </span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        required={required}
        maxLength={maxLength}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-b border-ink bg-transparent py-2.5 font-serif text-xl outline-none transition-colors placeholder:text-ink-3 focus:bg-white/40"
      />
    </label>
  );
}

/** A form that runs `onSubmit`, shows its error in a plain sentence, and blocks double submits. */
export function Form({ onSubmit, children, className }: { onSubmit: () => Promise<void>; children: (busy: boolean) => ReactNode; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await onSubmit();
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className={cn("space-y-6", className)} noValidate>
      {children(busy)}
      {err ? (
        <p role="alert" className="border-l-2 border-ink pl-3 font-serif text-ink-2">
          {err}
        </p>
      ) : null}
    </form>
  );
}

export function Submit({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button type="submit" disabled={busy} className="label w-full bg-ink px-5 py-4 text-paper transition-[transform,opacity] duration-200 enabled:hover:-translate-y-px disabled:opacity-50">
      {busy ? "One moment…" : children}
    </button>
  );
}

export function PageTitle({ kicker, children, sub }: { kicker: string; children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-10">
      <p className="label text-ink-3">{kicker}</p>
      <h1 className="mt-3 font-display text-[clamp(2.6rem,7vw,4.4rem)] leading-[0.95] tracking-[-0.01em]">{children}</h1>
      {sub ? <p className="mt-4 font-serif text-lg text-ink-2">{sub}</p> : null}
    </div>
  );
}

/** Only same-site paths may be a redirect target (no open redirects). */
export function safeNext(n: string | null, fallback = "/library") {
  return n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : fallback;
}
