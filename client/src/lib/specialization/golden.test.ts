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
 * forearm shipped with (6738eeb), per arm (the calculator's per-side capability, dormant since both
 * arms are counted as one on the page, owner 20 Oct 2026), except for this explicit list of allowed
 * differences:
 *
 * 1. (none since the reconciliation of 21 Oct 2026: a planned set of an exercise done one arm at a
 *    time is one bout again, `…/n`, assumed on both arms, as at 6738eeb; wave 0 had split it into
 *    `…/n#right` and `…/n#left`, and the tracker no longer lays it out per arm);
 * 2. the new fields `countedSide`, `recordedSide` and `sideRelation` on a contribution and
 *    `countedSide` and `recordedSide` on a region row, each checked against the fields the
 *    reference pins before it is set aside (`expectNewSideFields`);
 * 3. the new §8 fields `completeness.boutsListedUnmapped` and `listedUnmappedRows`: the sets of an
 *    exercise the forearm lists as left unmapped and does not count (its tag `listed`), which on the
 *    forearm are only 296–298 (sled pushes and drags: the grip quality, no forearm muscle tagged;
 *    the edge week logs two sled-push sets). Each row is checked to be one of those, with the
 *    forearm's listed reason, and in no total: no muscle's row, no region row, no other list
 *    (`expectListedOnly`). No set tags the forearm as a secondary muscle outside its tag scope,
 *    since the forearm reads every tag.
 *
 * Nothing else may differ: not a count, a row, a note, a side, an order or the rule version.
 * The reference (__fixtures__/goldenSummaries.6738eeb.json) is written by
 * scripts/specialization/release-gates/golden-summaries.ts run in a copy of 6738eeb's tree.
 */

type Reference = { from: string; now: string; cases: ({ id: string; sha256: string } & ({ summary: SpecializationSummary } | { totals: unknown }))[] };
const reference: Reference = JSON.parse(readFileSync(join(__dirname, "__fixtures__/goldenSummaries.6738eeb.json"), "utf8"));
const region = regionDataFor("forearm")!;

const NEW_CONTRIBUTION_FIELDS = ["countedSide", "recordedSide", "sideRelation"] as const;
/** The forearm's listed unmapped exercises that no forearm muscle is tagged on (unmapped.ts): their sets are listed, never counted. */
const LISTED_NOT_COUNTED = new Set([296, 297, 298]);
const listedReasons = new Map(region.unmappedTagged.map((item) => [item.catalogId, item.reason] as const));
const NEW_ROW_FIELDS = ["countedSide", "recordedSide"] as const;
/** A planned bout split per side, as wave 0 first built it: none is left. */
const SPLIT = /^(plan\/.+\/\d+)#(right|left)$/;

type Seen = { splitIds: number; newFields: number; listed: number };

/** Counts a planned id split per side, of which there must be none (allowed difference 1 is gone). */
function unsplit(id: string, seen: Seen): string {
  if (SPLIT.test(id)) seen.splitIds += 1;
  return id;
}

/**
 * The new side fields say what the old ones do, on the forearm: a row is counted on the summary's
 * arm unless it is kept apart; the recorded side is the arm's as the set or the plan gave it (Both
 * for a planned one-arm or either-way set), and none where the side came from the exercise or is
 * unknown; and no forearm mapping has a side relation but `same`.
 */
function expectNewSideFields(item: Contribution | RegionBoutRow, summary: SpecializationSummary): void {
  const at = `${item.boutId} on the ${summary.side} arm`;
  expect(item.countedSide, at).toBe(item.side === "unknown" ? "unknown" : summary.side);
  const recorded =
    item.sideSource === "recorded" ? { limb: "arm", side: item.side === "bilateral" ? "both" : item.side, source: "recorded" }
    : item.sideSource === "plan_assumption" ? { limb: "arm", side: "both", source: "plan_assumption" }
    : null;
  expect(item.recordedSide, at).toEqual(recorded);
  if ("sideRelation" in item) expect(item.sideRelation, at).toBe("same");
}

/** The listed sets are those of 296–298 alone, each with its listed reason, and none is in a total or another list. */
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
  const row = (item: RegionBoutRow): RegionBoutRow => {
    expectNewSideFields(item, summary);
    const plain = withoutNew(item, NEW_ROW_FIELDS, seen);
    return { ...plain, boutId: unsplit(plain.boutId, seen), segments: plain.segments.map((segment) => ({ ...segment, id: unsplit(segment.id, seen) })) };
  };
  const contribution = (item: Contribution): Contribution => {
    expectNewSideFields(item, summary);
    const plain = withoutNew(item, NEW_CONTRIBUTION_FIELDS, seen);
    return { ...plain, boutId: unsplit(plain.boutId, seen), segments: plain.segments.map((segment) => ({ ...segment, id: unsplit(segment.id, seen) })) };
  };
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
      const counts: Seen = { splitIds: 0, newFields: 0, listed: 0 };
      const summary = normalised(byId.get(expected.id)!, counts);
      seen.set(expected.id, counts);
      if ("summary" in expected) expect(summary).toEqual(expected.summary);
      else expect(summaryTotals(summary)).toEqual(expected.totals);
      expect(createHash("sha256").update(canonicalJson(summary)).digest("hex")).toBe(expected.sha256);
    });
  }

  it("found the allowed differences where they belong, and only there", () => {
    const split = Array.from(seen).filter(([, counts]) => counts.splitIds > 0).map(([id]) => id);
    // The day templates plan three one-arm exercises (46, 410, 411): one bout per planned set, as at 6738eeb.
    expect(split).toEqual([]);
    expect(Array.from(seen.values()).every((counts) => counts.newFields > 0)).toBe(true);
    // The edge week's two sled-push sets, listed on each arm's summary of it in every window (the plans hold none).
    expect(Array.from(seen).filter(([, counts]) => counts.listed > 0).map(([id, counts]) => `${id}: ${counts.listed}`)).toEqual(
      ["calendar-week", "rolling-7d", "custom-year"].flatMap((window) => ["left", "right"].map((side) => `completed/edge-week/${window}/${side}: 2`)),
    );
  });
});
