"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, CreditCard, Loader2, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { getPlan } from "@/lib/catalog/plans";
import { getPack, PACKS } from "@/lib/catalog/packs";
import { useSession } from "@/components/shell/session";
import { AuthForm } from "@/components/shell/auth-dialog";
import { cn } from "@/lib/utils";

type Step = "review" | "pay" | "processing" | "done";

export function CheckoutPage() {
  const search = useSearchParams();
  const router = useRouter();
  const { user, setUser } = useSession();

  const kind = (search.get("pack") ? "pack" : "plan") as "plan" | "pack";
  const packId = search.get("pack") ?? "creator";
  const planId = (search.get("plan") ?? "pro").toUpperCase();
  const interval = (search.get("interval") === "monthly" ? "monthly" : "annual") as "monthly" | "annual";
  const plan = getPlan(planId);
  const pack = getPack(packId) ?? PACKS[1];
  const credits = Math.max(plan.credits, Math.min(Number(search.get("credits") ?? plan.credits), plan.credits * 3));

  const order = useMemo(() => {
    if (kind === "pack") return { label: pack.name, sub: `${pack.credits.toLocaleString()} credits, one-off`, amount: pack.price, grant: pack.credits };
    const mult = credits / plan.credits;
    const monthly = Math.round(plan.price * mult * (interval === "monthly" ? 1.3 : 1) * 100) / 100;
    return { label: `${plan.name} plan`, sub: `${credits.toLocaleString()} credits / month · billed ${interval}`, amount: monthly, grant: credits };
  }, [kind, pack, plan, credits, interval]);

  const [step, setStep] = useState<Step>("review");
  const [result, setResult] = useState<{ order: string } | null>(null);
  const [card, setCard] = useState({ name: "", number: "", exp: "", cvc: "" });
  const [err, setErr] = useState<string | null>(null);

  const needsAccount = !!user && !user.email;

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const digits = card.number.replace(/\s+/g, "");
    if (!card.name.trim()) return setErr("Name on card is required.");
    if (digits.length < 16 || !luhn(digits)) return setErr("That card number doesn't look right. Use the test card 4242 4242 4242 4242.");
    if (!/^\d{2}\s?\/\s?\d{2}$/.test(card.exp)) return setErr("Expiry should look like 12 / 28.");
    if (!/^\d{3,4}$/.test(card.cvc)) return setErr("CVC should be 3 or 4 digits.");

    setStep("processing");
    // Card details stay in this component — only the order goes to the server.
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(kind === "pack" ? { kind, id: pack.id } : { kind, id: plan.id, credits, interval }),
    });
    const data = await res.json();
    await new Promise((r) => setTimeout(r, 1400));
    if (!res.ok) {
      setStep("pay");
      return setErr(data.error ?? "Payment failed");
    }
    setUser(data.user);
    setResult({ order: data.order });
    setStep("done");
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/pricing" className="inline-flex items-center gap-1 text-[13px] text-fg-3 hover:text-fg">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to pricing
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left: steps */}
        <div className="rounded-2xl border border-line bg-card p-5 sm:p-6">
          <Steps step={step} />

          {step === "review" && (
            <div className="mt-6">
              <h1 className="text-xl font-semibold">Review your order</h1>
              <p className="mt-1 text-[13px] text-fg-2">Credits are added to your account the moment payment completes.</p>
              {needsAccount ? (
                <div className="mt-5 rounded-xl border border-lime/30 bg-lime/5 p-4">
                  <div className="text-[13px] font-semibold">Create an account to keep your purchase</div>
                  <p className="mb-4 mt-1 text-[12px] text-fg-2">You&apos;re browsing as a guest. Your credits and generations carry over to the new account.</p>
                  <AuthForm mode="signup" compact />
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-line bg-bg-elev p-4 text-[13px]">
                  <div className="flex items-center justify-between">
                    <span className="text-fg-3">Account</span>
                    <span className="font-medium">{user?.email ?? "…"}</span>
                  </div>
                </div>
              )}
              <button
                onClick={() => setStep("pay")}
                disabled={needsAccount}
                className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-lime text-[14px] font-semibold text-black hover:bg-lime-2 disabled:opacity-50"
              >
                Continue to payment
              </button>
            </div>
          )}

          {(step === "pay" || step === "processing") && (
            <form onSubmit={pay} className="mt-6">
              <h1 className="text-xl font-semibold">Payment</h1>
              <div className="mt-1 flex items-center gap-1.5 text-[12px] text-fg-3">
                <Lock className="h-3.5 w-3.5" /> Demo checkout — nothing is charged and card details never leave this page. Use <code className="rounded bg-white/8 px-1">4242 4242 4242 4242</code>, any future date, any CVC.
              </div>
              <div className="mt-5 grid gap-3">
                <Field label="Name on card">
                  <input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="Ada Lovelace" className={input} autoComplete="off" />
                </Field>
                <Field label="Card number">
                  <div className="relative">
                    <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-3" />
                    <input
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })}
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                      className={cn(input, "pl-10 font-mono")}
                      autoComplete="off"
                    />
                  </div>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Expiry">
                    <input value={card.exp} onChange={(e) => setCard({ ...card, exp: formatExp(e.target.value) })} placeholder="12 / 28" inputMode="numeric" className={cn(input, "font-mono")} autoComplete="off" />
                  </Field>
                  <Field label="CVC">
                    <input value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="123" inputMode="numeric" className={cn(input, "font-mono")} autoComplete="off" />
                  </Field>
                </div>
              </div>
              {err && <div className="mt-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-[12px]">{err}</div>}
              <button type="submit" disabled={step === "processing"} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-lime text-[14px] font-semibold text-black hover:bg-lime-2 disabled:opacity-70">
                {step === "processing" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing payment…
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Pay ${order.amount}
                  </>
                )}
              </button>
              <div className="mt-3 flex items-center justify-center gap-4 text-[11px] text-fg-3">
                <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Demo-secure</span>
                <span>Cancel anytime</span>
                <span>Refunds within 14 days</span>
              </div>
            </form>
          )}

          {step === "done" && result && (
            <div className="mt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime text-black">
                <Check className="h-6 w-6" />
              </div>
              <h1 className="mt-4 text-xl font-semibold">Payment complete</h1>
              <p className="mt-1 text-[13px] text-fg-2">Order <span className="font-mono text-fg">{result.order}</span> · {order.grant.toLocaleString()} credits added.</p>
              <dl className="mt-5 grid grid-cols-2 gap-y-2 rounded-xl border border-line bg-bg-elev p-4 text-[13px]">
                <dt className="text-fg-3">Item</dt><dd className="text-right font-medium">{order.label}</dd>
                <dt className="text-fg-3">Details</dt><dd className="text-right">{order.sub}</dd>
                <dt className="text-fg-3">Paid</dt><dd className="text-right font-medium">${order.amount}</dd>
                <dt className="text-fg-3">Balance</dt><dd className="text-right font-medium">{user?.credits.toLocaleString()} ✦</dd>
              </dl>
              <div className="mt-5 flex gap-2">
                <Link href="/ai/video" className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-lime text-[14px] font-semibold text-black hover:bg-lime-2">
                  <Sparkles className="h-4 w-4" /> Start generating
                </Link>
                <Link href="/account" className="flex h-11 items-center justify-center rounded-xl border border-line px-4 text-[14px] font-medium hover:border-fg-3">
                  View receipt
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right: order summary */}
        <aside className="h-fit rounded-2xl border border-line bg-card p-5">
          <div className="text-[12px] font-medium uppercase tracking-wide text-fg-3">Order summary</div>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-[15px] font-semibold">{order.label}</div>
              <div className="text-[12px] text-fg-3">{order.sub}</div>
            </div>
            <div className="text-[15px] font-semibold">${order.amount}</div>
          </div>
          <div className="mt-4 border-t border-line pt-4 text-[13px]">
            <div className="flex justify-between text-fg-2"><span>Subtotal</span><span>${order.amount}</span></div>
            <div className="mt-1 flex justify-between text-fg-2"><span>Tax</span><span>$0.00</span></div>
            <div className="mt-2 flex justify-between text-[15px] font-semibold"><span>Total due {kind === "plan" ? "today" : ""}</span><span>${order.amount}</span></div>
          </div>
          <ul className="mt-4 space-y-1.5 text-[12px] text-fg-2">
            <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-lime" /> {order.grant.toLocaleString()} credits added instantly</li>
            {kind === "plan" && <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-lime" /> All models and presets unlocked</li>}
            <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-lime" /> Credits never expire on this instance</li>
          </ul>
          {kind === "plan" && (
            <div className="mt-4 rounded-lg bg-bg-elev p-3 text-[11px] text-fg-3">
              Want a one-off instead?{" "}
              {PACKS.map((p) => (
                <Link key={p.id} href={`/checkout?pack=${p.id}`} className="mr-2 text-fg hover:underline">
                  {p.credits} for ${p.price}
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function Steps({ step }: { step: Step }) {
  const idx = step === "review" ? 0 : step === "done" ? 2 : 1;
  return (
    <ol className="flex items-center gap-2 text-[12px]">
      {["Review", "Payment", "Done"].map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold", i < idx ? "bg-lime text-black" : i === idx ? "bg-white text-black" : "bg-white/10 text-fg-3")}>
            {i < idx ? <Check className="h-3 w-3" /> : i + 1}
          </span>
          <span className={cn(i === idx ? "font-medium text-fg" : "text-fg-3")}>{s}</span>
          {i < 2 && <span className="mx-1 h-px w-6 bg-line" />}
        </li>
      ))}
    </ol>
  );
}

const input = "h-10 w-full rounded-lg border border-line bg-bg-elev px-3 text-[14px] outline-none placeholder:text-fg-3 focus:border-lime/60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-[11px] font-medium text-fg-3">{label}</span>
      {children}
    </label>
  );
}

function formatCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
}
function formatExp(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
}
function luhn(num: string) {
  let sum = 0;
  let dbl = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = Number(num[i]);
    if (dbl) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}
