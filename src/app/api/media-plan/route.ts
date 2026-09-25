import { NextResponse } from "next/server";
import { PRESETS, presetThumbUrl } from "@/lib/catalog/presets";
import { getLanding } from "@/lib/catalog/landing";

// Dev-only helper for scripts/generate-media.mjs. It reports every still the
// marketing surfaces ask for, as the catalog would build it, so the generator
// never has to duplicate prompt logic. Not reachable in production.
export const dynamic = "force-dynamic";

export function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not available" }, { status: 404 });
  }

  const plan: { key: string; url: string }[] = [];
  for (const p of PRESETS) {
    plan.push({ key: `preset-${p.id}-card`, url: presetThumbUrl(p, "card") });
    plan.push({ key: `preset-${p.id}-wide`, url: presetThumbUrl(p, "wide") });
  }

  const L = getLanding();
  for (const [rowKey, row] of Object.entries(L.rows)) {
    row.items.forEach((it, i) => {
      if (it.poster.startsWith("http")) plan.push({ key: `row-${rowKey}-${i}`, url: it.poster });
    });
  }

  return NextResponse.json({ count: plan.length, plan });
}
