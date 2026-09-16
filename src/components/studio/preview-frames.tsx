"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, RefreshCw, Sparkles, X } from "lucide-react";
import type { GenerationDTO } from "@/lib/serialize";
import { useSession } from "@/components/shell/session";
import { toast } from "@/components/ui/toast";
import { LazyImg } from "./lazy-img";
import { cn } from "@/lib/utils";

// "Preview before you pay": render four cheap stills of the shot, let the
// user pick one, and hand that frame back to the studio as the first frame.

export function PreviewFrames({
  modelId,
  presetId,
  prompt,
  ratio,
  videoCost,
  chosen,
  onChoose,
  onPaywall,
}: {
  modelId: string;
  presetId: string;
  prompt: string;
  ratio: string;
  videoCost: number;
  chosen: string | null;
  onChoose: (url: string | null) => void;
  onPaywall: (needed: number, have: number) => void;
}) {
  const [gen, setGen] = useState<GenerationDTO | null>(null);
  const [busy, setBusy] = useState(false);
  const { setCredits } = useSession();
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!gen || (gen.status !== "queued" && gen.status !== "running")) return;
    poll.current = setInterval(async () => {
      const res = await fetch(`/api/generations/${gen.id}`, { cache: "no-store" });
      if (!res.ok) return;
      const { generation } = (await res.json()) as { generation: GenerationDTO };
      setGen(generation);
      if (generation.status === "failed") toast("Preview failed", { body: generation.error ?? "Credit refunded.", tone: "error" });
    }, 1500);
    return () => {
      if (poll.current) clearInterval(poll.current);
    };
  }, [gen]);

  async function render() {
    if (!prompt.trim() && presetId === "general") return toast("Describe the shot first, or pick a preset");
    setBusy(true);
    const res = await fetch("/api/preview", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ modelId, presetId, prompt, ratio }) });
    const data = await res.json();
    setBusy(false);
    if (res.status === 402) return onPaywall(data.needed, data.have);
    if (!res.ok) return toast("Couldn't start preview", { body: data.error, tone: "error" });
    setGen(data.generation);
    setCredits(data.credits);
    onChoose(null);
  }

  const pending = gen && (gen.status === "queued" || gen.status === "running");
  const frames = gen?.status === "done" ? gen.outputs : [];

  return (
    <div className="rounded-xl border border-lime/25 bg-lime/[0.04] p-3">
      <div className="flex flex-col gap-2">
        <div>
          <div className="text-[13px] font-semibold">Preview before you pay</div>
          <div className="text-[11px] text-fg-3">4 quick stills of this shot for 1✦. Pick the one that&apos;s right, then spend {videoCost}✦ on the video.</div>
        </div>
        <button
          onClick={render}
          disabled={busy || !!pending}
          className="flex h-8 w-fit items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-semibold text-black hover:bg-neutral-200 disabled:opacity-60"
        >
          {busy || pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : gen ? <RefreshCw className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
          {gen ? "Re-roll" : "Preview frames"} <span className="text-[11px] font-medium">✦1</span>
        </button>
      </div>

      {(pending || frames.length > 0) && (
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {(pending ? [0, 1, 2, 3] : frames).map((f, i) => {
            const url = typeof f === "string" ? f : null;
            const selected = !!url && chosen === url;
            return (
              <button
                key={i}
                disabled={!url}
                onClick={() => url && onChoose(selected ? null : url)}
                className={cn("relative overflow-hidden rounded-lg border-2 transition", selected ? "border-lime" : "border-transparent hover:border-line-2", !url && "shimmer")}
                style={{ aspectRatio: ratio.replace(":", "/") }}
              >
                {url && <LazyImg src={url} alt={`Frame ${i + 1}`} />}
                {selected && (
                  <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-lime text-black">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {chosen && (
        <div className="mt-2 flex items-center justify-between rounded-lg bg-black/40 px-2.5 py-1.5 text-[11px]">
          <span className="text-fg-2">Frame selected — it becomes the video&apos;s first frame.</span>
          <button onClick={() => onChoose(null)} className="flex items-center gap-1 text-fg-3 hover:text-fg">
            <X className="h-3 w-3" /> Clear
          </button>
        </div>
      )}
    </div>
  );
}
