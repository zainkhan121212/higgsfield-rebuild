import { NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { db } from "@/lib/db";
import { getOrCreateUser, toSessionUser } from "@/lib/auth";
import { handle, readJson } from "@/lib/api";
import { audit, rateLimit } from "@/lib/security";
import { z } from "zod";
import { getPlan } from "@/lib/catalog/plans";
import { getPack } from "@/lib/catalog/packs";

// Demo checkout. The client runs a card form for realism but never sends card
// data here — only what was bought. Completing an "order" grants credits and
// writes a ledger entry with the order number.
const orderNo = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

const schema = z.object({
  kind: z.enum(["plan", "pack"]),
  id: z.string().max(20),
  credits: z.number().int().min(0).max(100000).optional(),
  interval: z.enum(["monthly", "annual"]).optional(),
});

export function POST(req: Request) {
  return handle(async () => {
  const user = await getOrCreateUser();
  await rateLimit("checkout", user.id, 20, 3600);
  const body = await readJson(req, schema);

  let grant = 0;
  let amount = 0;
  let label = "";
  let planId: "BASIC" | "PRO" | "MAX" | null = null;

  if (body.kind === "plan") {
    const plan = getPlan(body.id);
    if (plan.id === "FREE") return NextResponse.json({ error: "Pick a paid plan" }, { status: 400 });
    const credits = Math.max(plan.credits, Math.min(Number(body.credits ?? plan.credits), plan.credits * 3));
    const mult = credits / plan.credits;
    amount = Math.round(plan.price * mult * (body.interval === "monthly" ? 1.3 : 1) * 100) / 100;
    grant = credits;
    label = `${plan.name} plan · ${credits.toLocaleString()} credits/mo`;
    planId = plan.id;
  } else {
    const pack = getPack(body.id);
    if (!pack) return NextResponse.json({ error: "Unknown pack" }, { status: 400 });
    amount = pack.price;
    grant = pack.credits;
    label = `${pack.name} · ${pack.credits.toLocaleString()} credits`;
  }

  const order = `HF-${orderNo()}`;
  const updated = await db.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: user.id },
      data: { credits: { increment: grant }, ...(planId ? { plan: planId } : {}) },
    });
    await tx.creditEntry.create({ data: { userId: user.id, delta: grant, reason: `order:${order}:${label}` } });
    return u;
  });

  await audit("checkout", { userId: user.id, meta: { order, amount, grant } });
  return NextResponse.json({ order, amount, grant, label, user: toSessionUser(updated) });
  });
}
