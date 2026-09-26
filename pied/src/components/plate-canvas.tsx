"use client";

import { useEffect, useRef } from "react";
import { createField, type FieldController, type FieldOptions } from "@/lib/field";
import { DEFAULTS, buildPlate, fieldData, gridFor, loadImage, physics, sample, type Settings } from "@/lib/plate";
import { cn } from "@/lib/utils";

/**
 * A picture set in type, ready to touch. Used for every plate on the
 * marketing pages; the press (/make) drives the engine directly.
 */
export function PlateCanvas({
  src,
  trim = 0,
  settings,
  className,
  fit = "cover",
  assemble = false,
  drift = false,
  listen = "canvas",
  label,
  onReady,
  transformRgba,
}: {
  src: string;
  trim?: number;
  settings?: Partial<Settings>;
  className?: string;
  fit?: FieldOptions["fit"];
  assemble?: boolean;
  drift?: boolean;
  listen?: FieldOptions["listen"];
  label: string;
  onReady?: (f: FieldController) => void;
  /** a chance to paint on the plate before it is shown */
  transformRgba?: (rgba: Uint8Array, cols: number, rows: number) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = JSON.stringify(settings ?? {});
  const readyRef = useRef(onReady);
  const paintRef = useRef(transformRgba);

  useEffect(() => {
    readyRef.current = onReady;
    paintRef.current = transformRgba;
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let field: FieldController | null = null;
    let cancelled = false;
    let io: IntersectionObserver | null = null;
    const s: Settings = { ...DEFAULTS, ...(JSON.parse(key) as Partial<Settings>) };
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    loadImage(src)
      .then((img) => {
        if (cancelled) return;
        const { cols, rows } = gridFor(s, { w: img.naturalWidth, h: img.naturalHeight * (1 - trim) });
        const plate = buildPlate(sample(img, cols, rows, trim), cols, rows, s);
        const rgba = plate.base.slice();
        paintRef.current?.(rgba, cols, rows);
        const start = () => {
          if (field || cancelled) return;
          field = createField(canvas, fieldData(plate, rgba, s), {
            fit,
            listen,
            mode: still ? "still" : "scatter",
            assemble: assemble && !still,
            drift: drift && !still,
            ...physics(s),
          });
          readyRef.current?.(field);
        };
        // Don't spend a frame on plates nobody has scrolled to yet; the
        // assembly animation should happen where someone can see it.
        io = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              start();
              io?.disconnect();
            }
          },
          { rootMargin: "200px" },
        );
        io.observe(canvas);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      io?.disconnect();
      field?.destroy();
    };
  }, [src, trim, key, fit, assemble, drift, listen]);

  return (
    <div className={cn("relative select-none", className)} data-cursor="play">
      <canvas ref={ref} className="block h-full w-full touch-pan-y" role="img" aria-label={label} />
    </div>
  );
}
