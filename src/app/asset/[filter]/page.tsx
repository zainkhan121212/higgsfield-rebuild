import type { Metadata } from "next";
import { AssetsPage } from "@/components/assets/assets-page";

export const metadata: Metadata = { title: "Assets" };

export default async function Assets({ params }: { params: Promise<{ filter: string }> }) {
  const { filter } = await params;
  return <AssetsPage initialFilter={filter} />;
}
