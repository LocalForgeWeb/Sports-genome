import { getSupabaseClient } from "@/lib/supabaseClient";
import { forInsert, toAthleteStrengthEntry, type AthleteSnapshot, type RecordedLift } from "@/lib/athleteStrengthEntry";

/**
 * The outbox between a logged lift and `public.athlete_strength_entries`.
 *
 * A gym is the worst network environment the app will ever run in, so nothing
 * here is allowed to make logging depend on connectivity. A finished workout is
 * queued on the device immediately and flushed whenever a session and a network
 * happen to exist. The queue is the durable part; the upload is best-effort.
 *
 * Deduplication is by the observation's own stable id — `workout-<session>-<exercise>`
 * — held in a local set of what has already landed. That is deliberately not a
 * database constraint: adding a unique column to a table someone else is
 * actively building would be the wrong kind of help. The cost is that clearing
 * site data mid-flight could re-send a row; the alternative was either blocking
 * on a schema change or silently dropping lifts.
 */
export type QueuedLift = {
  /** The observation id this came from, stable across re-derivations. */
  key: string;
  lift: RecordedLift;
  athlete: AthleteSnapshot;
  queuedAt: string;
};

export const strengthSyncQueueKey = "sports-genome-strength-sync-queue-v1";
export const strengthSyncedKey = "sports-genome-strength-synced-v1";
export const strengthSyncEvent = "sports-genome:strength-sync";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "null");
    return parsed == null ? fallback : parsed as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

// Both loaders check the shape the way the body-weight and workout logs do: a stored
// object or number would otherwise throw on every launch, and nothing rewrites it.
// A queued entry needs its lift and the athlete it was read against: a flush reads
// both, and one that throws stops every other lift in the queue from being sent.
export function loadSyncQueue(): QueuedLift[] {
  const parsed = readJson<unknown>(strengthSyncQueueKey, []);
  return Array.isArray(parsed)
    ? parsed.filter((item): item is QueuedLift =>
      isObject(item) && typeof item.key === "string" && item.key.length > 0 && isObject(item.lift) && isObject(item.athlete))
    : [];
}

export function loadSyncedKeys(): string[] {
  const parsed = readJson<unknown>(strengthSyncedKey, []);
  return Array.isArray(parsed) ? parsed.filter((key): key is string => typeof key === "string") : [];
}

/**
 * Adds lifts that are neither queued nor already sent. Pure, so the decision of
 * what is new can be tested without a browser or a database.
 */
export function enqueueLifts(
  queue: readonly QueuedLift[],
  syncedKeys: readonly string[],
  candidates: readonly QueuedLift[],
): QueuedLift[] {
  const known = new Set([...syncedKeys, ...queue.map((item) => item.key)]);
  return [...queue, ...candidates.filter((item) => item.key && !known.has(item.key))];
}

export function saveSyncQueue(queue: readonly QueuedLift[]): boolean {
  const ok = writeJson(strengthSyncQueueKey, queue);
  if (ok && typeof window !== "undefined") window.dispatchEvent(new Event(strengthSyncEvent));
  return ok;
}

export type FlushResult = { sent: number; remaining: number; skipped: number; reason?: "no_session" | "not_configured" | "offline" | "rejected" };

/**
 * Sends what is queued, one row per lift, and keeps anything that did not land.
 *
 * `resolveExerciseUuid` is injected rather than fetched here so the caller owns
 * the mapping cache, and so this can be tested against a known map. A lift whose
 * exercise has no Supabase uuid yet stays queued and is not marked sent: the
 * mapping is read from the database, and while that read failed (SB-06) every
 * lift was dropped as unmappable and lost. It is sent once its mapping resolves.
 */
export async function flushSyncQueue(
  userId: string | null,
  resolveExerciseUuid: (catalogExerciseId: number) => string | undefined,
): Promise<FlushResult> {
  const queue = loadSyncQueue();
  if (!queue.length) return { sent: 0, remaining: 0, skipped: 0 };

  const supabase = getSupabaseClient();
  if (!supabase) return { sent: 0, remaining: queue.length, skipped: 0, reason: "not_configured" };
  if (!userId) return { sent: 0, remaining: queue.length, skipped: 0, reason: "no_session" };

  const rows: { key: string; payload: Record<string, unknown> }[] = [];
  const unmappable: string[] = [];
  const unsendable: string[] = [];
  for (const item of queue) {
    const exerciseUuid = resolveExerciseUuid(item.lift.catalogExerciseId);
    // A lift whose exercise cannot be mapped yet waits for the mapping. It used to be dropped
    // and marked synced forever, so every lift was lost while the mapping read failed (SB-06,
    // PS-18). A lift that can never form a row (no date, no reps and no load) still leaves.
    if (!exerciseUuid) { unmappable.push(item.key); continue; }
    const row = toAthleteStrengthEntry(item.lift, item.athlete, exerciseUuid);
    if (row) rows.push({ key: item.key, payload: forInsert(row) });
    else unsendable.push(item.key);
  }

  if (!rows.length) {
    if (unsendable.length) saveSyncQueue(queue.filter((item) => !unsendable.includes(item.key)));
    return { sent: 0, remaining: queue.length - unsendable.length, skipped: unmappable.length + unsendable.length };
  }

  try {
    const { error } = await supabase.from("athlete_strength_entries").insert(rows.map((row) => row.payload));
    if (error) return { sent: 0, remaining: queue.length, skipped: 0, reason: "rejected" };
  } catch {
    return { sent: 0, remaining: queue.length, skipped: 0, reason: "offline" };
  }

  const landed = new Set(rows.map((row) => row.key));
  const alreadySent = loadSyncedKeys().concat(rows.map((row) => row.key), unsendable);
  writeJson(strengthSyncedKey, Array.from(new Set(alreadySent)).slice(-5000));
  const remaining = queue.filter((item) => !landed.has(item.key) && !unsendable.includes(item.key));
  saveSyncQueue(remaining);
  return { sent: rows.length, remaining: remaining.length, skipped: unmappable.length + unsendable.length };
}
