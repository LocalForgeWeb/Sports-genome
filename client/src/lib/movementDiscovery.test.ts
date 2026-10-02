import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { discoverMovementExercises, exerciseNamedBy, movementResultSet } from "./movementDiscovery";

/**
 * October 1 brief §6: the Body Lab's "Wrestling / Hand fighting" led to "Find
 * pectoralis major exercises". Discovery is now scoped to the action by its own
 * ids, and its results come from the action's record in tiers that are never
 * mixed: named, trains its demands, shares a muscle only.
 */
const byName = (name: string) => exercises.find((exercise) => exercise.name === name)!;

describe("exercise discovery for a sport action", () => {
  const handFighting = discoverMovementExercises("wrestling", "wrestling-17", exercises);

  it("names the action it is for, with its sport, from the ids alone", () => {
    expect(handFighting.label).toBe("Hand fighting");
    expect(handFighting.sportLabel).toBe("Wrestling");
    expect(handFighting.mapped).toBe(true);
    expect(handFighting.hasRecord).toBe(true);
  });

  it("lists the exercises the record names first, each with the record's own phrase", () => {
    const named = handFighting.named.map((match) => match.exercise.name);
    expect(named).toContain("Seated Cable Row");
    expect(named).toContain("Standard Push-Up");
    expect(named).toContain("Towel Pull-Up");
    expect(named).toContain("Farmer’s Walk");
    expect(handFighting.named.find((match) => match.exercise.name === "Seated Cable Row")?.reason).toBe('Named in the hand fighting record as "cable row".');
    // Named is the first tier of the default result set.
    expect(movementResultSet(handFighting).slice(0, handFighting.named.length)).toEqual(handFighting.named);
  });

  it("never lets a shared pectoralis alone qualify a bench press as a movement match", () => {
    const bench = byName("Barbell Bench Press");
    expect(movementResultSet(handFighting).some((match) => match.exercise.id === bench.id)).toBe(false);
    const muscleOnly = handFighting.muscleOnly.find((match) => match.exercise.id === bench.id);
    expect(muscleOnly?.tier).toBe("muscle");
    expect(muscleOnly?.reason).toMatch(/^Shares a muscle only: pectoralis major/);
    expect(muscleOnly?.reason).toContain("Not a movement match.");
  });

  it("explains a demand match from the record's demands and shared muscles", () => {
    const row = handFighting.demand.find((match) => match.exercise.name === "Barbell Bent-Over Row");
    expect(row?.reason).toBe("Trains its pulling, grip demand · works latissimus dorsi, deltoids.");
  });

  it("matches a record's phrase only as consecutive words of the name", () => {
    expect(exerciseNamedBy(byName("Seated Cable Row"), "cable row")).toBe(true);
    expect(exerciseNamedBy(byName("Cable Upright Row"), "cable row")).toBe(false);
    expect(exerciseNamedBy(byName("Bulgarian Split Squat"), "rear-foot-elevated split squat")).toBe(true);
    expect(exerciseNamedBy(byName("Cable Front-Foot-Elevated Press"), "rear-foot-elevated split squat")).toBe(false);
    expect(exerciseNamedBy(byName("Farmer’s Walk"), "farmer carry")).toBe(true);
  });

  it("keeps two actions' results apart: Bridge never leaks into Hand fighting", () => {
    const bridge = discoverMovementExercises("wrestling", "wrestling-19", exercises);
    expect(bridge.label).not.toBe(handFighting.label);
    const bridgeIds = new Set(movementResultSet(bridge).map((match) => match.exercise.id));
    const handIds = new Set(movementResultSet(handFighting).map((match) => match.exercise.id));
    expect(bridgeIds).not.toEqual(handIds);
    expect(movementResultSet(handFighting).every((match) => match.reason.includes("hand fighting") || match.reason.startsWith("Trains its"))).toBe(true);
  });

  it("says plainly when an action has no mapping, and offers its muscles", () => {
    const unknown = discoverMovementExercises("wrestling", "wrestling-does-not-exist", exercises);
    expect(unknown.mapped).toBe(false);
    expect(movementResultSet(unknown)).toEqual([]);
    expect(unknown.muscleOnly).toEqual([]);
  });

  it("covers every reviewed record with at least one named or demand match", () => {
    const sportIds = ["wrestling", "soccer", "basketball"];
    for (const sportId of sportIds) {
      for (let index = 1; index <= 5; index += 1) {
        const discovery = discoverMovementExercises(sportId, `${sportId}-${index}`, exercises);
        if (!discovery.mapped) continue;
        expect(movementResultSet(discovery).length, `${sportId}-${index}`).toBeGreaterThan(0);
      }
    }
  });
});
