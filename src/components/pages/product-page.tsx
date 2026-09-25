import Link from "next/link";
import { ArrowRight, Check, Film, ImageIcon, MessageSquare, Play, Sparkles, Upload } from "lucide-react";
import { getLanding, type Landing } from "@/lib/catalog/landing";
import type { MediaRef, ProductPage as PageDef } from "@/lib/catalog/pages";
import { MediaTile } from "@/components/explore/media";
import { Pill } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tile = { poster?: string; video?: string; hls?: string; label?: string; sub?: string; href?: string };

function resolve(L: Landing, ref: MediaRef): Tile[] {
  switch (ref.kind) {
    case "feature": {
      const f = L.feature[ref.index] ?? L.feature[0];
      return [{ poster: f.poster, video: f.video, label: f.title, sub: f.body, href: f.href }];
    }
    case "effects":
      return L.effects.slice(ref.from ?? 0, (ref.from ?? 0) + (ref.count ?? 10)).map((e) => ({ poster: e.poster, video: e.video, label: e.name, href: `/ai/video?preset=${e.id}` }));
    case "row":
      return L.rows[ref.row].items.slice(0, ref.count ?? 8).map((it) => ({ poster: it.poster, video: it.video, sub: `@${it.author}`, href: L.rows[ref.row].href }));
    case "projects":
      return L.projects.map((p) => ({ poster: p.poster, video: p.video, hls: p.hls, label: p.title, sub: "by Frameline Studio", href: "/ai/video" }));
    case "genjutsu":
      return L.genjutsu.map((m) => (m.endsWith(".mp4") ? { video: m } : { poster: m }));
    case "banner": {
      const b = L.banners?.[ref.name];
      const poster = b ? (b.desktop ?? b.bg) : undefined;
      return [{ poster, video: poster ? undefined : L.promo.video }];
    }
    case "promo":
      return [{ poster: L.promo.poster, video: L.promo.video }];
  }
}

export function ProductPage({ page }: { page: PageDef }) {
  const L = getLanding();
  const hero = resolve(L, page.hero);
  const heroTile = hero[0];
  const heroStrip = hero.length > 1 ? hero.slice(0, 6) : null;

  return (
    <main className="mx-auto w-full max-w-[1400px] px-3 pb-20 pt-4 sm:px-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-fg/8 bg-card">
        {heroStrip ? (
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-6">
            {heroStrip.map((t, i) => (
              <MediaTile key={i} poster={t.poster} video={t.video} play="auto" className="aspect-[3/4]" />
            ))}
          </div>
        ) : (
          <MediaTile poster={heroTile?.poster} video={heroTile?.video} play="auto" className="aspect-[16/7] min-h-[320px]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
          {page.badge && <Pill tone="lime">{page.badge}</Pill>}
          <h1 className="display mt-2 max-w-3xl text-3xl sm:text-5xl">{page.title}</h1>
          <p className="mt-3 max-w-xl text-[14px] text-fg-2 sm:text-[15px]">{page.tagline}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={page.cta.href} className="inline-flex h-11 items-center gap-2 rounded-full bg-lime px-5 text-[14px] font-semibold text-paper hover:bg-lime-2">
              <Sparkles className="h-4 w-4" /> {page.cta.label}
            </Link>
            {page.secondary && (
              <Link href={page.secondary.href} className="inline-flex h-11 items-center gap-2 rounded-full bg-fg/10 px-5 text-[14px] font-semibold hover:bg-fg/15">
                {page.secondary.label} <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Steps */}
      {page.steps && (
        <section className="mt-10 grid gap-3 sm:grid-cols-3">
          {page.steps.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-line bg-card p-5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-lime text-[12px] font-bold text-paper">{i + 1}</div>
              <div className="display mt-4 text-xl">{s.title}</div>
              <p className="mt-1 text-[13px] text-fg-2">{s.body}</p>
            </div>
          ))}
        </section>
      )}

      {page.extras?.includes("bundle") && <Bundle />}
      {page.extras?.includes("chats") && <Chats />}
      {page.extras?.includes("upload") && <UploadBox />}
      {page.extras?.includes("courses") && <Courses L={L} />}
      {page.extras?.includes("promptBank") && <PromptBank />}
      {page.extras?.includes("festival") && <Festival L={L} />}
      {page.extras?.includes("canvases") && <Canvases L={L} />}
      {page.extras?.includes("enterprise") && <Enterprise />}

      {/* Gallery */}
      {page.gallery && (
        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="display text-3xl">{page.gallery.title}</h2>
              {page.gallery.blurb && <p className="mt-1 text-[13px] text-fg-2">{page.gallery.blurb}</p>}
            </div>
            <Link href={page.cta.href} className="hidden shrink-0 rounded-full bg-fg px-4 py-2 text-[13px] font-semibold text-paper hover:bg-lime sm:block">
              Try it
            </Link>
          </div>
          <div
            className={cn(
              "mt-4 grid gap-2",
              (page.gallery.cols ?? 4) >= 6 ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6" : (page.gallery.cols ?? 4) === 5 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid-cols-2 lg:grid-cols-4",
            )}
          >
            {resolve(L, page.gallery.media).map((t, i) => (
              <Link key={i} href={t.href ?? page.cta.href} className="group relative overflow-hidden rounded-xl bg-bg-elev" style={{ aspectRatio: page.gallery!.ratio ?? "16/9" }}>
                <MediaTile poster={t.poster} video={t.video} hls={t.hls} play="auto" className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" />
                {(t.label || t.sub) && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
                    {t.label && <div className="display text-[14px]">{t.label}</div>}
                    {t.sub && <div className="text-[11px] text-fg-2">{t.sub}</div>}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA band */}
      <section className="mt-14 flex flex-col items-start justify-between gap-4 rounded-2xl border border-line bg-card p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <div className="display text-2xl">Every account starts with 100 credits</div>
          <div className="text-[13px] text-fg-2">No card, no waitlist. The studios are one click away.</div>
        </div>
        <div className="flex gap-2">
          <Link href="/ai/image" className="inline-flex h-10 items-center gap-2 rounded-full bg-fg px-4 text-[13px] font-semibold text-paper hover:bg-lime"><ImageIcon className="h-4 w-4" /> Image</Link>
          <Link href="/ai/video" className="inline-flex h-10 items-center gap-2 rounded-full bg-lime px-4 text-[13px] font-semibold text-paper hover:bg-lime-2"><Film className="h-4 w-4" /> Video</Link>
        </div>
      </section>
    </main>
  );
}

/* ---------- page-specific blocks ---------- */

function Bundle() {
  const items = [
    ["Illustration Animation in After Effects", "Bring illustrated characters to life in After Effects."],
    ["Localization Motion in After Effects", "Adapt animated designs for multiple languages."],
    ["Motion Design in After Effects", "Create and refine editable motion design."],
    ["Paper Collage in After Effects", "Turn paper cutouts into editable motion."],
    ["Presentation Animation in After Effects", "Turn presentation slides into editable motion."],
    ["SaaS Animation in After Effects", "Product walkthroughs that stay editable."],
  ];
  return (
    <section className="mt-10">
      <h2 className="display text-3xl">Motion design bundle</h2>
      <p className="mt-1 text-[13px] text-fg-2">Bring your ideas to life with editable animation workflows.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([t, b]) => (
          <Link key={t} href="/ai/video" className="rounded-2xl border border-line bg-card p-5 transition hover:border-fg-3">
            <div className="text-[14px] font-semibold">{t}</div>
            <div className="mt-1 text-[12px] text-fg-3">{b}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Chats() {
  const prompts = [
    "Create an editorial motion graphics faceless video about how the Mona Lisa became the world's most famous painting",
    "Create a cinematic animated faceless video showing how one decisive chess move changes the entire game",
    "Create a stickman cartoon faceless video showing Odysseus's journey to Troy and back home",
    "Create a UGC ad video for these chips, showing its store page on screen",
    "Create a UGC tutorial video showing how to use this water gun",
    "Create a brand kit for Yololey banana milk",
  ];
  return (
    <section className="mt-10 grid gap-4 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-2xl border border-line bg-card p-4">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-fg-3">Chats</div>
        <div className="mt-6 text-center text-[13px] text-fg-3">
          <MessageSquare className="mx-auto mb-2 h-6 w-6" />
          No chats yet
          <div className="text-[11px]">Create one to get started</div>
        </div>
      </aside>
      <div className="rounded-2xl border border-line bg-card p-5">
        <div className="display text-2xl">What are we creating today?</div>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-bg-elev px-4 py-3 text-[14px] text-fg-3">
          Describe the video, ad, or brand kit you want…
          <Link href="/ai/video" className="ml-auto rounded-full bg-lime px-3 py-1.5 text-[12px] font-semibold text-paper">Start</Link>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {prompts.map((p) => (
            <Link key={p} href="/ai/video" className="rounded-xl border border-line px-4 py-3 text-[13px] text-fg-2 transition hover:border-fg-3 hover:text-fg">{p}</Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function UploadBox() {
  return (
    <section className="mt-10 grid gap-4 lg:grid-cols-2">
      <Link href="/ai/image?model=gpt_image_2_5_sunburst" className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-line-2 bg-card p-6 text-center transition hover:border-lime/50">
        <Upload className="h-7 w-7 text-fg-3" />
        <div className="mt-3 text-[15px] font-semibold">Upload media</div>
        <div className="text-[12px] text-fg-3">Upload an image to separate it into editable layers</div>
      </Link>
      <div className="rounded-2xl border border-line bg-card p-6">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-fg-3">My projects</div>
        <div className="mt-6 text-[14px] font-semibold">Your edit projects will appear here</div>
        <div className="text-[12px] text-fg-3">Every project you start is saved here.</div>
      </div>
    </section>
  );
}

function Courses({ L }: { L: Landing }) {
  const courses = [
    ["Blockbuster 4K: The AI Filmmaking Pipeline", "One 40-minute tutorial — scripting, asset creation, and scene-by-scene prompt engineering — chaptered so you can follow shot by shot.", "40 min"],
    ["Build an Ultra-Realistic Short Film in 4K", "A 33-minute director's masterclass. A football drama built shot by shot with Seedance 2.0 4K.", "33 min"],
    ["Add AI VFX to Real Footage", "Composite generated effects into phone footage without a VFX team.", "22 min"],
    ["Make an AI Animated Short", "Build one animated story across eight distinct visual worlds, from concept and scene design to a finished short.", "28 min"],
  ];
  return (
    <section className="mt-10">
      <h2 className="display text-3xl">Most popular courses</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {courses.map(([t, b, d], i) => {
          const p = L.projects[i] ?? L.projects[0];
          return (
            <Link key={t} href="/ai/video" className="group overflow-hidden rounded-2xl border border-line bg-card transition hover:border-fg-3">
              <MediaTile poster={p?.poster} video={p?.video} hls={p?.hls} play="auto" className="aspect-[16/9]" />
              <div className="p-4">
                <div className="flex items-center gap-2 text-[11px] text-fg-3"><Play className="h-3 w-3" /> {d}</div>
                <div className="mt-1 text-[14px] font-semibold">{t}</div>
                <div className="mt-1 line-clamp-3 text-[12px] text-fg-3">{b}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function PromptBank() {
  const moves = ["Static shot", "Pan right", "Pan left", "Dolly zoom", "Rack focus", "Orbit", "Crash zoom", "Whip pan", "Crane up", "Handheld", "Tracking shot", "Tilt down", "Push in", "Pull out", "Dutch angle", "Low angle"];
  return (
    <section className="mt-12">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="display text-3xl">Prompt bank</h2>
          <p className="mt-1 text-[13px] text-fg-2">46 camera moves and framings you can drop into any prompt.</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {moves.map((m) => (
          <Link key={m} href={`/ai/video?preset=${m.toLowerCase().includes("orbit") ? "orbit" : m.toLowerCase().includes("crash") ? "crash_zoom" : "general"}`} className="rounded-full border border-line px-3.5 py-1.5 text-[13px] text-fg-2 transition hover:border-fg-3 hover:text-fg">
            {m}
          </Link>
        ))}
      </div>
    </section>
  );
}

function Festival({ L }: { L: Landing }) {
  const entries = ["Detour by @aist", "The Zero Slasher by @zerotohero", "Fallen Leaves by @jacob_everett", "The Tortoise and the Hare by @benhamin", "VARMINTS: Las Bodas Del Rio by @outrealproduction"];
  return (
    <section className="mt-10">
      <div className="grid gap-3 sm:grid-cols-3">
        {[["$1,000,000", "Prize pool"], ["14", "Winners · Audience Choice ×1 · Honorable Mention ×10"], ["Sep 15", "Deadline — the timeline has shifted"]].map(([v, l]) => (
          <div key={l} className="rounded-2xl border border-line bg-card p-5">
            <div className="display text-3xl text-lime">{v}</div>
            <div className="mt-1 text-[12px] text-fg-3">{l}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-line bg-card p-6">
          <h2 className="display text-2xl">Create in public</h2>
          <p className="mt-2 text-[13px] text-fg-2">Build your film in public — up to 50 most community-supported films go straight to the jury&apos;s shortlist. Standout projects also get credit grants from the Frameline team to finish stronger.</p>
          <ul className="mt-4 space-y-2 text-[13px]">
            {entries.map((e) => (
              <li key={e} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-lime" /> {e}</li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {L.projects.slice(0, 4).map((p) => (
            <MediaTile key={p.slug} poster={p.poster} video={p.video} hls={p.hls} play="auto" className="aspect-[16/9] rounded-xl" />
          ))}
        </div>
      </div>
    </section>
  );
}

function Canvases({ L }: { L: Landing }) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-3 text-[13px] font-medium">
        <span className="rounded-full bg-fg/10 px-3 py-1.5">All canvases</span>
        <span className="rounded-full px-3 py-1.5 text-fg-3">Templates · Quick start</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {L.effects.slice(0, 8).map((e, i) => (
          <Link key={e.id} href="/ai/image" className="group overflow-hidden rounded-2xl border border-line bg-card transition hover:border-fg-3">
            <MediaTile poster={e.poster} className="aspect-[4/3]" />
            <div className="p-3">
              <div className="text-[13px] font-semibold">{["Moodboard", "Product launch", "Character sheet", "Storyboard", "Ad variations", "Lookbook", "Thumbnail set", "Pitch deck"][i]}</div>
              <div className="text-[11px] text-fg-3">Template · {e.name}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Enterprise() {
  const quotes = [
    ["Studio creating the most widely reached mixed reality campaigns", "Frameline didn't just speed up production, but it accelerated the synchronization itself."],
    ["Creative director behind Madonna and Dolce & Gabbana", "The best response is that nobody stops to ask how it was made."],
    ["Creative production studio behind Netflix and Hulu", "Frameline's policies go above and beyond to protect client intellectual property."],
    ["Istanbul production studio behind Lacoste and SuperStep", "Most clients no longer ask whether it was made with AI. They ask whether we can deliver by Thursday."],
  ];
  return (
    <section className="mt-10">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quotes.map(([who, q]) => (
          <figure key={who} className="rounded-2xl border border-line bg-card p-5">
            <blockquote className="text-[14px] leading-relaxed">“{q}”</blockquote>
            <figcaption className="mt-3 text-[11px] text-fg-3">{who}</figcaption>
          </figure>
        ))}
      </div>
      <div id="contact" className="mt-8 grid gap-6 rounded-2xl border border-line bg-card p-6 lg:grid-cols-2 sm:p-8">
        <div>
          <h2 className="display text-3xl">Talk to sales</h2>
          <p className="mt-2 text-[13px] text-fg-2">Shared workspaces, pooled credits, SSO and IP protection for teams. This form is a demo — it doesn&apos;t send anywhere.</p>
          <ul className="mt-4 space-y-1.5 text-[13px] text-fg-2">
            {["Unlimited seats, pooled credits", "Private models and custom presets", "SOC 2 style controls, content never trains models", "Dedicated success engineer"].map((t) => (
              <li key={t} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-lime" /> {t}</li>
            ))}
          </ul>
        </div>
        <form className="grid gap-2.5" action="/pricing">
          {["Work email", "Company", "Team size"].map((l) => (
            <label key={l} className="grid gap-1">
              <span className="text-[11px] font-medium text-fg-3">{l}</span>
              <input className="h-10 rounded-lg border border-line bg-bg-elev px-3 text-[14px] outline-none placeholder:text-fg-3 focus:border-lime/60" placeholder={l} />
            </label>
          ))}
          <button type="submit" className="mt-1 h-11 rounded-lg bg-lime text-[14px] font-semibold text-paper hover:bg-lime-2">Request a demo</button>
        </form>
      </div>
    </section>
  );
}
