import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bot, Film, ImageIcon, Layers, Sparkles, Wand2, Zap } from "lucide-react";
import { db } from "@/lib/db";
import { getModel } from "@/lib/catalog/models";
import { getLanding, type Row } from "@/lib/catalog/landing";
import { Pill } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FeedGrid } from "./feed-grid";
import { MediaTile } from "./media";

export const dynamic = "force-dynamic";

const TOOLS = [
  { name: "Seedance 2.5", kind: "Video", desc: "The most advanced video model", href: "/ai/video?model=seedance_2_5", badge: "TOP", icon: Film },
  { name: "Nano Banana 2", kind: "Image", desc: "Generate high-quality visuals", href: "/ai/image?model=nano_banana_2", badge: "Top", icon: ImageIcon },
  { name: "Higgsfield Genjutsu", kind: "Video", desc: "One video, many versions", href: "/ai/video?model=genjutsu", badge: "NEW", icon: Wand2 },
  { name: "Effects", kind: "Presets", desc: "Camera moves and VFX in one click", href: "/effects", badge: "Free", icon: Zap },
  { name: "Cinema Studio", kind: "Video", desc: "Create cinematic scenes effortlessly", href: "/ai/video?model=kling_3", icon: Layers },
  { name: "Supercomputer", kind: "Agent", desc: "One superagent for your creative stack", href: "/ai/image?model=gpt_image_2", icon: Bot },
];

export async function ExplorePage() {
  const L = getLanding();
  const feed = await db.generation.findMany({
    where: { isPublic: true, status: "DONE" },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: { select: { name: true } } },
  });

  return (
    <main className="mx-auto w-full max-w-[1500px] px-3 pb-10 pt-4 sm:px-5">
      {/* 1. Feature carousel */}
      <section className="scrollbar-none -mx-3 flex snap-x gap-3 overflow-x-auto px-3 sm:-mx-5 sm:px-5">
        {L.feature.map((f) => (
          <Link key={f.title} href={f.href} className="group w-[82vw] shrink-0 snap-start sm:w-[400px]">
            <MediaTile poster={f.poster} video={f.video} play="auto" className="aspect-[16/9] rounded-2xl border border-white/8" />
            <div className="display mt-3 text-[15px]">{f.title}</div>
            <div className="line-clamp-1 text-[12px] text-fg-2">{f.body}</div>
          </Link>
        ))}
      </section>

      {/* 2. Promo + tool tiles */}
      <section className="mt-6 grid gap-3 lg:grid-cols-[1fr_1.6fr]">
        <Link href="/ai/video?model=seedance_2_5" className="relative min-h-[260px] overflow-hidden rounded-2xl border border-white/8">
          <MediaTile poster={L.promo.poster} video={L.promo.video} play="auto" className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/10" />
          <div className="relative p-6">
            <div className="display text-3xl leading-[0.95] sm:text-4xl">
              Start creating
              <br />
              <span className="text-lime">with 100 free credits</span>
            </div>
            <ul className="mt-4 space-y-1.5 text-[13px] text-fg-2">
              {["Real image generation on every account", "Access to Seedance 2.5 and 30+ models", "No card. No waitlist. No paywall on Generate."].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-lime" /> {t}
                </li>
              ))}
            </ul>
            <span className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-lime px-5 text-[13px] font-semibold text-black">
              <Sparkles className="h-4 w-4" /> Generate your first video
            </span>
          </div>
        </Link>
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

      {/* 3. MCP banner */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-line" style={{ background: "radial-gradient(80% 120% at 50% 100%, #1b1b1b 0%, #0a0a0a 70%)" }}>
        <div className="relative px-6 py-10 text-center">
          <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(#2a2a2a 1px, transparent 1px), linear-gradient(90deg, #2a2a2a 1px, transparent 1px)", backgroundSize: "48px 48px", maskImage: "radial-gradient(60% 80% at 50% 60%, black, transparent)" }} />
          <div className="relative">
            <div className="text-[14px] text-fg-2">Higgsfield MCP with</div>
            <div className="display mt-1 text-5xl tracking-tight text-[#cfcfcf] sm:text-7xl">GPT-6 ASTRA</div>
            <p className="mx-auto mt-3 max-w-md text-[13px] text-fg-2">Build games, motion graphics, and interactive 3D experiences with Higgsfield MCP</p>
            <div className="mt-5 flex justify-center gap-2">
              <span className="rounded-full bg-lime px-5 py-2.5 text-[13px] font-semibold text-black">Install Higgsfield plugin</span>
              <span className="rounded-full bg-white/10 px-5 py-2.5 text-[13px] font-semibold">Explore use cases</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Visual effects */}
      <SectionHead title="Visual effects" lime blurb="Big-budget visual effects, from explosions to surreal transformations." cta={{ label: "Try for free", href: "/effects" }} />
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {L.effects.slice(0, 15).map((e) => (
          <Link key={e.id} href={`/ai/video?preset=${e.id}`} className="group relative aspect-[3/4] overflow-hidden rounded-xl">
            <MediaTile poster={e.poster} video={e.video} play="auto" className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="display pointer-events-none absolute bottom-3 left-3 text-[15px]">{e.name}</div>
            <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium opacity-0 backdrop-blur transition group-hover:opacity-100">Recreate</span>
          </Link>
        ))}
      </div>
      <div className="mt-3 text-right">
        <Link href="/effects" className="inline-flex items-center gap-1 text-[13px] font-medium text-lime hover:underline">
          View all presets <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* 5. Genjutsu */}
      <section className="mt-12 rounded-2xl border border-line bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <Pill tone="lime">New model</Pill>
            <h2 className="display mt-3 text-3xl text-lime sm:text-4xl">Higgsfield Genjutsu</h2>
            <p className="mt-2 text-[14px] text-fg-2">Reality manipulation — transfer motion into new scenes, or swap details while everything else stays as filmed.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/ai/video?model=genjutsu" className="rounded-full bg-lime px-5 py-2.5 text-[13px] font-semibold text-black hover:bg-lime-2">Start generating</Link>
            <Link href="/ai/video?model=genjutsu" className="rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-black hover:bg-neutral-200">Learn more</Link>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {L.genjutsu.slice(0, 10).map((m, i) => (
            <Link key={i} href="/ai/video?model=genjutsu" className="relative aspect-[4/5] overflow-hidden rounded-xl bg-bg-elev">
              {m.endsWith(".mp4") ? <MediaTile video={m} play="auto" className="absolute inset-0" /> : <MediaTile poster={m} className="absolute inset-0" />}
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Seedance 2.5 */}
      <CommunityRow row={L.rows.seedance25} cols={5} />

      {/* 7. Projects */}
      <SectionHead title="Explore the inside of every project" blurb="See all prompts, assets, and how each project was created" />
      <div className="scrollbar-none -mx-3 mt-4 flex snap-x gap-3 overflow-x-auto px-3 sm:-mx-5 sm:px-5">
        {L.projects.map((p) => (
          <Link key={p.slug} href="/ai/video" className="group w-[70vw] shrink-0 snap-start sm:w-[286px]">
            <MediaTile poster={p.poster} video={p.video} hls={p.hls} play="auto" className="aspect-[16/9] rounded-xl" />
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-medium text-fg-2">Public</span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold">{p.title}</div>
                <div className="text-[11px] text-fg-3">by Higgsfield Studio</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-3">
        <Link href="/" className="inline-flex items-center gap-1 text-[13px] font-medium text-fg-2 hover:text-fg">Explore community <ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>

      {/* 8. Supercomputer */}
      <section className="mt-12 overflow-hidden rounded-2xl border border-line" style={{ background: L.banners ? `url(${L.banners.supercomputer.bg}) center/cover` : "linear-gradient(120deg,#101010,#0a0a0a)" }}>
        <div className="flex flex-col items-start justify-between gap-6 bg-black/40 p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="display text-3xl sm:text-4xl">Supercomputer</h2>
            <p className="mt-1 text-[14px] text-fg-2">One superagent for your entire creative stack</p>
            {L.banners && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(["creative", "visualizing", "marketing", "production"] as const).map((k) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={k} src={L.banners!.supercomputer[k]} alt={k} className="h-9 rounded-md" />
                ))}
              </div>
            )}
          </div>
          <Link href="/ai/image?model=gpt_image_2" className="rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-black hover:bg-neutral-200">Try Supercomputer</Link>
        </div>
      </section>

      {/* 9. GPT Image 2 */}
      <CommunityRow row={L.rows.gptImage2} cols={6} />

      {/* 10. Canvas */}
      <section className="mt-12 overflow-hidden rounded-2xl border border-line" style={{ background: L.banners ? `url(${L.banners.canvas.bgDesktop}) center/cover` : "linear-gradient(120deg,#0e1a17,#0a0a0a)" }}>
        <div className="grid items-center gap-6 bg-black/30 p-6 sm:grid-cols-[1fr_1.2fr] sm:p-8">
          <div>
            <h2 className="display text-3xl sm:text-4xl">
              One canvas.
              <br />
              Every workflow.
            </h2>
            <p className="mt-2 text-[14px] text-fg-2">Moodboard, chain workflows, and share with your team — all on one canvas</p>
            <span className="mt-4 inline-block rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-black">Open Canvas</span>
          </div>
          {L.banners ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={L.banners.canvas.desktop} alt="Canvas" className="w-full rounded-xl" />
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {L.effects.slice(0, 6).map((e) => (
                <MediaTile key={e.id} poster={e.poster} className="aspect-square rounded-lg" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 11–12. Marketing Studio, Seedance 2.0 */}
      <CommunityRow row={L.rows.marketing} cols={4} />
      <CommunityRow row={L.rows.seedance2} cols={4} />

      {/* 13. Photodump */}
      <section className="mt-12 overflow-hidden rounded-2xl border border-line" style={{ background: "linear-gradient(rgb(160,170,183) 0%, rgb(46,52,58) 100%)" }}>
        <div className="grid items-center gap-6 p-6 sm:grid-cols-[1fr_1fr] sm:p-8">
          <div className="text-black">
            <h2 className="display text-3xl sm:text-4xl">
              Different scenes
              <br />
              same star
            </h2>
            <p className="mt-2 text-[14px] text-black/70">Build your character. One click does the rest</p>
            <Link href="/ai/image?model=soul_2" className="mt-4 inline-block rounded-full bg-black px-5 py-2.5 text-[13px] font-semibold text-white">Try Photodump</Link>
          </div>
          {L.banners ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={L.banners.photodump.desktop} alt="Photodump" className="w-full" />
          ) : (
            <div className="flex justify-end gap-2">
              {L.rows.soul2.items.slice(0, 3).map((it, i) => (
                <MediaTile key={i} poster={it.poster} className={cn("aspect-[3/4] w-28 rounded-xl border-4 border-white/80 shadow-xl", i === 1 && "-mt-4 w-32")} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 14–15. Soul Cinema, Soul 2.0 */}
      <CommunityRow row={L.rows.soulCinema} cols={4} />
      <CommunityRow row={L.rows.soul2} cols={6} />

      {/* Fresh generations on this instance */}
      <SectionHead title="Fresh from this instance" blurb="Every public generation made here, newest first. Click one to remix it." />
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

      {/* 16. Explore more AI features */}
      <section className="mt-14">
        <h2 className="display text-3xl">Explore more AI features</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {L.moreFeatures.map((f) => (
            <Link key={f.label} href={f.href} className="rounded-full border border-line px-3.5 py-1.5 text-[13px] text-fg-2 transition hover:border-fg-3 hover:text-fg">
              {f.label}
            </Link>
          ))}
        </div>
      </section>

      {/* 17. Footer */}
      <footer className="mt-14 border-t border-line pt-10">
        <div className="display text-2xl">AI-native creative suite</div>
        <div className="mt-6 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {L.footer.map((col) => (
            <div key={col.title}>
              <div className="text-[12px] font-semibold uppercase tracking-wide text-fg-3">{col.title}</div>
              <ul className="mt-3 space-y-1.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link href={footerHref(l)} className="text-[13px] text-fg-2 hover:text-fg">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-[11px] text-fg-3 sm:flex-row sm:items-center sm:justify-between">
          <div>Higgsfield rebuild · a 24-hour take-home. {L.source === "higgsfield" ? "Landing media belongs to Higgsfield and its creators; hotlinked for review only." : "Stills generated in this app; motion is free-license footage."}</div>
          <div className="flex gap-4">
            <Link href="/pricing" className="hover:text-fg">Pricing</Link>
            <a href="https://github.com/zainkhan121212/higgsfield-rebuild" className="hover:text-fg" target="_blank" rel="noreferrer">Source</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function SectionHead({ title, blurb, cta, lime }: { title: string; blurb?: string; cta?: { label: string; href: string }; lime?: boolean }) {
  return (
    <div className="mt-12 flex items-end justify-between gap-4">
      <div>
        <h2 className={cn("display text-3xl", lime && "text-lime")}>{title}</h2>
        {blurb && <p className="mt-1 text-[13px] text-fg-2">{blurb}</p>}
      </div>
      {cta && (
        <Link href={cta.href} className="hidden shrink-0 rounded-full bg-lime px-4 py-2 text-[13px] font-semibold text-black hover:bg-lime-2 sm:block">
          {cta.label}
        </Link>
      )}
    </div>
  );
}

function CommunityRow({ row, cols }: { row: Row; cols: number }) {
  return (
    <section>
      <SectionHead title={row.title} blurb={row.blurb} cta={{ label: `View all of ${row.title}`, href: row.href }} />
      <div className={cn("mt-4 grid gap-2", cols >= 6 ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6" : cols === 5 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid-cols-2 lg:grid-cols-4")}>
        {row.items.slice(0, cols * 2).map((it, i) => (
          <Link key={i} href={row.href} className="group relative overflow-hidden rounded-xl" style={{ aspectRatio: row.ratio }}>
            <MediaTile poster={it.poster} video={it.video} play="auto" className="absolute inset-0" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/80 to-transparent p-2 text-[11px] opacity-0 transition group-hover:opacity-100">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-lime text-[9px] font-bold text-black">{it.author.slice(0, 1).toUpperCase()}</span>
              <span className="truncate">@{it.author}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function footerHref(label: string) {
  const l = label.toLowerCase();
  if (l.includes("video") || l.includes("seedance") || l.includes("kling") || l.includes("sora") || l.includes("veo") || l.includes("wan") || l.includes("grok") || l.includes("gemini")) return "/ai/video";
  if (l.includes("image") || l.includes("banana") || l.includes("flux") || l.includes("seedream") || l.includes("gpt") || l.includes("soul") || l.includes("upscale") || l.includes("inpaint")) return "/ai/image";
  if (l === "pricing" || l === "enterprise") return "/pricing";
  if (l.includes("studio") || l.includes("factory") || l.includes("canvas") || l.includes("popcorn")) return "/effects";
  return "/";
}
