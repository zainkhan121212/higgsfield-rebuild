"use client";

import * as Popover from "@radix-ui/react-popover";
import { Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function SettingChip<T extends string | number>({
  icon,
  label,
  value,
  options,
  onChange,
  format = (v) => String(v),
  className,
}: {
  icon?: React.ReactNode;
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
  format?: (v: T) => string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          title={label}
          className={cn("flex h-9 items-center gap-1.5 rounded-lg bg-card-2 px-2.5 text-[13px] font-semibold hover:bg-[#242424]", className)}
        >
          {icon && <span className="text-fg-2">{icon}</span>}
          {format(value)}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={8} className="z-50 min-w-[160px] rounded-xl border border-line bg-card p-1.5 shadow-2xl">
          <div className="px-2 pb-1 pt-1 text-[11px] font-medium text-fg-3">{label}</div>
          {options.map((o) => (
            <button
              key={String(o)}
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
              className={cn("flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[13px] hover:bg-white/6", o === value && "text-lime")}
            >
              {format(o)}
              {o === value && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
