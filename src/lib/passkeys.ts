import "server-only";
import { cookies, headers } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { db } from "./db";
import { audit } from "./security";
import { AuthError } from "./auth";

// Passkeys (FIDO2 / WebAuthn). Phishing-resistant, no shared secret: the
// private key never leaves the user's device and the signature is bound to
// this origin, so a look-alike domain gets nothing. Challenges ride in a
// short-lived signed cookie rather than the database.

const RP_NAME = "Higgsfield";
const CHALLENGE_COOKIE = "hf_webauthn";
const CHALLENGE_TTL = 300; // seconds
const SECRET = (process.env.AUTH_SECRET || "dev-only-secret-change-me") + ":webauthn";

async function rp() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return { rpID: host.split(":")[0], origin: `${proto}://${host}` };
}

function sign(v: string) {
  return createHmac("sha256", SECRET).update(v).digest("base64url");
}

async function setChallenge(purpose: "register" | "login", challenge: string, userId?: string) {
  const exp = Math.floor(Date.now() / 1000) + CHALLENGE_TTL;
  const payload = `${purpose}.${challenge}.${userId ?? ""}.${exp}`;
  (await cookies()).set(CHALLENGE_COOKIE, `${payload}.${sign(payload)}`, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: CHALLENGE_TTL });
}

async function takeChallenge(purpose: "register" | "login"): Promise<{ challenge: string; userId: string }> {
  const jar = await cookies();
  const raw = jar.get(CHALLENGE_COOKIE)?.value;
  jar.delete(CHALLENGE_COOKIE);
  if (!raw) throw new AuthError("Passkey challenge expired. Try again.");
  const parts = raw.split(".");
  const sig = parts.pop()!;
  const payload = parts.join(".");
  const expected = sign(payload);
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) throw new AuthError("Invalid passkey challenge.");
  const [p, challenge, userId, exp] = parts;
  if (p !== purpose || Number(exp) < Date.now() / 1000) throw new AuthError("Passkey challenge expired. Try again.");
  return { challenge, userId };
}

export async function registrationOptions(user: { id: string; name: string; email: string | null }) {
  const { rpID } = await rp();
  const existing = await db.passkey.findMany({ where: { userId: user.id }, select: { credentialId: true, transports: true } });
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: user.email ?? user.name,
    userDisplayName: user.name,
    attestationType: "none",
    excludeCredentials: existing.map((c) => ({ id: c.credentialId, transports: c.transports as AuthenticatorTransportFuture[] })),
    authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
  });
  await setChallenge("register", options.challenge, user.id);
  return options;
}

type AuthenticatorTransportFuture = "ble" | "cable" | "hybrid" | "internal" | "nfc" | "smart-card" | "usb";

export async function verifyRegistration(userId: string, response: RegistrationResponseJSON, label?: string) {
  const { challenge, userId: challengedFor } = await takeChallenge("register");
  if (challengedFor !== userId) throw new AuthError("Passkey challenge doesn't match this account.");
  const { rpID, origin } = await rp();
  const result = await verifyRegistrationResponse({ response, expectedChallenge: challenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: false });
  if (!result.verified || !result.registrationInfo) throw new AuthError("Passkey registration failed.");
  const { credential, credentialDeviceType, credentialBackedUp } = result.registrationInfo;
  await db.passkey.create({
    data: {
      userId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: BigInt(credential.counter),
      transports: credential.transports ?? [],
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      label: label?.slice(0, 40) || null,
    },
  });
  await audit("passkey_added", { userId, meta: { deviceType: credentialDeviceType } });
}

export async function authenticationOptions() {
  const { rpID } = await rp();
  // No allowCredentials: discoverable credentials let the browser pick.
  const options = await generateAuthenticationOptions({ rpID, userVerification: "preferred" });
  await setChallenge("login", options.challenge);
  return options;
}

export async function verifyAuthentication(response: AuthenticationResponseJSON): Promise<string> {
  const { challenge } = await takeChallenge("login");
  const { rpID, origin } = await rp();
  const passkey = await db.passkey.findUnique({ where: { credentialId: response.id } });
  if (!passkey) throw new AuthError("Unknown passkey.");
  const result = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: false,
    credential: {
      id: passkey.credentialId,
      publicKey: new Uint8Array(passkey.publicKey),
      counter: Number(passkey.counter),
      transports: passkey.transports as AuthenticatorTransportFuture[],
    },
  });
  if (!result.verified) throw new AuthError("Passkey verification failed.");
  // A counter that doesn't advance is the classic cloned-authenticator signal.
  await db.passkey.update({ where: { id: passkey.id }, data: { counter: BigInt(result.authenticationInfo.newCounter), lastUsedAt: new Date() } });
  return passkey.userId;
}
