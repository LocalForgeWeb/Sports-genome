import { describe, expect, it } from "vitest";
import { exercises } from "../client/src/lib/exerciseCatalog";
import { classifiedCatalogIds, loadConventionFor } from "../shared/loadConventions";

const idOf = (name: string) => exercises.find((exercise) => exercise.name === name)!.id;

describe("The scoring policy's load conventions, as the app holds them", () => {
  it("names only exercises that exist in the catalog", () => {
    const catalogIds = new Set(exercises.map((exercise) => exercise.id));
    const missing = Array.from(classifiedCatalogIds().keys()).filter((id) => !catalogIds.has(id));
    expect(missing).toEqual([]);
    // 40 per implement, 50 on reps, 87 by the stack, 1 per hand (policy, 28 September 2026), plus
    // the app's own entries for the forearm rows of 16 Oct 2026: 2 per implement (410, 411),
    // 2 by the number on the implement (the grippers, 402, 403), 1 per hand (409).
    const counts = Array.from(classifiedCatalogIds().values()).reduce<Record<string, number>>((all, convention) => ({ ...all, [convention]: (all[convention] ?? 0) + 1 }), {});
    expect(counts).toEqual({ per_implement: 42, bodyweight_reps: 50, machine_displayed_load: 89, per_hand: 2 });
  });

  it.each([
    ["Dumbbell Bench Press", "per_implement"],
    ["Hammer Curl", "per_implement"],
    ["Goblet Squat", "per_implement"],
    ["Pull-Up", "bodyweight_reps"],
    ["Chin-Up", "bodyweight_reps"],
    ["Parallel-Bar Dip", "bodyweight_reps"],
    ["Farmer’s Walk", "per_hand"],
    ["Barbell Bench Press", "total_external_load"],
    ["One-Arm Dumbbell Wrist Curl", "per_implement"],
    ["Suitcase Carry", "per_hand"],
    ["Gripper Close", "machine_displayed_load"],
    ["Finger Curl", "total_external_load"],
    ["Lever Pronation", "total_external_load"],
  ])("reads %s as %s", (name, convention) => {
    expect(loadConventionFor(idOf(name))).toBe(convention);
  });

  it("treats an exercise the policy does not classify as its total external load", () => {
    expect(loadConventionFor(null)).toBe("total_external_load");
    expect(loadConventionFor(999999)).toBe("total_external_load");
  });
});
