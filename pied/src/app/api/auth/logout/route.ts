import { endSession, requireUser, revokeSessions } from "@/lib/server/auth";
import { caller, readJson, securityEvent } from "@/lib/server/guard";
import { api, json } from "@/lib/server/route";

// {everywhere: true} signs out every device, not just this one.
export const POST = api(
  async (req) => {
    const s = await requireUser(req);
    const body = (await readJson(req, 256).catch(() => ({}))) as { everywhere?: boolean };
    if (body?.everywhere) await revokeSessions(s.user.id);
    await endSession();
    securityEvent(body?.everywhere ? "auth.logout_everywhere" : "auth.logout", { userId: s.user.id, who: caller(req) });
    return json({ ok: true });
  },
  { write: true },
);
