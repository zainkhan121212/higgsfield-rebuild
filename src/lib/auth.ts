import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { createHmac, timingSafeEqual } from "node:crypto";
import { customAlphabet } from "nanoid";
import bcrypt from "bcryptjs";
import { db } from "./db";
import type { User } from "@prisma/client";

// Guest-first auth: the first visit creates a user with real credits and pins
// it to a signed httpOnly cookie. Signing up attaches an email + password to
// that same row, so credits and generations carry over. Logging in swaps the
// cookie to the matching account.

export const SESSION_COOKIE = "hf_session";
export const FREE_CREDITS = 100;

const SECRET = process.env.AUTH_SECRET || "dev-only-secret-change-me";
const handleId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

const ADJ = ["quiet", "bright", "wandering", "electric", "velvet", "lucid", "neon", "amber", "cosmic", "paper"];
const NOUN = ["otter", "comet", "lantern", "sparrow", "orchid", "harbor", "signal", "meadow", "glacier", "cinema"];

function randomName() {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)];
  const n = NOUN[Math.floor(Math.random() * NOUN.length)];
  return `${a}_${n}${Math.floor(Math.random() * 900 + 100)}`;
}

function sign(id: string) {
  return createHmac("sha256", SECRET).update(id).digest("base64url");
}

function verify(value: string | undefined): string | null {
  if (!value) return null;
  const [id, sig] = value.split(".");
  if (!id || !sig) return null;
  const expected = sign(id);
  if (expected.length !== sig.length) return null;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(sig)) ? id : null;
}

async function setSession(id: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, `${id}.${sign(id)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export const getSessionUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const id = verify(jar.get(SESSION_COOKIE)?.value);
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
  await setSession(user.id);
  return user;
}

export class AuthError extends Error {}

export async function signUp(email: string, password: string, name?: string): Promise<User> {
  email = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new AuthError("Enter a valid email address.");
  if (password.length < 8) throw new AuthError("Password needs at least 8 characters.");
  if (await db.user.findUnique({ where: { email } })) throw new AuthError("That email already has an account. Log in instead.");

  const passwordHash = await bcrypt.hash(password, 10);
  const current = await getSessionUser();
  const displayName = name?.trim() || email.split("@")[0];

  // Upgrade the guest in place so nothing is lost; otherwise create fresh.
  const user =
    current && !current.email
      ? await db.user.update({ where: { id: current.id }, data: { email, passwordHash, name: displayName } })
      : await db.user.create({
          data: {
            email,
            passwordHash,
            name: displayName,
            handle: `${displayName.replace(/[^a-z0-9]+/gi, "_").toLowerCase().slice(0, 20)}_${handleId()}`,
            credits: FREE_CREDITS,
            ledger: { create: { delta: FREE_CREDITS, reason: "welcome" } },
          },
        });
  await setSession(user.id);
  return user;
}

export async function logIn(email: string, password: string): Promise<User> {
  email = email.trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AuthError("Wrong email or password.");
  }
  await setSession(user.id);
  return user;
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export function toSessionUser(u: User) {
  return { id: u.id, name: u.name, handle: u.handle, email: u.email, plan: u.plan, credits: u.credits };
}
