"use client";

import { Download, Heart, Link2, RefreshCw, Trash2, AlertTriangle, Maximize2 } from "lucide-react";
import { useState } from "react";
import type { GenerationDTO } from "@/lib/serialize";
import { getModel } from "@/lib/catalog/models";
import { getPreset } from "@/lib/catalog/presets";
import { cn, timeAgo } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { Lightbox } from "./lightbox";
import { LazyImg } from "./lazy-img";

export function GenerationCard({
  g,
  onFavorite,
  onDelete,
  onRerun,
  compact = false,
}: {
  g: GenerationDTO;
  onFavorite?: (id: string, v: boolean) => void;
  onDelete?: (id: string) => void;
  onRerun?: (g: GenerationDTO) => void;
  compact?: boolean;
}) {
  const model = getModel(g.modelId);
  const preset = g.kind === "video" ? getPreset(g.presetId) : null;
  const pending = g.status === "queued" || g.status === "running";
  const [lightbox, setLightbox] = useState<number | null>(null);

  const ratio = g.width && g.height ? `${g.width} / ${g.height}` : g.kind === "video" ? "16 / 9" : "1 / 1";
  const batch = g.kind === "image" ? Number(g.params.batch ?? 1) : 1;

  return (
    <article className="rounded-xl border border-line bg-card p-3">
      <header className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("line-clamp-2 text-[13px] leading-snug", compact && "line-clamp-1")}>{g.prompt}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-fg-3">
            <span className="font-medium text-fg-2">{model?.name ?? g.modelId}</span>
            {preset && preset.id !== "general" && <span>· {preset.name}</span>}
            {g.kind === "video" && g.durationSec && <span>· {g.durationSec}s</span>}
            <span>· {String(g.params.ratio ?? "")}</span>
            <span>· {timeAgo(g.createdAt)}</span>
            <span>· {g.cost}✦</span>
            {g.simulated && g.status === "done" && (
              <span className="rounded-[4px] bg-white/8 px-1 py-[1px] font-semibold uppercase text-fg-3" title="This model runs on a simulated backend in this build">
                simulated
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {onRerun && (
            <Icon title="Run again" onClick={() => onRerun(g)}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Icon>
          )}
          {onFavorite && (
            <Icon title={g.isFavorite ? "Unfavorite" : "Favorite"} onClick={() => onFavorite(g.id, !g.isFavorite)} active={g.isFavorite}>
              <Heart className={cn("h-3.5 w-3.5", g.isFavorite && "fill-current")} />
            </Icon>
          )}
          <Icon
            title="Copy share link"
            onClick={() => {
              navigator.clipboard?.writeText(`${location.origin}/a/${g.id}`);
              toast("Link copied", { body: "Anyone with the link can view this generation." });
            }}
          >
            <Link2 className="h-3.5 w-3.5" />
          </Icon>
          {onDelete && (
            <Icon title="Delete" onClick={() => onDelete(g.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Icon>
          )}
        </div>
      </header>

      {g.status === "failed" ? (
        <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/8 px-3 py-3 text-[13px]">
          <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
          <span className="text-fg-2">{g.error ?? "Generation failed."} Credits were refunded.</span>
        </div>
      ) : pending ? (
        <div className={cn("grid gap-2", batch > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {Array.from({ length: batch }).map((_, i) => (
            <div key={i} className="shimmer relative overflow-hidden rounded-lg" style={{ aspectRatio: ratio, maxHeight: 420 }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[12px] text-fg-2">
                <span className="pulse-ring h-2 w-2 rounded-full bg-lime" />
                {g.status === "queued" ? "Queued" : g.kind === "video" ? "Rendering frames…" : "Generating…"}
              </div>
            </div>
          ))}
        </div>
      ) : g.kind === "video" ? (
        <video
          src={g.outputs[0]}
          poster={g.thumbnailUrl ?? undefined}
          controls
          playsInline
          loop
          muted
          autoPlay
          className="w-full rounded-lg bg-black"
          style={{ aspectRatio: ratio, maxHeight: 480 }}
        />
      ) : (
        <div className={cn("grid gap-2", g.outputs.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {g.outputs.map((url, i) => (
            <button key={url} onClick={() => setLightbox(i)} className="group relative overflow-hidden rounded-lg bg-bg-elev" style={{ aspectRatio: ratio, maxHeight: 480 }}>
              <LazyImg src={url} alt={g.prompt} className="transition-transform duration-300 group-hover:scale-[1.02]" />
              <span className="absolute right-2 top-2 rounded-md bg-black/60 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Maximize2 className="h-3.5 w-3.5" />
              </span>
              <a
                href={url}
                download
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-2 right-2 rounded-md bg-black/60 p-1.5 opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
              >
                <Download className="h-3.5 w-3.5" />
              </a>
            </button>
          ))}
        </div>
      )}
      {lightbox !== null && <Lightbox urls={g.outputs} index={lightbox} prompt={g.prompt} onClose={() => setLightbox(null)} onIndex={setLightbox} />}
    </article>
  );
}

function Icon({ children, title, onClick, active }: { children: React.ReactNode; title: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn("flex h-7 w-7 items-center justify-center rounded-md text-fg-3 hover:bg-white/8 hover:text-fg", active && "text-pink hover:text-pink")}
    >
      {children}
    </button>
  );
}
