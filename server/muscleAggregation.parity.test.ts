import { describe, expect, it } from "vitest";
import { aggregateMuscleStrength, movementKey, type AggregationResult } from "./muscleAggregation";
import { liveMuscleAggregation as live } from "./fixtures/liveMuscleAggregation";

/**
 * The server's aggregation is the database's, to the rounding it reports (D-016).
 *
 * Every expected value is what `aggregate_muscle_strength_v1` returned on 30 September 2026
 * for the fixture's inputs, over the rows it joins (`server/fixtures/liveMuscleAggregation.ts`,
 * recorded by one read-only query: the exercises, muscles and mappings for nine catalog
 * exercises, and the function's answer for each input set). With directness switched off the
 * transcription must reproduce every muscle, every evidence row and every number.
 *
 * The database rounds percentiles to 2 places, weights to 4 and the rest to 3; doubles and
 * numerics can differ in the last place at a rounding edge, so each is held to half a unit.
 */
const tables = { exercises: live.exercises, muscles: live.muscles, mappings: live.mappings };
const sets = Object.keys(live.inputs) as (keyof typeof live.inputs)[];

const closeTo = (actual: number, expected: number, places: number) =>
  expect(Math.abs(actual - expected), `${actual} vs ${expected}`).toBeLessThanOrEqual(0.5 / 10 ** places + 1e-9);

function transcription(set: keyof typeof live.inputs): AggregationResult {
  return aggregateMuscleStrength(live.inputs[set], tables, { directness: false });
}

describe("The transcription reproduces the database, muscle for muscle", () => {
  it.each(sets)("%s", (set) => {
    const expected = live.outputs[set];
    const actual = transcription(set);
    expect(actual.status).toBe(expected.status);
    expect(actual.scoring_version).toBe(expected.scoring_version);
    expect(actual.aggregation_method).toBe(expected.aggregation_method);
    expect(actual.muscles.map((m) => m.muscle_canonical_name)).toEqual(expected.muscles.map((m) => m.muscle_canonical_name));
    for (const wanted of expected.muscles) {
      const got = actual.muscles.find((m) => m.muscle_id === wanted.muscle_id)!;
      closeTo(got.strength_percentile, wanted.strength_percentile, 2);
      closeTo(got.confidence, wanted.confidence, 3);
      expect(got.evidence_count).toBe(wanted.evidence_count);
      expect(got.movement_pattern_count).toBe(wanted.movement_pattern_count);
      expect(got.muscle_name).toBe(wanted.muscle_name);
      expect(got.region).toBe(wanted.region);
      expect(got.muscle_group).toBe(wanted.muscle_group);
      expect(got.evidence.map((e) => e.exercise_id)).toEqual(wanted.evidence.map((e) => e.exercise_id));
      wanted.evidence.forEach((row, index) => {
        const item = got.evidence[index];
        expect(item.exercise_name).toBe(row.exercise_name);
        expect(item.role).toBe(row.role);
        expect(item.movement_pattern).toBe(row.movement_pattern);
        expect(item.redundancy_rank).toBe(row.redundancy_rank);
        closeTo(item.exercise_percentile, row.exercise_percentile, 2);
        closeTo(item.transferred_percentile, row.transferred_percentile, 2);
        closeTo(item.signal_transfer, row.signal_transfer, 3);
        closeTo(item.observation_confidence, row.observation_confidence, 3);
        closeTo(item.contribution_weight, row.contribution_weight, 3);
        closeTo(item.mapping_confidence, row.mapping_confidence, 3);
        closeTo(item.redundancy_factor, row.redundancy_factor, 3);
        closeTo(item.effective_weight, row.effective_weight, 4);
      });
    }
  });

  /** set_e sends the fly twice and a percentile past each edge: the database's dedup and clamps. */
  it("keeps the database's dedup (most confident, then best placed) and its [1, 99] clamp", () => {
    const pec = transcription("set_e").muscles.find((m) => m.muscle_canonical_name === "pectoralis_major_sternocostal")!;
    expect(pec.evidence.find((e) => e.exercise_name === "Pec Deck Fly")?.exercise_percentile).toBe(40);
    expect(pec.evidence.find((e) => e.exercise_name === "Barbell Bench Press")?.exercise_percentile).toBe(99);
  });

  it("groups movement patterns the way the database keys them", () => {
    expect(movementKey({ id: "x", name: "Bench", movement_pattern: "Horizontal push" })).toBe(live.movementKeyOfHorizontalPush);
    expect(movementKey({ id: "x", name: "Bench", movement_pattern: null })).toBe("x");
  });

  it("answers no_evidence, as the database does, for nothing", () => {
    expect(aggregateMuscleStrength([], tables, { directness: false })).toEqual({ status: "no_evidence", scoring_version: "strength_beta_v1", aggregation_method: "role_and_contribution_attenuated_latent_evidence_with_redundancy_decay", muscles: [] });
  });
});
