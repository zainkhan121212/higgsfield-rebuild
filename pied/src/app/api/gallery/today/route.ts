import { db } from "@/lib/server/db";
import { api, json } from "@/lib/server/route";

// GET: the Plate of the Day. One public plate, the same for everyone all
// day (chosen by hashing each id with today's date), different tomorrow.
// Only what the front page shows: never an email or a user id.
export const GET = api(async () => {
  const [row] = await db()`
    select p.id, p.title, p.data, u.display_name
    from pied.plates p join pied.users u on u.id = p.user_id
    where p.is_public
    order by md5(p.id || current_date::text) limit 1`;
  if (!row) return json({ plate: null }, 200, { "cache-control": "public, max-age=300, s-maxage=300" });
  return json({ id: row.id, title: row.title, by: row.display_name || "Anonymous", plate: row.data }, 200, { "cache-control": "public, max-age=300, s-maxage=600" });
});
