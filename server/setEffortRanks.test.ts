import { describe, expect, it, vi } from "vitest";
import { scoreMuscleProfile } from "./supabaseStrengthProfile";
import { aggregateMuscleStrength, aggregateMuscleStrengthWithFloors } from "./muscleAggregation";
import { liveMuscleAggregation as live } from "./fixtures/liveMuscleAggregation";

/**
 * A set stopped short of failure is a floor (owner, 15 Oct 2026): "good mornings are usually low
 * weight and that shouldn't be used to give someone a lower ranking, especially when they have more
 * strenuous and demanding exercises." It may raise a muscle's rank, never lower it.
 *
 * The fixture's back squat and Romanian deadlift share the lower back (erector spinae: the squat
 * as a stabilizer, the deadlift as a mover), which is the good morning's case.
 */
const catalog = { exercises: live.exercises, muscles: live.muscles };
const id = (canonicalName: string) => live.exercises.find((row) => row.canonical_name === canonicalName)!.id;
const SQUAT = id("back_squat__catalog_161");
const RDL = id("romanian_deadlift__catalog_42");

/** Answers like `score_strength_profile_v1`: each observation comes back on its score as sent. */
function client(percentileByExercise: Record<string, number>) {
  return {
    getExerciseIndex: vi.fn(),
    getMuscles: vi.fn(),
    getMuscleMappings: vi.fn(async (ids: readonly string[]) => live.mappings.filter((row) => ids.includes(row.exercise_id))),
    scoreProfile: vi.fn(async (_bw: number, _sex: string, observations: Record<string, unknown>[]) => ({
      status: "ok",
      exercise_scores: observations.map((observation) => ({
        status: "ok",
        exercise_id: observation.exercise_id,
        overall_confidence: 0.8,
        percentile: { percentile_estimate: percentileByExercise[observation.exercise_id as string] ?? 50 },
        input_observation: observation,
      })),
      estimated_only: [],
      failures: [],
    })),
    adjustForAge: vi.fn(),
  };
}

const squat = { exerciseName: "Back Squat", catalogExerciseId: 161, bodyMassKg: 80, loadKg: 160, repetitions: 3 };
const rdl = (notToFailure?: boolean) => ({ exerciseName: "Romanian Deadlift", catalogExerciseId: 42, bodyMassKg: 80, loadKg: 60, repetitions: 8, ...(notToFailure ? { notToFailure } : {}) });

async function ranks(lifts: Parameters<typeof scoreMuscleProfile>[2]["lifts"], percentiles: Record<string, number>) {
  const fake = client(percentiles);
  const result = await scoreMuscleProfile(fake, catalog, { sex: "male", lifts });
  if (result.status === "unavailable") throw new Error("expected ranks");
  return { result, fake, muscle: (name: string) => result.muscles.find((muscle) => muscle.canonicalName === name) };
}

describe("A set stopped short of failure in the muscle ranks", () => {
  it("is sent with its lift and comes back on its score", async () => {
    const { fake } = await ranks([squat, rdl(true)], { [SQUAT]: 85, [RDL]: 20 });
    const sent = fake.scoreProfile.mock.calls[0][2] as Record<string, unknown>[];
    expect(sent.find((observation) => observation.exercise_id === RDL)).toMatchObject({ not_to_failure: true });
    expect(sent.find((observation) => observation.exercise_id === SQUAT)).not.toHaveProperty("not_to_failure");
  });

  it("never lowers a muscle that harder lifts rank", async () => {
    const alone = await ranks([squat], { [SQUAT]: 85 });
    const measured = await ranks([squat, rdl(false)], { [SQUAT]: 85, [RDL]: 20 });
    const floor = await ranks([squat, rdl(true)], { [SQUAT]: 85, [RDL]: 20 });
    const before = alone.muscle("erector_spinae")!.percentile;
    // Taken to failure, a weak deadlift is a measurement and pulls the lower back down.
    expect(measured.muscle("erector_spinae")!.percentile).toBeLessThan(before);
    // Stopped short of failure, it is left out wherever it would lower a muscle.
    expect(floor.muscle("erector_spinae")!.percentile).toBe(before);
    expect(floor.muscle("erector_spinae")!.evidence.map((item) => item.exerciseName)).not.toContain("Romanian Deadlift");
    expect(floor.muscle("gluteus_maximus")!.percentile).toBe(alone.muscle("gluteus_maximus")!.percentile);
  });

  it("raises a muscle where it places higher, and says it was not to failure", async () => {
    const alone = await ranks([squat], { [SQUAT]: 60 });
    const floor = await ranks([squat, rdl(true)], { [SQUAT]: 60, [RDL]: 92 });
    const back = floor.muscle("erector_spinae")!;
    expect(back.percentile).toBeGreaterThan(alone.muscle("erector_spinae")!.percentile);
    expect(back.evidence.find((item) => item.exerciseName === "Romanian Deadlift")).toMatchObject({ notToFailure: true });
    expect(back.atLeast).toBeUndefined();
  });

  it("still ranks a muscle it alone reads, as at least that much", async () => {
    const { muscle } = await ranks([squat, rdl(true)], { [SQUAT]: 85, [RDL]: 20 });
    // Only the deadlift reads the hamstrings here: a floor is all there is, so it shows - as a floor.
    const hamstring = muscle("semitendinosus")!;
    expect(hamstring.percentile).toBeGreaterThan(0);
    expect(hamstring.atLeast).toBe(true);
    expect(hamstring.evidence[0]).toMatchObject({ notToFailure: true });
    expect(muscle("erector_spinae")!.atLeast).toBeUndefined();
  });

  it("changes nothing for lifts taken to failure", async () => {
    const tables = { mappings: live.mappings, muscles: live.muscles, exercises: live.exercises };
    const scores = [{ exercise_id: SQUAT, percentile: 85, confidence: 0.8 }, { exercise_id: RDL, percentile: 20, confidence: 0.8 }];
    expect(aggregateMuscleStrengthWithFloors(scores, [], tables)).toEqual(aggregateMuscleStrength(scores, tables));
  });
});
