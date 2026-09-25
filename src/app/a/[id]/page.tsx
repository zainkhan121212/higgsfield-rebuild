import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { getModel } from "@/lib/catalog/models";
import { getPreset } from "@/lib/catalog/presets";
import { timeAgo } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const g = await db.generation.findUnique({ where: { id }, select: { prompt: true, thumbnailUrl: true } });
  if (!g) return { title: "Not found" };
  return { title: g.prompt.slice(0, 60), openGraph: { images: g.thumbnailUrl ? [g.thumbnailUrl] : [] } };
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await db.generation.findUnique({ where: { id }, include: { user: { select: { name: true } } } });
  if (!g || !g.isPublic || g.status !== "DONE") notFound();
  const model = getModel(g.modelId);
  const preset = g.kind === "VIDEO" ? getPreset(g.presetId) : null;
  const params_ = g.params as Record<string, unknown>;
  const rerunHref = g.kind === "IMAGE" ? `/ai/image?model=${g.modelId}` : `/ai/video?model=${g.modelId}${preset && preset.id !== "general" ? `&preset=${preset.id}` : ""}`;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-2xl border border-line bg-card">
          {g.kind === "VIDEO" ? (
            <video src={g.outputs[0]} controls autoPlay loop muted playsInline className="w-full bg-black" />
          ) : (
            <div className={g.outputs.length > 1 ? "grid grid-cols-2 gap-1 p-1" : ""}>
              {g.outputs.map((u) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={u} src={u} alt={g.prompt} className="w-full rounded-lg object-cover" />
              ))}
            </div>
          )}
        </div>
        <aside className="flex flex-col gap-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-fg-3">{g.kind === "VIDEO" ? "Video" : "Image"} · {timeAgo(g.createdAt)}</div>
            <h1 className="mt-1 text-[15px] leading-relaxed">{g.prompt}</h1>
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-line bg-card p-3 text-[12px]">
            <Row k="Model" v={model?.name ?? g.modelId} />
            {preset && <Row k="Preset" v={preset.name} />}
            <Row k="Ratio" v={String(params_.ratio ?? "—")} />
            <Row k="Resolution" v={String(params_.resolution ?? "—")} />
            {g.durationSec && <Row k="Duration" v={`${g.durationSec}s`} />}
            <Row k="Cost" v={`${g.cost}✦`} />
            <Row k="By" v={g.user.name} />
            {g.simulated && <Row k="Backend" v="Simulated" />}
          </dl>
          <Link href={rerunHref} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-lime text-[14px] font-semibold text-paper hover:bg-lime-2">
            <Sparkles className="h-4 w-4" /> Make your own <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-[11px] text-fg-3">Every account gets 100 free credits. No card required.</p>
        </aside>
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-fg-3">{k}</dt>
      <dd className="truncate text-right font-medium">{v}</dd>
    </>
  );
}
