"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Gauge, Minus, Monitor, Plus, Ratio, Sparkles, Wand2, Loader2 } from "lucide-react";
import { IMAGE_MODELS, getImageModel, imageCost, LIST_PRICE_MULTIPLIER, type ImageModel } from "@/lib/catalog/models";
import { useGenerations } from "./use-generations";
import { ModelPicker } from "./model-picker";
import { SettingChip } from "./setting-chip";
import { GenerationCard } from "./generation-card";
import { Paywall } from "./paywall";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { GenerationDTO } from "@/lib/serialize";

const SUGGESTIONS = [
  "A cinematic portrait of a woman in a yellow raincoat in neon-lit Tokyo rain, 35mm film",
  "Product shot of a matte black sneaker floating above wet concrete, studio rim light",
  "Editorial fashion photo, oversized wool coat, brutalist concrete plaza, overcast",
  "Isometric tiny diner at night, warm windows, snow falling, miniature look",
  "Macro photo of a dewdrop on a fern leaf, morning light, shallow depth of field",
  "Retro-futurist poster of a monorail crossing a desert canyon at golden hour",
];

export function ImageStudio({ initialModelId }: { initialModelId?: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const [model, setModel] = useState<ImageModel>(() => getImageModel(initialModelId));
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState(model.ratios[0]);
  const [resolution, setResolution] = useState(model.resolutions[0]);
  const [quality, setQuality] = useState<"Standard" | "High">("High");
  const [style, setStyle] = useState<"Auto" | "Photo" | "Cinematic" | "Illustration" | "3D">("Auto");
  const [batch, setBatch] = useState(1);
  const [busy, setBusy] = useState(false);
  const [paywall, setPaywall] = useState<{ needed: number; have: number } | null>(null);
  const [gridSize, setGridSize] = useState(2);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const { items, loaded, submit, patch, remove } = useGenerations("image");

  // Keep URL in sync with the model (shareable, like the original).
  useEffect(() => {
    const current = search.get("model");
    if (current !== model.id) router.replace(`/ai/image?model=${model.id}`, { scroll: false });
  }, [model.id, router, search]);

  function pickModel(m: ImageModel) {
    setModel(m);
    if (!m.ratios.includes(ratio)) setRatio(m.ratios[0]);
    if (!m.resolutions.includes(resolution)) setResolution(m.resolutions[0]);
    if (batch > m.maxBatch) setBatch(m.maxBatch);
  }

  const cost = useMemo(() => imageCost(model, resolution, batch), [model, resolution, batch]);
  const listCost = Math.round(cost * LIST_PRICE_MULTIPLIER * 10) / 10;

  async function generate() {
    if (busy) return;
    const p = prompt.trim();
    if (!p) {
      textarea.current?.focus();
      toast("Describe the scene you imagine");
      return;
    }
    setBusy(true);
    const fullPrompt = style === "Auto" ? p : `${p}, ${STYLE_SUFFIX[style]}`;
    const res = await submit({ modelId: model.id, prompt: fullPrompt, ratio, resolution, batch, quality, style });
    setBusy(false);
    if (!res.ok) {
      if (res.error === "insufficient_credits" && res.needed !== undefined) setPaywall({ needed: res.needed, have: res.have ?? 0 });
      else toast("Couldn't start generation", { body: res.error, tone: "error" });
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function rerun(g: GenerationDTO) {
    setPrompt(g.prompt);
    const m = getImageModel(g.modelId);
    pickModel(m);
    if (typeof g.params.ratio === "string") setRatio(g.params.ratio);
    if (typeof g.params.resolution === "string") setResolution(g.params.resolution);
    textarea.current?.focus();
  }

  const hasItems = loaded && items.length > 0;

  return (
    <div className="relative flex flex-1 flex-col">
      {/* Results / hero */}
      <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-44 pt-6 sm:px-6">
        {hasItems && (
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-sm font-semibold text-fg-2">History</h1>
            <label className="flex items-center gap-2 text-[11px] text-fg-3">
              Grid
              <input type="range" min={1} max={4} value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))} className="w-24 accent-lime" />
            </label>
          </div>
        )}
        {!loaded ? (
          <div className="mx-auto mt-24 h-6 w-6 animate-spin rounded-full border-2 border-line border-t-lime" />
        ) : hasItems ? (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${[520, 360, 280, 220][gridSize - 1]}px, 1fr))` }}
          >
            {items.map((g) => (
              <GenerationCard key={g.id} g={g} onFavorite={(id, v) => patch(id, { isFavorite: v })} onDelete={remove} onRerun={rerun} compact={gridSize >= 3} />
            ))}
          </div>
        ) : (
          <Hero onPick={(s) => { setPrompt(s); textarea.current?.focus(); }} />
        )}
      </div>

      {/* Prompt bar */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-4 sm:px-6">
        <div className="pointer-events-auto w-full max-w-[980px] rounded-2xl border border-line bg-[#131313]/95 p-3 shadow-[0_-8px_40px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <div className="flex items-start gap-2">
            <button title="Attach a reference (coming soon)" className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-card-2 text-fg-2 hover:bg-[#242424]">
              <Plus className="h-4 w-4" />
            </button>
            <textarea
              ref={textarea}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  generate();
                }
              }}
              rows={prompt.length > 90 ? 2 : 1}
              placeholder="Describe the scene you imagine"
              className="thin-scroll max-h-28 w-full resize-none bg-transparent py-1.5 text-[14px] leading-relaxed outline-none placeholder:text-fg-3"
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ModelPicker models={IMAGE_MODELS} value={model} onChange={(m) => pickModel(m as ImageModel)} />
            <SettingChip icon={<Ratio className="h-3.5 w-3.5" />} label="Aspect ratio" value={ratio} options={model.ratios} onChange={setRatio} />
            <SettingChip icon={<Gauge className="h-3.5 w-3.5" />} label="Quality" value={quality} options={["Standard", "High"] as const} onChange={setQuality} />
            <SettingChip icon={<Monitor className="h-3.5 w-3.5" />} label="Resolution" value={resolution} options={model.resolutions} onChange={setResolution} />
            <SettingChip icon={<Wand2 className="h-3.5 w-3.5" />} label="Style" value={style} options={["Auto", "Photo", "Cinematic", "Illustration", "3D"] as const} onChange={setStyle} />
            <div className="flex h-9 items-center rounded-lg bg-card-2 text-[13px] font-semibold">
              <button aria-label="Fewer images" onClick={() => setBatch((b) => Math.max(1, b - 1))} className="flex h-9 w-8 items-center justify-center text-fg-2 hover:text-fg disabled:opacity-40" disabled={batch <= 1}>
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[36px] text-center">
                {batch}/{model.maxBatch}
              </span>
              <button aria-label="More images" onClick={() => setBatch((b) => Math.min(model.maxBatch, b + 1))} className="flex h-9 w-8 items-center justify-center text-fg-2 hover:text-fg disabled:opacity-40" disabled={batch >= model.maxBatch}>
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              onClick={generate}
              disabled={busy}
              className={cn(
                "ml-auto flex h-11 items-center gap-2 rounded-xl bg-lime px-5 text-[15px] font-semibold text-black transition hover:bg-lime-2 disabled:opacity-60",
              )}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Generate
              <span className="flex items-center gap-1 text-[13px] font-medium">
                <Sparkles className="h-3.5 w-3.5" />
                <s className="text-black/50">{listCost}</s>
                <b>{cost}</b>
              </span>
            </button>
          </div>
          <div className="mt-1.5 hidden text-[11px] text-fg-3 sm:block">
            <kbd className="rounded border border-line px-1">⌘</kbd> + <kbd className="rounded border border-line px-1">Enter</kbd> to generate ·{" "}
            <kbd className="rounded border border-line px-1">⌘K</kbd> to switch model
          </div>
        </div>
      </div>

      {paywall && <Paywall open onOpenChange={(o) => !o && setPaywall(null)} needed={paywall.needed} have={paywall.have} />}
    </div>
  );
}

const STYLE_SUFFIX: Record<string, string> = {
  Photo: "photorealistic, natural light, DSLR",
  Cinematic: "cinematic still, anamorphic, dramatic lighting, film grain",
  Illustration: "editorial illustration, clean linework, limited palette",
  "3D": "3D render, octane, soft global illumination, subsurface scattering",
};

function Hero({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="mx-auto mt-10 max-w-3xl text-center sm:mt-16">
      <div className="relative mx-auto mb-6 h-40 w-[360px] max-w-full">
        {["-rotate-12 left-0 top-6", "-rotate-3 left-20 top-2", "rotate-3 left-44 top-0 rounded-full", "rotate-12 left-64 top-6"].map((cls, i) => (
          <div
            key={i}
            className={cn("absolute h-28 w-24 rounded-xl border border-white/10 shadow-xl", cls)}
            style={{ background: ["linear-gradient(160deg,#3b2a1a,#120c07)", "linear-gradient(160deg,#1f2a3f,#0a0e18)", "linear-gradient(160deg,#3a1f2d,#140810)", "linear-gradient(160deg,#1d3a2b,#07130d)"][i] }}
          />
        ))}
      </div>
      <h1 className="display text-4xl sm:text-5xl">
        Start creating with <span className="text-lime">Higgsfield Soul Cinema</span>
      </h1>
      <p className="mt-3 text-[15px] text-fg-2">Describe a scene, character, mood, or style — and watch it come to life.</p>
      <div className="mt-8 grid gap-2 text-left sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => onPick(s)} className="rounded-xl border border-line bg-card px-4 py-3 text-[13px] text-fg-2 transition hover:border-fg-3 hover:text-fg">
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
