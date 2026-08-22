import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import type { LogSetPayload } from "./offlineQueue";
import { readJson, writeJson } from "./persistentStore";

type RouterOutput = inferRouterOutputs<AppRouter>;
export type WorkoutSession = NonNullable<RouterOutput["workoutLog"]["get"]>;
type SetLog = WorkoutSession["exercises"][number]["setLogs"][number];

/**
 * Placeholder row id for a set logged before the server has seen it. The real
 * row replaces it on the next successful fetch; nothing in the UI keys off the
 * id, which is why a constant is safe here.
 */
export const OPTIMISTIC_SET_LOG_ID = -1;

const SESSION_CACHE_KEY = "workout-active-session";

/**
 * Apply a set log to a session snapshot locally.
 *
 * The UI must turn a set green the moment it is tapped, whether or not the
 * write reached the server — waiting for a round trip that may never complete
 * would make the app unusable in the exact place it is used.
 *
 * Pure, and the same shape the server returns, so the result can be written
 * straight into the react-query cache and later replaced by the real response
 * with no visible change.
 */
export function applyLocalSetLog(
  session: WorkoutSession,
  input: LogSetPayload
): WorkoutSession {
  return {
    ...session,
    exercises: session.exercises.map(exercise => {
      if (exercise.id !== input.sessionExerciseId) return exercise;

      const existing = exercise.setLogs.find(
        log => log.setNumber === input.setNumber
      );
      const now = new Date();

      const updated: SetLog = {
        // Preserve the server's row when there is one, so a re-log of an
        // already-synced set keeps its identity and timestamps.
        id: existing?.id ?? OPTIMISTIC_SET_LOG_ID,
        sessionExerciseId: input.sessionExerciseId,
        setNumber: input.setNumber,
        // `decimal` columns come back as strings; match that or the input field
        // re-renders with a different value than the one just typed.
        actualWeight:
          input.actualWeight === undefined
            ? null
            : input.actualWeight.toFixed(2),
        weightUnit: input.weightUnit,
        actualReps: input.actualReps ?? null,
        completed: input.completed,
        setNotes: input.setNotes ?? null,
        loggedAt: existing?.loggedAt ?? now,
        updatedAt: now,
      };

      const setLogs = existing
        ? exercise.setLogs.map(log =>
            log.setNumber === input.setNumber ? updated : log
          )
        : [...exercise.setLogs, updated].sort(
            (a, b) => a.setNumber - b.setNumber
          );

      return { ...exercise, setLogs };
    }),
  };
}

/** Mark a session complete locally, matching what the server would return. */
export function applyLocalComplete(
  session: WorkoutSession,
  sessionNotes?: string
): WorkoutSession {
  return {
    ...session,
    status: "completed",
    completedAt: new Date(),
    sessionNotes: sessionNotes ?? session.sessionNotes,
  };
}

/**
 * Persist the active session so the workout still renders after the app is
 * relaunched with no connection — the case where a phone is backgrounded
 * mid-workout and iOS reclaims it.
 */
export async function cacheActiveSession(
  session: WorkoutSession | null
): Promise<void> {
  await writeJson(SESSION_CACHE_KEY, session);
}

/**
 * Read the cached session. Pass `sessionId` to require a specific one; omit it
 * to recover whatever workout was in progress — the app relaunch case, where
 * the in-memory session id is gone and the history endpoint is unreachable.
 */
export async function readCachedSession(
  sessionId?: number
): Promise<WorkoutSession | null> {
  const cached = await readJson<WorkoutSession>(SESSION_CACHE_KEY);
  if (!cached) return null;
  if (sessionId !== undefined && cached.id !== sessionId) return null;

  // JSON has no Date type; the UI and the local-apply helpers above expect real
  // Dates, so revive the ones that round-tripped as strings.
  return {
    ...cached,
    startedAt: new Date(cached.startedAt),
    completedAt: cached.completedAt ? new Date(cached.completedAt) : null,
    exercises: cached.exercises.map(exercise => ({
      ...exercise,
      setLogs: exercise.setLogs.map(log => ({
        ...log,
        loggedAt: new Date(log.loggedAt),
        updatedAt: new Date(log.updatedAt),
      })),
    })),
  };
}
