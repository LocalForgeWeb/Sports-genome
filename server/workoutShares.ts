import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { supabaseServiceHeaders } from "./supabaseServiceHeaders";
import { parseShareSnapshot, shareExerciseCount, type ShareSnapshot } from "../shared/workoutShare";
import { upstreamFetch } from "./_core/http";

/**
 * Shared workouts, stored as snapshots.
 *
 * A share is a copy of a workout taken when the sender creates the link: it is stored
 * apart from their plan, so nothing they do to the plan later reaches a recipient,
 * and a recipient who saves it keeps their own copy. The link is a random token with
 * 128 bits of entropy - never a row id - and the public read returns only the
 * snapshot the sender approved.
 *
 * Who may manage a share. Accounts are not available in every deployment, so a share
 * is managed by whoever holds the secret the creating device generated and kept: the
 * server stores only its SHA-256, compares in constant time, and never returns it.
 * Losing the device's storage loses the ability to disable the link; it does not
 * expose it to anyone else.
 *
 * A new version is a new share that names the one it replaces. The old link keeps
 * the version its recipients were sent, and says that a newer one exists.
 *
 * Retries are deliberate: the client sends a request key with every create, and a
 * second create with the same key (a double tap, a timeout and retry) returns the
 * share the first one made instead of making another.
 */
export type ShareRow = {
  token: string;
  manage_hash: string;
  request_key: string;
  schema_version: number;
  scope: "day" | "week";
  title: string;
  payload: ShareSnapshot;
  exercise_count: number;
  day_count: number;
  version: number;
  supersedes_token: string | null;
  status: "active" | "disabled";
  created_at: string;
  disabled_at: string | null;
};

export interface ShareStore {
  insert(row: ShareRow): Promise<"ok" | "duplicate-request">;
  byToken(token: string): Promise<ShareRow | null>;
  byRequestKey(requestKey: string): Promise<ShareRow | null>;
  /** The newest active share that names this one as the version it replaces. */
  successorOf(token: string): Promise<string | null>;
  disable(token: string, at: string): Promise<void>;
}

export const tokenPattern = /^[A-Za-z0-9_-]{20,64}$/;
export const newShareToken = () => randomBytes(16).toString("base64url");
export const hashSecret = (secret: string) => createHash("sha256").update(secret, "utf8").digest("hex");

export function secretMatches(secret: string, hash: string): boolean {
  const given = Buffer.from(hashSecret(secret), "hex");
  const stored = Buffer.from(hash, "hex");
  return given.length === stored.length && timingSafeEqual(given, stored);
}

export class ShareError extends Error {
  constructor(public readonly code: "unavailable" | "invalid" | "forbidden" | "not-found" | "too-large", message: string) { super(message); }
}

/** In memory, for local development and tests. Never used where a real store is configured. */
export class MemoryShareStore implements ShareStore {
  rows = new Map<string, ShareRow>();
  async insert(row: ShareRow) {
    if (Array.from(this.rows.values()).some((existing) => existing.request_key === row.request_key)) return "duplicate-request" as const;
    this.rows.set(row.token, structuredClone(row));
    return "ok" as const;
  }
  async byToken(token: string) { const row = this.rows.get(token); return row ? structuredClone(row) : null; }
  async byRequestKey(requestKey: string) { const row = Array.from(this.rows.values()).find((existing) => existing.request_key === requestKey); return row ? structuredClone(row) : null; }
  async successorOf(token: string) {
    const next = Array.from(this.rows.values()).filter((row) => row.supersedes_token === token && row.status === "active").sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    return next?.token ?? null;
  }
  async disable(token: string, at: string) { const row = this.rows.get(token); if (row) { row.status = "disabled"; row.disabled_at = at; } }
}

/** Supabase, through PostgREST with the server-only key; the table admits no other role. */
export class SupabaseShareStore implements ShareStore {
  constructor(private readonly url: string, private readonly key: string, private readonly fetcher: typeof fetch = upstreamFetch) {}
  private endpoint(query = "") { return `${this.url.replace(/\/$/, "")}/rest/v1/workout_shares${query}`; }
  private headers(extra: Record<string, string> = {}) { return supabaseServiceHeaders(this.key, { "Content-Type": "application/json", ...extra }); }
  private async read(query: string): Promise<ShareRow[]> {
    const response = await this.fetcher(this.endpoint(query), { headers: this.headers() });
    if (!response.ok) throw new ShareError("unavailable", `Share store read failed (${response.status})`);
    return (await response.json()) as ShareRow[];
  }
  async insert(row: ShareRow) {
    const response = await this.fetcher(this.endpoint(), { method: "POST", headers: this.headers({ Prefer: "return=minimal" }), body: JSON.stringify(row) });
    if (response.status === 409) return "duplicate-request" as const;
    if (!response.ok) throw new ShareError("unavailable", `Share store write failed (${response.status})`);
    return "ok" as const;
  }
  async byToken(token: string) { return (await this.read(`?token=eq.${encodeURIComponent(token)}&limit=1`))[0] ?? null; }
  async byRequestKey(requestKey: string) { return (await this.read(`?request_key=eq.${encodeURIComponent(requestKey)}&limit=1`))[0] ?? null; }
  async successorOf(token: string) {
    const rows = await this.read(`?supersedes_token=eq.${encodeURIComponent(token)}&status=eq.active&select=token&order=created_at.desc&limit=1`);
    return rows[0]?.token ?? null;
  }
  async disable(token: string, at: string) {
    const response = await this.fetcher(this.endpoint(`?token=eq.${encodeURIComponent(token)}`), { method: "PATCH", headers: this.headers({ Prefer: "return=minimal" }), body: JSON.stringify({ status: "disabled", disabled_at: at }) });
    if (!response.ok) throw new ShareError("unavailable", `Share store update failed (${response.status})`);
  }
}

let configured: ShareStore | null | undefined;
const memory = new MemoryShareStore();

/**
 * The store this deployment uses: Supabase when its URL and server key are set;
 * in memory outside production (local development, tests); otherwise none, and
 * sharing says it is unavailable rather than pretending to work.
 */
export function shareStore(): ShareStore | null {
  if (configured !== undefined) return configured;
  const url = process.env.VITE_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (url && key && process.env.SHARE_STORE !== "memory") return (configured = new SupabaseShareStore(url, key));
  if (process.env.NODE_ENV !== "production" || process.env.SHARE_STORE === "memory") return (configured = memory);
  return (configured = null);
}

/** For tests: use this store until reset. */
export function useShareStore(store: ShareStore | null | undefined) { configured = store; }

const requireStore = () => {
  const store = shareStore();
  if (!store) throw new ShareError("unavailable", "Sharing by link is not available on this server.");
  return store;
};

export type CreateShareInput = { requestKey: string; manageSecret: string; snapshot: unknown; supersedes?: { token: string; manageSecret: string } };

export async function createShare(input: CreateShareInput, now = new Date()): Promise<{ token: string; version: number; createdAt: string; reused: boolean }> {
  const store = requireStore();
  const parsed = parseShareSnapshot(input.snapshot);
  if (!parsed.ok) throw new ShareError(parsed.reason === "too-large" ? "too-large" : "invalid", `This workout can't be shared: ${parsed.reason}`);
  // The same request again: the share it already made, and only to the device holding its secret.
  const existing = await store.byRequestKey(input.requestKey);
  if (existing) {
    if (!secretMatches(input.manageSecret, existing.manage_hash)) throw new ShareError("forbidden", "That request key belongs to another share.");
    return { token: existing.token, version: existing.version, createdAt: existing.created_at, reused: true };
  }
  let version = 1;
  let supersedes: string | null = null;
  if (input.supersedes) {
    const previous = await store.byToken(input.supersedes.token);
    if (!previous || !secretMatches(input.supersedes.manageSecret, previous.manage_hash)) throw new ShareError("forbidden", "Only the device that created a share can publish a new version of it.");
    version = previous.version + 1;
    supersedes = previous.token;
  }
  const row: ShareRow = {
    token: newShareToken(),
    manage_hash: hashSecret(input.manageSecret),
    request_key: input.requestKey,
    schema_version: parsed.snapshot.schema,
    scope: parsed.snapshot.scope,
    title: parsed.snapshot.title,
    payload: parsed.snapshot,
    exercise_count: shareExerciseCount(parsed.snapshot),
    day_count: parsed.snapshot.days.length,
    version,
    supersedes_token: supersedes,
    status: "active",
    created_at: now.toISOString(),
    disabled_at: null,
  };
  if ((await store.insert(row)) === "duplicate-request") {
    // Two copies of one request raced: both answer with the one that was stored.
    const winner = await store.byRequestKey(input.requestKey);
    if (!winner || !secretMatches(input.manageSecret, winner.manage_hash)) throw new ShareError("forbidden", "That request key belongs to another share.");
    return { token: winner.token, version: winner.version, createdAt: winner.created_at, reused: true };
  }
  return { token: row.token, version, createdAt: row.created_at, reused: false };
}

/** What anyone with the link may read: the approved snapshot, or why there is none. Never the hash or request key. */
export type PublicShare =
  | { state: "active"; token: string; snapshot: ShareSnapshot; createdAt: string; version: number; newerToken: string | null }
  | { state: "disabled" }
  | { state: "missing" };

export async function readShare(token: string): Promise<PublicShare> {
  if (!tokenPattern.test(token)) return { state: "missing" };
  const store = requireStore();
  const row = await store.byToken(token);
  if (!row) return { state: "missing" };
  if (row.status !== "active") return { state: "disabled" };
  // Re-validated on the way out: what is shown is what the current schema accepts.
  const parsed = parseShareSnapshot(row.payload);
  if (!parsed.ok) return { state: "missing" };
  return { state: "active", token: row.token, snapshot: parsed.snapshot, createdAt: row.created_at, version: row.version, newerToken: await store.successorOf(row.token) };
}

export async function disableShare(token: string, manageSecret: string, now = new Date()): Promise<{ state: "disabled" }> {
  const store = requireStore();
  const row = tokenPattern.test(token) ? await store.byToken(token) : null;
  if (!row) throw new ShareError("not-found", "No such share.");
  if (!secretMatches(manageSecret, row.manage_hash)) throw new ShareError("forbidden", "Only the device that created this share can turn it off.");
  if (row.status !== "disabled") await store.disable(token, now.toISOString());
  return { state: "disabled" };
}

export type OwnedShare = { token: string; state: "active" | "disabled" | "missing" | "forbidden"; title?: string; scope?: "day" | "week"; version?: number; createdAt?: string; exerciseCount?: number; dayCount?: number; newerToken?: string | null };

/** The status of the shares this device holds secrets for; a wrong secret learns nothing. */
export async function ownedShares(items: { token: string; manageSecret: string }[]): Promise<OwnedShare[]> {
  const store = requireStore();
  return Promise.all(items.map(async ({ token, manageSecret }): Promise<OwnedShare> => {
    const row = tokenPattern.test(token) ? await store.byToken(token) : null;
    if (!row) return { token, state: "missing" };
    if (!secretMatches(manageSecret, row.manage_hash)) return { token, state: "forbidden" };
    return { token, state: row.status, title: row.title, scope: row.scope, version: row.version, createdAt: row.created_at, exerciseCount: row.exercise_count, dayCount: row.day_count, newerToken: await store.successorOf(row.token) };
  }));
}
