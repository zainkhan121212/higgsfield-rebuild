"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type SessionUser = { id: string; name: string; handle: string; plan: string; credits: number };

type Ctx = {
  user: SessionUser | null;
  setCredits: (n: number) => void;
  refresh: () => Promise<void>;
  ensure: () => Promise<SessionUser>;
};

const SessionCtx = createContext<Ctx | null>(null);

export function SessionProvider({ initialUser, children }: { initialUser: SessionUser | null; children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/me", { cache: "no-store" });
    if (res.ok) setUser((await res.json()).user);
  }, []);

  // Guests are created lazily on first API call; make sure the nav shows a
  // balance as soon as the page is interactive.
  useEffect(() => {
    if (!user) refresh();
  }, [user, refresh]);

  const ensure = useCallback(async () => {
    if (user) return user;
    const res = await fetch("/api/me", { cache: "no-store" });
    const u = (await res.json()).user as SessionUser;
    setUser(u);
    return u;
  }, [user]);

  const value = useMemo<Ctx>(
    () => ({
      user,
      setCredits: (n) => setUser((u) => (u ? { ...u, credits: n } : u)),
      refresh,
      ensure,
    }),
    [user, refresh, ensure],
  );

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error("useSession outside SessionProvider");
  return ctx;
}
