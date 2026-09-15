export function Logo({ className }: { className?: string }) {
  // Two interlocked strokes — a nod to the original mark without copying it.
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M4 6.5c0-1.4 1.1-2.5 2.5-2.5H12v5H8.5v2.5H12v5H6.5A2.5 2.5 0 0 1 4 14V6.5Z" fill="currentColor" />
      <path d="M20 17.5c0 1.4-1.1 2.5-2.5 2.5H12v-5h3.5v-2.5H12v-5h5.5A2.5 2.5 0 0 1 20 10v7.5Z" fill="#d3ff3d" />
    </svg>
  );
}
