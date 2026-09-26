import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center gap-6 px-4 sm:px-8">
      <p className="label text-ink-3">Error 404 · page not found</p>
      <h1 className="font-display text-[clamp(3rem,10vw,7rem)] leading-[0.9]">
        This sheet is <em className="font-serif italic">pied.</em>
      </h1>
      <p className="max-w-md font-serif text-lg text-ink-2">The page you asked for was never set, or its type has been swept back into the case.</p>
      <Link href="/" className="label w-fit border-b border-ink pb-0.5">
        Back to the front page →
      </Link>
    </main>
  );
}
