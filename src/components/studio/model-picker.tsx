"use client";

import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronRight, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Model } from "@/lib/catalog/models";
import { cn } from "@/lib/utils";
import { Pill } from "@/components/ui/button";
import { VendorIcon } from "./vendor-icon";

export function ModelPicker({
  models,
  value,
  onChange,
  variant = "chip",
  className,
}: {
  models: Model[];
  value: Model;
  onChange: (m: Model) => void;
  variant?: "chip" | "row";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
    else setQ("");
  }, [open]);

  // ⌘K / Ctrl+K opens the picker.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? models.filter((m) => m.name.toLowerCase().includes(s) || m.description.toLowerCase().includes(s)) : models;
  }, [q, models]);
  const featured = filtered.filter((m) => m.featured);
  const rest = filtered.filter((m) => !m.featured);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        {variant === "chip" ? (
          <button className={cn("flex h-9 items-center gap-2 rounded-lg bg-card-2 px-2.5 text-[13px] font-semibold hover:bg-[#242424]", className)}>
            <VendorIcon vendor={value.vendor} className="h-4 w-4" />
            <span className="max-w-[160px] truncate">{value.name}</span>
            <ChevronRight className="h-3.5 w-3.5 text-fg-3" />
          </button>
        ) : (
          <button className={cn("flex w-full items-center justify-between rounded-xl bg-card-2 px-3 py-2.5 text-left hover:bg-[#242424]", className)}>
            <div>
              <div className="text-[11px] text-fg-3">Model</div>
              <div className="flex items-center gap-1.5 text-[13px] font-semibold">
                {value.name}
                <VendorIcon vendor={value.vendor} className="h-3.5 w-3.5 text-lime" />
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-fg-3" />
          </button>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-[340px] overflow-hidden rounded-xl border border-line bg-card shadow-2xl data-[state=open]:animate-in"
        >
          <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
            <Search className="h-4 w-4 text-fg-3" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-fg-3"
            />
            <kbd className="rounded border border-line px-1.5 py-0.5 text-[10px] text-fg-3">⌘K</kbd>
          </div>
          <div className="thin-scroll max-h-[440px] overflow-y-auto p-1.5">
            {featured.length > 0 && (
              <Section title="Featured models" icon={<Sparkles className="h-3 w-3" />}>
                {featured.map((m) => (
                  <Row key={m.id} m={m} selected={m.id === value.id} onSelect={() => { onChange(m); setOpen(false); }} />
                ))}
              </Section>
            )}
            {rest.length > 0 && (
              <Section title="All models">
                {rest.map((m) => (
                  <Row key={m.id} m={m} selected={m.id === value.id} onSelect={() => { onChange(m); setOpen(false); }} />
                ))}
              </Section>
            )}
            {filtered.length === 0 && <div className="px-3 py-8 text-center text-sm text-fg-3">No models match “{q}”.</div>}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="flex items-center gap-1 px-2.5 pb-1 pt-2 text-[11px] font-medium text-fg-3">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ m, selected, onSelect }: { m: Model; selected: boolean; onSelect: () => void }) {
  const caps = m.kind === "image" ? [m.resolutions[m.resolutions.length - 1], `${m.cost}✦`] : m.caps;
  const sim = m.backend.type === "simulated";
  return (
    <button
      onClick={onSelect}
      className={cn("flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-white/6", selected && "bg-white/6")}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-bg-elev">
        <VendorIcon vendor={m.vendor} className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold">{m.name}</span>
          {m.badge && <Pill tone={m.badge === "TOP" ? "blue" : m.badge === "NEW" ? "lime" : "gray"}>{m.badge}</Pill>}
          {sim && (
            <span title="Runs on a simulated backend in this build" className="rounded-[4px] bg-white/8 px-1 text-[9px] font-semibold uppercase text-fg-3">
              sim
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-fg-3">
          {m.kind === "video" ? (
            caps.map((c) => (
              <span key={c} className="rounded-[4px] bg-white/6 px-1 py-[1px]">
                {c}
              </span>
            ))
          ) : (
            <span className="truncate">{m.description}</span>
          )}
        </div>
      </div>
      {selected && <Check className="h-4 w-4 shrink-0 text-lime" />}
    </button>
  );
}
