"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication, startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { Fingerprint, KeyRound, Loader2, Trash2 } from "lucide-react";
import { useSession, type SessionUser } from "./session";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

/** "Continue with a passkey" — discoverable-credential login. */
export function PasskeyLoginButton({ onDone, className }: { onDone?: (u: SessionUser) => void; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(true);
  const { setUser } = useSession();
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => setSupported(browserSupportsWebAuthn()), 0);
    return () => clearTimeout(t);
  }, []);

  async function go() {
    setBusy(true);
    try {
      const options = await (await fetch("/api/auth/passkey/login")).json();
      if (options.error) throw new Error(options.error);
      const response = await startAuthentication({ optionsJSON: options });
      const res = await fetch("/api/auth/passkey/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ response }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser(data.user);
      toast("Signed in with passkey", { tone: "success" });
      router.refresh();
      onDone?.(data.user);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Passkey sign-in cancelled";
      if (!/cancel|abort|timed out|NotAllowed/i.test(msg)) toast("Passkey sign-in failed", { body: msg, tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;
  return (
    <button type="button" onClick={go} disabled={busy} className={cn("flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-card text-[13px] font-medium hover:border-fg-3 disabled:opacity-60", className)}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Fingerprint className="h-4 w-4 text-lime" />} Continue with a passkey
    </button>
  );
}

type Passkey = { id: string; label: string | null; deviceType: string | null; backedUp: boolean; createdAt: string; lastUsedAt: string | null };

/** Account-page manager: list, add, remove. */
export function PasskeyManager() {
  const [list, setList] = useState<Passkey[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [supported, setSupported] = useState(true);

  async function load() {
    const res = await fetch("/api/auth/passkey/list", { cache: "no-store" });
    setList((await res.json()).passkeys);
  }
  useEffect(() => {
    const t = setTimeout(() => {
      setSupported(browserSupportsWebAuthn());
      load();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  async function add() {
    setBusy(true);
    try {
      const options = await (await fetch("/api/auth/passkey/register")).json();
      if (options.error) throw new Error(options.error);
      const response = await startRegistration({ optionsJSON: options });
      const label = navigator.userAgent.includes("Windows") ? "Windows Hello" : navigator.userAgent.includes("Mac") ? "Touch ID" : navigator.userAgent.includes("Android") ? "Android" : navigator.userAgent.includes("iPhone") ? "iPhone" : "Passkey";
      const res = await fetch("/api/auth/passkey/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ response, label }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast("Passkey added", { body: "You can now sign in without a password.", tone: "success" });
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Cancelled";
      if (!/cancel|abort|timed out|NotAllowed/i.test(msg)) toast("Couldn't add passkey", { body: msg, tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await fetch("/api/auth/passkey/list", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
  }

  return (
    <section className="mt-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-[15px] font-semibold">Passkeys</h2>
          <p className="text-[12px] text-fg-3">Phishing-resistant sign-in with Face ID, Touch ID, Windows Hello or a security key. No password to steal.</p>
        </div>
        {supported && (
          <button onClick={add} disabled={busy} className="flex h-9 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-semibold text-black hover:bg-neutral-200 disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Add a passkey
          </button>
        )}
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-line">
        {list === null ? (
          <div className="px-4 py-3 text-[13px] text-fg-3">Loading…</div>
        ) : list.length === 0 ? (
          <div className="px-4 py-3 text-[13px] text-fg-3">{supported ? "No passkeys yet." : "This browser doesn't support passkeys."}</div>
        ) : (
          list.map((p) => (
            <div key={p.id} className="flex items-center justify-between border-b border-line px-4 py-2.5 text-[13px] last:border-b-0">
              <div className="flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-lime" />
                <span className="font-medium">{p.label ?? "Passkey"}</span>
                <span className="text-[11px] text-fg-3">{p.deviceType === "multiDevice" ? "synced" : "device-bound"}{p.backedUp ? " · backed up" : ""}</span>
              </div>
              <button onClick={() => remove(p.id)} className="rounded-md p-1.5 text-fg-3 hover:bg-white/8 hover:text-fg" title="Remove">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
