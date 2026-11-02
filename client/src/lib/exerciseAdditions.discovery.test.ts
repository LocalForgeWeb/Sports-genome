import { describe, expect, it } from "vitest";
import { exercises, type Exercise } from "@/lib/exerciseCatalog";
import { rankExerciseMatches } from "@/lib/exerciseSearch";
import { searchEverything } from "@/lib/universalSearch";
import { catalogSublabelOf, executionCreditOf, isProvisionalCatalogId, setCreditMusclesOf } from "@/lib/exerciseExecution";
import { pickerRequirementNote, pickerSetupLine } from "@/lib/pickerRowFacts";
import { catalogKeysFor, searchAliasesFor, trainsMuscle } from "@/lib/muscleVocabulary";
import { regionKeysForValue, roleMapForLists } from "@/lib/anatomyRegions";
import { muscleModeExercises } from "@/lib/catalogDiscovery";
import { defaultEquipmentProfile, exerciseFitsProfile, filterStackForEquipment, gymAccessProfiles, missingAccessories, type AthleteEquipmentProfile } from "@/lib/equipmentProfile";
import { getMovementRecommendations, getSportSession } from "@/lib/movementRecommendations";
import { sportMovementProfiles, sportProfiles } from "@/lib/sportMovementDatabase";
import { getSplitExercisePool } from "@/lib/splitAssignment";
import { getMovementSupport } from "@/lib/movementSupport";
import { swapSuggestions } from "@/lib/workoutSwap";
import { getSegmentPrioritySuggestions } from "@/lib/segmentPrioritySuggestions";
import { rankingLiftsForRegion } from "@/lib/rankRecommendations";
import { strengthRegionDefinitions } from "../../../shared/strengthGenomeDefinitions";
import { getExerciseStudyCalibration } from "@/lib/exerciseStudyCalibration";
import { buildMuscleTargetingEstimate } from "@/lib/muscleTargetingModel";
import { getExerciseGenome } from "@/lib/exerciseGenome";
import { muscleRankLiftSelection } from "@/lib/muscleRankLifts";
import { summarizeWithinAthleteStrengthComparisons } from "@/lib/withinAthleteStrengthChange";
import { workoutStrengthObservations } from "@/lib/workoutStrengthRecord";
import { rankAgainstPowerliftingNorms } from "@/lib/powerliftingReference";
import { getWeeklyMuscleVolume } from "@/lib/weeklyVolume";
import { getSessionMuscleVolume } from "@/lib/sessionVolume";
import { analyzeWholeStackMuscles } from "@/lib/stackMuscleAnalysis";
import { exercisePhotoSet } from "@/lib/exercisePhotos";
import type { DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";

/**
 * The Zercher, neck and bench rows (2 Nov 2026) as the rest of the app reads them: found by every
 * picker under the words athletes use (T01, T02), told apart by a set-up line and never chosen for
 * the athlete; neck its own key; kept out of everything the app puts forward on its own (T11) and
 * out of every rank, percentile and estimated max (T22); credited by role, not by tag; and shown
 * with the deliberate fallback where no photograph is exact (T26).
 */

const byId = new Map<number, Exercise>(exercises.map((exercise) => [exercise.id, exercise]));
const ex = (id: number) => byId.get(id)!;
const ids = (list: readonly Exercise[]) => list.map((exercise) => exercise.id);
const PROVISIONAL = Array.from({ length: 23 }, (_, index) => 421 + index);
const ZERCHER = [164, 300, 421, 422, 423, 424];
const NECK = Array.from({ length: 12 }, (_, index) => 425 + index);
const CABLE_NECK = [429, 430, 431, 432];
const universalExerciseIds = (query: string) => searchEverything(query).find((group) => group.type === "exercise")?.results.map((result) => Number(result.id)) ?? [];

describe("T01: \"zercher\" in every picker", () => {
  it("returns the six protocols - 164 and 300 among them - and nothing else, in the shared matcher every picker uses", () => {
    const found = rankExerciseMatches(exercises, "zercher");
    expect(ids(found.map((match) => match.exercise)).sort((a, b) => a - b)).toEqual(ZERCHER);
  });

  it("gives each a set-up line that tells it apart, the same line in every picker", () => {
    const lines = ZERCHER.map((id) => pickerSetupLine(ex(id)));
    expect(new Set(lines).size).toBe(6);
    expect(lines.map((line) => line.split(" · ")[0])).toEqual(["Squat", "Carry", "Floor pull", "Elevated pull", "Hip hinge", "Hold"]);
    for (const id of ZERCHER) expect(catalogSublabelOf(id), String(id)).toBe(pickerSetupLine(ex(id)));
  });

  it("returns all six in the global search too, each with that line as its context, past the per-type limit of five", () => {
    expect(universalExerciseIds("zercher").sort((a, b) => a - b)).toEqual(ZERCHER);
    const results = searchEverything("zercher").find((group) => group.type === "exercise")!.results;
    for (const result of results) expect(result.context).toBe(catalogSublabelOf(Number(result.id)));
  });

  it("never leaves one protocol to be chosen for the athlete: several match equally, so none is an exact name", () => {
    const found = rankExerciseMatches(exercises, "zercher");
    expect(found.filter((match) => match.kind === "exact")).toEqual([]);
    expect(found.every((match) => match.kind === "alias")).toBe(true);
    // A protocol's own words still find it first.
    expect(rankExerciseMatches(exercises, "zercher rdl")[0].exercise.id).toBe(423);
    expect(rankExerciseMatches(exercises, "zercher block pull")[0].exercise.id).toBe(422);
  });
});

describe("T02: \"incline bench machine\"", () => {
  it("returns the existing 12 and the new plate-loaded 437, each once, labelled by its equipment", () => {
    const found = ids(rankExerciseMatches(exercises, "incline bench machine").map((match) => match.exercise));
    expect(found[0]).toBe(12);
    expect(found).toContain(437);
    expect(found.filter((id) => id === 12)).toHaveLength(1);
    expect(new Set(found).size).toBe(found.length);
    expect(pickerSetupLine(ex(12))).toBe("Machine, type not specified · incline");
    expect(pickerSetupLine(ex(437))).toBe("Plate-loaded machine · incline, plates per arm");
    expect(universalExerciseIds("incline bench machine")).toEqual(expect.arrayContaining([12, 437]));
    // "machine incline press" is 12's too (existingRowAliases), and 12 keeps its unspecified machine.
    expect(rankExerciseMatches(exercises, "machine incline press")[0].exercise.id).toBe(12);
    expect(isProvisionalCatalogId(12)).toBe(false);
  });
});

describe("neck: its own key, found by its names, never the trapezius", () => {
  it("finds the twelve neck rows by \"neck\", \"cervical\" and \"SCM\", in the matcher and in muscle mode", () => {
    for (const query of ["neck", "cervical", "scm", "sternocleidomastoid"]) {
      const found = rankExerciseMatches(exercises, query);
      expect(ids(found.slice(0, 12).map((match) => match.exercise)).sort((a, b) => a - b), query).toEqual(NECK);
      // Anything after them is a spelling guess ("neck" is one letter from Pec Deck), ranked last.
      expect(found.slice(12).every((match) => match.kind === "fuzzy"), query).toBe(true);
    }
    expect(ids(muscleModeExercises(exercises, "neck"))).toEqual(NECK);
    expect(searchAliasesFor("neck").sort()).toEqual(["SCM", "cervical", "neck extensors", "neck flexors", "sternocleidomastoid"]);
  });

  it("offers Neck as a muscle in global search, under its own name, for \"cervical\" as for \"neck\"", () => {
    for (const query of ["neck", "cervical"]) {
      const muscles = searchEverything(query).find((group) => group.type === "muscle")?.results ?? [];
      expect(muscles.map((result) => [result.id, result.label]), query).toContainEqual(["neck", "Neck"]);
    }
  });

  it("routes no neck name to the trapezius, and paints no drawn shape for it", () => {
    for (const name of ["cervical", "sternocleidomastoid", "SCM", "neck flexors", "neck extensors"]) expect(catalogKeysFor(name), name).toEqual(["neck"]);
    for (const id of NECK) {
      expect(ex(id).primaryMuscles, String(id)).toEqual(["neck"]);
      expect(trainsMuscle(ex(id), "traps"), String(id)).toBeNull();
    }
    expect(regionKeysForValue("neck")).toEqual([]);
    expect(roleMapForLists(["neck"], [])).toEqual({});
  });
});

describe("T11: equipment a broad word does not imply", () => {
  const cableNoHarness: AthleteEquipmentProfile = { gymAccess: "Small gym", availableEquipment: gymAccessProfiles["Small gym"] };
  const withHarness: AthleteEquipmentProfile = { ...cableNoHarness, accessories: ["head_harness", "neck_machine"] };

  it("does not count Cable as a head harness or Machine as a neck machine, and has neither by default", () => {
    expect(defaultEquipmentProfile.accessories).toBeUndefined();
    for (const id of CABLE_NECK) {
      expect(exerciseFitsProfile(ex(id), cableNoHarness), String(id)).toBe(false);
      expect(missingAccessories(ex(id), cableNoHarness), String(id)).toEqual(["head_harness"]);
      expect(exerciseFitsProfile(ex(id), withHarness), String(id)).toBe(true);
    }
    expect(exerciseFitsProfile(ex(425), defaultEquipmentProfile)).toBe(false);
    expect(ids(filterStackForEquipment(exercises, cableNoHarness)).filter((id) => [...CABLE_NECK, 425, 426, 427, 428].includes(id))).toEqual([]);
    // Everything else is as before: the rows without an accessory pass on their equipment word alone.
    expect(filterStackForEquipment(exercises.filter((exercise) => exercise.id <= 420), cableNoHarness)).toHaveLength(exercises.filter((exercise) => exercise.id <= 420 && cableNoHarness.availableEquipment.includes(exercise.equipment as never)).length + exercises.filter((exercise) => exercise.id <= 420 && exercise.equipment === "Free weights").length);
  });

  it("never recommends a cable neck row - nor any provisional row - for any sport, harness or not, and the manual picker says what it needs", () => {
    for (const profile of [cableNoHarness, withHarness, undefined]) {
      for (const sport of sportProfiles) {
        const session = getSportSession(sport.id, "Athleticism", 12, profile);
        expect(session.filter((item) => isProvisionalCatalogId(item.exercise.id)).map((item) => item.exercise.id), sport.id).toEqual([]);
      }
    }
    for (const movement of sportMovementProfiles.filter((profile) => profile.sportId === "wrestling")) {
      expect(getMovementRecommendations(movement, 40, undefined, undefined, withHarness).filter((item) => isProvisionalCatalogId(item.exercise.id)), movement.id).toEqual([]);
    }
    for (const id of CABLE_NECK) expect(pickerRequirementNote(ex(id)), String(id)).toBe("Needs a head harness");
    expect(pickerRequirementNote(ex(425))).toBe("Needs a neck machine");
    expect(pickerRequirementNote(ex(433))).toBeNull();
    expect(pickerRequirementNote(ex(1))).toBeNull();
  });
});

describe("nothing the app puts forward on its own holds a provisional row", () => {
  it("leaves them out of generated days, sport movements' exercises, swap and segment suggestions and ranking lifts", () => {
    for (const split of ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Sport Transfer"] as const) {
      expect(getSplitExercisePool(exercises, split).filter((exercise) => isProvisionalCatalogId(exercise.id)), split).toEqual([]);
    }
    for (const movement of sportMovementProfiles.slice(0, 60)) {
      const support = getMovementSupport(movement.sportId, movement.id);
      expect([...support.specific, ...support.related, ...support.muscle].filter((row) => isProvisionalCatalogId(row.exercise.id)), movement.id).toEqual([]);
    }
    // A bench press swaps to the catalog's own presses; a neck row swaps among neck rows, since neck was chosen.
    expect(swapSuggestions(ex(1), exercises, new Set(), 30).filter((exercise) => isProvisionalCatalogId(exercise.id))).toEqual([]);
    expect(swapSuggestions(ex(425), exercises, new Set()).every((exercise) => NECK.includes(exercise.id))).toBe(true);
    expect(getSegmentPrioritySuggestions({ status: "review", muscle: "neck" } as never, [], exercises, [])).toEqual([]);
    for (const region of strengthRegionDefinitions) expect(rankingLiftsForRegion(region.id).filter((lift) => isProvisionalCatalogId(lift.exercise.id)), region.id).toEqual([]);
  });
});

describe("T22: no comparison borrowed by a name", () => {
  const set = (weight: string, reps: string) => ({ weight, reps, height: "", completed: true, skipped: false });
  const session: DeviceWorkoutSession = {
    id: "s1", title: "Push", dayLabel: "Week 1 · Push", startedAt: "2026-11-02T18:00:00.000Z", completedAt: "2026-11-02T19:00:00.000Z", status: "completed",
    exercises: [
      { id: "a", exerciseName: "Paused Barbell Bench Press", catalogId: 442, plannedPrescription: "3 × 5", sets: [set("100", "5")] },
      { id: "b", exerciseName: "Spoto Press", catalogId: 443, plannedPrescription: "3 × 5", sets: [set("95", "5")] },
      { id: "c", exerciseName: "Barbell Bench Press", catalogId: 1, plannedPrescription: "3 × 5", sets: [set("100", "5")] },
    ],
  } as DeviceWorkoutSession;

  it("carries no provisional set into the strength record, so no estimated max, rank or trend reads it", () => {
    expect(workoutStrengthObservations([session], "kg").map((observation) => observation.exerciseName)).toEqual(["Barbell Bench Press"]);
    const typed = [442, 443].map((id, index) => ({ id: `t${index}`, exerciseName: ex(id).name, loadKg: 100, repetitions: 5, measurementType: "MULTI_REP", observedAt: "2026-11-02T18:00:00.000Z", bodyMassKgAtTest: 80 }));
    expect(muscleRankLiftSelection(typed, [], 80).lifts).toEqual([]);
    const history = [442, 442].map((id, index) => ({ id: index, exerciseName: ex(id).name, catalogExerciseId: id, measurementType: "MULTI_REP", observedAt: `2026-10-${10 + index}T18:00:00.000Z`, loadKg: 100 + index * 10, repetitions: 5 }));
    expect(summarizeWithinAthleteStrengthComparisons(history).comparable).toEqual([]);
    // The same two sets on the catalog's bench press do make a trend.
    expect(summarizeWithinAthleteStrengthComparisons(history.map((observation) => ({ ...observation, exerciseName: "Barbell Bench Press", catalogExerciseId: 1 }))).comparable).toHaveLength(1);
  });

  it("matches no norm by name: \"bench press\" in a name is not the bench press", () => {
    for (const id of [442, 443, 441, 440]) {
      expect(rankAgainstPowerliftingNorms({ exerciseName: ex(id).name, measurementType: "MEASURED_1RM", loadKg: 100, bodyMassKgAtTest: 80, sex: "male", ageYears: 30 } as never).status, String(id)).toBe("unsupported");
      expect(getExerciseStudyCalibration(ex(id)), String(id)).toBeNull();
      expect(ex(id).evidenceContext, String(id)).toBeUndefined();
    }
    // The catalog's own bench press keeps its study context.
    expect(getExerciseStudyCalibration(ex(1))?.key).toBe("bench-angle");
  });
});

describe("no name-based reading for a provisional row", () => {
  it("reads a Zercher good morning, a neck extension and a hold by role and equipment, not by the words in their names", () => {
    for (const id of [423, 426, 434, 424, 442]) {
      const genome = getExerciseGenome(ex(id))!;
      expect(getExerciseStudyCalibration(ex(id)), String(id)).toBeNull();
      // "good morning" would read as a lengthened bias; "extension" as a shortened one.
      expect(genome.resistanceProfile.bias, String(id)).not.toBe("Lengthened");
      expect(genome.resistanceProfile.bias, String(id)).not.toBe("Shortened");
      const estimate = buildMuscleTargetingEstimate(ex(id), genome.muscleProfile[0].muscle, genome.muscleProfile[0].role);
      expect(estimate.evidenceTier, String(id)).toBe("Conditional mechanics ranking");
      expect(estimate.uncertainty, String(id)).toMatch(/^A provisional exercise/);
    }
  });
});

describe("role-aware credit (weekly, session and stack analysis)", () => {
  it("gives a Zercher pull's cradle no set credit: the elbow flexors and trunk steady, the hips and legs lift", () => {
    expect(setCreditMusclesOf(ex(421))).toEqual({ direct: ["glutes", "quads"], support: ["hamstrings", "adductors"] });
    expect(executionCreditOf(421)!.steadying).toEqual(["abs", "lowerBack", "upperBack", "biceps", "brachialis"]);
    const session = getSessionMuscleVolume([ex(421)], () => 3);
    expect(session.map((entry) => entry.muscle).sort()).toEqual(["adductors", "glutes", "hamstrings", "quads"]);
    const weekly = getWeeklyMuscleVolume({ "Week 1 · Legs": [ex(421), ex(424)] }, { "Week 1 · Legs": { 421: "3 × 5", 424: "2 × 20 sec" } }, "Max strength");
    expect(weekly.find((entry) => entry.muscle === "biceps")).toBeUndefined();
    expect(weekly.find((entry) => entry.muscle === "glutes")?.directSets).toBe(3);
    // The hold steadies only, so it adds no sets anywhere; its seconds are never sets or reps.
    expect(setCreditMusclesOf(ex(424))).toEqual({ direct: [], support: [] });
    // The stack analysis keeps the elbow flexors, as stabilizers.
    const stack = analyzeWholeStackMuscles([ex(421)]);
    expect(stack.find((entry) => entry.muscle === "biceps")?.contributions.map((contribution) => contribution.role)).toEqual(["Stabilizer"]);
    expect(getExerciseGenome(ex(421))!.muscleProfile.filter((entry) => entry.role === "Prime mover").map((entry) => entry.muscle)).toEqual(["glutes", "quads"]);
  });

  it("counts a neck row toward the neck alone, and a press as before", () => {
    for (const id of NECK) expect(setCreditMusclesOf(ex(id)), String(id)).toEqual({ direct: ["neck"], support: [] });
    const weekly = getWeeklyMuscleVolume({ day: [ex(425), ex(431), ex(435)] }, { day: { 425: "3 × 12", 431: "2 × 12", 435: "2 × 20 sec" } }, "Athleticism");
    expect(weekly.map((entry) => [entry.muscle, entry.label, entry.directSets])).toEqual([["neck", "Neck", 7]]);
    expect(setCreditMusclesOf(ex(442))).toEqual({ direct: ["chest"], support: ["triceps", "frontDelts"] });
    // A row with no execution record reads its tags, unchanged.
    expect(setCreditMusclesOf(ex(1))).toEqual({ direct: ex(1).primaryMuscles, support: ex(1).secondaryMuscles.filter((key) => !ex(1).primaryMuscles.includes(key)) });
  });
});

describe("T26: media", () => {
  it("photographs only the five rows whose source photograph shows exactly their set-up; every other new row has the placeholder", () => {
    const photographed = PROVISIONAL.filter((id) => exercisePhotoSet(id) !== null);
    expect(photographed).toEqual([428, 437, 439, 440, 441]);
    expect(exercisePhotoSet(440)!.urls[0]).toMatch(/Smith_Machine_Decline_Press\/1\.jpg$/);
    // The bench press, good morning and pause-bench photographs never reach a new row by its name.
    for (const id of [423, 442, 443, 433, 434, 435]) expect(exercisePhotoSet(id), String(id)).toBeNull();
  });
});
