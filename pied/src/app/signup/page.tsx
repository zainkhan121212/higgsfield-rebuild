"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Shell } from "@/components/site/shell";
import { Field, Form, PageTitle, Submit, safeNext } from "@/components/site/forms";
import { call, refreshSession } from "@/lib/session";

function SignUp() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <PageTitle kicker="Nearly there" sub="If you're new, a link to confirm your email is on its way. Open it on this device to finish.">
        Check your <em className="font-serif italic">inbox.</em>
      </PageTitle>
    );
  return (
    <>
      <PageTitle kicker="Sign the register" sub="An account keeps your plates, lets you share them, and puts them in the gallery if you choose.">
        Join the <em className="font-serif italic">shop.</em>
      </PageTitle>
      <Form
        onSubmit={async () => {
          const r = await call<{ next: string }>("/api/auth/signup", { body: { email, password, name } });
          if (r.next === "check-email") return setSent(true);
          await refreshSession();
          router.push(next);
        }}
      >
        {(busy) => (
          <>
            <Field id="name" label="Name, as it appears on your prints" autoComplete="nickname" value={name} onChange={setName} required={false} maxLength={60} />
            <Field id="email" label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} maxLength={254} />
            <Field id="password" label="Password" type="password" autoComplete="new-password" value={password} onChange={setPassword} hint={password.length < 10 ? `${password.length}/10` : "✓"} />
            <p className="font-serif text-sm text-ink-3">At least 10 characters. A few unrelated words make a strong one.</p>
            <Submit busy={busy}>Create my account →</Submit>
          </>
        )}
      </Form>
      <p className="mt-10 font-serif text-ink-2">
        Already signed?{" "}
        <Link href="/signin" className="underline underline-offset-4">
          Sign in
        </Link>
        .
      </p>
    </>
  );
}

export default function Page() {
  return (
    <Shell>
      <Suspense>
        <SignUp />
      </Suspense>
    </Shell>
  );
}
