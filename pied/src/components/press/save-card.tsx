"use client";

import Link from "next/link";
import { useState, type RefObject } from "react";
import { STATIC } from "@/lib/claude";
import { renderStill } from "@/lib/export";
import type { FieldData } from "@/lib/field";
import { pack } from "@/lib/pack";
import { call, useSession } from "@/lib/session";
import { Button, Toggle } from "./controls";

// Keep the plate in your library (and, if you like, the public gallery).
export function SaveCard({ data, name }: { data: RefObject<FieldData | null>; name: string }) {
  const { enabled, user } = useSession();
  const [title, setTitle] = useState(name);
  const [pub, setPub] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  if (STATIC || !enabled) return null;

  const save = async () => {
    const d = data.current;
    if (!d) return;
    setBusy(true);
    setErr(null);
    try {
      const thumb = renderStill(d, 480, 270, "contain").toDataURL("image/jpeg", 0.8);
      const r = await call<{ id: string }>("/api/plates", { body: { title: title.trim() || "Untitled", isPublic: pub, plate: pack(d), thumb } });
      setSaved(r.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't save it.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-4 border border-ink bg-ink p-4 text-paper">
      <h3 className="font-display text-2xl">Save to library</h3>
      {!user ? (
        <>
          <p className="mt-2 font-serif text-paper/70">Keep plates, share them by link, and hang them in the gallery.</p>
          <Link href="/signin?next=/make" target="_blank" className="label mt-4 inline-block border-b border-paper pb-0.5">
            Sign in (opens a new tab, your plate stays here) ↗
          </Link>
        </>
      ) : saved ? (
        <p className="mt-2 font-serif">
          Saved.{" "}
          <Link href={`/p/${saved}`} className="underline underline-offset-4">
            Open it
          </Link>{" "}
          or see your{" "}
          <Link href="/library" className="underline underline-offset-4">
            library
          </Link>
          .
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <input
            id="save-title"
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Title"
            className="w-full border-b border-paper/60 bg-transparent py-2 font-display text-xl outline-none"
          />
          <div className="[&_*]:!border-paper [&_.bg-ink]:!bg-paper [&_.bg-paper]:!bg-ink">
            <Toggle label="Hang it in the public gallery" note="anyone with the link can see it" checked={pub} onChange={setPub} />
          </div>
          <Button onClick={save} disabled={busy} className="w-full !bg-paper !text-ink">
            {busy ? "Saving…" : "Save"}
          </Button>
          {err ? <p className="font-serif text-sm">{err}</p> : null}
        </div>
      )}
    </section>
  );
}
