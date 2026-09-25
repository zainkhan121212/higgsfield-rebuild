"use client";

import * as Popover from "@radix-ui/react-popover";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { Notification } from "@/app/api/notifications/route";

const ICON = {
  done: <CheckCircle2 className="h-4 w-4 text-lime" />,
  failed: <AlertTriangle className="h-4 w-4 text-danger" />,
  order: <Wallet className="h-4 w-4 text-lime" />,
  welcome: <Sparkles className="h-4 w-4 text-lime" />,
  security: <ShieldCheck className="h-4 w-4 text-pink" />,
};

export function NotificationsButton() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const d = await res.json();
      setItems(d.items);
      setUnread(d.unread);
    } catch {}
  }, []);

  // Poll gently; generations finishing in another tab still show up.
  useEffect(() => {
    const first = setTimeout(load, 0);
    const t = setInterval(load, 20_000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearTimeout(first);
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  async function onOpenChange(o: boolean) {
    setOpen(o);
    if (o) {
      await load();
      if (unread > 0) {
        await fetch("/api/notifications", { method: "POST" });
        setUnread(0);
      }
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        <button
          aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
          className="relative hidden h-9 w-9 items-center justify-center rounded-full text-fg-2 hover:bg-fg/8 hover:text-fg sm:flex"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-lime px-1 text-[9px] font-bold text-paper">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={8} className="z-50 w-[360px] overflow-hidden rounded-xl border border-line bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <div className="text-[13px] font-semibold">Notifications</div>
            <Link href="/account" onClick={() => setOpen(false)} className="text-[11px] text-fg-3 hover:text-fg">
              Account
            </Link>
          </div>
          <div className="thin-scroll max-h-[420px] overflow-y-auto p-1.5">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center text-[13px] text-fg-3">Nothing yet. Generate something.</div>
            ) : (
              items.map((n) => (
                <Link key={n.id} href={n.href} onClick={() => setOpen(false)} className="flex items-start gap-3 rounded-lg px-2.5 py-2 hover:bg-fg/6">
                  {n.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={n.thumb} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bg-elev">{ICON[n.kind]}</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{n.title}</span>
                    <span className="block truncate text-[11px] text-fg-3">{n.body}</span>
                  </span>
                  <span className="shrink-0 text-[10px] text-fg-3">{timeAgo(n.at)}</span>
                </Link>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
