import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { FACES } from "@/lib/plate";

// What a saved plate may contain. Everything is checked before it's stored:
// sizes match the grid exactly, colours are hex, the font is one of ours,
// the thumbnail is a real JPEG — nothing free-form reaches the database
// except the title (cleaned) and the letters (drawn on a canvas, never as HTML).

const FONTS = new Set(Object.values(FACES).map((f) => f.stack));
const B64 = /^[A-Za-z0-9+/]*={0,2}$/;
const b64len = (s: string) => Math.floor((s.length * 3) / 4) - (s.endsWith("==") ? 2 : s.endsWith("=") ? 1 : 0);

export const Title = z
  .string()
  .transform((s) => s.replace(/[\u0000-\u001f\u007f-\u009f​-‏\u2028-‮⁦-⁩]/g, "").replace(/\s+/g, " ").trim().slice(0, 80))
  .pipe(z.string().min(1, "Give it a title."));

export const PlateData = z
  .object({
    cols: z.number().int().min(8).max(400),
    rows: z.number().int().min(8).max(400),
    cell: z.literal(10),
    ch: z.string().max(160_000),
    paper: z.string().regex(/^#[0-9a-f]{6}$/i),
    font: z.string().refine((f) => FONTS.has(f), "Unknown typeface."),
    weight: z.union([z.literal(400), z.literal(700)]),
    rgba: z.string().max(900_000).regex(B64),
    fx: z.string().max(220_000).regex(B64),
  })
  .strict()
  .superRefine((p, ctx) => {
    const n = p.cols * p.rows;
    if (n > 60_000) ctx.addIssue({ code: "custom", message: "That plate is too large to save." });
    if (p.ch.length !== n || /[\u0000-\u001f\u007f]/.test(p.ch)) ctx.addIssue({ code: "custom", message: "The letters don't fit the grid." });
    if (b64len(p.rgba) !== n * 4) ctx.addIssue({ code: "custom", message: "The colours don't fit the grid." });
    if (p.fx && b64len(p.fx) !== n) ctx.addIssue({ code: "custom", message: "The finishes don't fit the grid." });
  });

export const Thumb = z
  .string()
  .max(270_000)
  .transform((s, ctx) => {
    const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(s);
    const buf = m ? Buffer.from(m[1], "base64") : null;
    // JPEG files start FF D8 FF.
    if (!buf || buf.length < 100 || buf[0] !== 0xff || buf[1] !== 0xd8 || buf[2] !== 0xff) {
      ctx.addIssue({ code: "custom", message: "The preview image is broken." });
      return z.NEVER;
    }
    return buf;
  });

export type PlateRow = { id: string; title: string; is_public: boolean; created_at: Date; thumb: Buffer; display_name?: string; user_id?: string };

export const plateId = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const b = randomBytes(12);
  return Array.from(b, (x) => alphabet[x % alphabet.length]).join("").padEnd(12, "a");
};

export const card = (r: PlateRow) => ({
  id: r.id,
  title: r.title,
  isPublic: r.is_public,
  createdAt: r.created_at,
  thumb: `data:image/jpeg;base64,${Buffer.from(r.thumb).toString("base64")}`,
  ...(r.display_name !== undefined ? { by: r.display_name || "Anonymous" } : {}),
});

/** Keyset pagination cursor: "<iso time>_<id>". */
export function parseCursor(c: string | null) {
  if (!c) return null;
  const m = /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)_([A-Za-z0-9]{12})$/.exec(c);
  return m ? { at: new Date(m[1]), id: m[2] } : null;
}
export const cursorOf = (r: PlateRow) => `${new Date(r.created_at).toISOString()}_${r.id}`;
