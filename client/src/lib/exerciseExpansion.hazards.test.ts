import { describe, expect, it } from "vitest";
import { exercises, type Exercise } from "./exerciseCatalog";
import { buildExerciseGenome, exerciseSimilarity, EXERCISE_GENOME_REVISION } from "./exerciseGenome";
import { getExerciseStudyCalibration } from "./exerciseStudyCalibration";
import { buildMuscleTargetingEstimate } from "./muscleTargetingModel";
import { analyzeWeek, commonMovements, type WeekReviewInput } from "./weekReview";
import { buildDaySlots } from "./trainingDayPlan";
import { splitDaysForFrequency } from "./splitCycle";
import { equipmentMatchesProfile, filterStackForEquipment, gymAccessProfiles } from "./equipmentProfile";
import { regionKeysForValue, viewsForRegion } from "./anatomyRegions";
import { getMovementSupport } from "./movementSupport";
import { matchesTrainingSplit } from "./splitAssignment";
import { getGoalPrescription } from "./workoutPlanner";
import { strengthRegionIdsForCatalogMuscles } from "@shared/strengthGenomeDefinitions";
import { expansionLoadConventions, loadConventionFor } from "@shared/loadConventions";
import { measurementFor } from "@shared/exerciseMeasurement";
import { findCurveExercise } from "../../../server/supabaseStrengthCurves";
import { findProfileExercise } from "../../../server/supabaseStrengthProfile";

const byId = (id: number) => { const found = exercises.find((exercise) => exercise.id === id); if (!found) throw new Error(`no exercise ${id}`); return found; };
const byName = (name: string) => { const found = exercises.find((exercise) => exercise.name === name); if (!found) throw new Error(`no exercise ${name}`); return found; };
/** An exercise with no descriptor, so the original name rules read it: the path any future record without one would take. */
const named = (name: string, extra: Partial<Exercise> = {}): Exercise => ({ ...byId(139), id: 99_000, name, movement: "Test", category: "Test", equipment: "Free weights", qualities: [], ...extra });

describe("hazard: Reverse Nordic does not inherit the Nordic hamstring study (brief §5)", () => {
  it("carries its own transfer study, never the hamstring one, and its quadriceps get no direct-evidence floor", () => {
    const reverse = byName("Reverse Nordic Curl");
    expect(getExerciseStudyCalibration(reverse)).toMatchObject({ key: "reverse-nordic", kind: "Biomechanics or transfer" });
    const quads = buildExerciseGenome(reverse).muscleProfile.find((entry) => entry.muscle === "quads")!;
    expect(quads.targeting.evidenceTier).toBe("Conditional mechanics ranking");
    expect(quads.targeting.directEvidenceNote).toBeUndefined();
    expect(buildExerciseGenome(reverse).muscleProfile.some((entry) => entry.muscle === "hamstrings")).toBe(false);
  });

  it("reaches the same answer by the name rule for any undescribed 'Reverse Nordic', while the Nordic hamstring curl keeps its study and floor", () => {
    expect(getExerciseStudyCalibration(named("Reverse Nordic Curl"))?.key).not.toBe("nordic-hamstring");
    const nordic = byName("Nordic Hamstring Curl");
    expect(getExerciseStudyCalibration(nordic)?.key).toBe("nordic-hamstring");
    expect(buildMuscleTargetingEstimate(nordic, "hamstrings", "Prime mover").score).toBe(82);
  });

  it("is not a movement-specific match where a record names the Nordic hamstring curl", () => {
    const records = ["soccer", "american-football", "track-and-field"].flatMap((sport) => Array.from({ length: 30 }, (_, index) => getMovementSupport(sport, `${sport}-${index + 1}`)));
    const naming = records.filter((support) => support.specific.some((row) => row.exercise.name === "Nordic Hamstring Curl"));
    expect(naming.length).toBeGreaterThan(0);
    for (const support of naming) expect(support.specific.map((row) => row.exercise.name)).not.toContain("Reverse Nordic Curl");
  });
});

describe("hazard: neck extension is not given the 'extension' shortened curve", () => {
  it("keeps the machine's curve unestablished, and the name rule no longer calls a neck extension shortened", () => {
    expect(buildExerciseGenome(byName("Neck Extension Machine")).resistanceProfile.bias).toBe("Not established");
    expect(buildExerciseGenome(byName("Neck Extension Machine")).resistanceProfile.curve).toEqual([]);
    expect(buildExerciseGenome(named("Neck Extension")).resistanceProfile.bias).not.toBe("Shortened");
    // The triceps extension the rule was written for is unchanged.
    expect(buildExerciseGenome(named("Rope Triceps Extension")).resistanceProfile.bias).toBe("Shortened");
  });
});

describe("hazard: a bear-hug carry is not crawling", () => {
  it("states Carry, bracing and locomotion, never Crawling; a real bear crawl still is", () => {
    const patterns = buildExerciseGenome(byName("Sandbag Bear-Hug Carry")).movementPatterns;
    expect(patterns).toEqual(["Carry", "Anti-movement bracing", "Locomotion"]);
    expect(patterns).not.toContain("Crawling");
    expect(buildExerciseGenome(named("Bear Crawl")).movementPatterns).toContain("Crawling");
    expect(buildExerciseGenome(named("Bear-Hug Walk")).movementPatterns).not.toContain("Crawling");
  });
});

describe(`hazard: force direction and stance reach their branches (${EXERCISE_GENOME_REVISION})`, () => {
  it("reads squats and hinges as vertical, carries and sleds as mixed-stance multi-planar", () => {
    expect(buildExerciseGenome(byName("Back Squat")).forceDirection).toBe("Vertical / ground-reaction");
    expect(buildExerciseGenome(byName("Romanian Deadlift")).forceDirection).toBe("Vertical / ground-reaction");
    const farmer = buildExerciseGenome(byName("Farmer’s Walk"));
    expect([farmer.forceDirection, farmer.stance]).toEqual(["Multi-planar / diagonal", "Mixed"]);
    expect(buildExerciseGenome(byName("Sled March")).stance).toBe("Mixed");
  });

  it("does not call a plank, a crunch, a calf raise or a drag curl a gait", () => {
    for (const name of ["RKC Plank", "Cable Crunch", "Standing Calf Raise", "Drag Curl"]) {
      const genome = buildExerciseGenome(byName(name));
      expect(genome.stance, name).toBe("Bilateral");
      expect(genome.movementPatterns, name).not.toContain(name === "Standing Calf Raise" ? "Crawling" : "Locomotion");
    }
  });

  it("keeps the representative originals' scores exactly as they were", () => {
    const fingerprint = (name: string) => buildExerciseGenome(byName(name)).fingerprint;
    const contributions = (name: string) => buildExerciseGenome(byName(name)).muscleProfile.map((entry) => [entry.muscle, entry.contribution]);
    expect(fingerprint("Barbell Bench Press")).toEqual({ hypertrophy: 80, strength: 95, power: 20, stability: 64, mobility: 34, sfr: 93, skill: 34, practicality: 68 });
    expect(contributions("Barbell Bench Press")).toEqual([["chest", 69], ["triceps", 56], ["frontDelts", 55], ["abs", 46]]);
    expect(contributions("Barbell Bent-Over Row")).toEqual([["lats", 69], ["upperBack", 69], ["biceps", 56], ["rearDelts", 55], ["forearms", 55]]);
    expect(contributions("Back Squat")).toEqual([["quads", 82], ["glutes", 82], ["adductors", 82], ["calves", 58], ["abs", 56]]);
    expect(contributions("Romanian Deadlift")).toEqual([["hamstrings", 72], ["glutes", 70], ["lowerBack", 56], ["upperBack", 56], ["forearms", 56], ["abs", 56]]);
    expect(contributions("Nordic Hamstring Curl")).toEqual([["hamstrings", 82], ["calves", 60], ["glutes", 59]]);
    expect(fingerprint("Farmer’s Walk")).toEqual({ hypertrophy: 50, strength: 44, power: 20, stability: 54, mobility: 34, sfr: 72, skill: 22, practicality: 84 });
  });
});

describe("hazard: the seated leg-curl study is matched by meaning, not word order", () => {
  it("gives the single-leg seated curl the seated study and its hamstring floor, and names what the study did not test", () => {
    const curl = byName("Single-Leg Seated Leg Curl");
    const study = getExerciseStudyCalibration(curl)!;
    expect(study.key).toBe("seated-leg-curl");
    expect(study.planningBoundary).toMatch(/one leg on the seated curl, the other on the prone curl/);
    expect(buildMuscleTargetingEstimate(curl, "hamstrings", "Prime mover").score).toBeGreaterThanOrEqual(82);
    expect(getExerciseStudyCalibration(named("Leg Curl (Seated)"))?.key).toBe("seated-leg-curl");
    // The lying curl is the trial's other arm: its own record and floor, never the seated finding.
    const lying = byName("Single-Leg Lying Leg Curl");
    expect(getExerciseStudyCalibration(lying)?.key).toBe("prone-leg-curl");
    expect(buildMuscleTargetingEstimate(lying, "hamstrings", "Prime mover").evidenceTier).toBe("Direct longitudinal exercise evidence");
    // The original two-leg lying curl is untouched by the expansion's records.
    expect(getExerciseStudyCalibration(byName("Lying Leg Curl"))?.key).toBe("free-weight-modality");
  });
});

describe("hazard: equipment access names the new equipment", () => {
  it("leaves specialist equipment out of a profile that does not list it, and in when it does", () => {
    const bag = byName("Sandbag Bear-Hug Carry");
    expect(equipmentMatchesProfile(bag.equipment, gymAccessProfiles["Garage gym"])).toBe(false);
    expect(equipmentMatchesProfile(bag.equipment, [...gymAccessProfiles["Garage gym"], "Sandbag"])).toBe(true);
    expect(equipmentMatchesProfile(bag.equipment, gymAccessProfiles["Commercial gym"])).toBe(true);
    const stack = filterStackForEquipment([byName("Trap-Bar Deadlift"), byName("Conventional Deadlift")], { gymAccess: "Small gym", availableEquipment: gymAccessProfiles["Small gym"] });
    expect(stack.map((exercise) => exercise.name)).toEqual(["Conventional Deadlift"]);
  });
});

describe("hazard: the neck has a region everywhere a muscle is drawn or ranked", () => {
  it("maps both neck keys to the strength region and to the figure's front and back", () => {
    expect(strengthRegionIdsForCatalogMuscles(["neckFlexors"])).toEqual(["neck"]);
    expect(strengthRegionIdsForCatalogMuscles(["neckExtensors", "traps"])).toEqual(["upper_back", "neck"]);
    expect(viewsForRegion("neckFlexors")).toEqual(["front"]);
    expect(viewsForRegion("neckExtensors")).toEqual(["back"]);
    expect(regionKeysForValue("neck")).toEqual(["neckFlexors", "neckExtensors"]);
  });

  it("puts neck work on upper-body and whole-body days, never Push, Pull or Legs", () => {
    const neck = byName("Neck Flexion Machine");
    expect(["Push", "Pull", "Legs", "Upper", "Full Body"].map((split) => matchesTrainingSplit(neck, split as never))).toEqual([false, false, false, true, true]);
  });
});

describe("hazard: every new id has an explicit load convention", () => {
  it("classifies all fifty, none by falling through to total external load", () => {
    const conventions = expansionLoadConventions();
    expect(conventions.size).toBe(50);
    for (let id = 401; id <= 450; id++) expect(conventions.get(id), String(id)).toBe(loadConventionFor(id));
    expect(loadConventionFor(byName("Assisted Pull-Up Machine").id)).toBe("assistance");
    expect(loadConventionFor(byName("Suitcase Carry").id)).toBe("per_hand");
    expect(loadConventionFor(byName("Hand Gripper Close").id)).toBe("resistance_setting");
  });
});

describe("hazard: the server never borrows another catalog exercise's curve by name", () => {
  const index = [
    { exerciseId: "uuid-42", canonicalName: "romanian_deadlift__catalog_42", displayName: "Romanian Deadlift" },
    { exerciseId: "uuid-398", canonicalName: "sled_march", displayName: "Sled March" },
  ];
  it("refuses a name match onto a row that belongs to another id, and keeps the unsuffixed fallback", () => {
    expect(findCurveExercise(index, { catalogExerciseId: 425, exerciseName: "Romanian Deadlift" })).toBeNull();
    expect(findCurveExercise(index, { catalogExerciseId: 42, exerciseName: "Romanian Deadlift" })?.exerciseId).toBe("uuid-42");
    expect(findCurveExercise(index, { catalogExerciseId: 398, exerciseName: "Sled March" })?.exerciseId).toBe("uuid-398");
    const profileIndex = [{ id: "uuid-42", name: "Romanian Deadlift", canonical_name: "romanian_deadlift__catalog_42" }];
    expect(findProfileExercise(profileIndex, { catalogExerciseId: 425, exerciseName: "Romanian Deadlift" })).toBeNull();
    expect(findProfileExercise(profileIndex, { catalogExerciseId: 42, exerciseName: "Romanian Deadlift" })?.id).toBe("uuid-42");
  });
});

describe("hazard: aliases do not distort movement support", () => {
  it("keeps the assisted machine out of records that name the pull-up, and the neck out of hand fighting", () => {
    const pullUpRecords = ["gymnastics-6", "gymnastics-13", "gymnastics-14"].map((id) => getMovementSupport("gymnastics", id));
    expect(pullUpRecords.every((support) => support.specific.some((row) => row.phrase?.toLowerCase() === "pull-up"))).toBe(true);
    // A record that names the assisted pull-up gets the machine.
    expect(getMovementSupport("swimming", "swimming-2").specific.map((row) => row.exercise.name)).toContain("Assisted Pull-Up Machine");
    for (const support of pullUpRecords) expect(support.specific.filter((row) => row.phrase?.toLowerCase() === "pull-up").map((row) => row.exercise.name)).not.toContain("Assisted Pull-Up Machine");
    const handFighting = getMovementSupport("wrestling", "wrestling-17");
    const neckIds = new Set(exercises.filter((exercise) => exercise.category === "Neck").map((exercise) => exercise.id));
    expect([...handFighting.specific, ...handFighting.related].some((row) => neckIds.has(row.exercise.id))).toBe(false);
    // Forearm work reaches hand fighting as muscle support only: it shares the prime movers.
    const pronation = handFighting.muscle.find((row) => row.exercise.name === "Dumbbell Forearm Pronation");
    expect(pronation?.tier).toBe("muscle");
  });
});

describe("numerical fixtures (brief §12)", () => {
  const slots = buildDaySlots(splitDaysForFrequency(5));
  const key = (index: number) => slots[index].key;
  const input = (overrides: Partial<WeekReviewInput>): WeekReviewInput => ({ slots, plan: {}, prescriptions: {}, goal: "Athleticism", catalog: exercises, ...overrides });

  it("counts 3 direct and 4 supporting sets as 3 + 2 = 5, with 4 supporting sets performed", () => {
    // Overhead carry: traps primary. Neck extension machine: traps supporting.
    const carry = byName("Single-Arm Kettlebell Overhead Carry");
    const neck = byName("Neck Extension Machine");
    const week = analyzeWeek(input({ plan: { [key(3)]: [carry, neck] }, prescriptions: { [key(3)]: { [carry.id]: "3 × 20 m", [neck.id]: "4 × 12" } } }));
    const traps = week.muscles.find((muscle) => muscle.key === "traps")!;
    expect([traps.direct, traps.supporting, traps.total, traps.supportingPerformed]).toEqual([3, 2, 5, 4]);
  });

  it("shows a neck row in the week although no split target names the neck", () => {
    const neck = byName("Neck Lateral Flexion Machine");
    const week = analyzeWeek(input({ plan: { [key(3)]: [neck] }, prescriptions: { [key(3)]: { [neck.id]: "3 × 12" } } }));
    expect(week.muscles.find((muscle) => muscle.key === "neckFlexors")).toMatchObject({ label: "Neck flexors", direct: 3, figureKeys: ["neckFlexors"] });
    expect(week.muscles.find((muscle) => muscle.key === "neckExtensors")).toMatchObject({ label: "Neck extensors", direct: 3, figureKeys: ["neckExtensors"] });
  });

  it("keeps two occurrences on different days separate, and more sets change exposure, not mechanics", () => {
    const zercher = byName("Zercher Deadlift");
    const before = buildExerciseGenome(zercher);
    const week = analyzeWeek(input({ plan: { [key(0)]: [zercher], [key(2)]: [zercher] }, prescriptions: { [key(0)]: { [zercher.id]: "3 × 5" }, [key(2)]: { [zercher.id]: "5 × 5" } } }));
    const glutes = week.muscles.find((muscle) => muscle.key === "glutes")!;
    expect(glutes.byDay.filter((day) => day.total > 0).map((day) => day.total)).toEqual([3, 5]);
    expect(buildExerciseGenome(zercher)).toEqual(before);
  });

  it("does not change which movement categories the week board checks", () => {
    expect([...commonMovements(exercises)].sort()).toEqual([...commonMovements(exercises.filter((exercise) => exercise.id <= 400))].sort());
  });

  it("starts a hold or a carry with a time or a distance, keeping the goal's set count", () => {
    expect(getGoalPrescription("Muscle growth", 0, byName("Isometric Neck Lateral Flexion"))).toBe("3 × 20 s");
    expect(getGoalPrescription("Max strength", 0, byName("Suitcase Carry"))).toBe("4 × 30 m");
    expect(getGoalPrescription("Max strength", 0, byName("Zercher Deadlift"))).toBe("4 × 3–5");
    expect(measurementFor(byName("Zercher Deadlift").id)).toMatchObject({ mode: "load_reps", e1rmEligible: true, explicit: true });
  });

  it("rates a new exercise most similar to its own family and least to an unrelated one", () => {
    const trap = byName("Trap-Bar Deadlift");
    const deadlift = exerciseSimilarity(trap, byName("Conventional Deadlift"));
    expect(deadlift).toBeGreaterThan(exerciseSimilarity(trap, byName("Cable Lateral Raise")));
    expect(deadlift).toBeGreaterThan(exerciseSimilarity(trap, byName("Neck Flexion Machine")));
    // An unestablished curve is left out, not scored as a mismatch: identical other inputs read 100.
    expect(exerciseSimilarity(trap, trap)).toBe(100);
  });
});
