import { Suspense } from "react";
import type { Metadata } from "next";
import { VideoStudio } from "@/components/studio/video-studio";

export const metadata: Metadata = { title: "Create AI Videos from Text & Image" };

export default async function VideoPage({ searchParams }: { searchParams: Promise<{ model?: string; preset?: string }> }) {
  const { model, preset } = await searchParams;
  return (
    <Suspense>
      <VideoStudio initialModelId={model} initialPresetId={preset} />
    </Suspense>
  );
}
