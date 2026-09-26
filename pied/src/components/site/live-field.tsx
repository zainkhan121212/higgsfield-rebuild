"use client";

import { useEffect, useRef } from "react";
import { createField, type FieldData } from "@/lib/field";
import { cn } from "@/lib/utils";

/** A finished plate, live: scatters under the cursor. */
export function LiveField({ data, className, label }: { data: FieldData; className?: string; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const f = createField(c, data, { fit: "contain", listen: "canvas", assemble: !still, mode: still ? "still" : "scatter" });
    return () => f.destroy();
  }, [data]);
  return (
    <div className={cn("relative", className)} data-cursor="play">
      <canvas ref={ref} className="block h-full w-full touch-pan-y" role="img" aria-label={label} />
    </div>
  );
}
