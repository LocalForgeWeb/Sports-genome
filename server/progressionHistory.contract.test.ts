import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildSetLogPayload } from "../client/src/components/WorkoutExecutionPanel";

describe("progression history RPE retirement contract", () => {
  it("keeps new Tracker payloads focused on weight, reps, and completion while retaining legacy account-history compatibility", () => {
    const payload = buildSetLogPayload(7, 1, "kg", { weight: 22.5, reps: 10, completed: true });
    const persistence = readFileSync(new URL("./workoutSessions.ts", import.meta.url), "utf8");

    expect(payload).not.toHaveProperty("actualRpe");
    expect(persistence).toContain("actualRpe: workoutSetLogs.actualRpe");
    expect(persistence).toContain("actualRpe: input.actualRpe === undefined ? null : input.actualRpe.toFixed(1)");
    expect(persistence).toContain("eq(workoutSessions.status, \"completed\")");
  });
});
