"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { Crown, LogOut, Sparkles, User as UserIcon, Wallet } from "lucide-react";
import { useSession } from "./session";
import { useRouter } from "next/navigation";

export function AccountMenu() {
  const { user, refresh } = useSession();
  const router = useRouter();
  if (!user) return null;
  const pct = Math.min(100, Math.round((user.credits / 100) * 100));
  const initial = user.name.slice(0, 1).toUpperCase();

  async function rename() {
    const name = window.prompt("Display name (shown on your public generations)", user?.name ?? "");
    if (!name?.trim()) return;
    const res = await fetch("/api/me", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) });
    if (res.ok) await refresh();
  }

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="Account menu"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-lime to-[#6bd400] text-[13px] font-bold text-black ring-2 ring-transparent hover:ring-lime/40"
        >
          {initial}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={8} className="z-50 w-[280px] rounded-xl border border-line bg-card p-1.5 shadow-2xl">
          <div className="flex items-center gap-3 px-2.5 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-lime to-[#6bd400] text-sm font-bold text-black">{initial}</div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-fg-2">{planLabel(user.plan)}</div>
            </div>
          </div>
          <div className="mx-1.5 mb-1 rounded-lg bg-bg-elev px-3 py-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-medium">
                Credits <Sparkles className="h-3 w-3 text-lime" />
              </span>
              <Link href="/pricing" className="text-fg-2 hover:text-fg">
                {user.credits} left ›
              </Link>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-lime" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <DropdownMenu.Item asChild>
            <Link href="/pricing" className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm outline-none hover:bg-white/6 data-[highlighted]:bg-white/6">
              <span className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-lime" /> Go Premium
              </span>
              <span className="rounded-full bg-lime px-2 py-0.5 text-[11px] font-bold text-black">Upgrade</span>
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item
            onSelect={rename}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none hover:bg-white/6 data-[highlighted]:bg-white/6"
          >
            <UserIcon className="h-4 w-4" /> Change display name
          </DropdownMenu.Item>
          <Item href="/pricing" icon={<Wallet className="h-4 w-4" />}>
            Manage account
          </Item>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item
            onSelect={signOut}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-fg-2 outline-none hover:bg-white/6 data-[highlighted]:bg-white/6"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function Item({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <DropdownMenu.Item asChild>
      <Link href={href} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none hover:bg-white/6 data-[highlighted]:bg-white/6">
        {icon}
        {children}
      </Link>
    </DropdownMenu.Item>
  );
}

function planLabel(plan: string) {
  return plan === "FREE" ? "Free plan" : `${plan.charAt(0)}${plan.slice(1).toLowerCase()} plan`;
}
