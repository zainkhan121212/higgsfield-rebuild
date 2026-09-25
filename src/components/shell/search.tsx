"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Film, FolderOpen, ImageIcon, Search, Sparkles, Tag, Wand2 } from "lucide-react";
import { MODELS } from "@/lib/catalog/models";
import { PRESETS } from "@/lib/catalog/presets";
import { cn } from "@/lib/utils";

type Hit = { id: string; label: string; hint: string; href: string; icon: React.ReactNode; group: string };

const PAGES: Hit[] = [
  { id: "p-image", label: "Image studio", hint: "Generate images", href: "/ai/image", icon: <ImageIcon className="h-4 w-4" />, group: "Pages" },
  { id: "p-video", label: "Video studio", hint: "Generate videos", href: "/ai/video", icon: <Film className="h-4 w-4" />, group: "Pages" },
  { id: "p-assets", label: "Assets", hint: "Your library", href: "/asset/all", icon: <FolderOpen className="h-4 w-4" />, group: "Pages" },
  { id: "p-effects", label: "Effects", hint: "All presets", href: "/effects", icon: <Wand2 className="h-4 w-4" />, group: "Pages" },
  { id: "p-pricing", label: "Pricing", hint: "Plans and credits", href: "/pricing", icon: <Tag className="h-4 w-4" />, group: "Pages" },
];

const ALL: Hit[] = [
  ...PAGES,
  ...MODELS.map<Hit>((m) => ({
    id: `m-${m.id}`,
    label: m.name,
    hint: m.kind === "image" ? `Image model · ${m.cost}✦` : `Video model · ${m.caps.join(" · ")}`,
    href: `/ai/${m.kind}?model=${m.id}`,
    icon: m.kind === "image" ? <ImageIcon className="h-4 w-4" /> : <Film className="h-4 w-4" />,
    group: "Models",
  })),
  ...PRESETS.filter((p) => p.id !== "general").map<Hit>((p) => ({
    id: `pr-${p.id}`,
    label: p.name,
    hint: `Preset · ${p.description}`,
    href: `/ai/video?preset=${p.id}`,
    icon: <Sparkles className="h-4 w-4" />,
    group: "Presets",
  })),
];

export function SearchButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s ? ALL.filter((h) => h.label.toLowerCase().includes(s) || h.hint.toLowerCase().includes(s)) : ALL.slice(0, 12);
    return list.slice(0, 14);
  }, [q]);

  function go(h: Hit) {
    setOpen(false);
    setQ("");
    router.push(h.href);
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setQ("");
        setCursor(0);
      }}
    >
      <Dialog.Trigger asChild>
        <button aria-label="Search" className={cn("flex h-9 w-9 items-center justify-center rounded-full text-fg-2 hover:bg-fg/8 hover:text-fg", className)}>
          <Search className="h-4 w-4" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-[12vh] z-[81] w-[min(640px,calc(100vw-24px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-card shadow-2xl outline-none">
          <Dialog.Title className="sr-only">Search Frameline</Dialog.Title>
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <Search className="h-4 w-4 text-fg-3" />
            <input
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setCursor(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(hits.length - 1, c + 1)); }
                if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
                if (e.key === "Enter" && hits[cursor]) go(hits[cursor]);
              }}
              placeholder="Search models, presets, pages…"
              className="w-full bg-transparent text-[15px] outline-none placeholder:text-fg-3"
            />
            <kbd className="rounded border border-line px-1.5 py-0.5 text-[10px] text-fg-3">esc</kbd>
          </div>
          <div className="thin-scroll max-h-[50vh] overflow-y-auto p-1.5">
            {hits.map((h, i) => (
              <button
                key={h.id}
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(h)}
                className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left", i === cursor ? "bg-fg/8" : "hover:bg-fg/5")}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-bg-elev text-fg-2">{h.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{h.label}</span>
                  <span className="block truncate text-[11px] text-fg-3">{h.hint}</span>
                </span>
                <span className="text-[10px] uppercase tracking-wide text-fg-3">{h.group}</span>
              </button>
            ))}
            {hits.length === 0 && <div className="px-3 py-10 text-center text-sm text-fg-3">Nothing matches “{q}”.</div>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
