"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/site/shell";
import { PageTitle } from "@/components/site/forms";
import { PlateCard, type Card } from "@/components/site/plate-card";
import { call, useSession } from "@/lib/session";

export default function Page() {
  const { loaded, enabled } = useSession();
  const [plates, setPlates] = useState<Card[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | string>("loading");

  const load = async (cursor?: string) => {
    const r = await call<{ plates: Card[]; next: string | null }>(`/api/gallery${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`);
    setPlates((p) => (cursor ? [...p, ...r.plates] : r.plates));
    setNext(r.next);
    setState("ready");
  };
  useEffect(() => {
    if (!loaded || !enabled) return;
    const id = setTimeout(() => load().catch((e) => setState(e.message)), 0);
    return () => clearTimeout(id);
  }, [loaded, enabled]);

  return (
    <Shell wide>
      <PageTitle kicker="The gallery" sub="Plates people have chosen to share. Open one and move through it.">
        Pulled from the <em className="font-serif italic">press.</em>
      </PageTitle>
      {state === "loading" ? <p className="label flicker">Hanging the prints…</p> : null}
      {state !== "loading" && state !== "ready" ? <p className="font-serif text-ink-2">{state}</p> : null}
      {state === "ready" && !plates.length ? <p className="font-serif text-lg text-ink-2">Nothing on the walls yet. Make a plate, save it, and make it public to be the first.</p> : null}
      <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {plates.map((p, i) => (
          <PlateCard key={p.id} p={p} index={i} />
        ))}
      </div>
      {next ? (
        <div className="mt-12 flex justify-center">
          <button type="button" onClick={() => load(next)} className="label border border-ink px-6 py-3 hover:bg-ink hover:text-paper">
            More prints
          </button>
        </div>
      ) : null}
    </Shell>
  );
}
