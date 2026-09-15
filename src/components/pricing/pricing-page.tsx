"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { PLANS, type PlanDef } from "@/lib/catalog/plans";
import { PACKS } from "@/lib/catalog/packs";
import { useSession } from "@/components/shell/session";
import { cn } from "@/lib/utils";
import { Pill } from "@/components/ui/button";

export function PricingPage() {
  const { user } = useSession();
  const router = useRouter();
  const search = useSearchParams();
  const [annual, setAnnual] = useState(true);
  const [audience, setAudience] = useState<"individual" | "business">("individual");
  const [proCredits, setProCredits] = useState(600);
  const [maxCredits, setMaxCredits] = useState(1800);
  const [busy, setBusy] = useState<string | null>(null);
  const highlight = search.get("plan")?.toUpperCase();

  useEffect(() => {
    if (highlight) document.getElementById(`plan-${highlight}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlight]);

  function choose(plan: PlanDef) {
    setBusy(plan.id);
    const credits = plan.id === "PRO" ? proCredits : plan.id === "MAX" ? maxCredits : plan.credits;
    router.push(`/checkout?plan=${plan.id.toLowerCase()}&credits=${credits}&interval=${annual ? "annual" : "monthly"}`);
  }

  const wizardPlan = useMemo(() => (proCredits >= 900 ? "MAX" : "PRO"), [proCredits]);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 pb-24 pt-8 sm:px-6">
      {/* Promo hero */}
      <div className="relative overflow-hidden rounded-2xl border border-pink/30 p-6 sm:p-8" style={{ background: "linear-gradient(120deg,#2a0a1a 0%,#120612 60%,#0a0a0a 100%)" }}>
        <Pill tone="pink">Extra discount</Pill>
        <h1 className="display mt-3 text-3xl text-pink sm:text-4xl">Nano Banana 2 &amp; Kling 3.0 unlimited</h1>
        <div className="display text-3xl sm:text-4xl">Every plan is 30% off this week</div>
        <p className="mt-2 max-w-xl text-[13px] text-fg-2">Checkout runs end to end — order review, card form, receipt — with a test card. Nothing is charged; credits land when the order completes.</p>
      </div>

      <div className="mt-12">
        <h2 className="text-3xl font-bold tracking-tight">Upgrade your plan</h2>
        <p className="mt-1 text-[13px] text-fg-2">Lock better prices with upgrade or scale your creativity maximizing your current plan</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-full bg-card p-1 text-[13px] font-medium">
          {(["individual", "business"] as const).map((a) => (
            <button key={a} onClick={() => setAudience(a)} className={cn("rounded-full px-4 py-1.5", audience === a ? "bg-white/10 text-fg" : "text-fg-3 hover:text-fg-2")}>
              {a === "individual" ? "Individual plans" : "Business plans"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <a href="#wizard" className="rounded-full border border-line px-3 py-1.5 text-[12px] font-medium hover:border-fg-3">
            Not sure which plan?
          </a>
          <label className="flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-[12px] font-medium">
            <span className={cn(!annual && "text-fg", annual && "text-fg-3")}>Monthly</span>
            <button role="switch" aria-checked={annual} onClick={() => setAnnual((a) => !a)} className={cn("relative h-5 w-9 rounded-full transition", annual ? "bg-lime" : "bg-white/20")}>
              <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-black transition", annual ? "left-[18px]" : "left-0.5")} />
            </button>
            <span className={cn(annual && "text-fg", !annual && "text-fg-3")}>Annual</span>
            <Pill tone="pink">-30%</Pill>
          </label>
        </div>
      </div>

      {audience === "business" ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line-2 p-10 text-center text-[13px] text-fg-3">Business plans (shared workspaces, pooled credits, SSO) are not in this build.</div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {PLANS.filter((p) => p.id !== "FREE").map((p) => {
            const credits = p.id === "PRO" ? proCredits : p.id === "MAX" ? maxCredits : p.credits;
            const mult = credits / p.credits;
            const monthly = Math.round(p.price * mult * (annual ? 1 : 1.3));
            const list = p.listPrice ? Math.round(p.listPrice * mult * (annual ? 1 : 1.3)) : null;
            const current = user?.plan === p.id;
            return (
              <div
                id={`plan-${p.id}`}
                key={p.id}
                className={cn("flex flex-col rounded-2xl border p-5", highlight === p.id ? "border-lime" : "border-line")}
                style={{ background: p.bg }}
              >
                <div className="flex items-center gap-2">
                  <div className="display text-2xl">{p.name}</div>
                  {p.badge && <Pill tone="pink">{p.badge}</Pill>}
                  {p.id === "MAX" && <Pill tone="blue">Best value</Pill>}
                </div>
                <div className="text-[12px] text-fg-2">{p.tagline}</div>

                <div className="mt-4 rounded-xl bg-black/30 p-3">
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold">
                    <Sparkles className="h-3.5 w-3.5 text-lime" /> {credits.toLocaleString()} credits/mo.
                  </div>
                  <div className="mt-1 text-[11px] text-fg-3">
                    ≈ {Math.round(credits / 2)} Nano Banana 2 images
                    <br />≈ {Math.round(credits / 22)} Seedance 2.0 videos
                  </div>
                  {p.id === "BASIC" ? (
                    <div className="mt-2 flex items-center gap-1 rounded-md bg-white/6 px-2 py-1 text-[11px] text-fg-2">
                      <Check className="h-3 w-3" /> Fixed amount of 120 credits/mo
                    </div>
                  ) : (
                    <div className="mt-3">
                      <input
                        type="range"
                        min={p.credits}
                        max={p.credits * 3}
                        step={p.credits / 4}
                        value={credits}
                        onChange={(e) => (p.id === "PRO" ? setProCredits(Number(e.target.value)) : setMaxCredits(Number(e.target.value)))}
                        className="w-full accent-lime"
                      />
                      <div className="flex justify-between text-[10px] text-fg-3">
                        <span>{p.credits.toLocaleString()}</span>
                        <span>{(p.credits * 2).toLocaleString()}</span>
                        <span>{(p.credits * 3).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  {list && <s className="text-xl font-bold text-pink">${list}</s>}
                  <span className="text-3xl font-bold">${monthly}</span>
                  <span className="text-[11px] text-fg-3">per month, billed {annual ? "annually" : "monthly"}</span>
                </div>

                <button
                  onClick={() => choose(p)}
                  disabled={busy !== null}
                  className={cn(
                    "mt-3 flex h-11 items-center justify-center gap-2 rounded-xl text-[14px] font-semibold disabled:opacity-60",
                    p.id === "PRO" ? "bg-lime text-black hover:bg-lime-2" : p.id === "MAX" ? "bg-pink text-white hover:brightness-110" : "bg-white text-black hover:bg-neutral-200",
                  )}
                >
                  {busy === p.id && <Loader2 className="h-4 w-4 animate-spin" />}
                  {current ? `Top up ${p.name}` : `Get ${p.name}`}
                </button>
                <div className="mt-1.5 text-center text-[11px] text-fg-3">{annual && list ? `Save $${(list - monthly) * 12} compared to monthly` : "No difference compared to monthly"}</div>

                <ul className="mt-5 space-y-1.5 text-[12px]">
                  {p.perks.map((perk) => (
                    <li key={perk.text} className={cn("flex items-start gap-2", perk.on ? "text-fg" : "text-fg-3")}>
                      {perk.on ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime" /> : <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                      {perk.text}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight">Or just buy credits</h2>
        <p className="mt-1 text-[13px] text-fg-2">One-off packs, no subscription. Same credits, same models.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {PACKS.map((p) => (
            <Link key={p.id} href={`/checkout?pack=${p.id}`} className="rounded-2xl border border-line bg-card p-5 transition hover:border-fg-3">
              <div className="flex items-center justify-between">
                <div className="text-[15px] font-semibold">{p.name}</div>
                {p.perk && <Pill tone="lime">{p.perk}</Pill>}
              </div>
              <div className="mt-1 text-[12px] text-fg-3">{p.credits.toLocaleString()} credits</div>
              <div className="mt-4 flex items-baseline gap-1"><span className="text-3xl font-bold">${p.price}</span><span className="text-[11px] text-fg-3">one-off</span></div>
              <div className="mt-3 flex h-10 items-center justify-center rounded-full bg-white text-[13px] font-semibold text-black">Buy {p.credits} credits</div>
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-6 text-center text-[11px] text-fg-3">
        Prices exclude VAT and local taxes. Credits never expire on this instance. Free accounts start with 100 credits and can generate immediately — that is the one place this rebuild deliberately departs from the original.
      </p>

      {/* Wizard */}
      <section id="wizard" className="mt-16">
        <h2 className="text-3xl font-bold tracking-tight">Find the best plan for you</h2>
        <p className="mt-1 text-[13px] text-fg-2">Choose what you want to create and get what you need</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-line bg-card p-5">
            <Wizard onCredits={setProCredits} />
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-card p-6 text-center">
            <div className="text-[12px] text-fg-3">We recommend</div>
            <div className="display mt-1 text-4xl text-lime">{wizardPlan === "MAX" ? "Max" : "Pro"} plan</div>
            <div className="mt-2 text-[12px] text-fg-2">{proCredits.toLocaleString()} credits/mo covers your monthly output with room to iterate.</div>
            <a href={`#plan-${wizardPlan}`} className="mt-5 rounded-full bg-lime px-5 py-2 text-[13px] font-semibold text-black hover:bg-lime-2">
              See why
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

const MAKE = ["Social media videos", "Talking-avatar videos", "UGC & product video ads", "Marketing product photos", "Cinematic videos", "Personal use"];

function Wizard({ onCredits }: { onCredits: (n: number) => void }) {
  const [picked, setPicked] = useState<string[]>([MAKE[0]]);
  const [items, setItems] = useState(30);
  const videoHeavy = picked.some((p) => p.includes("video"));
  const perItem = videoHeavy ? 14 : 2;
  useEffect(() => {
    const need = items * perItem;
    onCredits(need <= 600 ? 600 : need <= 900 ? 900 : 1800);
  }, [items, perItem, onCredits]);
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[12px] font-bold">1</span>
        <div>
          <div className="text-[14px] font-semibold">What are you here to make?</div>
          <div className="text-[11px] text-fg-3">Multiple options can be selected</div>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {MAKE.map((m) => {
          const on = picked.includes(m);
          return (
            <button key={m} onClick={() => setPicked((xs) => (on ? xs.filter((x) => x !== m) : [...xs, m]))} className={cn("flex items-center justify-between rounded-lg border px-3 py-2 text-[13px]", on ? "border-lime/40 bg-lime/5 text-lime" : "border-line text-fg-2 hover:border-line-2")}>
              {m}
              <span className={cn("flex h-4 w-4 items-center justify-center rounded border", on ? "border-lime bg-lime text-black" : "border-line-2")}>{on && <Check className="h-3 w-3" />}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex items-center gap-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[12px] font-bold">2</span>
        <div>
          <div className="text-[14px] font-semibold">How many content items per month?</div>
          <div className="text-[11px] text-fg-3">≈ 14 credits each · per Kling 3.0 generation, 8s, 720p · ≈ 2 credits each · per Nano Banana 2 image</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <input type="range" min={5} max={200} step={5} value={items} onChange={(e) => setItems(Number(e.target.value))} className="flex-1 accent-lime" />
        <span className="w-16 text-right text-[13px] font-semibold">{items} / mo</span>
      </div>
      <div className="mt-2 text-[11px] text-fg-3">≈ {items * perItem} credits per month</div>
    </div>
  );
}
