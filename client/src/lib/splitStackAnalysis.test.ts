import { describe, expect, it } from "vitest";
import { analyzeSplitStack, getSplitRequirements, splitsWithRequirements } from "./splitStackAnalysis";
import { exercises, type Exercise } from "./exerciseCatalog";

const exercise = (id: number, primaryMuscles: string[], secondaryMuscles: string[] = []): Exercise => ({ id, name: `Exercise ${id}`, category: "Chest & push", primaryMuscles, secondaryMuscles, movement: "Horizontal push", equipment: "Cable", qualities: ["Strength"], sportFit: { Boxing: "B" } });

describe("split stack analysis", () => {
  it("only scores muscles required by the selected split and flags missing Push coverage", () => {
    const analysis = analyzeSplitStack([exercise(1, ["chest"]), exercise(2, ["chest"]), exercise(5, ["chest"])], [exercise(3, ["triceps"]), exercise(4, ["frontDelts"])], "Push");
    expect(analysis.ratings.every((rating) => ["chest", "frontDelts", "triceps", "sideDelts", "serratusAnterior"].includes(rating.muscle))).toBe(true);
    expect(analysis.gaps.some((rating) => rating.muscle === "triceps")).toBe(true);
    expect(analysis.suggestions.find((suggestion) => suggestion.muscle === "triceps")?.candidate.primaryMuscles).toContain("triceps");
    expect(analysis.suggestions.find((suggestion) => suggestion.muscle === "triceps")?.replaceExercise?.primaryMuscles).toContain("chest");
  });

  it("declares fixed catalog coverage weights as a planning model rather than activation data", () => {
    const analysis = analyzeSplitStack([], [], "Push");
    expect(analysis.boundary).toMatch(/measure activation/i);
  });

  it("recommends only split-compatible candidates when a Push target muscle is missing", () => {
    const lowerBodyTaggedTriceps = { ...exercise(30, ["triceps"]), category: "Knee dominant", movement: "Split squat" };
    const pushTricepsOption = { ...exercise(31, ["triceps"]), category: "Arms & push", movement: "Cable pressdown" };
    const chestAndFrontDeltWork = [exercise(40, ["chest", "frontDelts"]), exercise(41, ["chest", "frontDelts"])];
    const analysis = analyzeSplitStack(chestAndFrontDeltWork, [lowerBodyTaggedTriceps, pushTricepsOption], "Push");
    expect(analysis.suggestions.find((suggestion) => suggestion.muscle === "triceps")?.candidate.id).toBe(31);
  });
});

/**
 * Reported: "the app said t-bar rows don't do rhomboids ... i looked it up and
 * they do." They do, and the app had no way to say so.
 *
 * The Pull split asked for a muscle key called `rhomboids`. The catalog tags
 * that region `upperBack` on all 400 exercises and never uses `rhomboids` once,
 * and `involvement()` is a plain `includes` against those tags - so the row
 * scored 0 for every possible day, could never be offered a suggestion (the
 * candidate filter requires involvement > 0), and capped a fully-covered Pull
 * day at 83/100. Meanwhile the row work the athlete DID add landed under "Upper
 * back" in "Supporting involvement", which the page labels as excluded from the
 * grade.
 *
 * It was the only such key in the app, which is exactly why nothing caught it:
 * one silent zero among seven splits reads as a gap, not as a bug.
 */
describe("split targets the catalog can actually grade", () => {
  it("names a target some exercise in the catalog can actually move", () => {
    // Not "some exercise carries this exact tag": the Pull split asks for
    // `rhomboids`, which no catalog row is tagged with, and the matcher resolves
    // it through the muscle vocabulary instead. What has to hold is the thing an
    // athlete sees - that the row can leave zero at all.
    for (const split of splitsWithRequirements) {
      for (const requirement of getSplitRequirements(split)) {
        const mover = exercises.find((item) => analyzeSplitStack([item], exercises, split).ratings.find((rating) => rating.muscle === requirement.muscle)!.score > 0);
        expect(mover, `${split} target "${requirement.muscle}" cannot be moved off 0 by any of the ${exercises.length} exercises`).toBeDefined();
      }
    }
  });

  it("lets a primary tag on every split target move that target off a gap", () => {
    // The weaker half of the same claim, stated per requirement rather than per
    // catalog: a single direct exercise has to register. A key the catalog does
    // not use satisfies the check above only by accident of one stray tag.
    for (const split of splitsWithRequirements) {
      for (const requirement of getSplitRequirements(split)) {
        const direct = exercises.find((item) => item.primaryMuscles.includes(requirement.muscle));
        if (!direct) continue;
        const analysis = analyzeSplitStack([direct], exercises, split);
        const rating = analysis.ratings.find((item) => item.muscle === requirement.muscle)!;
        expect(rating.score, `${split} / ${requirement.muscle}`).toBeGreaterThan(0);
      }
    }
  });

  it("credits a t-bar row's interscapular work toward the Pull target", () => {
    const tBarRow = exercises.find((item) => item.name === "T-Bar Row")!;
    expect(tBarRow.primaryMuscles, "the catalog's own name for the region").toContain("upperBack");

    // The target keeps the anatomical name the athlete reads...
    const pull = getSplitRequirements("Pull");
    expect(pull.map((requirement) => requirement.muscle)).toContain("rhomboids");

    // ...and a row's upperBack work still has to land on it.
    const rating = analyzeSplitStack([tBarRow], exercises, "Pull").ratings.find((item) => item.muscle === "rhomboids")!;
    expect(rating.score).toBeGreaterThan(0);
    expect(rating.state, "one direct row clears the gap threshold").not.toBe("gap");
  });
});
