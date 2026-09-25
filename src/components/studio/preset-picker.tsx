"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { VIDEO_MODELS, type VideoModel } from "@/lib/catalog/models";
import { PRESETS, presetsForModel, type Preset } from "@/lib/catalog/presets";
import { cn } from "@/lib/utils";
import { Pill } from "@/components/ui/button";
import { PresetThumb } from "./preset-thumb";
import { VendorIcon } from "./vendor-icon";

const TAB_MODELS = ["seedance_2_5", "genjutsu", "flux_3_video", "kling_3", "seedance_2_fast", "minimax_h3", "wan_3"];

export function PresetPicker({
  open,
  onOpenChange,
  model,
  value,
  onPick,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  model: VideoModel;
  value: Preset;
  onPick: (p: Preset, model?: VideoModel) => void;
}) {
  const [tabModel, setTabModel] = useState<string>(model.id);
  const [q, setQ] = useState("");
  const tabs = useMemo(() => {
    const ids = TAB_MODELS.includes(model.id) ? TAB_MODELS : [model.id, ...TAB_MODELS];
    return ids.map((id) => VIDEO_MODELS.find((m) => m.id === id)!).filter(Boolean);
  }, [model.id]);

  const list = useMemo(() => {
    const base = q.trim() ? PRESETS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())) : presetsForModel(tabModel);
    return base;
  }, [q, tabModel]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-x-2 top-16 z-[71] mx-auto flex max-h-[calc(100vh-80px)] max-w-[1200px] flex-col overflow-hidden rounded-2xl border border-line bg-bg outline-none sm:inset-x-6 lg:left-[340px]">
          <Dialog.Title className="sr-only">Choose a preset</Dialog.Title>
          <div className="flex items-center gap-1 border-b border-line px-3 py-2">
            <div className="scrollbar-none flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {tabs.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setTabModel(m.id); setQ(""); }}
                  className={cn("flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] font-semibold", tabModel === m.id && !q ? "border-lime text-fg" : "border-transparent text-fg-3 hover:text-fg-2")}
                >
                  <VendorIcon vendor={m.vendor} className="h-3.5 w-3.5" />
                  {m.name}
                  {m.badge === "NEW" && <Pill tone="lime">New</Pill>}
                </button>
              ))}
            </div>
            <div className="flex h-9 items-center gap-2 rounded-lg bg-card-2 px-3">
              <Search className="h-3.5 w-3.5 text-fg-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-28 bg-transparent text-[13px] outline-none placeholder:text-fg-3 sm:w-40" />
            </div>
            <Dialog.Close className="rounded-full p-2 text-fg-2 hover:bg-fg/8" aria-label="Close">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <div className="thin-scroll grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-3 sm:grid-cols-3 lg:grid-cols-5">
            {list.map((p) => {
              const selected = p.id === value.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onPick(p, VIDEO_MODELS.find((m) => m.id === tabModel))}
                  className={cn("group relative aspect-[3/4] overflow-hidden rounded-xl border text-left transition", selected ? "border-lime" : "border-transparent hover:border-line-2")}
                >
                  <PresetThumb preset={p} motion="auto" className="absolute inset-0" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="display text-[15px] leading-tight">{p.name}</div>
                    <div className="mt-0.5 line-clamp-2 text-[11px] text-fg-2 opacity-0 transition group-hover:opacity-100">{p.description}</div>
                  </div>
                  {p.category !== "general" && (
                    <span className="absolute left-2 top-2 rounded-[4px] bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-fg-2 backdrop-blur">{p.category}</span>
                  )}
                </button>
              );
            })}
            {list.length === 0 && <div className="col-span-full py-16 text-center text-sm text-fg-3">No presets match “{q}”.</div>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
