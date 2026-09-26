import { db } from "@/lib/server/db";
import { card, cursorOf, parseCursor, type PlateRow } from "@/lib/server/plates";
import { api, json } from "@/lib/server/route";

const PAGE = 12;

// GET: public plates, newest first. Only what's been made public, and only
// the fields a card needs (never an email or a user id).
export const GET = api(async (req) => {
  const cur = parseCursor(new URL(req.url).searchParams.get("cursor"));
  const rows = (await db()`
    select p.id, p.title, p.is_public, p.created_at, p.thumb, u.display_name
    from pied.plates p join pied.users u on u.id = p.user_id
    where p.is_public ${cur ? db()`and (p.created_at, p.id) < (${cur.at}, ${cur.id})` : db()``}
    order by p.created_at desc, p.id desc limit ${PAGE + 1}`) as unknown as PlateRow[];
  const more = rows.length > PAGE;
  const page = rows.slice(0, PAGE);
  return json({ plates: page.map(card), next: more ? cursorOf(page[page.length - 1]) : null }, 200, { "cache-control": "public, max-age=30, s-maxage=30" });
});
