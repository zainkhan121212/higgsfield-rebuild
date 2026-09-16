import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { createHmac, timingSafeEqual } from "node:crypto";
import { customAlphabet } from "nanoid";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { audit, checkLoginAllowed, clearLoginFailures, clientIp, passwordProblem, rateLimit, recordLoginFailure } from "./security";
import type { User } from "@prisma/client";

// Guest-first auth: the first visit creates a user with real credits and pins
// it to a signed httpOnly cookie. Signing up attaches an email + password (or
// a passkey) to that same row, so credits and generations carry over.
//
// Session token = `${userId}.${issuedAt}.${hmac}`. The HMAC covers both
// fields; tokens expire after 30 days; SESSION_VERSION in the secret lets us
// invalidate every session at once.

const PROD = process.env.NODE_ENV === "production";
// `__Host-` cookies can only be set by this exact origin, over HTTPS, with
// Path=/ and no Domain — a subdomain or an attacker's page can't plant one.
export const SESSION_COOKIE = PROD ? "__Host-hf_session" : "hf_session";
export const FREE_CREDITS = 100;
const SESSION_TTL_SEC = 60 * 60 * 24 * 30;
const SESSION_VERSION = "v2";

const SECRET = (process.env.AUTH_SECRET || "dev-only-secret-change-me") + ":" + SESSION_VERSION;
const handleId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

const ADJ = ["quiet", "bright", "wandering", "electric", "velvet", "lucid", "neon", "amber", "cosmic", "paper"];
const NOUN = ["otter", "comet", "lantern", "sparrow", "orchid", "harbor", "signal", "meadow", "glacier", "cinema"];

function randomName() {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)];
  const n = NOUN[Math.floor(Math.random() * NOUN.length)];
  return `${a}_${n}${Math.floor(Math.random() * 900 + 100)}`;
}

function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function verify(value: string | undefined): string | null {
  if (!value) return null;
  const [id, iat, sig] = value.split(".");
  if (!id || !iat || !sig) return null;
  const expected = sign(`${id}.${iat}`);
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  if (Date.now() / 1000 - Number(iat) > SESSION_TTL_SEC) return null;
  return id;
}

async function setSession(id: string) {
  const iat = Math.floor(Date.now() / 1000);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, `${id}.${iat}.${sign(`${id}.${iat}`)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: PROD,
    path: "/",
    maxAge: SESSION_TTL_SEC,
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
  // Free-credit abuse control: a single IP gets at most 5 fresh guest
  // accounts an hour. Real visitors never notice; a credit-farming script does.
  const ip = await clientIp();
  await rateLimit("guest-create", ip, 5, 3600);
  const name = randomName();
  const user = await db.user.create({
    data: {
      name,
      handle: `${name}_${handleId()}`,
      credits: FREE_CREDITS,
      signupIp: ip,
      ledger: { create: { delta: FREE_CREDITS, reason: "welcome" } },
    },
  });
  await setSession(user.id);
  await audit("guest_created", { userId: user.id });
  return user;
}

export class AuthError extends Error {}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function signUp(email: string, password: string, name?: string): Promise<User> {
  email = email.trim().toLowerCase();
  const ip = await clientIp();
  await rateLimit("signup", ip, 10, 3600);
  if (!EMAIL_RE.test(email) || email.length > 254) throw new AuthError("Enter a valid email address.");
  const problem = passwordProblem(password);
  if (problem) throw new AuthError(problem);
  if (await db.user.findUnique({ where: { email } })) throw new AuthError("That email already has an account. Log in instead.");

  const passwordHash = await bcrypt.hash(password, 12);
  const current = await getSessionUser();
  const displayName = (name?.trim() || email.split("@")[0]).slice(0, 40);

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
            signupIp: ip,
            ledger: { create: { delta: FREE_CREDITS, reason: "welcome" } },
          },
        });
  await setSession(user.id);
  await audit("signup", { userId: user.id });
  return user;
}

export async function logIn(email: string, password: string): Promise<User> {
  email = email.trim().toLowerCase();
  const ip = await clientIp();
  await rateLimit("login", ip, 30, 900);
  await checkLoginAllowed(email, ip);
  const user = await db.user.findUnique({ where: { email } });
  // Constant-ish time: always run a compare so unknown emails cost the same.
  const ok = user?.passwordHash ? await bcrypt.compare(password, user.passwordHash) : await bcrypt.compare(password, DUMMY_HASH).then(() => false);
  if (!user || !ok) {
    await recordLoginFailure(email, ip);
    await audit("login_failed", { userId: user?.id, meta: { email } });
    throw new AuthError("Wrong email or password.");
  }
  await clearLoginFailures(email);
  await setSession(user.id); // fresh token on every login (rotation)
  await audit("login", { userId: user.id });
  return user;
}

const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8b4fZ7QzWkQ1B0nT2f5r0M2u0mE7Jm";

/** Passkey login: called after the WebAuthn assertion verified. */
export async function logInWithUserId(userId: string) {
  await setSession(userId);
  await audit("login_passkey", { userId });
}

export async function signOut() {
  const user = await getSessionUser();
  const jar = await cookies();
  // A __Host- cookie can only be cleared by a Set-Cookie that repeats its
  // Secure + Path=/ attributes; a bare delete() is ignored by the browser.
  jar.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: PROD, path: "/", maxAge: 0, expires: new Date(0) });
  if (user) await audit("logout", { userId: user.id });
}

export function toSessionUser(u: User) {
  return { id: u.id, name: u.name, handle: u.handle, email: u.email, plan: u.plan, credits: u.credits };
}
