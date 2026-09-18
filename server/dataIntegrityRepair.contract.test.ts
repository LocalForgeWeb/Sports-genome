import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./dataIntegrityRepair.ts", import.meta.url), "utf8");
const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const sessions = readFileSync(new URL("./workoutSessions.ts", import.meta.url), "utf8");

/**
 * `removePasskey` was the only destructive operation in the entire API, so the
 * athlete's own logged sets and observations were uncorrectable. These assertions
 * hold the two properties that make the repair path safe to expose.
 */
describe("Data-integrity repair contract", () => {
  it("exposes correction and removal behind the auth guard", () => {
    expect(router).toContain("repair: router({");
    for (const procedure of ["deleteWorkoutSet", "correctWorkoutSet", "deleteStrengthObservation"]) {
      expect(router).toContain(`${procedure}: protectedProcedure`);
    }
    expect(router).not.toContain("deleteWorkoutSet: publicProcedure");
    expect(router).not.toContain("correctWorkoutSet: publicProcedure");
    expect(router).not.toContain("deleteStrengthObservation: publicProcedure");
  });

  it("re-reads ownership from the database instead of trusting the request", () => {
    expect(source).toContain("eq(workoutSessionExercises.sessionId, workoutSessions.id)");
    expect(source).toContain("userId: workoutSessions.userId");
    expect(source).toContain("eq(strengthObservations.id, observationId)");
    expect(source).toContain("userId: strengthObservations.userId");
    expect(source).toContain("resolveRepair(");
  });

  it("answers a missing record and someone else's record identically", () => {
    // Separate answers would make every repair endpoint an id-existence probe.
    expect(router).toContain('code: "NOT_FOUND"');
    expect(router).toContain("That record is not available on this account.");
    expect(router).not.toContain('message: "not-owned"');
    expect(router).not.toMatch(/reason:\s*outcome\.reason/);
  });

  it("keeps correction separate from logging, so a log cannot rewrite history", () => {
    // upsertWorkoutSet refuses a finished session on purpose; correction is the
    // operation that is allowed to touch one, and it is named for that.
    expect(sessions).toContain('owner.status !== "active"');
    expect(source).toContain("export async function correctWorkoutSet");
    expect(source).not.toContain('status !== "active"');
  });

  it("removes rather than hides, so nothing deleted still feeds an estimate", () => {
    expect(source).toContain(".delete(workoutSetLogs)");
    expect(source).toContain(".delete(strengthObservations)");
    expect(source).not.toContain("deletedAt");
    expect(source).not.toContain("isDeleted");
  });

  it("bounds every correction field at the edge", () => {
    expect(router).toContain("actualWeight: z.number().min(0).max(2000).nullable().optional()");
    expect(router).toContain("actualReps: z.number().int().min(0).max(1000).nullable().optional()");
    expect(router).toContain("actualRpe: z.number().min(0).max(10).nullable().optional()");
    expect(router).toContain("setNumber: z.number().int().positive().max(100)");
  });

  it("reports an unreachable database as unavailable rather than as a refusal", () => {
    // Otherwise an outage would read to the athlete as "that record is not yours".
    expect(source).toContain('return { status: "unavailable" }');
    expect(router).toContain('code: "SERVICE_UNAVAILABLE"');
  });
});
