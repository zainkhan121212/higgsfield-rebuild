import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { customAlphabet } from "nanoid";
import { db } from "./db";
import type { User } from "@prisma/client";

// Guest-first auth: the first visit creates a user with real credits and
// pins it to an httpOnly cookie. "Sign in" later just names that user.
// No passwords, no OAuth — the live link has to work for a stranger
// without any setup, and the judge is a stranger.

export const SESSION_COOKIE = "hf_session";
export const FREE_CREDITS = 100;

const handleId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

const ADJ = ["quiet", "bright", "wandering", "electric", "velvet", "lucid", "neon", "amber", "cosmic", "paper"];
const NOUN = ["otter", "comet", "lantern", "sparrow", "orchid", "harbor", "signal", "meadow", "glacier", "cinema"];

function randomName() {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)];
  const n = NOUN[Math.floor(Math.random() * NOUN.length)];
  return `${a}_${n}${Math.floor(Math.random() * 900 + 100)}`;
}

export const getSessionUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return db.user.findUnique({ where: { id } });
});

/** Get the current user, creating a guest if there is none. Only callable
 *  from route handlers / server actions (cookies are written). */
export async function getOrCreateUser(): Promise<User> {
  const existing = await getSessionUser();
  if (existing) return existing;
  const name = randomName();
  const user = await db.user.create({
    data: {
      name,
      handle: `${name}_${handleId()}`,
      credits: FREE_CREDITS,
      ledger: { create: { delta: FREE_CREDITS, reason: "welcome" } },
    },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return user;
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
