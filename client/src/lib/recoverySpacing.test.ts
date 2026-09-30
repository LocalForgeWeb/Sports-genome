import { describe, expect, it } from "vitest";
import { getRecoverySpacingAlerts, getRecoverySpacingCoverage } from "./recoverySpacing";
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

  /** Sep 28 regression brief §9. */
  it("names muscles the way the volume map beside it does, never by key", () => {
    const plan = { "0-Pull": [exercise(1, "upperBack")], "1-Legs": [exercise(2, "upperBack")] };
    const [alert] = getRecoverySpacingAlerts(plan, { "0-Pull": { 1: "8 × 6–8" }, "1-Legs": { 2: "8 × 6–8" } }, "Muscle growth");
    expect(alert.sharedMuscles[0].label).toBe("Upper back");
    expect(alert.nextKey).toBe("1-Legs");
  });

  it("says which neighbouring days it compared and which it skipped", () => {
    const plan = { "0-Push": [exercise(1, "chest")], "1-Pull": [exercise(2, "lats")], "2-Legs": [exercise(3, "quads")], "3-Upper": [], "4-Sport Transfer": [exercise(4, "quads")] };
    expect(getRecoverySpacingCoverage(plan)).toEqual({ compared: [["Push", "Pull"], ["Pull", "Legs"]], skipped: [["Legs", "Sport Transfer"]] });
  });
});
