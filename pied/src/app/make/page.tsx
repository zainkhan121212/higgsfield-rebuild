import type { Metadata } from "next";
import { Press } from "@/components/press/press";

export const metadata: Metadata = {
  title: "The press",
  description: "Set a picture in type, paint on it, and take it home as a live wallpaper.",
};

export default function MakePage() {
  return <Press />;
}
