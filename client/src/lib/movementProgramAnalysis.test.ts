import { describe, expect, it } from "vitest";
import { exercises as catalogExercises, type Exercise } from "./exerciseCatalog";
import { enrichedSportMovements, getEnrichedMovement } from "./enrichedSportMovementDatabase";
import { sportMovementProfiles } from "./sportMovementDatabase";
import { analyzeWorkoutForMovement, createActionConnectionLookup, getExerciseActionConnection, getMovementAssistance, getMovementSupport, sharedConnectionSummary, supportTierLabel } from "./movementProgramAnalysis";

const exercise = (name: string, primaryMuscles: string[]): Exercise => ({
  id: 999,
  name,
  sourceGroup: "Test",
  category: "Test",
  equipment: "Test",
  movement: "Test",
  primaryMuscles,
  secondaryMuscles: [],
  qualities: [],
  muscleGrade: "C",
  sportFit: {
    tennis: { grade: "C", movementHelp: "Test" },
    basketball: { grade: "C", movementHelp: "Test" },
    soccer: { grade: "C", movementHelp: "Test" },
    baseball: { grade: "C", movementHelp: "Test" },
    combat: { grade: "C", movementHelp: "Test" },
  },
});

describe("selected action exercise connections", () => {
  // wrestling-1, penetration step: prime movers gluteus maximus, quadriceps, adductor magnus, soleus.
  const movement = enrichedSportMovements[0];

  it("marks an exercise its movement record names as movement-specific", () => {
    // Sep 30: the label is the movement support tier, and the detail is its reason line.
    const connection = getExerciseActionConnection(exercise(movement.recommendedExercises[0], ["sideDelts"]), movement);
    expect(connection.label).toBe("Movement-specific");
    expect(connection.detail).toBe("Named in the Penetration step movement record: rear-foot-elevated split squat.");
  });

  it("marks a shared prime mover without a movement link as muscle support", () => {
    // Sep 30: a shared prime mover alone is muscle support, not a "Supporting link".
    const connection = getExerciseActionConnection(exercise("Quadriceps support", ["quads"]), movement);
    expect(connection.label).toBe("Muscle support");
    expect(connection.detail).toBe("Trains quadriceps, a prime mover in Penetration step; not specific to the movement.");
  });

  it("does not link an exercise that shares only an assisting or stabilizing muscle", () => {
    // Sep 30: assisting and stabilizer overlap used to count as a "Supporting link" and covered most of the catalog.
    expect(getExerciseActionConnection(exercise("Hamstring isolation", ["hamstrings"]), movement).label).toBe("Not mapped");
    expect(getExerciseActionConnection(exercise("Pressing isolation", ["chest"]), movement).label).toBe("Not mapped");
  });

  it("does not imply a connection where the record contains none", () => {
    const connection = getExerciseActionConnection(exercise("Lateral deltoid isolation", ["sideDelts"]), movement);
    expect(connection.label).toBe("Not mapped");
    expect(connection.detail).toContain("Not named in the action's movement record");
  });

  it("agrees with the movement support tiers for every catalog exercise", () => {
    for (const [sportId, movementId] of [["wrestling", "wrestling-19"], ["wrestling", "wrestling-1"], ["baseball", "baseball-4"]]) {
      const support = getMovementSupport(sportId, movementId);
      const record = getEnrichedMovement(sportId, movementId)!;
      const tierById = new Map([...support.specific, ...support.related, ...support.muscle].map((row) => [row.exercise.id, row] as const));
      for (const entry of catalogExercises) {
        const row = tierById.get(entry.id);
        const connection = getExerciseActionConnection(entry, record);
        expect(connection.label).toBe(row ? supportTierLabel[row.tier] : "Not mapped");
        if (row) expect(connection.detail.startsWith(row.reason)).toBe(true);
      }
    }
  });
});

describe("a connection worked out once per selected action", () => {
  const movement = enrichedSportMovements[0];

  it("gives every catalog exercise the same answer as working it out directly", () => {
    const lookup = createActionConnectionLookup(movement);
    for (const entry of catalogExercises) {
      expect(lookup(entry)).toEqual(getExerciseActionConnection(entry, movement));
    }
  });

  it("hands back the answer it already has instead of working it out again", () => {
    const lookup = createActionConnectionLookup(movement);
    const first = catalogExercises[0];
    // A fresh computation is a new object, so the same object back means it was kept.
    expect(getExerciseActionConnection(first, movement)).not.toBe(getExerciseActionConnection(first, movement));
    expect(lookup(first)).toBe(lookup(first));
  });

  it("says Not mapped when there is no record for the action", () => {
    const lookup = createActionConnectionLookup(undefined);
    expect(lookup(catalogExercises[0]).label).toBe("Not mapped");
  });
});

describe("a connection stated once instead of on every row", () => {
  it("words the shared fact for each label, and agrees in number", () => {
    // Sep 30: worded for the tier names that replaced Direct support / Supporting link.
    expect(sharedConnectionSummary("Movement-specific", 24)).toBe("All 24 are named in its movement record.");
    expect(sharedConnectionSummary("Movement-specific", 1)).toBe("This one is named in its movement record.");
    expect(sharedConnectionSummary("Related pattern", 24)).toBe("All 24 share a pattern with an exercise its record names.");
    expect(sharedConnectionSummary("Muscle support", 24)).toBe("All 24 train one of its prime movers, without a movement-specific link.");
    expect(sharedConnectionSummary("Muscle support", 1)).toBe("This one trains one of its prime movers, without a movement-specific link.");
    expect(sharedConnectionSummary("Not mapped", 24)).toBe("None of the 24 has a mapped link to it.");
  });

  it("keeps the badge on the rows only while it tells them apart", () => {
    // Measured on the shipped build: the default view and the "row" and "press"
    // searches each held one label across all 24 rows, so the badge was
    // twenty-four identical pills in the accent colour. The "squat" search split
    // 21/3, where it earns its place.
    const uniform = ["Muscle support", "Muscle support", "Muscle support"];
    const split = ["Muscle support", "Movement-specific", "Muscle support"];
    expect(new Set(uniform).size > 1).toBe(false);
    expect(new Set(split).size > 1).toBe(true);
  });
});

describe("gym support for an action", () => {
  it("leads with the movement-specific exercises, in tier order, and fills the rest from the catalog ranking", () => {
    const profile = sportMovementProfiles.find((entry) => entry.id === "wrestling-19")!;
    const record = getEnrichedMovement("wrestling", "wrestling-19")!;
    const assistance = getMovementAssistance(record, profile, 20);
    const specific = getMovementSupport("wrestling", "wrestling-19").specific;
    expect(assistance.slice(0, specific.length).map((entry) => entry.exercise.id)).toEqual(specific.map((row) => row.exercise.id));
    expect(assistance[0]).toMatchObject({ source: "Movement record", rationale: "Named in the Bridge movement record: hip thrust." });
    expect(assistance.slice(specific.length).every((entry) => entry.source === "Catalog match")).toBe(true);
  });
});

describe("training coverage reads the shared muscle table", () => {
  it("counts an oblique exercise as covering Bridge's obliquus externus prime mover", () => {
    const record = getEnrichedMovement("wrestling", "wrestling-19")!;
    const woodChop = catalogExercises.find((entry) => entry.name === "Cable Wood Chop")!;
    const oblique = analyzeWorkoutForMovement(record, [woodChop]).primeMovers.find((entry) => entry.name === "obliquus externus abdominis")!;
    expect(oblique.catalogTags).toEqual(["obliques"]);
    expect(oblique.coveredBy.map((entry) => entry.name)).toEqual(["Cable Wood Chop"]);
  });
});
