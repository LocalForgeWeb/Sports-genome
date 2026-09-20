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

export const loadSyncQueue = (): QueuedLift[] => readJson<QueuedLift[]>(strengthSyncQueueKey, []).filter((item) => item?.key);
export const loadSyncedKeys = (): string[] => readJson<string[]>(strengthSyncedKey, []);

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
 * exercise has no Supabase uuid is dropped from the queue rather than retried
 * forever — `exercise_id` is a foreign key, and no amount of retrying will
 * invent a row in `public.exercises`.
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
  for (const item of queue) {
    const row = toAthleteStrengthEntry(item.lift, item.athlete, resolveExerciseUuid(item.lift.catalogExerciseId));
    if (row) rows.push({ key: item.key, payload: forInsert(row) });
    else unmappable.push(item.key);
  }

  if (!rows.length) {
    saveSyncQueue([]);
    return { sent: 0, remaining: 0, skipped: unmappable.length };
  }

  try {
    const { error } = await supabase.from("athlete_strength_entries").insert(rows.map((row) => row.payload));
    if (error) return { sent: 0, remaining: queue.length, skipped: 0, reason: "rejected" };
  } catch {
    return { sent: 0, remaining: queue.length, skipped: 0, reason: "offline" };
  }

  const landed = new Set(rows.map((row) => row.key));
  const alreadySent = loadSyncedKeys().concat(rows.map((row) => row.key), unmappable);
  writeJson(strengthSyncedKey, Array.from(new Set(alreadySent)).slice(-5000));
  saveSyncQueue(queue.filter((item) => !landed.has(item.key) && !unmappable.includes(item.key)));
  return { sent: rows.length, remaining: 0, skipped: unmappable.length };
}
