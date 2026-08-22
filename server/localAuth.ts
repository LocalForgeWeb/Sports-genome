import { and, eq, gt } from "drizzle-orm";
import { parse } from "cookie";
import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import type { Request, Response } from "express";
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";
import type { User } from "../drizzle/schema";
import { accountPasskeys, emailCredentials, localAuthChallenges, localAuthSessions, users } from "../drizzle/schema";
import { getDb } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";

export const LOCAL_AUTH_COOKIE = "go_email_session";
const SESSION_DAYS = 30;
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const CHALLENGE_MINUTES = 5;

export function nextPasswordFailureState(previousAttempts: number, now = Date.now()) {
  const attempts = Math.max(0, previousAttempts) + 1;
  return attempts >= MAX_ATTEMPTS
    ? { failedAttempts: 0, lockedUntil: new Date(now + LOCK_MINUTES * 60 * 1000), locked: true }
    : { failedAttempts: attempts, lockedUntil: null, locked: false };
}

export function hasPasskeyOption(passkeyCount: number) { return passkeyCount > 0; }

function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
function hashToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
function passwordHash(password: string, salt: string) { return scryptSync(password, salt, 64).toString("hex"); }
function publicName(email: string) { return email.split("@")[0]?.replace(/[._-]+/g, " ").replace(/\b\w/g, letter => letter.toUpperCase()) || "Athlete"; }
function relyingParty(req: Request) {
  const forwarded = req.headers["x-forwarded-proto"];
  const protocol = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0])?.trim() || req.protocol;
  const origin = `${protocol}://${req.get("host")}`;
  return { origin, rpID: new URL(origin).hostname };
}

async function storeChallenge(identifier: string, purpose: "register" | "authenticate", challenge: string) {
  const db = await getDb();
  if (!db) throw new Error("Account service unavailable");
  await db.delete(localAuthChallenges).where(and(eq(localAuthChallenges.identifier, identifier), eq(localAuthChallenges.purpose, purpose)));
  await db.insert(localAuthChallenges).values({ identifier, purpose, challenge, expiresAt: new Date(Date.now() + CHALLENGE_MINUTES * 60 * 1000) });
}

async function consumeChallenge(identifier: string, purpose: "register" | "authenticate") {
  const db = await getDb();
  if (!db) throw new Error("Account service unavailable");
  const rows = await db.select().from(localAuthChallenges).where(and(eq(localAuthChallenges.identifier, identifier), eq(localAuthChallenges.purpose, purpose), gt(localAuthChallenges.expiresAt, new Date()))).limit(1);
  const entry = rows[0];
  if (!entry) return undefined;
  await db.delete(localAuthChallenges).where(eq(localAuthChallenges.id, entry.id));
  return entry.challenge;
}

async function setLocalSession(userId: number, req: Request, res: Response) {
  const db = await getDb();
  if (!db) throw new Error("Account service unavailable");
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(localAuthSessions).values({ userId, tokenHash: hashToken(token), expiresAt, lastSeenAt: new Date() });
  res.cookie(LOCAL_AUTH_COOKIE, token, { ...getSessionCookieOptions(req), maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000 });
}

export async function registerEmailAccount(input: { email: string; password: string }, req: Request, res: Response) {
  const db = await getDb();
  if (!db) throw new Error("Account service unavailable");
  const email = normalizeEmail(input.email);
  const existing = await db.select({ id: emailCredentials.id }).from(emailCredentials).where(eq(emailCredentials.email, email)).limit(1);
  if (existing.length) return { ok: false as const, code: "EMAIL_EXISTS" as const };
  const openId = `email-${randomUUID()}`;
  const salt = randomBytes(16).toString("hex");
  await db.insert(users).values({ openId, email, name: publicName(email), loginMethod: "email", lastSignedIn: new Date() });
  const user = (await db.select().from(users).where(eq(users.openId, openId)).limit(1))[0];
  if (!user) throw new Error("Could not create account");
  await db.insert(emailCredentials).values({ userId: user.id, email, passwordHash: passwordHash(input.password, salt), passwordSalt: salt });
  await setLocalSession(user.id, req, res);
  return { ok: true as const, user };
}

export async function signInWithEmail(input: { email: string; password: string }, req: Request, res: Response) {
  const db = await getDb();
  if (!db) throw new Error("Account service unavailable");
  const email = normalizeEmail(input.email);
  const rows = await db.select({ credential: emailCredentials, user: users }).from(emailCredentials).innerJoin(users, eq(emailCredentials.userId, users.id)).where(eq(emailCredentials.email, email)).limit(1);
  const record = rows[0];
  if (!record) return { ok: false as const, code: "INVALID_CREDENTIALS" as const };
  if (record.credential.lockedUntil && record.credential.lockedUntil.getTime() > Date.now()) return { ok: false as const, code: "TEMPORARILY_LOCKED" as const };
  const candidate = Buffer.from(passwordHash(input.password, record.credential.passwordSalt), "hex");
  const saved = Buffer.from(record.credential.passwordHash, "hex");
  const matched = candidate.length === saved.length && timingSafeEqual(candidate, saved);
  if (!matched) {
    const next = nextPasswordFailureState(record.credential.failedAttempts);
    await db.update(emailCredentials).set({ failedAttempts: next.failedAttempts, lockedUntil: next.lockedUntil }).where(eq(emailCredentials.id, record.credential.id));
    return { ok: false as const, code: next.locked ? "TEMPORARILY_LOCKED" as const : "INVALID_CREDENTIALS" as const };
  }
  await db.update(emailCredentials).set({ failedAttempts: 0, lockedUntil: null }).where(eq(emailCredentials.id, record.credential.id));
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, record.user.id));
  await setLocalSession(record.user.id, req, res);
  return { ok: true as const, user: record.user };
}

export async function getLocalSessionUser(req: Request): Promise<User | null> {
  const token = parse(req.headers.cookie || "")[LOCAL_AUTH_COOKIE];
  if (!token) return null;
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ user: users }).from(localAuthSessions).innerJoin(users, eq(localAuthSessions.userId, users.id)).where(and(eq(localAuthSessions.tokenHash, hashToken(token)), gt(localAuthSessions.expiresAt, new Date()))).limit(1);
  return rows[0]?.user || null;
}

export async function clearLocalSession(req: Request, res: Response) {
  const token = parse(req.headers.cookie || "")[LOCAL_AUTH_COOKIE];
  const db = await getDb();
  if (token && db) await db.delete(localAuthSessions).where(eq(localAuthSessions.tokenHash, hashToken(token)));
  res.clearCookie(LOCAL_AUTH_COOKIE, { ...getSessionCookieOptions(req), maxAge: -1 });
}

export async function beginPasskeyRegistration(user: User, req: Request) {
  const db = await getDb();
  if (!db) throw new Error("Account service unavailable");
  const { rpID } = relyingParty(req);
  const existing = await db.select().from(accountPasskeys).where(eq(accountPasskeys.userId, user.id));
  const options = await generateRegistrationOptions({ rpName: "Gym Optimizer", rpID, userName: user.email || `athlete-${user.id}`, userDisplayName: user.name || "Gym Optimizer athlete", userID: new TextEncoder().encode(String(user.id)), attestationType: "none", excludeCredentials: existing.map(passkey => ({ id: passkey.credentialId, transports: passkey.transports ? JSON.parse(passkey.transports) : undefined })), authenticatorSelection: { residentKey: "preferred", userVerification: "required" } });
  await storeChallenge(String(user.id), "register", options.challenge);
  return options;
}

export async function finishPasskeyRegistration(user: User, response: unknown, req: Request) {
  const challenge = await consumeChallenge(String(user.id), "register");
  if (!challenge) return { ok: false as const, code: "EXPIRED_CHALLENGE" as const };
  const { origin, rpID } = relyingParty(req);
  const verification = await verifyRegistrationResponse({ response: response as RegistrationResponseJSON, expectedChallenge: challenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true });
  if (!verification.verified || !verification.registrationInfo) return { ok: false as const, code: "INVALID_PASSKEY" as const };
  const credential = verification.registrationInfo.credential;
  const db = await getDb();
  if (!db) throw new Error("Account service unavailable");
  await db.insert(accountPasskeys).values({ userId: user.id, credentialId: credential.id, publicKey: Buffer.from(credential.publicKey).toString("base64"), counter: credential.counter, transports: credential.transports ? JSON.stringify(credential.transports) : null });
  return { ok: true as const };
}

export async function listAccountPasskeys(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Account service unavailable");
  const rows = await db.select({ id: accountPasskeys.id, credentialId: accountPasskeys.credentialId, createdAt: accountPasskeys.createdAt, lastUsedAt: accountPasskeys.lastUsedAt }).from(accountPasskeys).where(eq(accountPasskeys.userId, userId));
  return rows.map((row) => ({ id: row.id, label: `Device ending ${row.credentialId.slice(-6)}`, createdAt: row.createdAt, lastUsedAt: row.lastUsedAt }));
}

export async function removeAccountPasskey(userId: number, passkeyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Account service unavailable");
  await db.delete(accountPasskeys).where(and(eq(accountPasskeys.id, passkeyId), eq(accountPasskeys.userId, userId)));
  return { ok: true as const };
}

export async function beginPasskeyAuthentication(emailInput: string, req: Request) {
  const db = await getDb();
  if (!db) throw new Error("Account service unavailable");
  const email = normalizeEmail(emailInput);
  const rows = await db.select({ credential: accountPasskeys }).from(emailCredentials).innerJoin(accountPasskeys, eq(accountPasskeys.userId, emailCredentials.userId)).where(eq(emailCredentials.email, email));
  if (!hasPasskeyOption(rows.length)) return { ok: false as const, code: "NO_PASSKEY" as const };
  const { rpID } = relyingParty(req);
  const options = await generateAuthenticationOptions({ rpID, userVerification: "required", allowCredentials: rows.map(row => ({ id: row.credential.credentialId, transports: row.credential.transports ? JSON.parse(row.credential.transports) : undefined })) });
  await storeChallenge(email, "authenticate", options.challenge);
  return { ok: true as const, options };
}

export async function finishPasskeyAuthentication(emailInput: string, response: { id: string }, req: Request, res: Response) {
  const db = await getDb();
  if (!db) throw new Error("Account service unavailable");
  const email = normalizeEmail(emailInput);
  const challenge = await consumeChallenge(email, "authenticate");
  if (!challenge) return { ok: false as const, code: "EXPIRED_CHALLENGE" as const };
  const rows = await db.select({ passkey: accountPasskeys, user: users }).from(emailCredentials).innerJoin(users, eq(emailCredentials.userId, users.id)).innerJoin(accountPasskeys, eq(accountPasskeys.userId, users.id)).where(and(eq(emailCredentials.email, email), eq(accountPasskeys.credentialId, response.id))).limit(1);
  const record = rows[0];
  if (!record) return { ok: false as const, code: "INVALID_PASSKEY" as const };
  const { origin, rpID } = relyingParty(req);
  const verification = await verifyAuthenticationResponse({ response: response as AuthenticationResponseJSON, expectedChallenge: challenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true, credential: { id: record.passkey.credentialId, publicKey: Buffer.from(record.passkey.publicKey, "base64"), counter: record.passkey.counter, transports: record.passkey.transports ? JSON.parse(record.passkey.transports) : undefined } });
  if (!verification.verified) return { ok: false as const, code: "INVALID_PASSKEY" as const };
  await db.update(accountPasskeys).set({ counter: verification.authenticationInfo.newCounter, lastUsedAt: new Date() }).where(eq(accountPasskeys.id, record.passkey.id));
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, record.user.id));
  await setLocalSession(record.user.id, req, res);
  return { ok: true as const, user: record.user };
}
