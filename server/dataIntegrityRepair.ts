/**
 * Correcting and removing an athlete's own records.
 *
 * `removePasskey` was the only destructive operation in the whole API. An athlete
 * who logged 225 instead of 22.5, or recorded a set against the wrong exercise,
 * had no way to fix it and no way to remove it - the number stayed in their
 * history and in everything computed from it. The philosophy DB ranks
 * `data_integrity_repair` at priority 95 for exactly this reason: a record you
 * cannot correct is worse than no record, because the athlete stops trusting the
 * rest of the history too.
 *
 * Two rules shape everything here:
 *
 *   Ownership is checked in the database, never taken from the request. Every
 *   operation joins back to the owning user and refuses anything that is not the
 *   caller's own row.
 *
 *   Editing a finished session is allowed, and deliberate. `upsertWorkoutSet`
 *   only touches an active session, which is the opposite of what correction
 *   needs - you notice the typo after you have finished. Corrections are a
 *   separate, explicitly-named operation rather than a loosened guard on the
 *   logging path, so a normal log can never silently rewrite history.
 */

import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  strengthObservations,
  workoutSessionExercises,
  workoutSessions,
  workoutSetLogs,
} from "../drizzle/schema";

/** What the database says about the row a caller wants to change. */
export type RecordOwner = { userId: number } | null;

export type RepairDecision =
  | { action: "apply" }
  | { action: "refuse"; reason: "not-found" | "not-owned" };

/**
 * The authorization decision, as a pure function.
 *
 * A missing row and someone else's row are deliberately distinguishable here but
 * NOT to the caller: the router collapses both into one response so this never
 * becomes a way to probe which record ids exist.
 */
export function resolveRepair(owner: RecordOwner, requesterId: number): RepairDecision {
  if (!owner) return { action: "refuse", reason: "not-found" };
  if (owner.userId !== requesterId) return { action: "refuse", reason: "not-owned" };
  return { action: "apply" };
}

export type RepairOutcome =
  | { status: "applied" }
  | { status: "refused"; reason: "not-found" | "not-owned" }
  | { status: "unavailable" };

/** A set correction. Every field is optional; only what is passed is changed. */
export type SetCorrection = {
  actualWeight?: number | null;
  weightUnit?: "lb" | "kg";
  actualReps?: number | null;
  actualRpe?: number | null;
  completed?: boolean;
  setNotes?: string | null;
};

async function findSetOwner(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  sessionExerciseId: number
): Promise<RecordOwner> {
  const rows = await db
    .select({ userId: workoutSessions.userId })
    .from(workoutSessionExercises)
    .innerJoin(workoutSessions, eq(workoutSessionExercises.sessionId, workoutSessions.id))
    .where(eq(workoutSessionExercises.id, sessionExerciseId))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Removes one logged set.
 *
 * Deliberately not a soft delete. An athlete asking to remove a mistyped set
 * means "this never happened"; leaving a hidden row that still feeds estimates
 * would be the same defect wearing a flag.
 */
export async function deleteWorkoutSet(
  userId: number,
  input: { sessionExerciseId: number; setNumber: number }
): Promise<RepairOutcome> {
  const db = await getDb();
  if (!db) return { status: "unavailable" };

  const decision = resolveRepair(await findSetOwner(db, input.sessionExerciseId), userId);
  if (decision.action === "refuse") return { status: "refused", reason: decision.reason };

  await db
    .delete(workoutSetLogs)
    .where(
      and(
        eq(workoutSetLogs.sessionExerciseId, input.sessionExerciseId),
        eq(workoutSetLogs.setNumber, input.setNumber)
      )
    );
  return { status: "applied" };
}

/** Corrects a logged set, including one in a session already finished. */
export async function correctWorkoutSet(
  userId: number,
  input: { sessionExerciseId: number; setNumber: number; correction: SetCorrection }
): Promise<RepairOutcome> {
  const db = await getDb();
  if (!db) return { status: "unavailable" };

  const decision = resolveRepair(await findSetOwner(db, input.sessionExerciseId), userId);
  if (decision.action === "refuse") return { status: "refused", reason: decision.reason };

  const patch = buildSetPatch(input.correction);
  // Nothing to change is a no-op, not an error: the caller submitted a form
  // without touching anything.
  if (Object.keys(patch).length === 0) return { status: "applied" };

  await db
    .update(workoutSetLogs)
    .set({ ...patch, updatedAt: new Date() })
    .where(
      and(
        eq(workoutSetLogs.sessionExerciseId, input.sessionExerciseId),
        eq(workoutSetLogs.setNumber, input.setNumber)
      )
    );
  return { status: "applied" };
}

/**
 * Only the fields the caller actually sent.
 *
 * `undefined` means "leave it alone" and `null` means "clear it" - collapsing the
 * two would let a form that omits RPE wipe an RPE the athlete recorded earlier.
 * The decimal columns are written as fixed-precision strings, matching how the
 * logging path stores them.
 */
export function buildSetPatch(correction: SetCorrection): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (correction.actualWeight !== undefined) {
    patch.actualWeight = correction.actualWeight === null ? null : correction.actualWeight.toFixed(2);
  }
  if (correction.weightUnit !== undefined) patch.weightUnit = correction.weightUnit;
  if (correction.actualReps !== undefined) patch.actualReps = correction.actualReps;
  if (correction.actualRpe !== undefined) {
    patch.actualRpe = correction.actualRpe === null ? null : correction.actualRpe.toFixed(1);
  }
  if (correction.completed !== undefined) patch.completed = correction.completed;
  if (correction.setNotes !== undefined) patch.setNotes = correction.setNotes || null;
  return patch;
}

/**
 * Removes one strength observation.
 *
 * `strengthEstimateSnapshots` carries an `observationCount` but no foreign key to
 * the observations themselves, so a delete cannot break referential integrity -
 * it can leave a snapshot whose count is one too high until the next recompute.
 * That is a stale derived figure, not a corrupted record, and it is strictly
 * better than an uncorrectable observation feeding every future estimate.
 */
export async function deleteStrengthObservation(
  userId: number,
  observationId: number
): Promise<RepairOutcome> {
  const db = await getDb();
  if (!db) return { status: "unavailable" };

  const rows = await db
    .select({ userId: strengthObservations.userId })
    .from(strengthObservations)
    .where(eq(strengthObservations.id, observationId))
    .limit(1);

  const decision = resolveRepair(rows[0] ?? null, userId);
  if (decision.action === "refuse") return { status: "refused", reason: decision.reason };

  await db.delete(strengthObservations).where(eq(strengthObservations.id, observationId));
  return { status: "applied" };
}
