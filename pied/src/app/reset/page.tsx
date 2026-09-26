"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Shell } from "@/components/site/shell";
import { Field, Form, PageTitle, Submit } from "@/components/site/forms";
import { call, refreshSession } from "@/lib/session";

export default function Page() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  // Take the token out of the address bar (and so out of history) at once.
  useEffect(() => {
    const t = new URLSearchParams(location.search).get("token") ?? "";
    history.replaceState(null, "", "/reset");
    const id = setTimeout(() => setToken(t), 0);
    return () => clearTimeout(id);
  }, []);
  return (
    <Shell>
      <PageTitle kicker="A new key" sub="Choose a new password. Every device signed in to your account will be signed out.">
        Choose a new <em className="font-serif italic">password.</em>
      </PageTitle>
      <Form
        onSubmit={async () => {
          if (!token) throw new Error("This page needs the link from your email. Ask for a new one.");
          if (password !== again) throw new Error("The two passwords don't match.");
          await call("/api/auth/reset", { body: { token, password } });
          await refreshSession();
          router.push("/library");
        }}
      >
        {(busy) => (
          <>
            <Field id="password" label="New password" type="password" autoComplete="new-password" value={password} onChange={setPassword} hint={password.length < 10 ? `${password.length}/10` : "✓"} />
            <Field id="again" label="Once more" type="password" autoComplete="new-password" value={again} onChange={setAgain} />
            <Submit busy={busy}>Save and sign in →</Submit>
          </>
        )}
      </Form>
    </Shell>
  );
}
