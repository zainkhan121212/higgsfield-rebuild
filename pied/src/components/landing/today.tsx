"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { STATIC } from "@/lib/claude";
import { unpack, type Packed } from "@/lib/pack";
import { LiveField } from "../site/live-field";
import { Reveal } from "../reveal";

type Today = { id: string; title: string; by: string; plate: Packed };

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

// The front page of the day: one plate from the public gallery, the same for
// everyone until midnight. Without accounts or public plates, nothing shows.
export function PlateOfTheDay() {
  const [t, setT] = useState<Today | null>(null);
  useEffect(() => {
    if (STATIC) return;
    let live = true;
    fetch("/api/gallery/today")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => live && j?.plate && setT(j))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  const data = useMemo(() => (t ? unpack(t.plate) : null), [t]);
  const now = new Date();
  const day = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  if (!t || !data) return null;

  return (
    <section data-section="Plate of the day" className="mx-auto max-w-[1600px] px-4 pb-28 sm:px-8 sm:pb-40">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-y-[3px] border-double border-ink py-3">
        <p className="label">N° {day} — The Plate of the Day</p>
        <p className="label text-ink-3">
          {now.getDate()} · {ROMAN[now.getMonth() + 1]} · {now.getFullYear()}
        </p>
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-end">
        <Reveal className="lg:col-span-8">
          <div className="bg-paper-2 p-4 sm:p-8" style={{ aspectRatio: `${data.cols} / ${data.rows}`, maxHeight: "80svh", marginInline: "auto" }}>
            <LiveField data={data} label={`${t.title}, set in ${data.cols * data.rows} letters, by ${t.by}`} className="h-full w-full" />
          </div>
        </Reveal>
        <Reveal className="lg:col-span-4" delay={120}>
          <p className="label text-ink-3">Printed by {t.by}</p>
          <h2 className="mt-3 font-display text-[clamp(2.4rem,4.4vw,4.6rem)] leading-[0.95]">{t.title}</h2>
          <p className="mt-4 max-w-sm font-serif text-ink-2">Chosen from the gallery this morning, for everyone, until midnight. Tomorrow there&apos;ll be another.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/p/${t.id}`} className="label bg-ink px-5 py-3 text-paper">
              See the plate
            </Link>
            <Link href={`/make?remix=${t.id}`} className="label border border-ink px-5 py-3 hover:bg-ink hover:text-paper">
              Remix it
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
