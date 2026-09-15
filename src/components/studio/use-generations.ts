"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GenerationDTO } from "@/lib/serialize";
import { useSession } from "@/components/shell/session";
import { toast } from "@/components/ui/toast";

export type SubmitResult =
  | { ok: true; generation: GenerationDTO }
  | { ok: false; error: "insufficient_credits"; needed: number; have: number }
  | { ok: false; error: string; needed?: undefined; have?: undefined };

export function useGenerations(kind: "image" | "video") {
  const { setCredits, refresh } = useSession();
  const [items, setItems] = useState<GenerationDTO[]>([]);
  const [loaded, setLoaded] = useState(false);
  const active = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/generations?kind=${kind}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { generations: GenerationDTO[] }) => {
        if (cancelled) return;
        setItems(d.generations);
        d.generations.forEach((g) => {
          if (g.status === "queued" || g.status === "running") active.current.add(g.id);
        });
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  // Poll anything in flight.
  useEffect(() => {
    const t = setInterval(async () => {
      const ids = [...active.current];
      if (ids.length === 0) return;
      await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(`/api/generations/${id}`, { cache: "no-store" });
          if (!res.ok) return;
          const { generation } = (await res.json()) as { generation: GenerationDTO };
          setItems((xs) => xs.map((x) => (x.id === id ? generation : x)));
          if (generation.status === "done" || generation.status === "failed") {
            active.current.delete(id);
            if (generation.status === "failed") {
              toast("Generation failed", { body: generation.error ?? "Credits refunded.", tone: "error" });
              refresh();
            }
          }
        }),
      );
    }, 1500);
    return () => clearInterval(t);
  }, [refresh]);

  const submit = useCallback(
    async (input: Record<string, unknown>): Promise<SubmitResult> => {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, ...input }),
      });
      const data = await res.json();
      if (res.status === 402) return { ok: false, error: "insufficient_credits", needed: data.needed, have: data.have };
      if (!res.ok) return { ok: false, error: data.error ?? "Something went wrong" };
      const gen = data.generation as GenerationDTO;
      setItems((xs) => [gen, ...xs]);
      active.current.add(gen.id);
      setCredits(data.credits);
      return { ok: true, generation: gen };
    },
    [kind, setCredits],
  );

  const patch = useCallback(async (id: string, body: Partial<Pick<GenerationDTO, "isFavorite" | "isPublic" | "folderId">>) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...body } : x)));
    await fetch(`/api/generations/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  }, []);

  const remove = useCallback(async (id: string) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
    await fetch(`/api/generations/${id}`, { method: "DELETE" });
  }, []);

  return { items, loaded, submit, patch, remove };
}
