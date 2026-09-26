"use client";

import { useState } from "react";
import { Shell } from "@/components/site/shell";
import { Field, Form, PageTitle, Submit } from "@/components/site/forms";
import { call } from "@/lib/session";

export default function Page() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState<string | null>(null);
  return (
    <Shell>
      <PageTitle kicker="Lost your key" sub={done ?? "Tell us the address you signed up with and we'll send a link to choose a new password."}>
        Reset your <em className="font-serif italic">password.</em>
      </PageTitle>
      {!done ? (
        <Form
          onSubmit={async () => {
            const r = await call<{ message: string }>("/api/auth/forgot", { body: { email } });
            setDone(r.message);
          }}
        >
          {(busy) => (
            <>
              <Field id="email" label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} maxLength={254} />
              <Submit busy={busy}>Send the link →</Submit>
            </>
          )}
        </Form>
      ) : null}
    </Shell>
  );
}
