"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shell } from "@/components/site/shell";
import { PageTitle } from "@/components/site/forms";
import { PlateCard, type Card } from "@/components/site/plate-card";
import { download, slug, wallpaperHtml } from "@/lib/export";
import { physics, DEFAULTS } from "@/lib/plate";
import { unpack, type Packed } from "@/lib/pack";
import { call, useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export default function Page() {
  const router = useRouter();
  const { loaded, enabled, user } = useSession();
  const [plates, setPlates] = useState<Card[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | string>("loading");
  const [picked, setPicked] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async (cursor?: string) => {
    const r = await call<{ plates: Card[]; next: string | null }>(`/api/plates${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`);
    setPlates((p) => (cursor ? [...p, ...r.plates] : r.plates));
    setNext(r.next);
    setState("ready");
  };
  useEffect(() => {
    if (!loaded) return;
    if (enabled && !user) return router.replace("/signin?next=/library");
    if (!enabled) return;
    const id = setTimeout(() => load().catch((e) => setState(e.message)), 0);
    return () => clearTimeout(id);
  }, [loaded, enabled, user, router]);

  const patch = async (id: string, body: { isPublic?: boolean; title?: string }) => {
    const r = await call<{ isPublic: boolean; title: string }>(`/api/plates/${id}`, { method: "PATCH", body });
    setPlates((ps) => ps.map((p) => (p.id === id ? { ...p, ...r } : p)));
  };
  const remove = async (id: string) => {
    await call(`/api/plates/${id}`, { method: "DELETE" });
    setPlates((ps) => ps.filter((p) => p.id !== id));
    setPicked((x) => x.filter((y) => y !== id));
    setConfirm(null);
  };
  const share = async (id: string) => {
    const url = `${location.origin}/p/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setMsg(`Link copied: ${url}`);
    } catch {
      setMsg(url);
    }
  };
  const slideshow = async () => {
    setMsg("Setting the slideshow…");
    const full = await Promise.all(picked.map((id) => call<{ plate: Packed }>(`/api/plates/${id}`)));
    const html = wallpaperHtml(
      full.map((f) => unpack(f.plate)),
      { title: "Slideshow", ...physics(DEFAULTS), drift: false, fit: "contain", kind: "slideshow", every: 60, audio: true, h24: false },
    );
    const ok = await download(new Blob([html], { type: "text/html" }), `${slug("pied slideshow")}.html`);
    setMsg(ok ? "Saved the slideshow wallpaper. It changes picture every minute and dances to music in Lively or Wallpaper Engine." : "Not saved.");
  };

  if (!user) return <Shell wide>{null}</Shell>;
  return (
    <Shell wide>
      <PageTitle kicker="Your library" sub={<>Every plate you&apos;ve saved from the press. Pick two or more to make a slideshow wallpaper.</>}>
        The <em className="font-serif italic">case.</em>
      </PageTitle>
      <div className="mb-10 flex flex-wrap items-center gap-3 border-y border-rule py-4">
        <Link href="/make" className="label bg-ink px-4 py-2.5 text-paper">
          New plate →
        </Link>
        <button type="button" disabled={picked.length < 2} onClick={() => slideshow().catch((e) => setMsg(e.message))} className="label border border-ink px-4 py-2.5 enabled:hover:bg-ink enabled:hover:text-paper disabled:opacity-40">
          Slideshow from {picked.length || "…"} picked
        </button>
        {msg ? (
          <p className="font-serif text-sm text-ink-2" role="status">
            {msg}
          </p>
        ) : null}
      </div>
      {state === "loading" ? <p className="label flicker">Opening the case…</p> : null}
      {state === "ready" && !plates.length ? <p className="font-serif text-lg text-ink-2">Nothing saved yet. In the press, finish a plate and choose <em>Save to library</em>.</p> : null}
      <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {plates.map((p, i) => (
          <PlateCard key={p.id} p={p} index={i}>
            <span className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <label className="label flex cursor-pointer items-center gap-2">
                <input id={`pick-${p.id}`} type="checkbox" checked={picked.includes(p.id)} onChange={(e) => setPicked((x) => (e.target.checked ? [...x, p.id] : x.filter((y) => y !== p.id)))} className="h-3.5 w-3.5 accent-[#0c0c0b]" />
                Pick
              </label>
              <button type="button" onClick={() => patch(p.id, { isPublic: !p.isPublic }).catch((e) => setMsg(e.message))} className={cn("label", p.isPublic ? "text-ink" : "text-ink-3")}>
                {p.isPublic ? "● Public" : "○ Private"}
              </button>
              {p.isPublic ? (
                <button type="button" onClick={() => share(p.id)} className="label text-ink-3 hover:text-ink">
                  Copy link
                </button>
              ) : null}
              {confirm === p.id ? (
                <span className="label flex gap-3">
                  <button type="button" onClick={() => remove(p.id).catch((e) => setMsg(e.message))} className="text-ink underline">
                    Delete it
                  </button>
                  <button type="button" onClick={() => setConfirm(null)} className="text-ink-3">
                    Keep
                  </button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirm(p.id)} className="label text-ink-3 hover:text-ink">
                  Delete
                </button>
              )}
            </span>
          </PlateCard>
        ))}
      </div>
      {next ? (
        <div className="mt-12 flex justify-center">
          <button type="button" onClick={() => load(next)} className="label border border-ink px-6 py-3 hover:bg-ink hover:text-paper">
            More plates
          </button>
        </div>
      ) : null}
    </Shell>
  );
}
