"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "./session";

export function AccountActions({ hasEmail }: { hasEmail: boolean }) {
  const router = useRouter();
  const { setUser } = useSession();
  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  }
  return (
    <div className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6">
      {!hasEmail && (
        <Link href="/signup" className="rounded-full bg-lime px-4 py-2 text-[13px] font-semibold text-black hover:bg-lime-2">
          Create account to keep this
        </Link>
      )}
      <button onClick={signOut} className="rounded-full border border-line px-4 py-2 text-[13px] font-medium hover:border-fg-3">
        Sign out
      </button>
    </div>
  );
}
