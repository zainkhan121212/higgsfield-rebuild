export function Logo({ className }: { className?: string }) {
  // A frame line: the corner marks a camera operator uses to find the edge of
  // the frame, drawn with a pen.
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M3 8V4.6c0-.9.7-1.6 1.6-1.6H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
      <path d="M21 16v3.4c0 .9-.7 1.6-1.6 1.6H16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
      <path d="M16 3h3.4c.9 0 1.6.7 1.6 1.6V8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
      <path d="M8 21H4.6A1.6 1.6 0 0 1 3 19.4V16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
      <path d="M7.5 12h9" stroke="#bc3318" strokeWidth="1.6" strokeLinecap="square" />
    </svg>
  );
}
