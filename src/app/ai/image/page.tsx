import { Suspense } from "react";
import type { Metadata } from "next";
import { ImageStudio } from "@/components/studio/image-studio";

export const metadata: Metadata = { title: "Create AI Images from Text & Photo" };

export default async function ImagePage({ searchParams }: { searchParams: Promise<{ model?: string }> }) {
  const { model } = await searchParams;
  return (
    <Suspense>
      <ImageStudio initialModelId={model} />
    </Suspense>
  );
}
