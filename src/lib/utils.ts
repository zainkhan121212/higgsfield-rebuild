import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCredits(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function timeAgo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

/** Map an aspect ratio label to pixel dimensions at a given base size. */
export function dimsFor(ratio: string, base = 1024): { width: number; height: number } {
  const map: Record<string, [number, number]> = {
    "1:1": [1, 1], "3:4": [3, 4], "4:3": [4, 3], "9:16": [9, 16], "16:9": [16, 9],
    "3:2": [3, 2], "2:3": [2, 3], "21:9": [21, 9], Auto: [1, 1],
  };
  const [w, h] = map[ratio] ?? [1, 1];
  const scale = base / Math.max(w, h);
  const round = (x: number) => Math.round((x * scale) / 16) * 16;
  return { width: round(w), height: round(h) };
}
