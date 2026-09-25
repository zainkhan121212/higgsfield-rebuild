"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "./session";
import { AccountMenu } from "./account-menu";
import { Logo } from "./logo";
import { SearchButton } from "./search";
import { AuthDialog } from "./auth-dialog";
import { IndexMenu } from "./index-menu";
import { NotificationsButton } from "./notifications";

// A masthead, not a toolbar: wordmark, three verbs, and everything else in the
// index. Current section is marked with a rule under it, the way a running
// head marks a chapter.
const PRIMARY = [
  { href: "/ai/image", label: "Image", match: (p: string) => p.startsWith("/ai/image") },
  { href: "/ai/video", label: "Video", match: (p: string) => p.startsWith("/ai/video") },
  { href: "/asset/all", label: "Library", match: (p: string) => p.startsWith("/asset") },
];

export function Nav() {
  const pathname = usePathname();
  const { user } = useSession();

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-fg/15 bg-bg/90 backdrop-blur-md">
      <div className="flex h-full items-center gap-2 px-4 sm:px-6">
        <Link href="/" className="group mr-1 flex items-center gap-2" aria-label="Frameline home">
          <Logo className="h-[18px] w-[18px]" />
          <span className="display text-[21px] tracking-[-0.02em] group-hover:text-lime">Frameline</span>
        </Link>

        <span className="mx-2 hidden h-4 w-px bg-line-2 sm:block" />

        <nav className="flex items-center gap-1">
          {PRIMARY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative px-2 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                item.match(pathname) ? "text-fg" : "text-fg-3 hover:text-fg",
              )}
            >
              {item.label}
              {item.match(pathname) && <span className="absolute inset-x-2 -bottom-[7px] h-px bg-lime" />}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <SearchButton className="hidden sm:flex" />
          <IndexMenu />

          <Link
            href="/pricing"
            className={cn(
              "hidden px-2 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-3 hover:text-fg sm:block",
              pathname === "/pricing" && "text-fg",
            )}
          >
            Plans
          </Link>

          {user ? (
            <>
              <Link
                href="/account"
                className="ml-1 flex h-8 items-center gap-1.5 border border-line bg-card px-2.5 font-mono text-[11px] tabular-nums hover:border-fg-3"
                title="Credit balance"
              >
                <span className="text-fg-3">CR</span>
                {user.credits}
              </Link>
              {user.email ? (
                <>
                  <NotificationsButton />
                  <AccountMenu />
                </>
              ) : (
                <>
                  <AuthDialog
                    mode="login"
                    trigger={
                      <button className="h-8 px-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-3 hover:text-fg">Sign in</button>
                    }
                  />
                  <AuthDialog
                    mode="signup"
                    trigger={
                      <button className="h-8 bg-fg px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-paper hover:bg-lime">Start</button>
                    }
                  />
                </>
              )}
            </>
          ) : (
            <>
              <div className="h-8 w-16 shimmer" />
              <div className="h-8 w-8 shimmer" />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
