"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Shell } from "@/components/site/shell";
import { Field, Form, PageTitle, Submit, safeNext } from "@/components/site/forms";
import { call, refreshSession } from "@/lib/session";

function SignIn() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <>
      <PageTitle kicker="The shop is open" sub="Sign in to keep plates in your library and share them.">
        Welcome <em className="font-serif italic">back.</em>
      </PageTitle>
      <Form
        onSubmit={async () => {
          await call("/api/auth/login", { body: { email, password } });
          await refreshSession();
          router.push(next);
        }}
      >
        {(busy) => (
          <>
            <Field id="email" label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} maxLength={254} />
            <Field id="password" label="Password" type="password" autoComplete="current-password" value={password} onChange={setPassword} hint={<Link href="/forgot" className="underline underline-offset-4">Forgot it?</Link>} />
            <Submit busy={busy}>Sign in →</Submit>
          </>
        )}
      </Form>
      <p className="mt-10 font-serif text-ink-2">
        New here?{" "}
        <Link href={`/signup${next !== "/library" ? `?next=${encodeURIComponent(next)}` : ""}`} className="underline underline-offset-4">
          Sign the register
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
        <SignIn />
      </Suspense>
    </Shell>
  );
}
