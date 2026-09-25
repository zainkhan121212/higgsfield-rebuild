import Link from "next/link";
import { db } from "@/lib/db";
import { getModel } from "@/lib/catalog/models";
import { PromptImage } from "@/components/hero/prompt-image";
import { MediaTile } from "@/components/explore/media";
import { clipUrl, FEATURE_CLIPS } from "@/lib/catalog/clips";
import { Reveal } from "@/components/ui/reveal";
import { Overture } from "@/components/intro/overture";
import { Filmstrip, type Frame } from "./filmstrip";
import { Plates, type Plate } from "./plates";

export const dynamic = "force-dynamic";

// The page alternates paper and dark room: you read on paper, you watch in the
// dark. Odd sections are printed, even sections are projected.

const HERO_PROMPT =
  "a woman pouring water, caught mid-pour, silhouette against white, water breaking into a thousand drops, shot on 85mm, high contrast black and white";

const STEPS = [
  {
    n: "01",
    title: "Write the line",
    body: "One sentence. Pick a model if you care which — thirty of them, each priced in plain credits before you press anything.",
  },
  {
    n: "02",
    title: "Spend one credit looking",
    body: "Video is expensive everywhere. Here you buy four stills of the shot for a single credit first, and choose the frame you actually want.",
  },
  {
    n: "03",
    title: "Keep what is yours",
    body: "Every result lands in your library with the prompt attached, downloadable, and on a public page you can send to anyone.",
  },
];

export async function HomePage() {
  const [feed, made] = await Promise.all([
    db.generation.findMany({
      where: { isPublic: true, status: "DONE" },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
    db.generation.count({ where: { status: "DONE" } }),
  ]);

  const usable = feed.filter((g) => g.outputs.length > 0);
  const toName = (id: string) => getModel(id)?.name ?? id;

  const plates: Plate[] = usable.slice(0, 9).map((g) => ({
    id: g.id,
    kind: g.kind === "VIDEO" ? "video" : "image",
    prompt: g.prompt,
    url: g.outputs[0],
    width: g.width,
    height: g.height,
    model: toName(g.modelId),
  }));

  const frames: Frame[] = usable
    .filter((g) => g.kind !== "VIDEO")
    .slice(0, 12)
    .map((g) => ({ id: g.id, url: g.outputs[0], prompt: g.prompt, model: toName(g.modelId) }));

  return (
    <main className="w-full">
      <Overture />

      {/* 01 · the page that is a picture */}
      <section className="relative border-b border-fg/15">
        <div className="mx-auto grid w-full max-w-[1380px] items-center gap-10 px-5 pb-12 pt-8 sm:px-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16 lg:px-12 lg:pb-20 lg:pt-14">
          <div className="order-2 lg:order-1">
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
              <span className="label !text-fg-2">Frameline · reel 01</span>
              <span className="hidden h-px flex-1 bg-line sm:block" />
            </div>
            <h1 className="display mt-6 text-[clamp(2.6rem,5.6vw,4.25rem)]">
              Every picture here
              <br />
              begins as a <em className="text-lime">sentence</em>.
            </h1>
            <p className="mt-7 max-w-[47ch] text-[15px] leading-[1.65] text-fg-2">
              The woman beside this paragraph is not a photograph. She is the prompt that made her, set in
              type — one character per pixel of the result. Move your cursor through her and the writing
              scatters; leave it a moment and it settles back into the picture.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/ai/image"
                className="group inline-flex h-11 items-center gap-2.5 bg-fg px-6 font-mono text-[11px] uppercase tracking-[0.16em] text-paper transition-colors hover:bg-lime"
              >
                Open the image studio
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/ai/video"
                className="inline-flex h-11 items-center border border-fg/30 px-6 font-mono text-[11px] uppercase tracking-[0.16em] text-fg transition-colors hover:border-fg"
              >
                Make a video
              </Link>
            </div>
            <p className="mt-6 font-mono text-[11px] leading-relaxed text-fg-3">
              100 credits waiting when you arrive. No card, no waitlist, no paywall on the button.
            </p>
          </div>

          {/* The picture is mounted like a plate: crop marks and a warm ground. */}
          <figure className="order-1 lg:order-2">
            <div className="crop-marks relative mx-auto max-w-[620px] px-5 text-fg-3 sm:px-8">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(60% 45% at 50% 42%, rgba(188,51,24,0.07), transparent 70%)" }}
              />
              <PromptImage
                src="/hero/pour.jpg"
                prompt={HERO_PROMPT}
                palette="ink"
                cell={8}
                radius={130}
                force={2.8}
                className="relative mx-auto aspect-[870/1100] w-full max-w-[540px]"
              />
            </div>
            <figcaption className="mx-auto mt-3 flex max-w-[540px] items-baseline justify-between gap-4 border-t border-line pt-2">
              <span className="fig">Fig. 01 — the prompt, printed as its own result</span>
              <span className="fig hidden shrink-0 sm:block">move your cursor through it</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 02 · the dark room: a contact strip of what was just made */}
      {frames.length > 0 && (
        <section className="relative overflow-hidden bg-night text-paper grain">
          <div className="absolute inset-0 grid-field opacity-60" />
          <div className="relative mx-auto w-full max-w-[1380px] px-5 pt-10 sm:px-8 lg:px-12">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-amber/20 pb-3">
              <h2 className="display text-[22px] text-paper">
                Lately, in the <em className="text-amber">dark room</em>
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/40">
                § 02 · straight off the wire
              </span>
            </div>
          </div>
          <div className="relative mt-6 pb-10">
            <Filmstrip frames={frames} />
          </div>
        </section>
      )}

      {/* 03 · how the thing works */}
      <section className="border-b border-fg/15">
        <div className="mx-auto w-full max-w-[1380px] px-5 py-14 sm:px-8 lg:px-12">
          <div className="flex items-baseline justify-between border-b border-line pb-3">
            <h2 className="display text-[26px]">Three moves, in order</h2>
            <span className="label hidden sm:block">§ 03</span>
          </div>
          <div className="grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08} className="py-8 md:px-8 md:py-10 md:first:pl-0 md:last:pr-0">
                <span className="fig">{s.n}</span>
                <h3 className="display mt-3 text-[22px]">{s.title}</h3>
                <p className="mt-3 max-w-[38ch] text-[14px] leading-[1.6] text-fg-2">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 04 · the one number that matters */}
      <section className="relative overflow-hidden bg-night text-paper grain vignette">
        <div className="absolute inset-0 grid-field opacity-70" />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "radial-gradient(70% 55% at 22% 30%, rgba(232,163,61,0.13), transparent 70%)" }}
        />
        <div className="relative mx-auto w-full max-w-[1380px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
            <Reveal>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber/80">
                § 04 · the difference
              </span>
              <h2 className="display fringe mt-4 text-[clamp(2rem,4vw,3.1rem)]">
                Most of these sites
                <br />
                stop you at the <em className="text-amber">button</em>.
              </h2>
              <p className="mt-6 max-w-[46ch] text-[15px] leading-[1.65] text-paper/65">
                I signed up for the one this was modelled on, wrote a prompt, pressed generate, and got a
                pricing page. So the first decision here was the only one that mattered: the free account
                generates. Really generates — the pictures on this page came out of this database.
              </p>
            </Reveal>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-8 self-end sm:grid-cols-4">
              {[
                ["100", "credits, on arrival"],
                ["1", "credit for four stills"],
                ["0", "cards asked for"],
                [String(made), made === 1 ? "picture made here" : "pictures made here"],
              ].map(([big, small], i) => (
                <Reveal key={small} delay={0.1 + i * 0.08} className="border-t border-amber/30 pt-3">
                  <dt className="display text-[clamp(2.2rem,5vw,3.2rem)] leading-none tabular-nums text-paper">{big}</dt>
                  <dd className="mt-2 font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-paper/50">
                    {small}
                  </dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* 05 · plates: real output, real prompts */}
      <section className="border-b border-fg/15">
        <div className="mx-auto w-full max-w-[1380px] px-5 py-14 sm:px-8 lg:px-12">
          <div className="flex items-baseline justify-between border-b border-line pb-3">
            <h2 className="display text-[26px]">Plates</h2>
            <span className="label hidden sm:block">§ 05 · made in this app, prompts intact</span>
          </div>
          <Reveal className="pt-8">
            <Plates items={plates} />
          </Reveal>
          <div className="mt-10 border-t border-line pt-4">
            <Link href="/asset/all" className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg-2 hover:text-lime">
              The whole library →
            </Link>
          </div>
        </div>
      </section>

      {/* 06 · the two rooms, shown in the dark */}
      <section className="relative overflow-hidden bg-night text-paper grain">
        <div className="absolute inset-0 grid-field opacity-50" />
        <div className="relative mx-auto w-full max-w-[1380px] px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          <div className="flex items-baseline justify-between border-b border-amber/20 pb-3">
            <h2 className="display text-[26px] text-paper">Two rooms</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/40">§ 06</span>
          </div>
          <div className="grid gap-10 pt-8 md:grid-cols-2 md:gap-12">
            <Reveal as="div">
              <Link href="/ai/image" className="group block">
                <div className="relative overflow-hidden border border-amber/20 bg-paper">
                  <PromptImage
                    src="/hero/tokyo.jpg"
                    prompt="a street in tokyo at night, rain on the asphalt, neon reflected in every puddle, shot on 35mm"
                    palette="ink"
                    cell={7}
                    radius={100}
                    force={2.2}
                    className="aspect-[16/10] w-full"
                  />
                </div>
                <div className="mt-4 border-t border-amber/20 pt-3">
                  <div className="flex items-baseline justify-between">
                    <h3 className="display text-[24px] text-paper transition-colors group-hover:text-amber">Stills</h3>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber/70">1–4 credits</span>
                  </div>
                  <p className="mt-2 max-w-[44ch] text-[14px] leading-[1.6] text-paper/60">
                    Thirty models behind one prompt box. Real generation, a few seconds, the cost printed on the
                    button before you press it.
                  </p>
                </div>
              </Link>
            </Reveal>

            <Reveal as="div" delay={0.1}>
              <Link href="/ai/video" className="group block">
                <MediaTile
                  video={clipUrl(FEATURE_CLIPS.effects.id)}
                  play="auto"
                  className="aspect-[16/10] w-full border border-amber/20"
                />
                <div className="mt-4 border-t border-amber/20 pt-3">
                  <div className="flex items-baseline justify-between">
                    <h3 className="display text-[24px] text-paper transition-colors group-hover:text-amber">Motion</h3>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber/70">45 credits</span>
                  </div>
                  <p className="mt-2 max-w-[44ch] text-[14px] leading-[1.6] text-paper/60">
                    Twenty-two camera and effect presets, a reference drop, and the one-credit still preview so a
                    45-credit render is never a guess. Video models are simulated in this build and every card
                    says so.
                  </p>
                </div>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 07 · colophon */}
      <footer className="mx-auto w-full max-w-[1380px] px-5 py-14 sm:px-8 lg:px-12">
        <div className="grid gap-10 border-t border-fg/20 pt-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-20">
          <div>
            <h2 className="display text-[28px]">Colophon</h2>
            <p className="mt-4 max-w-[62ch] text-[14px] leading-[1.7] text-fg-2">
              Frameline was built in a day and redrawn in an evening. Next.js with React Server Components,
              Postgres through Prisma, images from FLUX on fal, deployed on Vercel. The hero is a canvas that
              samples an image and prints one character of the prompt per pixel; it parks its own animation
              loop when the letters settle, and draws once instead of animating if you have asked your system
              for less motion.
            </p>
            <p className="mt-4 max-w-[62ch] text-[14px] leading-[1.7] text-fg-2">
              Honest labels, because they cost nothing: images are real, video is simulated, and checkout is a
              faithful walkthrough that never touches a card.
            </p>
            <Link
              href="/?intro=1"
              className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-fg-3 hover:text-lime"
            >
              ▸ Play the overture again
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-8">
            {[
              {
                title: "Make",
                links: [
                  ["Image studio", "/ai/image"],
                  ["Video studio", "/ai/video"],
                  ["Effects", "/effects"],
                  ["Library", "/asset/all"],
                ],
              },
              {
                title: "Read",
                links: [
                  ["Plans & credits", "/pricing"],
                  ["Your account", "/account"],
                  ["Academy", "/academy"],
                  ["Enterprise", "/enterprise"],
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h3 className="label mb-3">{col.title}</h3>
                <ul className="space-y-2">
                  {col.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className="text-[14px] text-fg-2 hover:text-lime">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-baseline justify-between gap-3 border-t border-line pt-4">
          <span className="fig">Frameline · set in Instrument Serif, Inter and IBM Plex Mono</span>
          <span className="fig">An assignment build. Not affiliated with any other studio.</span>
        </div>
      </footer>
    </main>
  );
}
