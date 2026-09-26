import { z } from "zod";
import { parse, requireUser, currentSession } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { HttpError, caller, limitDurable, readJson, securityEvent } from "@/lib/server/guard";
import { PlateData, Thumb, Title, card, cursorOf, parseCursor, plateId, type PlateRow } from "@/lib/server/plates";
import { api, json } from "@/lib/server/route";

const PAGE = 12;
const QUOTA = 200;

// GET: your plates, newest first, 12 at a time (keyset pagination).
export const GET = api(async (req) => {
  const s = await currentSession();
  if (!s) throw new HttpError(401, "Sign in to see your library.");
  const cur = parseCursor(new URL(req.url).searchParams.get("cursor"));
  const rows = (await db()`
    select id, title, is_public, created_at, thumb from pied.plates
    where user_id = ${s.user.id} ${cur ? db()`and (created_at, id) < (${cur.at}, ${cur.id})` : db()``}
    order by created_at desc, id desc limit ${PAGE + 1}`) as unknown as PlateRow[];
  const more = rows.length > PAGE;
  const page = rows.slice(0, PAGE);
  return json({ plates: page.map(card), next: more ? cursorOf(page[page.length - 1]) : null });
});

const Save = z
  .object({ title: Title, isPublic: z.boolean().default(false), plate: PlateData, thumb: Thumb, remixOf: z.string().regex(/^[A-Za-z0-9]{12}$/).optional() })
  .strict();

// POST: save a plate to your library.
export const POST = api(
  async (req) => {
    const s = await requireUser(req);
    const r = await limitDurable(`save:${s.user.id}`, 30, 3600);
    if (!r.ok) throw new HttpError(429, "That's a lot of saving. Try again in a while.");
    const body = parse(Save, await readJson(req, 1_600_000));
    const [{ n }] = await db()`select count(*)::int as n from pied.plates where user_id = ${s.user.id}`;
    if (n >= QUOTA) throw new HttpError(409, `Your library is full (${QUOTA} plates). Delete a few to make room.`);
    const id = plateId();
    // Credit only a plate this person could see: a public one, or their own.
    const [src] = body.remixOf
      ? await db()`select id from pied.plates where id = ${body.remixOf} and (is_public or user_id = ${s.user.id})`
      : [];
    await db()`
      insert into pied.plates (id, user_id, title, is_public, cols, rows, data, thumb, remix_of)
      values (${id}, ${s.user.id}, ${body.title}, ${body.isPublic}, ${body.plate.cols}, ${body.plate.rows}, ${db().json(body.plate)}, ${body.thumb}, ${src?.id ?? null})`;
    securityEvent("plate.saved", { userId: s.user.id, who: caller(req), plate: id });
    return json({ ok: true, id }, 201);
  },
  { write: true },
);
