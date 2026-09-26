export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
