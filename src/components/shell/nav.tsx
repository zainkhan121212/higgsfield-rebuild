"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Sparkles, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "./session";
import { Pill } from "@/components/ui/button";
import { AccountMenu } from "./account-menu";
import { Logo } from "./logo";
import { SearchButton } from "./search";
import { AuthDialog } from "./auth-dialog";

const PRIMARY = [
  { href: "/", label: "Explore", match: (p: string) => p === "/" },
  { href: "/ai/image", label: "Image", match: (p: string) => p.startsWith("/ai/image") },
  { href: "/ai/video", label: "Video", match: (p: string) => p.startsWith("/ai/video") },
  { href: "/asset/all", label: "Assets", match: (p: string) => p.startsWith("/asset") },
];

const SECONDARY: { href: string; label: string; badge?: "New" | "Free" }[] = [
  { href: "/ai/video?model=genjutsu", label: "Genjutsu", badge: "New" },
  { href: "/effects", label: "Effects", badge: "Free" },
  { href: "/ai/video?model=kling_3", label: "Kling 3.0" },
  { href: "/ai/image?model=soul_cinema", label: "Soul Cinema" },
  { href: "/ai/image?model=nano_banana_2", label: "Nano Banana 2" },
];

export function Nav() {
  const pathname = usePathname();
  const { user } = useSession();

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-line/80 bg-bg/85 backdrop-blur-md">
      <div className="flex h-full items-center gap-1 px-3 sm:px-4">
        <Link href="/" className="mr-2 flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/8" aria-label="Higgsfield home">
          <Logo className="h-5 w-5" />
        </Link>

        <nav className="flex items-center gap-0.5">
          {PRIMARY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-1.5 py-1.5 text-[13px] font-medium transition-colors sm:px-2.5",
                item.match(pathname) ? "text-lime" : "text-fg-2 hover:text-fg",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mx-2 hidden h-4 w-px bg-line-2 lg:block" />

        <nav className="scrollbar-none hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto lg:flex">
          {SECONDARY.map((item) => (
            <Link key={item.label} href={item.href} className="flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-fg-2 hover:text-fg">
              {item.label}
              {item.badge && <Pill tone={item.badge === "Free" ? "lime" : "gray"}>{item.badge}</Pill>}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <SearchButton className="hidden sm:flex" />

          <Link
            href="/pricing"
            className={cn(
              "hidden h-8 items-center gap-1.5 rounded-full border border-line-2 px-3 text-[13px] font-medium hover:border-fg-3 sm:flex",
              pathname === "/pricing" && "border-lime text-lime",
            )}
          >
            <Tag className="h-3.5 w-3.5" />
            Pricing
            <Pill tone="pink" className="ml-0.5">
              -30%
            </Pill>
          </Link>

          {user ? (
            <>
              <Link
                href="/account"
                className="flex h-8 items-center gap-1.5 rounded-full bg-card-2 px-2.5 text-[13px] font-semibold hover:bg-[#242424] sm:px-3"
                title="Credits"
              >
                <Sparkles className="h-3.5 w-3.5 text-lime" />
                {user.credits}
              </Link>
              {user.email ? (
                <>
                  <button aria-label="Notifications" className="hidden h-9 w-9 items-center justify-center rounded-full text-fg-2 hover:bg-white/8 hover:text-fg sm:flex">
                    <Bell className="h-4 w-4" />
                  </button>
                  <AccountMenu />
                </>
              ) : (
                <>
                  <AuthDialog mode="login" trigger={<button className="h-8 rounded-full bg-black px-3 text-[13px] font-semibold text-fg ring-1 ring-line-2 hover:ring-fg-3">Login</button>} />
                  <AuthDialog mode="signup" trigger={<button className="h-8 rounded-full bg-lime px-3 text-[13px] font-semibold text-black hover:bg-lime-2">Sign up</button>} />
                </>
              )}
            </>
          ) : (
            <>
              <div className="h-8 w-16 rounded-full shimmer" />
              <div className="h-8 w-8 rounded-full shimmer" />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
