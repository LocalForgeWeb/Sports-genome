import { describe, expect, it } from "vitest";
import { aggregateMuscleStrength, directnessOf, MUSCLE_AGGREGATION_METHOD, MUSCLE_AGGREGATION_VERSION } from "./muscleAggregation";
import { liveMuscleAggregation as live } from "./fixtures/liveMuscleAggregation";

/**
 * D-016: a lift counts for more the more of its work the muscle does.
 *
 * The owner's chest read Regional from a pec deck fly at the 86th and two presses at the 60th
 * and 67th: the presses spoke first because their sets were the more confident, and nothing in
 * the database's weights knew that a fly is nearly half chest while a press shares the load
 * with the shoulders and the triceps. The fixture is the database's own rows and outputs.
 */
const tables = { exercises: live.exercises, muscles: live.muscles, mappings: live.mappings };
const BENCH = "03c880ed-4138-4217-92c2-28fff50845d1";
const FLY = "358df10a-41ee-4d16-8dad-275dbe708567";
const PEC = "pectoralis_major_sternocostal";

const mappingsOf = (exerciseId: string) => live.mappings.filter((m) => m.exercise_id === exerciseId);
const mappingFor = (exerciseId: string, muscleId: string) => mappingsOf(exerciseId).find((m) => m.muscle_id === muscleId)!;
const pecId = live.muscles.find((m) => m.canonical_name === PEC)!.id;

const both = (set: keyof typeof live.inputs) => ({
  before: aggregateMuscleStrength(live.inputs[set], tables, { directness: false }),
  after: aggregateMuscleStrength(live.inputs[set], tables),
});
const muscle = (result: ReturnType<typeof aggregateMuscleStrength>, canonicalName: string) => result.muscles.find((m) => m.muscle_canonical_name === canonicalName)!;

describe("Directness: the muscle's share of the lift's mover contribution", () => {
  it("reads the sternocostal pec through a fly at about twice the share of a bench press", () => {
    const fly = directnessOf(mappingFor(FLY, pecId), mappingsOf(FLY));
    const bench = directnessOf(mappingFor(BENCH, pecId), mappingsOf(BENCH));
    // 0.98 of 2.10 mover weight against 0.95 of 3.93: the database's numbers in a ratio.
    expect(fly).toBeCloseTo(0.467, 3);
    expect(bench).toBeCloseTo(0.242, 3);
    expect(fly / bench).toBeGreaterThan(1.9);
  });

  it("reads a lift with one mover at 1, and a stabilizer against the movers plus itself", () => {
    const solo = [{ exercise_id: "e", muscle_id: "m", role: "primary", contribution_weight: 0.9, confidence_score: 90 }];
    expect(directnessOf(solo[0], solo)).toBe(1);
    const withStabilizer = [...solo, { exercise_id: "e", muscle_id: "s", role: "stabilizer", contribution_weight: 0.3, confidence_score: 70 }];
    expect(directnessOf(withStabilizer[0], withStabilizer)).toBe(1);
    expect(directnessOf(withStabilizer[1], withStabilizer)).toBeCloseTo(0.3 / 1.2, 6);
  });

  it("falls back to the database's role defaults when a mapping has no weight", () => {
    const rows = [
      { exercise_id: "e", muscle_id: "a", role: "primary", contribution_weight: null, confidence_score: null },
      { exercise_id: "e", muscle_id: "b", role: "secondary", contribution_weight: null, confidence_score: null },
    ];
    expect(directnessOf(rows[0], rows)).toBeCloseTo(0.75 / 1.15, 6);
  });
});

describe("What directness changes", () => {
  /** The owner's case with the presses the more confident sets: the fly had been decayed to rank 3. */
  it("lets the most direct lift lead its movement pattern, however confident the presses were", () => {
    const { before, after } = both("set_b");
    const wasFly = muscle(before, PEC).evidence.find((e) => e.exercise_id === FLY)!;
    const isFly = muscle(after, PEC).evidence.find((e) => e.exercise_id === FLY)!;
    expect(wasFly.redundancy_rank).toBe(3);
    expect(isFly.redundancy_rank).toBe(1);
    expect(isFly.weight_share).toBeGreaterThan(0.5);
    expect(muscle(after, PEC).evidence[0].exercise_id).toBe(FLY);
  });

  it("raises the chest when the fly is the stronger lift, and lowers it when the fly is the weaker", () => {
    const stronger = both("set_a");
    expect(muscle(stronger.after, PEC).strength_percentile).toBeGreaterThan(muscle(stronger.before, PEC).strength_percentile);
    const weaker = both("set_f");
    expect(muscle(weaker.after, PEC).strength_percentile).toBeLessThan(muscle(weaker.before, PEC).strength_percentile);
  });

  it("never moves a muscle whose lifts are equally direct: two presses, or one lift", () => {
    for (const set of ["set_g", "set_h"] as const) {
      const { before, after } = both(set);
      expect(after.muscles.map((m) => [m.muscle_canonical_name, m.strength_percentile, m.confidence]))
        .toEqual(before.muscles.map((m) => [m.muscle_canonical_name, m.strength_percentile, m.confidence]));
    }
  });
});

describe("What directness leaves alone", () => {
  it("keeps the database's confidence for every muscle: how much evidence there is has not changed", () => {
    for (const set of Object.keys(live.inputs) as (keyof typeof live.inputs)[]) {
      const { before, after } = both(set);
      for (const was of before.muscles) {
        expect(muscle(after, was.muscle_canonical_name).confidence, `${set} ${was.muscle_canonical_name}`).toBe(was.confidence);
      }
    }
  });

  it("keeps each lift's own transferred percentile", () => {
    const { before, after } = both("set_a");
    for (const was of muscle(before, PEC).evidence) {
      const is = muscle(after, PEC).evidence.find((e) => e.exercise_id === was.exercise_id)!;
      expect(is.transferred_percentile).toBe(was.transferred_percentile);
      expect(is.signal_transfer).toBe(was.signal_transfer);
    }
  });
});

describe("What the evidence says about itself", () => {
  it("carries each lift's directness and its share of the rank, strongest first, summing to one", () => {
    const pec = muscle(both("set_a").after, PEC);
    const shares = pec.evidence.map((e) => e.weight_share);
    expect(shares).toEqual([...shares].sort((a, b) => b - a));
    expect(shares.reduce((sum, share) => sum + share, 0)).toBeCloseTo(1, 2);
    pec.evidence.forEach((e) => { expect(e.directness).toBeGreaterThan(0); expect(e.directness).toBeLessThanOrEqual(1); });
  });

  it("names its own version and method", () => {
    const result = both("set_a").after;
    expect(result.scoring_version).toBe(MUSCLE_AGGREGATION_VERSION);
    expect(result.aggregation_method).toBe(MUSCLE_AGGREGATION_METHOD);
    expect(MUSCLE_AGGREGATION_VERSION).toBe("sg_muscle_aggregate_v2");
  });

  it("ignores a mapping whose exercise or muscle is not on file, as the database's joins do", () => {
    const result = aggregateMuscleStrength([{ exercise_id: BENCH, percentile: 60, confidence: 0.8 }], { ...tables, muscles: [] });
    expect(result.status).toBe("no_evidence");
  });
});
