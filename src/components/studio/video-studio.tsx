"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AtSign, Clock, Film, ImageIcon, Loader2, Music, Pencil, Ratio, Sparkles, Volume2, VolumeX, Monitor, SlidersHorizontal, Upload, X } from "lucide-react";
import { VIDEO_MODELS, getVideoModel, videoCost, LIST_PRICE_MULTIPLIER, type VideoModel } from "@/lib/catalog/models";
import { getPreset, presetsForModel, type Preset } from "@/lib/catalog/presets";
import { useGenerations } from "./use-generations";
import { ModelPicker } from "./model-picker";
import { SettingChip } from "./setting-chip";
import { GenerationCard } from "./generation-card";
import { Paywall } from "./paywall";
import { PresetPicker } from "./preset-picker";
import { PresetThumb } from "./preset-thumb";
import { PreviewFrames } from "./preview-frames";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { GenerationDTO } from "@/lib/serialize";

type Tab = "create" | "edit" | "motion";

export function VideoStudio({ initialModelId, initialPresetId }: { initialModelId?: string; initialPresetId?: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const [tab, setTab] = useState<Tab>("create");
  const [model, setModel] = useState<VideoModel>(() => getVideoModel(initialModelId));
  const [preset, setPreset] = useState<Preset>(() => getPreset(initialPresetId));
  const [mode, setMode] = useState<"references" | "extend">("references");
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(model.durations[1] ?? model.durations[0]);
  const [ratio, setRatio] = useState(model.ratios[0]);
  const [resolution, setResolution] = useState(model.resolutions[model.resolutions.length - 1]);
  const [bitrate, setBitrate] = useState<"Standard" | "High">("High");
  const [audio, setAudio] = useState(true);
  const [reference, setReference] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [paywall, setPaywall] = useState<{ needed: number; have: number } | null>(null);
  const [rightTab, setRightTab] = useState<"history" | "how">("history");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const { items, submit, patch, remove } = useGenerations("video");

  useEffect(() => {
    const m = search.get("model");
    const p = search.get("preset");
    if (m !== model.id || (p ?? "general") !== preset.id) {
      const qs = new URLSearchParams({ model: model.id });
      if (preset.id !== "general") qs.set("preset", preset.id);
      router.replace(`/ai/video?${qs.toString()}`, { scroll: false });
    }
  }, [model.id, preset.id, router, search]);

  function pickModel(m: VideoModel) {
    setModel(m);
    if (!m.durations.includes(duration)) setDuration(m.durations[1] ?? m.durations[0]);
    if (!m.ratios.includes(ratio)) setRatio(m.ratios[0]);
    if (!m.resolutions.includes(resolution)) setResolution(m.resolutions[m.resolutions.length - 1]);
    if (!presetsForModel(m.id).some((p) => p.id === preset.id)) setPreset(getPreset("general"));
  }

  const cost = useMemo(() => videoCost(model, duration, resolution), [model, duration, resolution]);
  const listCost = Math.round(cost * LIST_PRICE_MULTIPLIER);

  async function generate() {
    if (busy) return;
    const p = prompt.trim();
    if (!p && preset.id === "general") {
      textarea.current?.focus();
      toast("Describe the motion you want, or pick a preset");
      return;
    }
    setBusy(true);
    const res = await submit({
      modelId: model.id, presetId: preset.id, prompt: p, ratio, resolution, durationSec: duration, bitrate,
      ...(reference && reference.startsWith("http") ? { referenceUrl: reference } : {}),
    });
    setBusy(false);
    if (!res.ok) {
      if (res.error === "insufficient_credits" && res.needed !== undefined) setPaywall({ needed: res.needed, have: res.have ?? 0 });
      else toast("Couldn't start generation", { body: res.error, tone: "error" });
      return;
    }
    setRightTab("history");
  }

  function rerun(g: GenerationDTO) {
    setPrompt(g.prompt);
    pickModel(getVideoModel(g.modelId));
    setPreset(getPreset(g.presetId));
    if (typeof g.params.ratio === "string") setRatio(g.params.ratio);
    if (typeof g.params.resolution === "string") setResolution(g.params.resolution);
    if (typeof g.params.durationSec === "number") setDuration(g.params.durationSec);
    textarea.current?.focus();
  }

  function onFile(f: File | undefined) {
    if (!f) return;
    const url = URL.createObjectURL(f);
    setReference(url);
    toast("Reference attached", { body: "References guide simulated models; real models use them as the first frame." });
  }

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* Left panel */}
      <aside className="thin-scroll flex w-full shrink-0 flex-col gap-3 border-b border-line bg-bg-elev p-3 lg:h-[var(--studio-h)] lg:w-[320px] lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-4 px-1 text-[13px] font-semibold">
          {(["create", "edit", "motion"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("border-b-2 pb-1.5 pt-1", tab === t ? "border-lime text-fg" : "border-transparent text-fg-3 hover:text-fg-2")}>
              {t === "create" ? "Create Video" : t === "edit" ? "Edit Video" : "Motion Control"}
            </button>
          ))}
        </div>

        {tab !== "create" ? (
          <div className="rounded-xl border border-dashed border-line-2 p-5 text-center text-[13px] text-fg-2">
            <Film className="mx-auto mb-2 h-6 w-6 text-fg-3" />
            {tab === "edit" ? "Upload a clip and describe the change — Seedance 2.5 Edit." : "Drive a character with a reference video — Kling 3.0 Motion Control."}
            <div className="mt-2 text-[11px] text-fg-3">Not in this build. Create Video is fully working.</div>
            <button onClick={() => setTab("create")} className="mt-3 rounded-full bg-fg/8 px-3 py-1.5 text-[12px] font-medium hover:bg-fg/12">
              Back to Create
            </button>
          </div>
        ) : (
          <>
            {/* Preset card */}
            <button onClick={() => setPickerOpen(true)} className="group relative h-[124px] overflow-hidden rounded-xl text-left">
              <PresetThumb preset={preset} motion="auto" className="absolute inset-0" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <div className="display text-lg text-lime">{preset.name}</div>
                <div className="text-[11px] text-fg-2">{model.name}</div>
              </div>
              <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-medium backdrop-blur group-hover:bg-lime group-hover:text-paper">
                <Pencil className="h-3 w-3" /> Change
              </span>
            </button>

            {/* Mode */}
            <div className="grid grid-cols-2 rounded-lg bg-card p-1 text-[12px] font-semibold">
              {(["references", "extend"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={cn("rounded-md py-1.5", mode === m ? "bg-line-2 text-fg" : "text-fg-3 hover:text-fg-2")}>
                  {m === "references" ? "References" : "Extend Video"}
                </button>
              ))}
            </div>

            {/* References */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onFile(e.dataTransfer.files?.[0]);
              }}
              className="rounded-xl border border-dashed border-line-2 bg-card p-4 text-center"
            >
              {reference ? (
                <div className="relative overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={reference} alt="Reference" className="h-28 w-full object-cover" />
                  <button onClick={() => setReference(null)} className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 hover:bg-black">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="mx-auto mb-2 flex w-fit items-center gap-1 rounded-full bg-fg/6 p-1">
                    {[ImageIcon, Film, Music].map((I, i) => (
                      <button key={i} onClick={() => fileInput.current?.click()} className="flex h-7 w-7 items-center justify-center rounded-full bg-card-2 text-fg-2 hover:text-fg">
                        <I className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                  <div className="text-[13px] font-medium">{mode === "references" ? "Add references" : "Add the video to extend"}</div>
                  <div className="text-[11px] text-fg-3">Image, Video or Audio · drop or click</div>
                </>
              )}
              <input ref={fileInput} type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </div>

            {/* Prompt */}
            <div className="rounded-xl bg-card p-3">
              <div className="mb-1 text-[11px] text-fg-3">Prompt</div>
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
                rows={4}
                placeholder={preset.id === "general" ? 'Describe the visual change you want — e.g., "Make it snow" or "Make it nighttime". Add reference images or elements using @…' : `${preset.description} Add details or leave blank.`}
                className="thin-scroll w-full resize-none bg-transparent text-[13px] leading-relaxed outline-none placeholder:text-fg-3"
              />
              <div className="mt-2 flex items-center gap-1.5">
                <button className="flex h-7 items-center gap-1 rounded-full bg-fg/6 px-2 text-[11px] font-medium text-fg-2 hover:text-fg">
                  <AtSign className="h-3 w-3" /> Elements
                </button>
                <button onClick={() => setAudio((a) => !a)} className="flex h-7 items-center gap-1 rounded-full bg-fg/6 px-2 text-[11px] font-medium text-fg-2 hover:text-fg">
                  {audio ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />} {audio ? "On" : "Off"}
                </button>
              </div>
            </div>

            <ModelPicker models={VIDEO_MODELS} value={model} onChange={(m) => pickModel(m as VideoModel)} variant="row" />

            <PreviewFrames
              modelId={model.id}
              presetId={preset.id}
              prompt={prompt}
              ratio={ratio}
              videoCost={cost}
              chosen={reference && reference.startsWith("http") ? reference : null}
              onChoose={(url) => setReference(url)}
              onPaywall={(needed, have) => setPaywall({ needed, have })}
            />

            <div className="grid grid-cols-3 gap-2">
              <SettingChip icon={<Clock className="h-3.5 w-3.5" />} label="Duration" value={duration} options={model.durations} onChange={setDuration} format={(v) => `${v}s`} className="w-full justify-center" />
              <SettingChip icon={<Ratio className="h-3.5 w-3.5" />} label="Aspect ratio" value={ratio} options={model.ratios} onChange={setRatio} className="w-full justify-center" />
              <SettingChip icon={<Monitor className="h-3.5 w-3.5" />} label="Resolution" value={resolution} options={model.resolutions} onChange={setResolution} className="w-full justify-center" />
            </div>
            <SettingChip icon={<SlidersHorizontal className="h-3.5 w-3.5" />} label="Bitrate" value={bitrate} options={["Standard", "High"] as const} onChange={setBitrate} className="w-full justify-between" format={(v) => `Bitrate · ${v}`} />

            <button onClick={generate} disabled={busy} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-lime text-[15px] font-semibold text-paper hover:bg-lime-2 disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Generate
              <span className="flex items-center gap-1 text-[13px] font-medium">
                <Sparkles className="h-3.5 w-3.5" />
                <s className="text-fg-3">{listCost}</s>
                <b>{cost}</b>
              </span>
            </button>
            <div className="text-center text-[11px] text-fg-3">
              {model.backend.type === "simulated" ? "This model is simulated in this build — you get a sample clip after a short render." : "Real generation via fal.ai."}
            </div>
          </>
        )}
      </aside>

      {/* Right panel */}
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1 border-b border-line px-4 py-2 text-[12px] font-medium">
          {(["history", "how"] as const).map((t) => (
            <button key={t} onClick={() => setRightTab(t)} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5", rightTab === t ? "bg-fg/10 text-fg" : "text-fg-3 hover:text-fg-2")}>
              {t === "history" ? <Film className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
              {t === "history" ? "History" : "How it works"}
            </button>
          ))}
        </div>
        <div className="thin-scroll flex-1 overflow-y-auto p-4 lg:h-[calc(var(--studio-h)-41px)]">
          {rightTab === "how" || items.length === 0 ? (
            <HowItWorks onStart={() => { setRightTab("history"); textarea.current?.focus(); }} onPreset={() => setPickerOpen(true)} />
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))" }}>
              {items.map((g) => (
                <GenerationCard key={g.id} g={g} onFavorite={(id, v) => patch(id, { isFavorite: v })} onDelete={remove} onRerun={rerun} />
              ))}
            </div>
          )}
        </div>
      </section>

      <PresetPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        model={model}
        value={preset}
        onPick={(p, m) => {
          if (m && m.id !== model.id) pickModel(m);
          setPreset(p);
          setPickerOpen(false);
        }}
      />
      {paywall && <Paywall open onOpenChange={(o) => !o && setPaywall(null)} needed={paywall.needed} have={paywall.have} />}
    </div>
  );
}

function HowItWorks({ onStart, onPreset }: { onStart: () => void; onPreset: () => void }) {
  const steps = [
    { title: "Add image", body: "Upload or generate an image to start your animation", preset: "act_natural" },
    { title: "Choose preset", body: "Pick a preset to control your image movement", preset: "lacewalker" },
    { title: "Get video", body: "Click generate to create your final animated video", preset: "wild_ride" },
  ];
  return (
    <div className="mx-auto max-w-4xl px-2 py-8 sm:py-14">
      <h1 className="display text-3xl sm:text-4xl">Make videos in one click</h1>
      <p className="mt-2 max-w-xl text-[14px] text-fg-2">250+ presets for camera control, framing, and high-quality VFX — or use the general preset for manual control.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <button key={s.title} onClick={i === 1 ? onPreset : onStart} className="group text-left">
            <PresetThumb preset={getPreset(s.preset)} size="wide" className="aspect-[4/3] w-full rounded-xl border border-fg/8 transition group-hover:border-lime/50" />
            <div className="display mt-3 text-lg">{s.title}</div>
            <div className="text-[13px] text-fg-2">{s.body}</div>
          </button>
        ))}
      </div>
      <div className="mt-8 flex items-center justify-between rounded-xl border border-line bg-card px-5 py-4">
        <div>
          <div className="text-[14px] font-semibold">Don&apos;t know where to start?</div>
          <div className="text-[12px] text-fg-3">Pick a preset — it writes the motion prompt for you.</div>
        </div>
        <button onClick={onPreset} className="rounded-full bg-fg px-4 py-2 text-[13px] font-semibold text-paper hover:bg-lime">
          Browse presets
        </button>
      </div>
    </div>
  );
}
