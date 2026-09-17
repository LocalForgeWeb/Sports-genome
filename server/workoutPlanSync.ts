import { eq } from "drizzle-orm";
import { athleteWorkoutPlans } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * The athlete's training plan, stored against the account rather than the browser.
 *
 * The plan lived only in localStorage, so building a week on a phone and opening a
 * laptop showed nothing. It moves as the JSON document the client already
 * serialises: the client owns its shape, it is read and written whole, and nothing
 * here queries inside it.
 *
 * Every device that edits offline produces a plan that believes it is current, so
 * the interesting part is not storing it but deciding which one wins. That decision
 * is `resolvePlanWrite` below, kept pure so it can be reasoned about and tested
 * without a database.
 */

/** MEDIUMTEXT holds 16MB; this is a sanity ceiling, far above any real plan. */
export const maxPlanBytes = 2_000_000;

export type StoredPlanRecord = {
  planJson: string;
  planVersion: number;
  revision: number;
  updatedAt: Date;
};

export type PlanWriteDecision =
  | { action: "write"; revision: number }
  | { action: "reject"; reason: "stale"; current: StoredPlanRecord }
  | { action: "reject"; reason: "too-large" };

/**
 * Whether an incoming plan should replace the stored one.
 *
 * The client sends the revision it last saw. If that still matches, it is editing
 * the current plan and wins. If it does not, another device has written since, and
 * blindly accepting would silently delete that work - so the write is rejected and
 * the caller is handed the current record to reconcile against.
 *
 * This is deliberately not last-write-wins. A phone that has been in a pocket with
 * a stale plan open should not be able to erase a session built on a laptop an hour
 * ago simply by being saved second.
 */
export function resolvePlanWrite(
  incoming: { planJson: string; baseRevision: number | null },
  current: StoredPlanRecord | null
): PlanWriteDecision {
  if (incoming.planJson.length > maxPlanBytes) return { action: "reject", reason: "too-large" };
  if (!current) return { action: "write", revision: 1 };
  // A client that has never seen the server's copy must reconcile before writing.
  if (incoming.baseRevision === null) return { action: "reject", reason: "stale", current };
  if (incoming.baseRevision !== current.revision) return { action: "reject", reason: "stale", current };
  return { action: "write", revision: current.revision + 1 };
}

export async function getWorkoutPlan(userId: number): Promise<StoredPlanRecord | null> {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const [row] = await db
    .select({
      planJson: athleteWorkoutPlans.planJson,
      planVersion: athleteWorkoutPlans.planVersion,
      revision: athleteWorkoutPlans.revision,
      updatedAt: athleteWorkoutPlans.updatedAt,
    })
    .from(athleteWorkoutPlans)
    .where(eq(athleteWorkoutPlans.userId, userId))
    .limit(1);
  return row ?? null;
}

export type SavePlanResult =
  | { status: "saved"; revision: number; updatedAt: Date }
  | { status: "conflict"; current: StoredPlanRecord }
  | { status: "rejected"; reason: "too-large" };

export async function saveWorkoutPlan(
  userId: number,
  input: { planJson: string; planVersion: number; baseRevision: number | null }
): Promise<SavePlanResult> {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const current = await getWorkoutPlan(userId);
  const decision = resolvePlanWrite({ planJson: input.planJson, baseRevision: input.baseRevision }, current);

  if (decision.action === "reject") {
    return decision.reason === "too-large"
      ? { status: "rejected", reason: "too-large" }
      : { status: "conflict", current: decision.current };
  }

  if (current) {
    await db
      .update(athleteWorkoutPlans)
      .set({ planJson: input.planJson, planVersion: input.planVersion, revision: decision.revision })
      .where(eq(athleteWorkoutPlans.userId, userId));
  } else {
    await db.insert(athleteWorkoutPlans).values({
      userId,
      planJson: input.planJson,
      planVersion: input.planVersion,
      revision: decision.revision,
    });
  }

  const saved = await getWorkoutPlan(userId);
  return { status: "saved", revision: decision.revision, updatedAt: saved?.updatedAt ?? new Date() };
}
