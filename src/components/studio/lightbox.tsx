"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { useEffect } from "react";

export function Lightbox({
  urls,
  index,
  prompt,
  onClose,
  onIndex,
}: {
  urls: string[];
  index: number;
  prompt: string;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndex((index + 1) % urls.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + urls.length) % urls.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, urls.length, onIndex]);

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-[81] flex flex-col items-center justify-center p-4 outline-none">
          <Dialog.Title className="sr-only">{prompt}</Dialog.Title>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urls[index]} alt={prompt} className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl" />
          <p className="mt-3 max-w-2xl text-center text-[13px] text-fg-2">{prompt}</p>
          <div className="mt-2 flex items-center gap-2">
            {urls.length > 1 && (
              <button onClick={() => onIndex((index - 1 + urls.length) % urls.length)} className="rounded-full bg-white/10 p-2 hover:bg-white/20">
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <a href={urls[index]} target="_blank" rel="noreferrer" download className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-[13px] hover:bg-white/20">
              <Download className="h-4 w-4" /> Download
            </a>
            {urls.length > 1 && (
              <button onClick={() => onIndex((index + 1) % urls.length)} className="rounded-full bg-white/10 p-2 hover:bg-white/20">
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
          <Dialog.Close className="absolute right-4 top-4 rounded-full bg-white/10 p-2 hover:bg-white/20" aria-label="Close">
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
