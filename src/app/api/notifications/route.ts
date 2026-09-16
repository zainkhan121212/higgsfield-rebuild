import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { getModel } from "@/lib/catalog/models";
import { handle } from "@/lib/api";

// Notifications are derived, not stored: finished/failed generations, orders,
// welcome credits and security events already live in their own tables.
// `notificationsSeenAt` on the user is the read cursor.

export type Notification = {
  id: string;
  kind: "done" | "failed" | "order" | "welcome" | "security";
  title: string;
  body: string;
  href: string;
  at: string;
  thumb?: string | null;
};

export function GET() {
  return handle(async () => {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ items: [], unread: 0 });
    const [gens, ledger, events] = await Promise.all([
      db.generation.findMany({ where: { userId: user.id, status: { in: ["DONE", "FAILED"] } }, orderBy: { finishedAt: "desc" }, take: 15 }),
      db.creditEntry.findMany({ where: { userId: user.id, reason: { startsWith: "order:" } }, orderBy: { createdAt: "desc" }, take: 5 }),
      db.securityEvent.findMany({ where: { userId: user.id, kind: { in: ["login", "login_passkey", "passkey_added", "login_locked"] } }, orderBy: { createdAt: "desc" }, take: 5 }),
    ]);
    const items: Notification[] = [
      ...gens.map((g) => ({
        id: `gen:${g.id}`,
        kind: (g.status === "DONE" ? "done" : "failed") as "done" | "failed",
        title: g.status === "DONE" ? `${g.kind === "VIDEO" ? "Video" : "Image"} ready` : `${g.kind === "VIDEO" ? "Video" : "Image"} failed — refunded`,
        body: `${getModel(g.modelId)?.name ?? g.modelId} · ${g.prompt.slice(0, 70)}`,
        href: g.kind === "VIDEO" ? "/ai/video" : "/ai/image",
        at: (g.finishedAt ?? g.createdAt).toISOString(),
        thumb: g.kind === "IMAGE" ? g.thumbnailUrl : null,
      })),
      ...ledger.map((e) => ({
        id: `order:${e.id}`,
        kind: "order" as const,
        title: `+${e.delta} credits added`,
        body: e.reason.split(":").slice(2).join(":"),
        href: "/account",
        at: e.createdAt.toISOString(),
      })),
      ...events.map((e) => ({
        id: `sec:${e.id}`,
        kind: "security" as const,
        title: e.kind === "login_locked" ? "Sign-in temporarily locked" : e.kind === "passkey_added" ? "Passkey added" : "New sign-in",
        body: e.kind === "login_locked" ? "Too many failed attempts. Try again in 15 minutes." : `From ${e.ip ?? "unknown"}`,
        href: "/account",
        at: e.createdAt.toISOString(),
      })),
      {
        id: "welcome",
        kind: "welcome" as const,
        title: "Welcome — 100 credits on us",
        body: "Enough for ~50 images or a couple of videos. No card needed.",
        href: "/ai/image",
        at: user.createdAt.toISOString(),
      },
    ]
      .sort((a, b) => (a.at < b.at ? 1 : -1))
      .slice(0, 20);
    const seen = user.notificationsSeenAt?.getTime() ?? 0;
    const unread = items.filter((i) => new Date(i.at).getTime() > seen).length;
    return NextResponse.json({ items, unread });
  });
}

export function POST() {
  return handle(async () => {
    const user = await getSessionUser();
    if (user) await db.user.update({ where: { id: user.id }, data: { notificationsSeenAt: new Date() } });
    return NextResponse.json({ ok: true });
  });
}
