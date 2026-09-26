"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/site/shell";
import { LiveField } from "@/components/site/live-field";
import { canvasBlob, download, renderStill, slug, wallpaperHtml } from "@/lib/export";
import { DEFAULTS, physics } from "@/lib/plate";
import { unpack, type Packed } from "@/lib/pack";
import { call } from "@/lib/session";
import { describePlate } from "@/lib/describe";

type Full = { id: string; title: string; isPublic: boolean; mine: boolean; by: string; createdAt: string; plate: Packed; remixOf?: { id: string; title: string; by: string } | null };

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [p, setP] = useState<Full | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    call<Full>(`/api/plates/${encodeURIComponent(id)}`)
      .then(setP)
      .catch((e) => setErr(e.message));
  }, [id]);
  const data = useMemo(() => (p ? unpack(p.plate) : null), [p]);

  const saveHtml = async () => {
    if (!p || !data) return;
    const html = wallpaperHtml([data], { title: p.title, ...physics(DEFAULTS), drift: false, fit: "contain", kind: "picture", every: 60, audio: false, h24: false });
    setMsg((await download(new Blob([html], { type: "text/html" }), `${slug(p.title)}.html`)) ? "Saved." : "Not saved.");
  };
  const savePng = async () => {
    if (!p || !data) return;
    setMsg((await download(await canvasBlob(renderStill(data, data.cols * 40, data.rows * 40, "contain")), `${slug(p.title)}.png`)) ? "Saved." : "Not saved.");
  };

  return (
    <Shell wide>
      {err ? (
        <div className="py-20">
          <p className="label text-ink-3">Not found</p>
          <h1 className="mt-3 font-display text-5xl">This plate isn&apos;t on the press.</h1>
          <p className="mt-4 font-serif text-ink-2">It may be private, or it was taken down.</p>
          <Link href="/gallery" className="label mt-8 inline-block border-b border-ink pb-0.5">
            See the gallery →
          </Link>
        </div>
      ) : !p || !data ? (
        <p className="label flicker py-20">Inking the plate…</p>
      ) : (
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="relative bg-paper-2 p-4 sm:p-8" style={{ aspectRatio: `${data.cols} / ${data.rows}` }}>
              <LiveField data={data} label={describePlate(data, p.title)} className="h-full w-full" />
            </div>
          </div>
          <aside className="lg:col-span-4">
            <p className="label text-ink-3">
              {p.by} · {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h1 className="mt-3 font-display text-5xl leading-none">{p.title}</h1>
            {p.remixOf ? (
              <p className="label mt-3 text-ink-3">
                Remixed from{" "}
                <Link href={`/p/${p.remixOf.id}`} className="border-b border-ink-3 text-ink hover:border-ink">
                  {p.remixOf.title}
                </Link>{" "}
                · by {p.remixOf.by}
              </p>
            ) : null}
            <p className="mt-4 font-serif text-ink-2">
              {data.cols} × {data.rows} letters. Move your cursor through it.
            </p>
            <div className="mt-8 grid gap-2">
              <button type="button" onClick={saveHtml} className="label bg-ink px-4 py-3 text-paper">
                Download live wallpaper
              </button>
              <button type="button" onClick={savePng} className="label border border-ink px-4 py-3 hover:bg-ink hover:text-paper">
                Download PNG
              </button>
              <Link href={`/make?remix=${p.id}`} className="label border border-ink px-4 py-3 text-center hover:bg-ink hover:text-paper">
                Remix this plate
              </Link>
              <Link href="/make" className="label mt-4 text-center text-ink-3 hover:text-ink">
                Make your own →
              </Link>
            </div>
            {msg ? <p className="mt-4 font-serif text-sm text-ink-2">{msg}</p> : null}
            {p.mine && !p.isPublic ? <p className="mt-6 border-l-2 border-ink pl-3 font-serif text-sm text-ink-2">Only you can see this plate. Make it public from your library to share the link.</p> : null}
          </aside>
        </div>
      )}
    </Shell>
  );
}
