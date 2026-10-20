import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { regionDataFor } from "@shared/specialization/registry";
import type { Contribution, RegionBoutRow, SpecializationSummary } from "@shared/specialization/types";
import { canonicalJson, goldenSummaries, summaryTotals } from "./__fixtures__/releaseGateHistories";

/**
 * The forearm's golden test (docs/specialization-atlas/10-multi-region.md §4.3): the release-gate
 * histories, completed and planned, give the same summaries with this code as with the code the
 * forearm shipped with (6738eeb), except for this explicit list of allowed differences:
 *
 * 1. planned bout ids of one-sided variants: a planned set of an exercise done one arm at a time is
 *    two bouts, `…/n#right` and `…/n#left`, where it was one, `…/n` (§2.1); each arm's summary
 *    holds its own, and its segment carries the same id;
 * 2. the new fields `countedSide`, `recordedSide` and `sideRelation` on a contribution and
 *    `countedSide` and `recordedSide` on a region row;
 * 3. the new §8 fields `completeness.boutsListedUnmapped` and `listedUnmappedRows`, which these
 *    histories leave at zero and empty (no set here tags the forearm outside its tag scope or is a
 *    listed unmapped exercise not counted here).
 *
 * Nothing else may differ: not a count, a row, a note, a side, an order or the rule version.
 * The reference (__fixtures__/goldenSummaries.6738eeb.json) is written by
 * scripts/specialization/release-gates/golden-summaries.ts run in a copy of 6738eeb's tree.
 */

type Reference = { from: string; now: string; cases: ({ id: string; sha256: string } & ({ summary: SpecializationSummary } | { totals: unknown }))[] };
const reference: Reference = JSON.parse(readFileSync(join(__dirname, "__fixtures__/goldenSummaries.6738eeb.json"), "utf8"));
const region = regionDataFor("forearm")!;
const variantByCatalogId = new Map(region.variants.map((variant) => [variant.catalogExerciseId, variant] as const));

const NEW_CONTRIBUTION_FIELDS = ["countedSide", "recordedSide", "sideRelation"] as const;
const NEW_ROW_FIELDS = ["countedSide", "recordedSide"] as const;
const SPLIT = /^(plan\/.+\/\d+)#(right|left)$/;

type Seen = { splitIds: number; newFields: number };

/** A planned split id back to the one bout it was, after checking it is allowed: a one-arm exercise, on its own arm's summary. */
function unsplit(id: string, catalogExerciseId: number | null, summary: SpecializationSummary, seen: Seen): string {
  const match = SPLIT.exec(id);
  if (!match) return id;
  const variant = catalogExerciseId === null ? undefined : variantByCatalogId.get(catalogExerciseId);
  expect(summary.mode, id).toBe("planned");
  expect(variant && variant.sidedBy === "arm" && variant.laterality === "unilateral", `${id}: only a one-arm exercise is planned per arm`).toBe(true);
  expect(match[2], `${id} on the ${summary.side} arm's summary`).toBe(summary.side);
  seen.splitIds += 1;
  return match[1];
}

function withoutNew<T extends object>(item: T, fields: readonly string[], seen: Seen): T {
  const copy = { ...item } as Record<string, unknown>;
  for (const field of fields) {
    expect(field in copy, `new field ${field}`).toBe(true);
    delete copy[field];
    seen.newFields += 1;
  }
  return copy as T;
}

/** The summary with the allowed differences taken back out; every other field as computed. */
function normalised(summary: SpecializationSummary, seen: Seen): SpecializationSummary {
  const row = (item: RegionBoutRow): RegionBoutRow => {
    const plain = withoutNew(item, NEW_ROW_FIELDS, seen);
    return { ...plain, boutId: unsplit(plain.boutId, plain.catalogExerciseId, summary, seen), segments: plain.segments.map((segment) => ({ ...segment, id: unsplit(segment.id, plain.catalogExerciseId, summary, seen) })) };
  };
  const contribution = (item: Contribution): Contribution => {
    const plain = withoutNew(item, NEW_CONTRIBUTION_FIELDS, seen);
    return { ...plain, boutId: unsplit(plain.boutId, plain.catalogExerciseId, summary, seen), segments: plain.segments.map((segment) => ({ ...segment, id: unsplit(segment.id, plain.catalogExerciseId, summary, seen) })) };
  };
  expect(summary.completeness.boutsListedUnmapped).toBe(0);
  expect(summary.listedUnmappedRows).toEqual([]);
  const { listedUnmappedRows: _rows, ...rest } = summary;
  const { boutsListedUnmapped: _listed, ...completeness } = summary.completeness;
  return {
    ...rest,
    completeness: completeness as SpecializationSummary["completeness"],
    nodes: summary.nodes.map((node) => ({ ...node, contributions: node.contributions.map(contribution), notCounted: node.notCounted?.map(contribution) })),
    regionBoutRows: summary.regionBoutRows?.map(row),
    regionUnknownSideRows: summary.regionUnknownSideRows?.map(row),
    regionUnclassifiedRows: summary.regionUnclassifiedRows?.map(row),
  };
}

describe("the forearm's golden summaries, against the code it shipped with (6738eeb)", () => {
  const computed = goldenSummaries();
  const byId = new Map(computed.map((item) => [item.id, item.summary] as const));
  const seen = new Map<string, Seen>();

  it("computes every case the reference holds, in the same order", () => {
    expect(reference.from).toBe("6738eeb");
    expect(computed.map((item) => item.id)).toEqual(reference.cases.map((item) => item.id));
  });

  for (const expected of reference.cases) {
    it(expected.id, () => {
      const counts: Seen = { splitIds: 0, newFields: 0 };
      const summary = normalised(byId.get(expected.id)!, counts);
      seen.set(expected.id, counts);
      if ("summary" in expected) expect(summary).toEqual(expected.summary);
      else expect(summaryTotals(summary)).toEqual(expected.totals);
      expect(createHash("sha256").update(canonicalJson(summary)).digest("hex")).toBe(expected.sha256);
    });
  }

  it("found the allowed differences where they belong, and only there", () => {
    const split = Array.from(seen).filter(([, counts]) => counts.splitIds > 0).map(([id]) => id);
    // The day templates plan three one-arm exercises (46, 410, 411); the release-gate plan none.
    expect(split).toEqual(["planned/day-templates-plan/left", "planned/day-templates-plan/right"]);
    expect(Array.from(seen.values()).every((counts) => counts.newFields > 0)).toBe(true);
  });
});
