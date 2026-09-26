"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shell } from "@/components/site/shell";
import { Field, Form, PageTitle, Submit } from "@/components/site/forms";
import { call, refreshSession, useSession } from "@/lib/session";

export default function Page() {
  const router = useRouter();
  const { loaded, user, enabled } = useSession();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [changed, setChanged] = useState(false);
  const [delPw, setDelPw] = useState("");
  const [sure, setSure] = useState(false);

  useEffect(() => {
    if (loaded && enabled && !user) router.replace("/signin?next=/account");
  }, [loaded, enabled, user, router]);
  if (!user) return <Shell>{null}</Shell>;

  const signOut = async (everywhere: boolean) => {
    await call("/api/auth/logout", { body: { everywhere } });
    await refreshSession();
    router.push("/");
  };

  return (
    <Shell>
      <PageTitle kicker="Your account" sub={user.email}>
        {user.displayName || "Hello."}
      </PageTitle>

      <section className="border-t border-ink pt-6">
        <h2 className="label">Change password</h2>
        {changed ? <p className="mt-4 font-serif text-ink-2">Password changed. Every other device has been signed out.</p> : null}
        <Form
          className="mt-4"
          onSubmit={async () => {
            await call("/api/auth/password", { body: { current, next } });
            setCurrent("");
            setNext("");
            setChanged(true);
          }}
        >
          {(busy) => (
            <>
              <Field id="current" label="Current password" type="password" autoComplete="current-password" value={current} onChange={setCurrent} />
              <Field id="next" label="New password" type="password" autoComplete="new-password" value={next} onChange={setNext} hint={next.length < 10 ? `${next.length}/10` : "✓"} />
              <Submit busy={busy}>Change it</Submit>
            </>
          )}
        </Form>
      </section>

      <section className="mt-14 border-t border-ink pt-6">
        <h2 className="label">Signed-in devices</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => signOut(false)} className="label border border-ink px-4 py-3 hover:bg-ink hover:text-paper">
            Sign out
          </button>
          <button type="button" onClick={() => signOut(true)} className="label border border-ink px-4 py-3 hover:bg-ink hover:text-paper">
            Sign out everywhere
          </button>
        </div>
      </section>

      <section className="mt-14 border-t border-ink pt-6">
        <h2 className="label">Delete account</h2>
        <p className="mt-3 font-serif text-ink-2">Removes your account and every plate in your library, including any you&apos;ve shared. This can&apos;t be undone.</p>
        <Form
          className="mt-4"
          onSubmit={async () => {
            if (!sure) throw new Error("Tick the box to confirm.");
            await call("/api/auth/delete", { body: { password: delPw } });
            await refreshSession();
            router.push("/");
          }}
        >
          {(busy) => (
            <>
              <Field id="delete-password" label="Password" type="password" autoComplete="current-password" value={delPw} onChange={setDelPw} />
              <label className="flex items-center gap-3 font-serif">
                <input id="delete-sure" type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} className="h-4 w-4 accent-[#0c0c0b]" />
                Yes, delete my account and all my plates
              </label>
              <Submit busy={busy}>Delete for good</Submit>
            </>
          )}
        </Form>
      </section>
    </Shell>
  );
}
