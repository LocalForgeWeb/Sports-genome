import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildSetLogPayload } from "../client/src/components/WorkoutExecutionPanel";

describe("progression history actual-RPE contract", () => {
  it("keeps recorded RPE in the client payload and server persistence/history path", () => {
    const payload = buildSetLogPayload(7, 1, "kg", { weight: 22.5, reps: 10, rpe: 8, completed: true });
    const persistence = readFileSync(new URL("./workoutSessions.ts", import.meta.url), "utf8");

    expect(payload.actualRpe).toBe(8);
    expect(persistence).toContain("actualRpe: workoutSetLogs.actualRpe");
    expect(persistence).toContain("actualRpe: input.actualRpe === undefined ? null : input.actualRpe.toFixed(1)");
    expect(persistence).toContain("eq(workoutSessions.status, \"completed\")");
  });
});
