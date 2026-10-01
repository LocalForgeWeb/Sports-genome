import { describe, expect, it } from "vitest";
import { exercises, type Exercise } from "./exerciseCatalog";
import { enrichedSportMovements, getEnrichedMovement } from "./enrichedSportMovementDatabase";
import {
  BROAD_PATTERN_MIN_EXERCISES,
  BROAD_PATTERNS,
  NOT_THE_SAME_EXERCISE,
  SAME_EXERCISE_SYNONYMS,
  classifyExerciseForMovement,
  getMovementSupport,
  isNotTheSameExercise,
  movementMatchCount,
  nameContainsPhrase,
  normalizeExercisePhrase,
  supportMatchMethod,
  type SupportTier,
} from "./movementSupport";

const bridge = () => getMovementSupport("wrestling", "wrestling-19");
const penetrationStep = () => getMovementSupport("wrestling", "wrestling-1");
const overhandThrow = () => getMovementSupport("baseball", "baseball-4");
const ids = (rows: { exercise: Exercise }[]) => rows.map((row) => row.exercise.id);
const names = (rows: { exercise: Exercise }[]) => rows.map((row) => row.exercise.name);

describe("phrase normalizer and contiguous-phrase matcher", () => {
  it("lower-cases, reads hyphens and punctuation as spaces, drops apostrophes and makes simple plurals singular", () => {
    expect(normalizeExercisePhrase("Single-Leg  Romanian Deadlifts")).toBe("single leg romanian deadlift");
    expect(normalizeExercisePhrase("Farmer’s Walk")).toBe("farmer walk");
    expect(normalizeExercisePhrase("Bench presses")).toBe("bench press");
    expect(normalizeExercisePhrase("Loaded carries")).toBe("loaded carry");
    expect(normalizeExercisePhrase("Step-ups")).toBe("step up");
    expect(normalizeExercisePhrase("Pallof Press")).toBe("pallof press");
  });

  it("matches a phrase only as a contiguous run of whole words", () => {
    expect(nameContainsPhrase("Barbell Hip Thrust", "hip thrust")).toBe(true);
    expect(nameContainsPhrase("Dumbbell Walking Lunges", "walking lunge")).toBe(true);
    // The old word matcher counted these; neither is the named exercise.
    expect(nameContainsPhrase("Cable Deadlift", "cable lift")).toBe(false);
    expect(nameContainsPhrase("Landmine Anti-Rotation Press", "landmine press")).toBe(false);
    expect(nameContainsPhrase("Cable 90/90 External Rotation", "cable anti-rotation")).toBe(false);
    expect(nameContainsPhrase("Hip Thruster", "hip thrust")).toBe(false);
  });

  it("keeps every synonym to one exercise named two ways, each with its reason, and each resolving in the catalog", () => {
    for (const entry of SAME_EXERCISE_SYNONYMS) {
      expect(entry.why.length).toBeGreaterThan(20);
      expect(exercises.some((exercise) => nameContainsPhrase(exercise.name, entry.sameAs))).toBe(true);
      // An entry the plain matcher already resolves is not a synonym, just noise.
      expect(exercises.some((exercise) => nameContainsPhrase(exercise.name, entry.phrase))).toBe(false);
    }
  });
});

describe("NOT_THE_SAME_EXERCISE", () => {
  const recordsNaming = (phrase: string) => enrichedSportMovements.filter((record) => record.recommendedExercises.some((text) => normalizeExercisePhrase(text) === normalizeExercisePhrase(phrase)));

  it("lists only pairs the name rule would match, each with its reason, and each moves the exercise out of movement-specific", () => {
    expect(NOT_THE_SAME_EXERCISE.length).toBeGreaterThan(0);
    for (const entry of NOT_THE_SAME_EXERCISE) {
      const exercise = exercises.find((item) => item.id === entry.catalogId);
      expect(exercise, `${entry.phrase} -> ${entry.catalogId}`).toBeTruthy();
      expect(entry.why.length).toBeGreaterThan(20);
      // Without the list the plain name rule would match this pair; otherwise the entry is noise.
      expect(nameContainsPhrase(exercise!.name, entry.phrase)).toBe(true);
      expect(isNotTheSameExercise(entry.phrase, entry.catalogId)).toBe(true);
      const records = recordsNaming(entry.phrase);
      expect(records.length, entry.phrase).toBeGreaterThan(0);
      const rows = records.map((record) => classifyExerciseForMovement(exercise!, record));
      // No record places it by that phrase any more, and at least one placement changed.
      expect(rows.every((row) => !row?.phrase || normalizeExercisePhrase(row.phrase) !== normalizeExercisePhrase(entry.phrase))).toBe(true);
      expect(rows.some((row) => row?.tier !== "specific")).toBe(true);
    }
  });

  it("keeps the row a record names but drops the upright row from it, which still meets the record's other exercises", () => {
    const record = getEnrichedMovement("mma", "mma-17")!;
    const uprightRow = exercises.find((exercise) => exercise.id === 317)!;
    expect(uprightRow.name).toBe("Cable Upright Row");
    expect(classifyExerciseForMovement(uprightRow, record)?.tier).not.toBe("specific");
    const support = getMovementSupport("mma", "mma-17");
    expect(ids(support.specific)).not.toContain(317);
    expect(names(support.specific)).toContain("Seated Cable Row");
    expect(support.unmatchedPhrases).not.toContain("row");
  });
});

describe("BROAD_PATTERNS", () => {
  it("is exactly the catalog patterns that label more than 15 exercises", () => {
    const counts = new Map<string, number>();
    exercises.forEach((exercise) => counts.set(exercise.movement, (counts.get(exercise.movement) ?? 0) + 1));
    const byRule = Array.from(counts).filter(([, count]) => count >= BROAD_PATTERN_MIN_EXERCISES).map(([pattern]) => pattern);
    expect([...BROAD_PATTERNS].sort()).toEqual(byRule.sort());
    expect(BROAD_PATTERNS).toContain("Horizontal push");
    expect(BROAD_PATTERNS).toContain("Horizontal pull");
  });

  it("never anchors a related-pattern match", () => {
    for (const support of [bridge(), penetrationStep(), overhandThrow()]) {
      expect(support.related.every((row) => !BROAD_PATTERNS.includes(row.exercise.movement))).toBe(true);
    }
  });
});

describe("movement support for Wrestling · Bridge", () => {
  it("leads with the hip thrusts, glute bridges and Romanian deadlifts its record names, and no rotator-cuff drill", () => {
    const support = bridge();
    expect(support.status).toBe("ok");
    expect(support.movementLabel).toBe("Bridge");
    expect(support.sportLabel).toBe("Wrestling");
    const tierOne = names(support.specific);
    expect(tierOne).toEqual(expect.arrayContaining(["Barbell Hip Thrust", "Single-Leg Hip Thrust", "Glute Bridge", "Single-Leg Glute Bridge", "Romanian Deadlift", "Dumbbell Romanian Deadlift"]));
    expect(support.specific.every((row) => !row.exercise.primaryMuscles.includes("rotatorCuff"))).toBe(true);
    expect(tierOne).not.toContain("Cable 90/90 External Rotation");
    expect(tierOne).not.toContain("Cable 90/90 Internal Rotation");
    expect(tierOne).not.toContain("Cable Cuban Rotation");
    // The recorded handoff led with these through a leftover shoulder filter.
    expect(tierOne).not.toContain("Cable Wood Chop");
    expect(tierOne).not.toContain("Landmine Rotation");
  });

  it("orders movement-specific rows by the record's phrase order, then catalog id, and says which phrase named each", () => {
    const support = bridge();
    const record = getEnrichedMovement("wrestling", "wrestling-19")!;
    const phraseIndexes = support.specific.map((row) => record.recommendedExercises.indexOf(row.phrase!));
    expect(phraseIndexes).toEqual([...phraseIndexes].sort((left, right) => left - right));
    expect(support.specific[0].exercise.name).toBe("Barbell Hip Thrust");
    expect(support.specific[0].reason).toBe("Named in the Bridge movement record: hip thrust");
  });

  it("relates exercises through a named exercise's own pattern and a shared prime mover, and says which", () => {
    const related = bridge().related;
    const goodMorning = related.find((row) => row.exercise.name === "Good Morning")!;
    expect(goodMorning.reason).toBe("Same hip hinge pattern as Romanian Deadlift");
    expect(goodMorning.anchorExerciseId).toBe(42);
    expect(goodMorning.sharedPrimeMovers).toEqual(["gluteus maximus", "hamstrings"]);
    expect(names(related)).toContain("Cable Glute Kickback");
  });

  it("keeps muscle support apart, says it is not specific, and never counts it as a match", () => {
    const support = bridge();
    const backSquat = support.muscle.find((row) => row.exercise.name === "Back Squat")!;
    expect(backSquat.reason).toBe("Trains gluteus maximus, a prime mover in Bridge; not specific to the movement.");
    expect(movementMatchCount(support)).toBe(support.specific.length + support.related.length);
    const tiers = [support.specific, support.related, support.muscle].map(ids);
    expect(new Set(tiers.flat()).size).toBe(tiers.flat().length);
  });

  it("gives no number, percentage or grade for relevance", () => {
    const support = bridge();
    for (const row of [...support.specific, ...support.related, ...support.muscle]) {
      expect(Object.keys(row).sort()).toEqual(expect.arrayContaining(["exercise", "reason", "sharedPrimeMovers", "tier"]));
      expect(row).not.toHaveProperty("score");
      expect(row).not.toHaveProperty("grade");
      expect(row.reason).not.toMatch(/%|\bgrade\b|reviewed/i);
    }
    expect(support.record).toEqual({ confidence: "moderate", sourceCount: 3 });
  });

  it("says how each tier was reached, with the record's confidence and sources, and never calls it reviewed", () => {
    const record = getEnrichedMovement("wrestling", "wrestling-19")!;
    const byName = (name: string) => exercises.find((exercise) => exercise.name === name)!;
    expect(supportMatchMethod(byName("Barbell Hip Thrust"), record)).toBe("Matched by exercise name to the Bridge movement record (hip thrust). Record rated moderate confidence, from 3 sources.");
    expect(supportMatchMethod(byName("Good Morning"), record)).toBe("Not named in the Bridge movement record. It has the same hip hinge pattern as Romanian Deadlift, which the record names, and trains gluteus maximus and hamstrings, prime movers in Bridge. Record rated moderate confidence, from 3 sources.");
    expect(supportMatchMethod(byName("Back Squat"), record)).toBe("Not named in the Bridge movement record, and its pattern does not relate it to an exercise the record names. It trains gluteus maximus, a prime mover in Bridge. Record rated moderate confidence, from 3 sources.");
    expect(supportMatchMethod(byName("Barbell Bench Press"), record)).toBeNull();
    const step = getEnrichedMovement("wrestling", "wrestling-1")!;
    expect(supportMatchMethod(byName("Bulgarian Split Squat"), step)).toMatch(/^Matched by exercise name to the Penetration step movement record \(rear-foot-elevated split squat, the same exercise as the Bulgarian split squat\)\. /);
    for (const name of ["Barbell Hip Thrust", "Good Morning", "Back Squat"]) expect(supportMatchMethod(byName(name), record)).not.toMatch(/reviewed|%|\/100/i);
  });

  it("is worked out once per movement", () => {
    expect(bridge()).toBe(bridge());
  });
});

describe("two movements with different records", () => {
  it("returns materially different movement-specific sets for Bridge and Penetration step", () => {
    const bridgeIds = new Set(ids(bridge().specific));
    const stepIds = ids(penetrationStep().specific);
    expect(stepIds.filter((id) => bridgeIds.has(id))).toEqual([]);
    expect(names(penetrationStep().specific)).toEqual(expect.arrayContaining(["Bulgarian Split Squat", "Walking Lunge", "Heavy Sled Push", "Landmine Press"]));
    expect(penetrationStep().specific.every((row) => row.reason.startsWith("Named in the Penetration step movement record: "))).toBe(true);
  });

  it("resolves an exact same-exercise synonym and says so", () => {
    const bulgarian = penetrationStep().specific.find((row) => row.exercise.name === "Bulgarian Split Squat")!;
    expect(bulgarian.phrase).toBe("rear-foot-elevated split squat");
    expect(bulgarian.reason).toBe("Named in the Penetration step movement record: rear-foot-elevated split squat (the same exercise as the Bulgarian split squat)");
  });

  it("does not let a broad pattern carry a named landmine press into bench presses", () => {
    const throwing = overhandThrow();
    expect(names(throwing.specific)).toContain("Landmine Press");
    expect(names(throwing.related)).not.toContain("Barbell Bench Press");
    expect(throwing.unmatchedPhrases).toEqual(expect.arrayContaining(["medicine-ball rotational throw", "cable lift"]));
  });
});

describe("missing data", () => {
  it("says no-record for a movement without an enriched record, with nothing in any tier", () => {
    const support = getMovementSupport("wrestling", "wrestling-21");
    expect(support.status).toBe("no-record");
    expect(support.movementLabel).toBe("Gut-wrench turn");
    expect(support.record).toBeNull();
    expect([support.specific, support.related, support.muscle].every((rows) => rows.length === 0)).toBe(true);
  });

  it("says no-named-matches when the record names nothing in the catalog, and still offers muscle support", () => {
    const support = getMovementSupport("olympic-weightlifting", "olympic-weightlifting-2");
    expect(support.status).toBe("no-named-matches");
    expect(support.specific).toEqual([]);
    expect(support.related).toEqual([]);
    expect(support.muscle.length).toBeGreaterThan(0);
    expect(support.unmatchedPhrases).toEqual(["clean pull", "snatch pull", "hang clean", "jump shrug"]);
    expect(support.primeMoverKeys.length).toBeGreaterThan(0);
  });
});

describe("no tier is decided by muscle breadth", () => {
  const allKeys = Array.from(new Set(exercises.flatMap((exercise) => [...exercise.primaryMuscles, ...exercise.secondaryMuscles])));
  const rank: Record<SupportTier | "none", number> = { specific: 3, related: 2, muscle: 1, none: 0 };
  const tierOf = (exercise: Exercise, record = getEnrichedMovement("wrestling", "wrestling-19")!) => classifyExerciseForMovement(exercise, record)?.tier ?? "none";

  it("tags every muscle on an unrelated exercise and it rises no higher than muscle support", () => {
    const everything: Exercise = { ...exercises.find((exercise) => exercise.name === "Barbell Bench Press")!, id: 9001, primaryMuscles: allKeys, secondaryMuscles: allKeys };
    expect(tierOf(everything)).toBe("muscle");
  });

  it("never moves any catalog exercise up a tier when every muscle is added to it", () => {
    for (const record of [getEnrichedMovement("wrestling", "wrestling-19")!, getEnrichedMovement("wrestling", "wrestling-1")!]) {
      for (const exercise of exercises) {
        const broadened = { ...exercise, primaryMuscles: allKeys, secondaryMuscles: allKeys };
        const before = tierOf(exercise, record);
        const after = tierOf(broadened, record);
        // Breadth can at most add muscle support to an exercise that shares nothing, or
        // complete the prime-mover condition of a pattern the record already relates.
        if (rank[after] > rank[before]) {
          expect(before === "none" || before === "muscle").toBe(true);
          expect(after === "muscle" || (after === "related" && !BROAD_PATTERNS.includes(exercise.movement))).toBe(true);
        }
        if (after === "specific") expect(before).toBe("specific");
      }
    }
  });

  it("orders muscle support by the record's prime movers, not by how many muscles an exercise lists", () => {
    const support = bridge();
    const firstMover = support.muscle.map((row) => row.sharedPrimeMovers[0]);
    const order = ["gluteus maximus", "hamstrings", "erector spinae", "obliquus externus abdominis"];
    const indexes = firstMover.map((name) => order.indexOf(name));
    expect(indexes).toEqual([...indexes].sort((left, right) => left - right));
  });
});
