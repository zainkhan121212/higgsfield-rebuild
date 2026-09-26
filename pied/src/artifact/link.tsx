import type { AnchorHTMLAttributes, ReactNode } from "react";

// Stand-in for next/link in the artifact build. The artifact is one page, so
// the two routes live in the hash: "/make" is #make, "/" is #home.
export default function Link({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode }) {
  const to = href === "/make" ? "#make" : href === "/" ? "#home" : href;
  return (
    <a href={to} {...rest}>
      {children}
    </a>
  );
}
