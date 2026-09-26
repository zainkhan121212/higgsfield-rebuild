"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Group({ title, hint, children, className }: { title: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("border-t border-rule py-5", className)}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="label">{title}</h3>
        {hint ? <span className="label text-ink-3">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col border border-ink">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "label border-l border-ink px-2 py-2.5 transition-colors first:border-l-0",
              on ? "bg-ink text-paper" : "bg-transparent text-ink hover:bg-ink/5",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-baseline justify-between">
        <span className="font-serif text-[15px]">{label}</span>
        <span className="label tabular-nums text-ink-3">{format ? format(value) : value}</span>
      </span>
      <input type="range" className="slug" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function Toggle({ label, checked, onChange, note }: { label: string; checked: boolean; onChange: (v: boolean) => void; note?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 py-1 text-left">
      <span>
        <span className="block font-serif text-[15px]">{label}</span>
        {note ? <span className="label block text-ink-3 normal-case tracking-normal">{note}</span> : null}
      </span>
      <span className={cn("relative h-5 w-9 shrink-0 border border-ink transition-colors", checked ? "bg-ink" : "bg-transparent")}>
        <span className={cn("absolute top-[3px] h-3 w-3 transition-all duration-300", checked ? "left-[19px] bg-paper" : "left-[3px] bg-ink")} />
      </span>
    </button>
  );
}

export function Button({
  children,
  onClick,
  disabled,
  variant = "solid",
  className,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "solid" | "line" | "ghost";
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "label inline-flex items-center justify-center gap-2 px-4 py-3 transition-[transform,background-color,color,opacity] duration-200 disabled:cursor-not-allowed disabled:opacity-40",
        variant === "solid" && "bg-ink text-paper enabled:hover:-translate-y-px",
        variant === "line" && "border border-ink text-ink enabled:hover:bg-ink enabled:hover:text-paper",
        variant === "ghost" && "text-ink underline-offset-4 enabled:hover:underline",
        className,
      )}
    >
      {children}
    </button>
  );
}
