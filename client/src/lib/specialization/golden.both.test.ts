import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { regionDataFor } from "@shared/specialization/registry";
import type { Contribution, RegionBoutRow, SpecializationSummary } from "@shared/specialization/types";
import { canonicalJson, goldenSummaries, summaryTotals } from "./__fixtures__/releaseGateHistories";

/**
 * The forearm's golden test for the page's summary, both arms as one (owner, 20 Oct 2026: "there's
 * no reason for a left and right arm"): the release-gate histories, completed and planned, give
 * the same `both` summaries with this code as with main's calculator at 4dac1ae, which is the
 * athlete's current reality, except for this explicit list of allowed differences:
 *
 * 1. the new fields `countedSide`, `recordedSide` and `sideRelation` on a contribution and
 *    `countedSide` and `recordedSide` on a region row, each checked before it is set aside
 *    (`expectNewSideFields`): every row is counted on `both` (nothing is kept apart for want of an
 *    arm), the recorded side is the arm's as the set or the plan gave it, and no forearm mapping
 *    has a side relation but `same`;
 * 2. the new §8 fields `completeness.boutsListedUnmapped` and `listedUnmappedRows`: the sets of the
 *    exercises the forearm lists as left unmapped (296–298, sled pushes and drags), each with its
 *    listed reason and in no total (`expectListedOnly`).
 *
 * Nothing else may differ: not a count, a row, a note, a side, an order or the rule version. The
 * per-arm summaries (the calculator's per-side capability, dormant on the page) are held to the
 * code the forearm shipped with by golden.test.ts. The reference
 * (__fixtures__/goldenSummaries.both.4dac1ae.json) is written by
 * scripts/specialization/release-gates/golden-summaries.ts --sides both, run in a copy of main's
 * tree at 4dac1ae.
 */

type Reference = { from: string; now: string; cases: ({ id: string; sha256: string } & ({ summary: SpecializationSummary } | { totals: unknown }))[] };
const reference: Reference = JSON.parse(readFileSync(join(__dirname, "__fixtures__/goldenSummaries.both.4dac1ae.json"), "utf8"));
const region = regionDataFor("forearm")!;

const NEW_CONTRIBUTION_FIELDS = ["countedSide", "recordedSide", "sideRelation"] as const;
const NEW_ROW_FIELDS = ["countedSide", "recordedSide"] as const;
const LISTED_NOT_COUNTED = new Set([296, 297, 298]);
const listedReasons = new Map(region.unmappedTagged.map((item) => [item.catalogId, item.reason] as const));

type Seen = { newFields: number; listed: number; noArm: number };

function expectNewSideFields(item: Contribution | RegionBoutRow, seen: Seen): void {
  const at = item.boutId;
  // Both arms as one: every row is counted, on both, a set with no arm recorded included.
  expect(item.countedSide, at).toBe("both");
  if (item.side === "unknown") seen.noArm += 1;
  const recorded =
    item.sideSource === "recorded" ? { limb: "arm", side: item.side === "bilateral" ? "both" : item.side, source: "recorded" }
    : item.sideSource === "plan_assumption" ? { limb: "arm", side: "both", source: "plan_assumption" }
    : null;
  expect(item.recordedSide, at).toEqual(recorded);
  if ("sideRelation" in item) expect(item.sideRelation, at).toBe("same");
}

function expectListedOnly(summary: SpecializationSummary, seen: Seen): void {
  const rows = summary.listedUnmappedRows ?? [];
  expect(summary.completeness.boutsListedUnmapped).toBe(rows.length);
  const counted = new Set([
    ...summary.nodes.flatMap((node) => [...node.contributions, ...(node.notCounted ?? [])].map((item) => item.boutId)),
    ...[summary.regionBoutRows, summary.regionUnknownSideRows, summary.regionUnclassifiedRows].flatMap((list) => (list ?? []).map((item) => item.boutId)),
  ]);
  for (const row of rows) {
    const at = `${row.boutId} (${row.exerciseName})`;
    expect(row.catalogExerciseId !== null && LISTED_NOT_COUNTED.has(row.catalogExerciseId), `${at}: only 296–298 are listed and not counted on the forearm`).toBe(true);
    expect(row.tag, at).toBe("listed");
    expect(row.reason, at).toBe(listedReasons.get(row.catalogExerciseId!));
    expect(counted.has(row.boutId), `${at} is in no total`).toBe(false);
  }
  seen.listed += rows.length;
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
  const row = (item: RegionBoutRow): RegionBoutRow => { expectNewSideFields(item, seen); return withoutNew(item, NEW_ROW_FIELDS, seen); };
  const contribution = (item: Contribution): Contribution => { expectNewSideFields(item, seen); return withoutNew(item, NEW_CONTRIBUTION_FIELDS, seen); };
  expectListedOnly(summary, seen);
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

describe("the forearm's golden summaries, both arms as one, against main's calculator (4dac1ae)", () => {
  const computed = goldenSummaries(["both"]);
  const byId = new Map(computed.map((item) => [item.id, item.summary] as const));
  const seen = new Map<string, Seen>();

  it("computes every case the reference holds, in the same order", () => {
    expect(reference.from).toBe("4dac1ae");
    expect(computed.map((item) => item.id)).toEqual(reference.cases.map((item) => item.id));
    expect(computed.every((item) => item.summary.side === "both")).toBe(true);
  });

  for (const expected of reference.cases) {
    it(expected.id, () => {
      const counts: Seen = { newFields: 0, listed: 0, noArm: 0 };
      const summary = normalised(byId.get(expected.id)!, counts);
      seen.set(expected.id, counts);
      if ("summary" in expected) expect(summary).toEqual(expected.summary);
      else expect(summaryTotals(summary)).toEqual(expected.totals);
      expect(createHash("sha256").update(canonicalJson(summary)).digest("hex")).toBe(expected.sha256);
      // Nothing is kept apart for want of an arm.
      expect(summary.regionUnknownSideBouts).toBe(0);
      expect(summary.nodes.every((node) => node.unknownSide.bouts === 0)).toBe(true);
    });
  }

  it("found the allowed differences where they belong, and only there", () => {
    expect(Array.from(seen.values()).every((counts) => counts.newFields > 0)).toBe(true);
    // The edge week's two sled-push sets, listed in every window (the plans hold none).
    expect(Array.from(seen).filter(([, counts]) => counts.listed > 0).map(([id, counts]) => `${id}: ${counts.listed}`)).toEqual(
      ["calendar-week", "rolling-7d", "custom-year"].map((window) => `completed/edge-week/${window}/both: 2`),
    );
    // The edge week's sets with no arm recorded are counted like any other, on both.
    expect(Array.from(seen).filter(([, counts]) => counts.noArm > 0).map(([id]) => id)).toContain("completed/edge-week/calendar-week/both");
  });
});
