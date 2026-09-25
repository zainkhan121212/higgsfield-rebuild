"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { NAV_PAGES } from "@/lib/catalog/pages";

// Every secondary surface exists, but a sixteen-item rail across the top is
// how the original site looks, not how a page works. They live in a table of
// contents instead: one click, everything visible, numbered.

const SECTIONS: { title: string; items: { label: string; href: string; note?: string }[] }[] = [
  {
    title: "Make",
    items: [
      { label: "Image studio", href: "/ai/image", note: "real generation" },
      { label: "Video studio", href: "/ai/video", note: "preview first" },
      { label: "Effects", href: "/effects", note: "22 presets" },
      { label: "Library", href: "/asset/all" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Plans & credits", href: "/pricing" },
      { label: "Your account", href: "/account" },
      { label: "Sign in", href: "/login" },
      { label: "Create an account", href: "/signup" },
    ],
  },
];

export function IndexMenu() {
  const [open, setOpen] = useState(false);
  const pages = NAV_PAGES.map((p) => ({ label: p.nav, href: `/${p.slug}` }));
  const half = Math.ceil(pages.length / 2);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="flex h-8 items-center gap-2 px-2 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-2 hover:text-fg">
        <span className="flex flex-col gap-[3px]" aria-hidden>
          <span className="block h-px w-4 bg-current" />
          <span className="block h-px w-4 bg-current" />
          <span className="block h-px w-4 bg-current" />
        </span>
        Index
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-fg/25 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed inset-x-0 top-0 z-[90] max-h-[92dvh] overflow-y-auto border-b border-fg bg-bg shadow-[0_24px_60px_-30px_rgba(20,18,14,0.45)]">
          <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-10 sm:py-12">
            <div className="flex items-baseline justify-between border-b border-line pb-3">
              <span className="label">Contents</span>
              <Dialog.Close className="label hover:text-fg" aria-label="Close index">
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            <div className="grid gap-x-10 gap-y-8 pt-8 sm:grid-cols-2 lg:grid-cols-4">
              {SECTIONS.map((s) => (
                <div key={s.title}>
                  <h3 className="label mb-3">{s.title}</h3>
                  <ul className="space-y-1.5">
                    {s.items.map((it) => (
                      <li key={it.href + it.label}>
                        <Link
                          href={it.href}
                          onClick={() => setOpen(false)}
                          className="group flex items-baseline gap-2 text-[17px] leading-tight hover:text-lime"
                        >
                          <span className="display">{it.label}</span>
                          {it.note && <span className="font-mono text-[10px] text-fg-3">{it.note}</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {[pages.slice(0, half), pages.slice(half)].map((chunk, ci) => (
                <div key={ci}>
                  <h3 className="label mb-3">{ci === 0 ? "More" : " "}</h3>
                  <ul className="space-y-1.5">
                    {chunk.map((it, i) => (
                      <li key={it.href}>
                        <Link
                          href={it.href}
                          onClick={() => setOpen(false)}
                          className="flex items-baseline gap-2 text-[15px] text-fg-2 hover:text-lime"
                        >
                          <span className="font-mono text-[10px] text-fg-3">{String(ci * half + i + 1).padStart(2, "0")}</span>
                          {it.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
