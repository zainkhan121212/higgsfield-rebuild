import { z } from "zod";
import { currentSession, parse, requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { HttpError, caller, readJson, securityEvent } from "@/lib/server/guard";
import { Title } from "@/lib/server/plates";
import { api, json } from "@/lib/server/route";

type Ctx = { params: Promise<{ id: string }> };
const ID = /^[A-Za-z0-9]{12}$/;

async function id(ctx: Ctx) {
  const { id } = await ctx.params;
  if (!ID.test(id)) throw new HttpError(404, "No such plate.");
  return id;
}

// GET: the whole plate. Yours, or anyone's that has been made public.
// A private plate answers 404 to everyone else, the same as a missing one,
// so ids can't be probed (IDOR).
export const GET = api(async (_req: Request, ctx: Ctx) => {
  const pid = await id(ctx);
  const s = await currentSession();
  const [row] = await db()`
    select p.id, p.title, p.is_public, p.user_id, p.data, p.created_at, u.display_name
    from pied.plates p join pied.users u on u.id = p.user_id
    where p.id = ${pid} and (p.is_public or p.user_id = ${s?.user.id ?? null})`;
  if (!row) throw new HttpError(404, "No such plate.");
  return json({ id: row.id, title: row.title, isPublic: row.is_public, mine: row.user_id === s?.user.id, by: row.display_name || "Anonymous", createdAt: row.created_at, plate: row.data });
});

// PATCH: only the title and whether it's public can change (no mass assignment).
const Patch = z.object({ title: Title.optional(), isPublic: z.boolean().optional() }).strict();
export const PATCH = api(
  async (req: Request, ctx: Ctx) => {
    const s = await requireUser(req);
    const pid = await id(ctx);
    const p = parse(Patch, await readJson(req, 1024));
    const [row] = await db()`
      update pied.plates set
        title = coalesce(${p.title ?? null}, title),
        is_public = coalesce(${p.isPublic ?? null}, is_public),
        updated_at = now()
      where id = ${pid} and user_id = ${s.user.id}
      returning id, title, is_public`;
    if (!row) throw new HttpError(404, "No such plate.");
    if (p.isPublic !== undefined) securityEvent(p.isPublic ? "plate.published" : "plate.unpublished", { userId: s.user.id, who: caller(req), plate: pid });
    return json({ id: row.id, title: row.title, isPublic: row.is_public });
  },
  { write: true },
);

export const DELETE = api(
  async (req: Request, ctx: Ctx) => {
    const s = await requireUser(req);
    const pid = await id(ctx);
    const r = await db()`delete from pied.plates where id = ${pid} and user_id = ${s.user.id}`;
    if (!r.count) throw new HttpError(404, "No such plate.");
    securityEvent("plate.deleted", { userId: s.user.id, who: caller(req), plate: pid });
    return json({ ok: true });
  },
  { write: true },
);
