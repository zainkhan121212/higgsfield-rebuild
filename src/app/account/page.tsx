import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getPlan } from "@/lib/catalog/plans";
import { PACKS } from "@/lib/catalog/packs";
import { timeAgo } from "@/lib/utils";
import { AccountActions } from "@/components/shell/account-actions";
import { PasskeyManager } from "@/components/shell/passkeys";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">No account yet</h1>
        <p className="mt-2 text-[13px] text-fg-2">Generate something first, or create an account.</p>
        <Link href="/signup" className="mt-4 inline-block rounded-full bg-lime px-5 py-2 text-[13px] font-semibold text-black">Sign up</Link>
      </main>
    );
  }
  const [ledger, counts, events] = await Promise.all([
    db.creditEntry.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.generation.groupBy({ by: ["kind"], where: { userId: user.id }, _count: true }),
    db.securityEvent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);
  const plan = getPlan(user.plan);
  const images = counts.find((c) => c.kind === "IMAGE")?._count ?? 0;
  const videos = counts.find((c) => c.kind === "VIDEO")?._count ?? 0;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold">Account</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card title="Profile">
          <div className="text-[15px] font-semibold">{user.name}</div>
          <div className="text-[12px] text-fg-3">{user.email ?? "Guest account — sign up to keep it"}</div>
          <div className="mt-1 text-[11px] text-fg-3">@{user.handle}</div>
        </Card>
        <Card title="Plan">
          <div className="text-[15px] font-semibold">{plan.name}</div>
          <div className="text-[12px] text-fg-3">{plan.id === "FREE" ? "100 welcome credits" : `${plan.credits.toLocaleString()} credits / month`}</div>
          <Link href="/pricing" className="mt-2 inline-block text-[12px] font-medium text-lime hover:underline">{plan.id === "FREE" ? "Upgrade" : "Change plan"}</Link>
        </Card>
        <Card title="Balance">
          <div className="flex items-center gap-1.5 text-[22px] font-bold"><Sparkles className="h-5 w-5 text-lime" />{user.credits.toLocaleString()}</div>
          <div className="text-[12px] text-fg-3">{images} images · {videos} videos generated</div>
        </Card>
      </div>

      <section className="mt-8">
        <h2 className="text-[15px] font-semibold">Top up</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {PACKS.map((p) => (
            <Link key={p.id} href={`/checkout?pack=${p.id}`} className="rounded-xl border border-line bg-card p-4 transition hover:border-fg-3">
              <div className="text-[14px] font-semibold">{p.name}</div>
              <div className="text-[12px] text-fg-3">{p.credits.toLocaleString()} credits{p.perk ? ` · ${p.perk}` : ""}</div>
              <div className="mt-2 text-[18px] font-bold">${p.price}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[15px] font-semibold">Transactions</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-[13px]">
            <thead className="bg-bg-elev text-left text-[11px] uppercase tracking-wide text-fg-3">
              <tr><th className="px-4 py-2">When</th><th className="px-4 py-2">What</th><th className="px-4 py-2 text-right">Credits</th></tr>
            </thead>
            <tbody>
              {ledger.map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <td className="px-4 py-2 text-fg-3">{timeAgo(e.createdAt)}</td>
                  <td className="px-4 py-2">{describe(e.reason)}</td>
                  <td className={`px-4 py-2 text-right font-medium ${e.delta > 0 ? "text-lime" : "text-fg-2"}`}>{e.delta > 0 ? "+" : ""}{e.delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <PasskeyManager />

      <section className="mt-8">
        <h2 className="text-[15px] font-semibold">Security activity</h2>
        <p className="text-[12px] text-fg-3">Sign-ins, passkeys and blocked attempts on this account, newest first.</p>
        <div className="mt-3 overflow-hidden rounded-xl border border-line">
          {events.length === 0 ? (
            <div className="px-4 py-3 text-[13px] text-fg-3">Nothing yet.</div>
          ) : (
            events.map((e) => (
              <div key={e.id} className="flex items-center justify-between border-b border-line px-4 py-2 text-[12px] last:border-b-0">
                <span className="font-medium">{eventLabel(e.kind)}</span>
                <span className="text-fg-3">{maskIp(e.ip)} · {timeAgo(e.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <AccountActions hasEmail={!!user.email} />
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="text-[11px] font-medium uppercase tracking-wide text-fg-3">{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function eventLabel(kind: string) {
  const map: Record<string, string> = {
    guest_created: "Guest session started", signup: "Account created", login: "Signed in with password", login_passkey: "Signed in with passkey",
    login_failed: "Failed sign-in attempt", login_locked: "Sign-in locked (too many failures)", logout: "Signed out",
    passkey_added: "Passkey added", passkey_removed: "Passkey removed", rate_limited: "Request rate-limited", checkout: "Order completed",
  };
  return map[kind] ?? kind;
}

function maskIp(ip: string | null) {
  if (!ip) return "";
  const p = ip.split(".");
  return p.length === 4 ? `${p[0]}.${p[1]}.•.•` : ip.slice(0, 9) + "…";
}

function describe(reason: string) {
  if (reason === "welcome") return "Welcome credits";
  if (reason.startsWith("generate:")) return `Generation (${reason.split(":")[1]})`;
  if (reason.startsWith("refund:")) return "Refund — generation failed";
  if (reason.startsWith("order:")) {
    const [, order, ...rest] = reason.split(":");
    return `Order ${order} — ${rest.join(":")}`;
  }
  if (reason.startsWith("plan:")) return `Plan change (${reason.split(":")[1]})`;
  return reason;
}
