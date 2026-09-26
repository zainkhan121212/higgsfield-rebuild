import { hasDb } from "@/lib/server/db";
import { currentSession } from "@/lib/server/auth";
import { json } from "@/lib/server/route";

export const dynamic = "force-dynamic";

// Who is signed in, and the CSRF token their page must send with writes.
export async function GET() {
  if (!hasDb()) return json({ enabled: false, user: null });
  const s = await currentSession().catch(() => null);
  return json({ enabled: true, user: s?.user ?? null, csrf: s?.csrf ?? null });
}
