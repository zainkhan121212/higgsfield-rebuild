import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { handle, readJson, ApiError } from "@/lib/api";
import { audit } from "@/lib/security";

export function GET() {
  return handle(async () => {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ passkeys: [] });
    const passkeys = await db.passkey.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
    return NextResponse.json({
      passkeys: passkeys.map((p) => ({ id: p.id, label: p.label, deviceType: p.deviceType, backedUp: p.backedUp, createdAt: p.createdAt, lastUsedAt: p.lastUsedAt })),
    });
  });
}

export function DELETE(req: Request) {
  return handle(async () => {
    const user = await getSessionUser();
    if (!user) throw new ApiError(401, "Not signed in");
    const { id } = await readJson(req, z.object({ id: z.string().max(64) }));
    await db.passkey.delete({ where: { id, userId: user.id } });
    await audit("passkey_removed", { userId: user.id });
    return NextResponse.json({ ok: true });
  });
}
