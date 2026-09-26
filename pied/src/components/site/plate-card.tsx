"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type Card = { id: string; title: string; thumb: string; isPublic: boolean; createdAt: string; by?: string };

export function PlateCard({ p, children, index }: { p: Card; children?: ReactNode; index: number }) {
  return (
    <figure className="group">
      <Link href={`/p/${p.id}`} className="block overflow-hidden border border-rule bg-paper-2" data-cursor="open">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.thumb} alt={p.title} className="block aspect-video w-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]" loading="lazy" />
      </Link>
      <figcaption className="mt-3 border-t border-ink pt-2">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate font-display text-xl">{p.title}</span>
          <span className="label shrink-0 text-ink-3">Nº {String(index + 1).padStart(3, "0")}</span>
        </span>
        <span className="label mt-1 block text-ink-3">
          {p.by ? `${p.by} · ` : ""}
          {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        {children}
      </figcaption>
    </figure>
  );
}
