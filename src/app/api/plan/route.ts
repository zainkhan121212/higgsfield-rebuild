import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateUser, toSessionUser } from "@/lib/auth";
import { getPlan } from "@/lib/catalog/plans";

// Demo checkout: no payment provider. Picking a plan grants its monthly
// credits immediately and records the change in the ledger.
export async function POST(req: Request) {
  const user = await getOrCreateUser();
  const { plan: planId, credits } = (await req.json()) as { plan: string; credits?: number };
  const plan = getPlan(planId);
  if (plan.id === "FREE") return NextResponse.json({ error: "Pick a paid plan" }, { status: 400 });
  const grant = Math.max(plan.credits, Math.min(Number(credits ?? plan.credits), plan.credits * 3));
  const updated = await db.$transaction(async (tx) => {
    const u = await tx.user.update({ where: { id: user.id }, data: { plan: plan.id, credits: { increment: grant } } });
    await tx.creditEntry.create({ data: { userId: user.id, delta: grant, reason: `plan:${plan.id.toLowerCase()}` } });
    return u;
  });
  return NextResponse.json({ user: toSessionUser(updated) });
}
