"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { X } from "lucide-react";
import { PLANS } from "@/lib/catalog/plans";
import { cn } from "@/lib/utils";

export function Paywall({ open, onOpenChange, needed, have }: { open: boolean; onOpenChange: (o: boolean) => void; needed: number; have: number }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] w-[min(960px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-bg p-6 outline-none sm:p-8">
          <Dialog.Title className="display text-center text-3xl sm:text-4xl">Upgrade plan to buy credits</Dialog.Title>
          <Dialog.Description className="mt-2 text-center text-sm text-fg-2">
            This generation costs <b className="text-fg">{needed}✦</b> and you have <b className="text-fg">{have}✦</b>. Pick a plan — credits land instantly.
          </Dialog.Description>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {PLANS.filter((p) => p.id !== "FREE").map((p) => (
              <div key={p.id} className="rounded-xl border border-line bg-card p-4" style={{ background: p.bg }}>
                <div className="display text-xl">{p.name}</div>
                <div className="text-xs text-fg-2">{p.tagline}</div>
                <div className="mt-3 text-sm font-semibold">{p.credits.toLocaleString()} credits/mo</div>
                <div className="mt-1 text-2xl font-bold">
                  ${p.price}
                  <span className="text-xs font-normal text-fg-2"> /mo</span>
                </div>
                <Link
                  href={`/checkout?plan=${p.id.toLowerCase()}`}
                  className={cn(
                    "mt-3 flex h-10 w-full items-center justify-center rounded-full text-sm font-semibold",
                    p.id === "PRO" ? "bg-lime text-paper hover:bg-lime-2" : p.id === "MAX" ? "bg-pink text-white hover:brightness-110" : "bg-fg text-paper hover:bg-lime",
                  )}
                >
                  Get {p.name}
                </Link>
              </div>
            ))}
          </div>
          <Dialog.Close className="absolute right-3 top-3 rounded-full p-2 text-fg-2 hover:bg-fg/8" aria-label="Close">
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
