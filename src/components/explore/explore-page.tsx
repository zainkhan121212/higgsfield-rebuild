import Link from "next/link";
import { ArrowUpRight, Film, ImageIcon, Sparkles, Wand2, Zap, Layers, Bot } from "lucide-react";
import { db } from "@/lib/db";
import { PRESETS, getPreset } from "@/lib/catalog/presets";
import { getModel } from "@/lib/catalog/models";
import { PresetThumb } from "@/components/studio/preset-thumb";
import { AutoVideo } from "@/components/studio/auto-video";
import { FEATURE_CLIPS, GENJUTSU_CLIPS, PROJECT_CLIPS, clipUrl } from "@/lib/catalog/clips";
import { Pill } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FeedGrid } from "./feed-grid";

export const dynamic = "force-dynamic";

const FEATURES = [
  { title: "Higgsfield Genjutsu", body: "One upload in. Endless new visions out.", href: "/ai/video?model=genjutsu", bg: "linear-gradient(135deg,#0b1f1a 0%,#0a0a0a 60%)", accent: "#4ade80", badge: "New model", preset: "world_morphing", clip: FEATURE_CLIPS.genjutsu },
  { title: "Higgsfield Effects", body: "Viral video presets — 20 camera and VFX recipes, free to try.", href: "/effects", bg: "linear-gradient(135deg,#2a1230 0%,#0a0a0a 60%)", accent: "#f472b6", badge: "Free", preset: "burning_man", clip: FEATURE_CLIPS.effects },
  { title: "Soul Cinema", body: "Cinema-grade stills. Anamorphic, moody, ready for the grade.", href: "/ai/image?model=soul_cinema", bg: "linear-gradient(135deg,#2a1a0b 0%,#0a0a0a 60%)", accent: "#fbbf24", preset: "nightline", clip: FEATURE_CLIPS.soul_cinema },
  { title: "Nano Banana 2", body: "Pro quality at Flash speed. 1 credit per image.", href: "/ai/image?model=nano_banana_2", bg: "linear-gradient(135deg,#0b1a2a 0%,#0a0a0a 60%)", accent: "#60a5fa", badge: "Top", preset: "wild_ride", clip: FEATURE_CLIPS.nano_banana },
];

const TOOLS = [
  { name: "Seedance 2.5", kind: "Video", desc: "The most advanced video model", href: "/ai/video?model=seedance_2_5", badge: "TOP", icon: Film },
  { name: "Nano Banana 2", kind: "Image", desc: "Generate high-quality visuals", href: "/ai/image?model=nano_banana_2", badge: "Top", icon: ImageIcon },
  { name: "Higgsfield Genjutsu", kind: "Video", desc: "One video, many versions", href: "/ai/video?model=genjutsu", badge: "NEW", icon: Wand2 },
  { name: "Effects", kind: "Presets", desc: "Camera moves and VFX in one click", href: "/effects", badge: "Free", icon: Zap },
  { name: "Soul 2.0", kind: "Image", desc: "Ultra-realistic fashion visuals", href: "/ai/image?model=soul_2", icon: Layers },
  { name: "Kling 3.0", kind: "Video", desc: "Smooth camera moves, great for people", href: "/ai/video?model=kling_3", icon: Bot },
];

export async function ExplorePage() {
  const feed = await db.generation.findMany({
    where: { isPublic: true, status: "DONE" },
    orderBy: { createdAt: "desc" },
    take: 48,
    include: { user: { select: { name: true } } },
  });

  const featuredPresets = PRESETS.filter((p) => p.featured && p.id !== "general");

  return (
    <main className="mx-auto w-full max-w-[1500px] px-3 pb-24 pt-4 sm:px-5">
      {/* Feature carousel */}
      <section className="scrollbar-none -mx-3 flex snap-x gap-3 overflow-x-auto px-3 sm:-mx-5 sm:px-5">
        {FEATURES.map((f) => (
          <Link key={f.title} href={f.href} className="group w-[82vw] shrink-0 snap-start sm:w-[420px]">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/8" style={{ background: f.bg }}>
              <PresetThumb preset={getPreset(f.preset)} size="wide" className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" />
              <AutoVideo src={clipUrl(f.clip.id)} className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
              <div className="absolute inset-0 opacity-60" style={{ background: `radial-gradient(60% 60% at 80% 20%, ${f.accent}33, transparent 70%)` }} />
              <div className="absolute inset-x-5 top-1/2 -translate-y-1/2">
                <div className="display text-3xl leading-none" style={{ color: f.accent }}>
                  {f.title.split(" ")[0]}
                </div>
                <div className="display text-3xl leading-none text-white">{f.title.split(" ").slice(1).join(" ")}</div>
              </div>
              {f.badge && (
                <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold backdrop-blur">{f.badge}</span>
              )}
              <ArrowUpRight className="absolute right-3 top-3 h-5 w-5 opacity-0 transition group-hover:opacity-100" />
            </div>
            <div className="display mt-3 text-[15px]">{f.title}</div>
            <div className="text-[12px] text-fg-2">{f.body}</div>
          </Link>
        ))}
      </section>

      {/* Welcome card + tool tiles */}
      <section className="mt-8 grid gap-3 lg:grid-cols-[1fr_1.6fr]">
        <div className="relative overflow-hidden rounded-2xl border border-white/8 p-6" style={{ background: "linear-gradient(135deg,#1a1f08 0%,#0a0a0a 70%)" }}>
          <div className="display text-3xl leading-[0.95] sm:text-4xl">
            Start creating
            <br />
            <span className="text-lime">with 100 free credits</span>
          </div>
          <ul className="mt-4 space-y-1.5 text-[13px] text-fg-2">
            {["Real image generation on every account", "20 video presets, 30+ models", "No card. No waitlist. No paywall on Generate."].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-lime" /> {t}
              </li>
            ))}
          </ul>
          <Link href="/ai/image" className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-lime px-5 text-[13px] font-semibold text-black hover:bg-lime-2">
            <Sparkles className="h-4 w-4" /> Generate your first image
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TOOLS.map((t) => (
            <Link key={t.name} href={t.href} className="group flex flex-col justify-between rounded-2xl border border-line bg-card p-4 transition hover:border-line-2 hover:bg-card-2">
              <div className="flex items-start justify-between">
                <t.icon className="h-5 w-5 text-fg-2" />
                <span className="rounded-full bg-white/6 px-2 py-0.5 text-[10px] font-medium text-fg-2">{t.kind}</span>
              </div>
              <div className="mt-6">
                <div className="flex items-center gap-1.5 text-[13px] font-semibold">
                  {t.name}
                  {t.badge && <Pill tone={t.badge === "NEW" || t.badge === "Free" ? "lime" : "blue"}>{t.badge}</Pill>}
                </div>
                <div className="text-[11px] text-fg-3">{t.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Visual effects */}
      <section className="mt-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="display text-3xl text-lime">Visual effects</h2>
            <p className="mt-1 text-[13px] text-fg-2">Big-budget visual effects, from explosions to surreal transformations.</p>
          </div>
          <Link href="/effects" className="hidden rounded-full bg-lime px-4 py-2 text-[13px] font-semibold text-black hover:bg-lime-2 sm:block">
            Try for free
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {featuredPresets.slice(0, 10).map((p, i) => (
            <Link key={p.id} href={`/ai/video?preset=${p.id}`} className={cn("group relative overflow-hidden rounded-xl", i % 5 === 1 ? "aspect-[3/4]" : "aspect-[3/4]")}>
              <PresetThumb preset={p} motion="auto" className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="display absolute bottom-3 left-3 text-[15px]">{p.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Genjutsu */}
      <section className="mt-12 rounded-2xl border border-line bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <Pill tone="lime">New model</Pill>
            <h2 className="display mt-3 text-3xl text-lime sm:text-4xl">Higgsfield Genjutsu</h2>
            <p className="mt-2 text-[14px] text-fg-2">Reality manipulation — transfer motion into new scenes, or swap details while everything else stays as filmed.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/ai/video?model=genjutsu" className="rounded-full bg-lime px-5 py-2.5 text-[13px] font-semibold text-black hover:bg-lime-2">
              Start generating
            </Link>
            <Link href="/ai/video?model=genjutsu" className="rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-black hover:bg-neutral-200">
              Learn more
            </Link>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {GENJUTSU_CLIPS.map((c) => (
            <Link key={c.id} href="/ai/video?model=genjutsu" className="relative aspect-[4/5] overflow-hidden rounded-xl bg-bg-elev">
              <AutoVideo src={clipUrl(c.id)} className="absolute inset-0" />
              <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium backdrop-blur">{c.title}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Studio projects */}
      <section className="mt-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="display text-3xl">Studio originals</h2>
            <p className="mt-1 text-[13px] text-fg-2">Short pieces cut on this stack. Free-license footage, our grade.</p>
          </div>
        </div>
        <div className="scrollbar-none -mx-3 mt-4 flex snap-x gap-3 overflow-x-auto px-3 sm:-mx-5 sm:px-5">
          {PROJECT_CLIPS.map((p) => (
            <Link key={p.clip.id} href="/ai/video" className="group w-[70vw] shrink-0 snap-start sm:w-[300px]">
              <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-bg-elev">
                <AutoVideo src={clipUrl(p.clip.id)} className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" />
                <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium backdrop-blur">Public</span>
              </div>
              <div className="display mt-2 text-[15px]">{p.title}</div>
              <div className="text-[11px] text-fg-3">{p.blurb} · by Higgsfield Studio</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Community feed */}
      <section className="mt-12">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="display text-3xl">Explore the inside of every project</h2>
            <p className="mt-1 text-[13px] text-fg-2">Every public generation on this instance, with its prompt, model and settings. Click one to remix it.</p>
          </div>
        </div>
        <FeedGrid
          items={feed.map((g) => ({
            id: g.id,
            kind: g.kind === "IMAGE" ? "image" : "video",
            prompt: g.prompt,
            url: g.outputs[0],
            thumb: g.thumbnailUrl,
            width: g.width,
            height: g.height,
            model: getModel(g.modelId)?.name ?? g.modelId,
            by: g.user.name,
          }))}
        />
      </section>
    </main>
  );
}
