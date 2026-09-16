"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Mail, X } from "lucide-react";
import { useSession, type SessionUser } from "./session";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { PasskeyLoginButton } from "./passkeys";

export type AuthMode = "login" | "signup";

export function AuthForm({ mode: initial, onDone, compact }: { mode: AuthMode; onDone?: (u: SessionUser) => void; compact?: boolean }) {
  const [mode, setMode] = useState<AuthMode>(initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [honey, setHoney] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useSession();
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, name, website: honey }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.status === 429) return setError("Too many attempts. Wait a few minutes and try again.");
    if (!res.ok) return setError(data.error ?? "Something went wrong");
    setUser(data.user);
    toast(mode === "signup" ? "Welcome to Higgsfield" : "Welcome back", { body: `Signed in as ${data.user.email}`, tone: "success" });
    router.refresh();
    onDone?.(data.user);
  }

  return (
    <div className={cn(!compact && "px-1")}>
      <div className="mb-5 flex items-center gap-2">
        <Logo className="h-6 w-6" />
        <div>
          <div className="text-[17px] font-semibold leading-tight">{mode === "signup" ? "Create your account" : "Log in"}</div>
          <div className="text-[12px] text-fg-3">{mode === "signup" ? "Keep your credits and generations across devices." : "Pick up where you left off."}</div>
        </div>
      </div>

      <div className="grid gap-2">
        <PasskeyLoginButton onDone={onDone} />
        <button type="button" disabled className="flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-card text-[13px] font-medium text-fg-3" title="OAuth isn't wired in this build">
          <GoogleG /> Continue with Google <span className="ml-1 rounded bg-white/6 px-1 text-[9px] uppercase">soon</span>
        </button>
      </div>

      <div className="my-4 flex items-center gap-3 text-[11px] text-fg-3">
        <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={submit} className="grid gap-2.5">
        {/* Honeypot: hidden from people, irresistible to bots. */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" value={honey} onChange={(e) => setHoney(e.target.value)} />
        {mode === "signup" && (
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="How should we call you?" className={input} autoComplete="name" />
          </Field>
        )}
        <Field label="Email">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.com" className={input} autoComplete="email" />
        </Field>
        <Field label="Password">
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"} className={input} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
        </Field>
        {error && <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-[12px] text-fg">{error}</div>}
        <button type="submit" disabled={busy} className="mt-1 flex h-11 items-center justify-center gap-2 rounded-lg bg-lime text-[14px] font-semibold text-black hover:bg-lime-2 disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          {mode === "signup" ? "Sign up" : "Log in"}
        </button>
      </form>

      <div className="mt-4 text-center text-[12px] text-fg-3">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <button type="button" onClick={() => { setMode("login"); setError(null); }} className="font-medium text-fg hover:underline">Log in</button>
          </>
        ) : (
          <>
            New here?{" "}
            <button type="button" onClick={() => { setMode("signup"); setError(null); }} className="font-medium text-fg hover:underline">Create an account</button>
          </>
        )}
      </div>
      {mode === "signup" && <p className="mt-3 text-center text-[11px] text-fg-3">Your guest credits and generations move to the new account.</p>}
    </div>
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

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

export function AuthDialog({ mode, trigger }: { mode: AuthMode; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] w-[min(420px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-card p-6 shadow-2xl outline-none">
          <Dialog.Title className="sr-only">{mode === "signup" ? "Sign up" : "Log in"}</Dialog.Title>
          <AuthForm mode={mode} onDone={() => setOpen(false)} />
          <Dialog.Close className="absolute right-3 top-3 rounded-full p-2 text-fg-3 hover:bg-white/8 hover:text-fg" aria-label="Close">
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
