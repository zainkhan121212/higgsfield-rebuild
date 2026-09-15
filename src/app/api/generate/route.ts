import { NextResponse, after } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { generateInput, InsufficientCredits, submit, run } from "@/lib/generate";
import { serialize } from "@/lib/serialize";

export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  const parsed = generateInput.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  try {
    const gen = await submit(user, parsed.data);
    // Do the work after the response is flushed; the client polls for it.
    after(() => run(gen.id).catch(() => {}));
    const credits = user.credits - gen.cost;
    return NextResponse.json({ generation: serialize(gen), credits });
  } catch (err) {
    if (err instanceof InsufficientCredits) {
      return NextResponse.json({ error: "insufficient_credits", needed: err.needed, have: err.have }, { status: 402 });
    }
    throw err;
  }
}
