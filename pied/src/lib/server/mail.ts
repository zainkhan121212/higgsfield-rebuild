import "server-only";

// Outgoing email (verification and password reset). With RESEND_API_KEY and
// MAIL_FROM set it sends through Resend; without them, development prints the
// message to the server console and production sends nothing (the flows then
// fall back as described in SECURITY.md).

export const mailConfigured = () => !!(process.env.RESEND_API_KEY && process.env.MAIL_FROM);

export async function sendMail(to: string, subject: string, text: string) {
  if (!mailConfigured()) {
    if (process.env.NODE_ENV !== "production") console.info(`\n[mail → ${to}] ${subject}\n${text}\n`);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject, text }),
    signal: AbortSignal.timeout(10_000),
  });
  return res.ok;
}

/**
 * Links in emails are built from APP_URL, never from the request's Host
 * header: a forged Host would otherwise put an attacker's domain in a reset
 * link (host-header injection).
 */
export function appUrl(req: Request) {
  const fixed = process.env.APP_URL;
  if (fixed) return fixed.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") throw new Error("APP_URL must be set in production");
  return new URL(req.url).origin;
}
