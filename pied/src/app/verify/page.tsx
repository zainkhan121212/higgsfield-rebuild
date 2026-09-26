"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Shell } from "@/components/site/shell";
import { PageTitle } from "@/components/site/forms";
import { call, refreshSession } from "@/lib/session";

export default function Page() {
  const [state, setState] = useState<"working" | "done" | string>("working");
  const once = useRef(false);
  useEffect(() => {
    if (once.current) return;
    once.current = true;
    const t = new URLSearchParams(location.search).get("token") ?? "";
    history.replaceState(null, "", "/verify");
    call("/api/auth/verify", { body: { token: t } })
      .then(() => refreshSession())
      .then(() => setState("done"))
      .catch((e) => setState(e instanceof Error ? e.message : "That link didn't work."));
  }, []);
  return (
    <Shell>
      {state === "working" ? (
        <PageTitle kicker="One moment">Checking your link…</PageTitle>
      ) : state === "done" ? (
        <PageTitle kicker="Confirmed" sub={<Link href="/make" className="underline underline-offset-4">Open the press →</Link>}>
          You&apos;re in the <em className="font-serif italic">register.</em>
        </PageTitle>
      ) : (
        <PageTitle kicker="That didn't work" sub={state}>
          Link expired.
        </PageTitle>
      )}
    </Shell>
  );
}
