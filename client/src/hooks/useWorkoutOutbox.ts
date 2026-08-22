import { trpc } from "@/lib/trpc";
import { isOnline, onConnectivityRestored } from "@/lib/connectivity";
import {
  enqueue,
  flushQueue,
  loadQueue,
  queueSnapshot,
  type CompletePayload,
  type LogSetPayload,
  type QueuedWrite,
  type SendResult,
} from "@/lib/offlineQueue";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useState } from "react";

/**
 * Decide whether a failed replay is worth retrying.
 *
 * A `TRPCClientError` carrying an HTTP status means the server received the
 * write and refused it — a stale set against a finished session, a validation
 * failure — and replaying it forever would wedge the queue behind an entry that
 * can never succeed. Anything else (a transport error, a 5xx, an expired
 * session that a re-login will fix) stays queued.
 */
export function classifyFailure(error: unknown): SendResult {
  if (!(error instanceof TRPCClientError)) return "retry";

  const status = (error.data as { httpStatus?: number } | null)?.httpStatus;
  if (typeof status !== "number") return "retry";

  // 401 is recoverable: the user logs back in and the write goes through.
  // 408/429 are explicit "try again" responses.
  if (status === 401 || status === 408 || status === 429) return "retry";

  return status >= 400 && status < 500 ? "drop" : "retry";
}

/**
 * The pending-write outbox, wired to the API.
 *
 * Writes made without a connection are queued and replayed when one returns.
 * The caller is responsible for updating the UI optimistically — see
 * `applyLocalSetLog` — since the whole point is that the interface does not
 * wait for the network.
 */
export function useWorkoutOutbox(onSynced?: () => void) {
  const utils = trpc.useUtils();
  const [pending, setPending] = useState(0);

  const flush = useCallback(async () => {
    const send = async (entry: QueuedWrite): Promise<SendResult> => {
      try {
        if (entry.kind === "logSet") {
          await utils.client.workoutLog.logSet.mutate(entry.payload);
        } else {
          await utils.client.workoutLog.complete.mutate(entry.payload);
        }
        return "ok";
      } catch (error) {
        return classifyFailure(error);
      }
    };

    const result = await flushQueue(send);
    setPending(queueSnapshot().length);

    // Only refetch if something actually moved, so a no-op flush on a dead
    // connection does not spin the UI.
    if (result.sent > 0 || result.dropped > 0) onSynced?.();
  }, [utils, onSynced]);

  useEffect(() => {
    let cancelled = false;

    // Anything queued before the app was last closed is replayed on startup.
    void loadQueue().then(restored => {
      if (cancelled) return;
      setPending(restored.length);
      if (restored.length > 0 && isOnline()) void flush();
    });

    const unsubscribe = onConnectivityRestored(() => {
      void flush();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [flush]);

  const queueSetLog = useCallback(
    async (sessionId: number, payload: LogSetPayload) => {
      const next = await enqueue({
        id: `set-${payload.sessionExerciseId}-${payload.setNumber}`,
        kind: "logSet",
        sessionId,
        queuedAt: Date.now(),
        payload,
      });
      setPending(next.length);
    },
    []
  );

  const queueComplete = useCallback(async (payload: CompletePayload) => {
    const next = await enqueue({
      id: `complete-${payload.sessionId}`,
      kind: "complete",
      sessionId: payload.sessionId,
      queuedAt: Date.now(),
      payload,
    });
    setPending(next.length);
  }, []);

  return { pending, queueSetLog, queueComplete, flush };
}
