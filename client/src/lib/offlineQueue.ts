import { readJson, writeJson } from "./persistentStore";

/**
 * Durable outbox for workout writes made without a usable connection.
 *
 * A gym is exactly where signal dies, so a set logged in a basement squat rack
 * has to survive both the failed request and an app relaunch. Entries are
 * persisted, replayed in FIFO order when connectivity returns, and are safe to
 * replay because `upsertWorkoutSet` is keyed on the unique
 * `(sessionExerciseId, setNumber)` index — re-sending a set overwrites rather
 * than duplicating it.
 *
 * FIFO is load-bearing, not cosmetic: the server rejects set logs against a
 * session that is no longer `active`, so a queued `complete` must never be
 * replayed before the sets that precede it.
 */
const QUEUE_KEY = "workout-outbox";

export type WeightUnit = "lb" | "kg";

export type LogSetPayload = {
  sessionExerciseId: number;
  setNumber: number;
  actualWeight?: number;
  weightUnit: WeightUnit;
  actualReps?: number;
  completed: boolean;
  setNotes?: string;
};

export type CompletePayload = {
  sessionId: number;
  sessionNotes?: string;
};

export type QueuedWrite =
  | {
      id: string;
      kind: "logSet";
      sessionId: number;
      queuedAt: number;
      payload: LogSetPayload;
    }
  | {
      id: string;
      kind: "complete";
      sessionId: number;
      queuedAt: number;
      payload: CompletePayload;
    };

/**
 * How a replay attempt ended.
 * - `ok`    — accepted; drop the entry.
 * - `retry` — the request never reached the server; stop and keep everything.
 * - `drop`  — the server answered and rejected it; retrying cannot help.
 */
export type SendResult = "ok" | "retry" | "drop";

/**
 * Fold an entry into the queue, collapsing writes that supersede each other.
 *
 * Pure, so the ordering and collapsing rules can be tested directly.
 *
 * Toggling a set on and off while offline must not grow the queue without
 * bound, and only the final value matters. A superseding entry keeps the
 * original's POSITION — moving it to the tail could reorder it past a
 * `complete` and get it rejected on replay.
 */
export function mergeIntoQueue(
  queue: QueuedWrite[],
  entry: QueuedWrite
): QueuedWrite[] {
  const supersedes = (existing: QueuedWrite): boolean => {
    if (existing.kind !== entry.kind) return false;
    if (existing.kind === "logSet" && entry.kind === "logSet") {
      return (
        existing.payload.sessionExerciseId ===
          entry.payload.sessionExerciseId &&
        existing.payload.setNumber === entry.payload.setNumber
      );
    }
    return existing.sessionId === entry.sessionId;
  };

  const index = queue.findIndex(supersedes);
  if (index === -1) return [...queue, entry];

  const next = [...queue];
  next[index] = {
    ...entry,
    id: queue[index].id,
    queuedAt: queue[index].queuedAt,
  };
  return next;
}

// In-memory mirror of the persisted queue, so the UI can read the pending count
// synchronously while renders stay cheap.
let queue: QueuedWrite[] = [];
let loaded = false;
let flushing = false;

export async function loadQueue(): Promise<QueuedWrite[]> {
  if (loaded) return queue;
  queue = (await readJson<QueuedWrite[]>(QUEUE_KEY)) ?? [];
  loaded = true;
  return queue;
}

export function queueSnapshot(): QueuedWrite[] {
  return queue;
}

export async function enqueue(entry: QueuedWrite): Promise<QueuedWrite[]> {
  await loadQueue();
  queue = mergeIntoQueue(queue, entry);
  await writeJson(QUEUE_KEY, queue);
  return queue;
}

/**
 * Replay queued writes in order.
 *
 * Stops at the first `retry`, leaving that entry and everything after it in
 * place — the connection is presumably still down, and draining out of order
 * would break the sets-before-complete guarantee.
 */
export async function flushQueue(
  send: (entry: QueuedWrite) => Promise<SendResult>
): Promise<{ sent: number; dropped: number; remaining: number }> {
  // A connectivity event and a manual retry can land together; a second
  // concurrent drain would replay entries the first one is still working on.
  if (flushing) return { sent: 0, dropped: 0, remaining: queue.length };
  flushing = true;

  try {
    await loadQueue();
    let sent = 0;
    let dropped = 0;

    while (queue.length > 0) {
      const entry = queue[0];
      let result: SendResult;
      try {
        result = await send(entry);
      } catch {
        // A throwing sender is treated as a transport failure: keep the entry.
        result = "retry";
      }

      if (result === "retry") break;

      if (result === "drop") {
        console.warn(
          "[offlineQueue] Dropping a write the server rejected",
          entry.kind,
          entry.id
        );
        dropped += 1;
      } else {
        sent += 1;
      }

      queue = queue.slice(1);
      await writeJson(QUEUE_KEY, queue);
    }

    return { sent, dropped, remaining: queue.length };
  } finally {
    flushing = false;
  }
}

/** Test seam: reset the module's in-memory state. */
export function resetQueueForTests(): void {
  queue = [];
  loaded = false;
  flushing = false;
}
