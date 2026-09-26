"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

// Inner pages (gallery, library, accounts) share one masthead: the wordmark,
// the three places, and who's signed in.
export function Shell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteNav />
      <main className={cn("mx-auto w-full flex-1 px-4 pb-24 pt-10 sm:px-8", wide ? "max-w-[1600px]" : "max-w-xl")}>{children}</main>
      <footer className="border-t border-rule">
        <div className="label mx-auto flex max-w-[1600px] flex-wrap justify-between gap-2 px-4 py-5 text-ink-3 sm:px-8">
          <span>Pied · pictures set in loose type</span>
          <span>Set in Libre Caslon &amp; Courier Prime</span>
        </div>
      </footer>
    </div>
  );
}

export function SiteNav() {
  const path = usePathname();
  const { enabled, user } = useSession();
  const item = (href: string, label: string) => (
    <Link href={href} className={cn("label border-b pb-0.5 transition-colors", path?.startsWith(href) ? "border-ink text-ink" : "border-transparent text-ink-3 hover:text-ink")}>
      {label}
    </Link>
  );
  return (
    <header className="border-b border-ink">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Link href="/" className="font-display text-2xl leading-none">
          Pied
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6" aria-label="Main">
          {item("/make", "Press")}
          {enabled ? item("/gallery", "Gallery") : null}
          {enabled ? (user ? item("/library", "Library") : null) : null}
          {enabled ? (user ? item("/account", user.displayName || "Account") : item("/signin", "Sign in")) : null}
        </nav>
      </div>
    </header>
  );
}
