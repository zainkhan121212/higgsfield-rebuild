import { ImageResponse } from "next/og";
import { db, hasDb } from "@/lib/server/db";

// The share preview for a plate (WhatsApp, iMessage, X…): its own picture
// on paper with the title. Public plates only; anything else gets the plain
// card, so a private plate's picture never leaves through a link preview.

export const alt = "A plate set in loose type, made with Pied";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let row: { title: string; thumb: Buffer; display_name: string | null } | undefined;
  if (hasDb() && /^[A-Za-z0-9]{12}$/.test(id)) {
    try {
      [row] = (await db()`
        select p.title, p.thumb, u.display_name from pied.plates p join pied.users u on u.id = p.user_id
        where p.id = ${id} and p.is_public`) as unknown as (typeof row)[];
    } catch {
      row = undefined;
    }
  }
  const src = row ? `data:image/jpeg;base64,${Buffer.from(row.thumb).toString("base64")}` : null;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f4f3ee", color: "#0c0c0b", padding: 48, gap: 48, alignItems: "center" }}>
        {src ? (
          <img src={src} width={704} height={396} alt="" style={{ border: "2px solid #0c0c0b" }} />
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ fontSize: 20, letterSpacing: 6, textTransform: "uppercase", opacity: 0.6 }}>Pied · a plate</div>
          <div style={{ fontSize: src ? 56 : 96, lineHeight: 1.02, marginTop: 20, fontStyle: "italic" }}>{row ? row.title : "Pictures, set in loose type."}</div>
          <div style={{ fontSize: 22, marginTop: 24, opacity: 0.7 }}>{row ? `by ${row.display_name || "Anonymous"}` : "Make your own at Pied"}</div>
        </div>
      </div>
    ),
    size,
  );
}
