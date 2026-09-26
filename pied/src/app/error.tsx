"use client";

// Production errors never show a stack or a message from the server: the
// visitor gets a plain sentence and a way back.
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center gap-6 px-4 sm:px-8">
      <p className="label text-ink-3">Something went wrong</p>
      <h1 className="font-display text-[clamp(2.6rem,8vw,6rem)] leading-[0.9]">The press jammed.</h1>
      <p className="max-w-md font-serif text-lg text-ink-2">Nothing you made has left your browser. Try again, and if it keeps happening, reload the page.</p>
      <button type="button" onClick={reset} className="label w-fit bg-ink px-5 py-3 text-paper">
        Try again
      </button>
    </main>
  );
}
