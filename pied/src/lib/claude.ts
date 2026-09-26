// When Pied runs as a published claude.ai artifact, the viewer offers a few
// capabilities through `window.claude.use(name)`. On the normal website there
// is no `window.claude`, and every call here resolves null.

type Use = (name: string) => Promise<unknown>;

export function capability<T>(name: string): Promise<T | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const c = (window as unknown as { claude?: { use?: Use } }).claude;
  if (!c?.use) return Promise.resolve(null);
  return c
    .use(name)
    .then((ns) => (ns ?? null) as T | null)
    .catch(() => null);
}

export type Downloads = { save(req: { filename: string; data: Blob | string }): Promise<{ status: string }> };
export type Sample = (input: string, opts?: { modelTier?: "quick" | "default" | "complex"; cache?: boolean }) => Promise<{ text: string; truncated: boolean }>;

/** True in the artifact build, where the page has no server behind it. */
export const STATIC = process.env.NEXT_PUBLIC_PIED_STATIC === "1";
