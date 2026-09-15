"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthForm, type AuthMode } from "./auth-dialog";

function Inner({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/ai/image";
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-line bg-card p-6">
        <AuthForm mode={mode} onDone={() => router.push(next)} />
      </div>
    </main>
  );
}

export function AuthPage({ mode }: { mode: AuthMode }) {
  return (
    <Suspense>
      <Inner mode={mode} />
    </Suspense>
  );
}
