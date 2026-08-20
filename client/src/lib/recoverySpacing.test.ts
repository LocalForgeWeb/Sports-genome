import { describe, expect, it } from "vitest";
import { getRecoverySpacingAlerts } from "./recoverySpacing";
import type { Exercise } from "./exerciseCatalog";

const exercise = (id: number, muscle: string): Exercise => ({ id, name: `Exercise ${id}`, category: "Chest", primaryMuscles: [muscle], secondaryMuscles: [], movement: "Press", equipment: "Barbell", qualities: ["Strength"], sportFit: { Boxing: "B" } });

describe("recovery spacing", () => {
  it("flags consecutive saved days with meaningful shared muscle exposure", () => {
    const plan = { "0-Push": [exercise(1, "chest")], "1-Upper": [exercise(2, "chest")] };
    const alerts = getRecoverySpacingAlerts(plan, { "0-Push": { 1: "8 × 6–8" }, "1-Upper": { 2: "8 × 6–8" } }, "Muscle growth");
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("priority");
    expect(alerts[0].sharedMuscles[0].muscle).toBe("chest");
  });

  it("does not flag overlapping exposure when a recovery day separates the saved sessions", () => {
    const plan = { "0-Push": [exercise(1, "chest")], "2-Upper": [exercise(2, "chest")] };
    expect(getRecoverySpacingAlerts(plan, {}, "Muscle growth")).toHaveLength(0);
  });
});
