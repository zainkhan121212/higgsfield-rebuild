"use client";

import { useEffect, useSyncExternalStore } from "react";
import { STATIC } from "./claude";

// The signed-in visitor, shared by every component on the page. The CSRF
// token from /api/auth/me is attached to every write made through `call`.

export type User = { id: string; email: string; displayName: string; verified: boolean };
type State = { loaded: boolean; enabled: boolean; user: User | null; csrf: string | null };

let state: State = { loaded: false, enabled: false, user: null, csrf: null };
const subs = new Set<() => void>();
let inflight: Promise<void> | null = null;

function set(next: State) {
  state = next;
  subs.forEach((f) => f());
}

export function refreshSession() {
  // The artifact build has no server behind it.
  if (STATIC) {
    set({ loaded: true, enabled: false, user: null, csrf: null });
    return Promise.resolve();
  }
  if (!inflight) {
    inflight = fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { enabled: false, user: null, csrf: null }))
      .then((j) => set({ loaded: true, enabled: !!j.enabled, user: j.user ?? null, csrf: j.csrf ?? null }))
      .catch(() => set({ ...state, loaded: true }))
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useSession() {
  const s = useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state,
    () => state,
  );
  useEffect(() => {
    if (!state.loaded) refreshSession();
    // Coming back to the tab (after signing in elsewhere) picks up the change.
    const on = () => document.visibilityState === "visible" && refreshSession();
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  return s;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** JSON call to our own API, with the CSRF token on writes. */
export async function call<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = opts.method ?? (opts.body ? "POST" : "GET");
  if (method !== "GET" && !state.csrf && state.user) await refreshSession();
  const res = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: { ...(opts.body !== undefined ? { "content-type": "application/json" } : {}), ...(state.csrf && method !== "GET" ? { "x-csrf-token": state.csrf } : {}) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const j = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(res.status, j.error ?? "Something went wrong.");
  return j as T;
}
