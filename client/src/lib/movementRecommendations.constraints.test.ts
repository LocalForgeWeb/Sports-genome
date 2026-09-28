import { describe, expect, it } from "vitest";
import { exerciseMatchesSignal, findSportMovement, getMovementRecommendations, getMovementSignals, getSportSession } from "./movementRecommendations";
import { exercises } from "./exerciseCatalog";
import { equipmentMatchesProfile, gymAccessProfiles, type AthleteEquipmentProfile } from "./equipmentProfile";

/**
 * Recommendations read the action, not its muscle list, and never suggest equipment the
 * athlete does not have (Backend V1 EN-12, EN-13; B118, B120, B129, B130).
 */
const whizzer = findSportMovement("wrestling", "wrestling-14");
const bodyweightOnly: AthleteEquipmentProfile = { gymAccess: "Bodyweight only", availableEquipment: gymAccessProfiles["Bodyweight only"] };
const atHome: AthleteEquipmentProfile = { gymAccess: "At home", availableEquipment: gymAccessProfiles["At home"] };

describe("A sport movement's demands come from what the body does (EN-13)", () => {
  it("does not read the whizzer's 'pressure' as a push, or its 'posterior deltoid' as hip extension", () => {
    expect(whizzer.label).toBe("overhook/whizzer");
    const signals = getMovementSignals(whizzer);
    expect(signals).not.toContain("push");
    expect(signals).not.toContain("posterior");
    expect(signals).toEqual(expect.arrayContaining(["rotation", "pull"]));
  });

  it("no longer leads the whizzer's picks with chest presses", () => {
    const top = getMovementRecommendations(whizzer, 5).map((result) => result.exercise);
    const pressing = top.filter((exercise) => /press/i.test(exercise.name) && exercise.primaryMuscles.includes("chest"));
    expect(pressing).toEqual([]);
  });
});

describe("An exercise trains a signal by what distinguishes it (EN-13)", () => {
  const byName = (name: string) => exercises.find((exercise) => exercise.name === name)!;

  it("does not count a chest press as pulling because it builds strength, and counts a row", () => {
    expect(exerciseMatchesSignal(byName("Barbell Bench Press"), "pull")).toBe(false);
    expect(exerciseMatchesSignal(byName("Cable Single-Arm Bent-Over Row"), "pull")).toBe(true);
  });

  it("puts rows among the whizzer's picks, and sled and carry work first for a sprawl", () => {
    const whizzerPicks = getMovementRecommendations(whizzer, 6).map((result) => result.exercise.name);
    expect(whizzerPicks.some((name) => /row/i.test(name))).toBe(true);
    const sprawl = findSportMovement("wrestling", "wrestling-5");
    expect(sprawl.label).toBe("sprawl");
    const sprawlPicks = getMovementRecommendations(sprawl, 3).map((result) => result.exercise.name);
    expect(sprawlPicks.some((name) => /abduction|band walk/i.test(name))).toBe(false);
    expect(sprawlPicks.some((name) => /sled/i.test(name))).toBe(true);
  });
});

describe("The saved equipment is a hard constraint on recommendations (EN-12)", () => {
  it("recommends only exercises the athlete's equipment supports", () => {
    for (const profile of [bodyweightOnly, atHome]) {
      const picks = getMovementRecommendations(whizzer, 10, undefined, undefined, profile);
      expect(picks.length).toBeGreaterThan(0);
      for (const pick of picks) expect(equipmentMatchesProfile(pick.exercise.equipment, profile.availableEquipment)).toBe(true);
    }
  });

  it("fills a sport session from the equipment available rather than filtering a list cut without it", () => {
    const session = getSportSession("wrestling", "Athleticism", 6, bodyweightOnly);
    for (const pick of session) expect(equipmentMatchesProfile(pick.exercise.equipment, bodyweightOnly.availableEquipment)).toBe(true);
    expect(session.length).toBe(6);
  });
});
