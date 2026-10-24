import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { regionDataFor } from "@shared/specialization/registry";
import type { Contribution, RegionBoutRow, SpecializationSummary } from "@shared/specialization/types";
import { canonicalJson, goldenSummaries, summaryTotals } from "./__fixtures__/releaseGateHistories";
import { expectOnlyTwoHandedMoves, expectOnlyUpperArmCredit, libraryOnlyInputs, waveAInputs, waveZeroInputs, type UpperArmCredit } from "./__fixtures__/goldenWaveA";
import { f3Moves } from "./__fixtures__/goldenF3";

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
 *    listed reason and in no total (`expectListedOnly`);
 * 3. the ledger note "Each side assumed" on a planned row assumed on both arms, which main's
 *    calculator writes and no row says now (`withAssumedNote`; the release review, 22 Oct 2026);
 *
 * and wave A's, taken apart as golden.test.ts takes them apart (__fixtures__/goldenWaveA.ts): each
 * case computed with wave 0's inputs must give the reference exactly (1-3 aside); then the rule
 * version (v2), the biceps' and brachialis' rows and the biceps' targets credited by the upper arm,
 * and the region-only set of a forearm-tagged exercise whose new variant is two-handed read on both
 * arms rather than as "no arm recorded" (24 Dumbbell Pullover in the edge week: on `both` it was
 * counted already, so only its reading and the no-arm count in completeness change).
 *
 * and F3's (24 Oct 2026; 11-forearm-research-and-stack.md §1.7), taken apart in
 * __fixtures__/goldenF3.ts: wave A's summaries are computed with the forearm under
 * forearm_mappings_v1 (`waveAInputs`), and the tree's differ from them only by
 * 9. the mapping version's name (v2) and the numbers of the muscles v2 credits differently, every
 *    one listed, generated, in __fixtures__/goldenF3.moved.both.txt (the release's list); region
 *    totals and completeness do not move in these histories, which hold none of the seven pulls
 *    whose brachioradialis v2 adds (goldenF3.pulls.test.ts lists where they do).
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

type Seen = { newFields: number; listed: number; noArm: number; assumed: number };

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

/**
 * Allowed difference 3: no ledger note names a side (the release review, 22 Oct 2026), so a planned row
 * the plan assumed on both arms (`sideSource: "plan_assumption"`) no longer says "Each side assumed".
 * The reference's rows have it, written after the straps notes and before "Matched by name" (and the
 * pending-review note); it is put back there on exactly those rows, and the rest of each row, its
 * other notes included, must be as the reference holds it.
 */
const ASSUMED = "Each side assumed";
function withAssumedNote(item: Contribution, seen: Seen): string[] {
  expect(item.notes, `${item.boutId}: no note names a side`).not.toContain(ASSUMED);
  if (item.sideSource !== "plan_assumption") return item.notes;
  seen.assumed += 1;
  const at = item.notes.findIndex((note) => note === "Matched by name" || note === "Mapping pending review");
  return at < 0 ? [...item.notes, ASSUMED] : [...item.notes.slice(0, at), ASSUMED, ...item.notes.slice(at)];
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
  const contribution = (item: Contribution): Contribution => { expectNewSideFields(item, seen); const plain = withoutNew(item, NEW_CONTRIBUTION_FIELDS, seen); return { ...plain, notes: withAssumedNote(plain, seen) }; };
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
  // Wave 0's inputs: the reference must come back exactly (allowed differences 1-3 aside).
  const computed = goldenSummaries(["both"], waveZeroInputs);
  const byId = new Map(computed.map((item) => [item.id, item.summary] as const));
  const libraryOnly = new Map(goldenSummaries(["both"], libraryOnlyInputs).map((item) => [item.id, item.summary] as const));
  const waveA = new Map(goldenSummaries(["both"], waveAInputs).map((item) => [item.id, item.summary] as const));
  const actual = new Map(goldenSummaries(["both"]).map((item) => [item.id, item.summary] as const));
  const f3 = new Map<string, string | null>();
  const seen = new Map<string, Seen>();
  const moved = new Map<string, string[]>();
  const credit: UpperArmCredit = { gained: new Map(), lost: new Map(), partnerDropped: 0 };

  it("computes every case the reference holds, in the same order", () => {
    expect(reference.from).toBe("4dac1ae");
    expect(computed.map((item) => item.id)).toEqual(reference.cases.map((item) => item.id));
    expect(computed.every((item) => item.summary.side === "both")).toBe(true);
  });

  for (const expected of reference.cases) {
    it(expected.id, () => {
      const counts: Seen = { newFields: 0, listed: 0, noArm: 0, assumed: 0 };
      const summary = normalised(byId.get(expected.id)!, counts);
      seen.set(expected.id, counts);
      if ("summary" in expected) expect(summary).toEqual(expected.summary);
      else expect(summaryTotals(summary)).toEqual(expected.totals);
      expect(createHash("sha256").update(canonicalJson(summary)).digest("hex")).toBe(expected.sha256);
      // Nothing is kept apart for want of an arm.
      expect(summary.regionUnknownSideBouts).toBe(0);
      expect(summary.nodes.every((node) => node.unknownSide.bouts === 0)).toBe(true);
    });
    it(`${expected.id}: wave A differs from wave 0 only as allowed`, () => {
      const steps = expectOnlyTwoHandedMoves(byId.get(expected.id)!, libraryOnly.get(expected.id)!);
      if (steps.length) moved.set(expected.id, steps);
      expectOnlyUpperArmCredit(libraryOnly.get(expected.id)!, waveA.get(expected.id)!, credit);
      // Still nothing kept apart for want of an arm.
      expect(waveA.get(expected.id)!.regionUnknownSideBouts).toBe(0);
    });
    it(`${expected.id}: F3 (forearm_mappings_v2) differs from wave A only by its listed moves`, () => {
      f3.set(expected.id, f3Moves(expected.id, waveA.get(expected.id)!, actual.get(expected.id)!));
      // The page's summary is the tree's, and still nothing is kept apart for want of an arm.
      expect(actual.get(expected.id)!.regionUnknownSideBouts).toBe(0);
    });
  }

  it("found wave A's differences where they belong", () => {
    // 24 Dumbbell Pullover's set with no arm recorded, in each window of the edge week.
    expect(Array.from(moved).map(([id, bouts]) => `${id}: ${bouts.join(", ")}`)).toEqual(["calendar-week", "rolling-7d", "custom-year"].map((window) => `completed/edge-week/${window}/both: x10a`));
    expect(credit.lost.size).toBe(0);
    expect(Array.from(credit.gained.keys()).sort()).toEqual(["upper_arm.biceps", "upper_arm.brachialis"]);
  });

  it("lists F3's moved numbers, generated: the release's list, both arms as one (allowed difference 9)", async () => {
    const lines = reference.cases.map((item) => f3.get(item.id)).filter((line): line is string => typeof line === "string");
    console.log(`F3, the moved numbers (both arms as one):\n${lines.join("\n")}`);
    expect(f3.size).toBe(reference.cases.length);
    await expect(`${lines.join("\n")}\n`).toMatchFileSnapshot("./__fixtures__/goldenF3.moved.both.txt");
  });

  it("found the allowed differences where they belong, and only there", () => {
    expect(Array.from(seen.values()).every((counts) => counts.newFields > 0)).toBe(true);
    // The edge week's two sled-push sets, listed in every window (the plans hold none).
    expect(Array.from(seen).filter(([, counts]) => counts.listed > 0).map(([id, counts]) => `${id}: ${counts.listed}`)).toEqual(
      ["calendar-week", "rolling-7d", "custom-year"].map((window) => `completed/edge-week/${window}/both: 2`),
    );
    // The edge week's sets with no arm recorded are counted like any other, on both.
    expect(Array.from(seen).filter(([, counts]) => counts.noArm > 0).map(([id]) => id)).toContain("completed/edge-week/calendar-week/both");
    // The day templates' one-arm sets, planned and assumed on both arms: the only rows that said "Each side assumed".
    expect(Array.from(seen).filter(([, counts]) => counts.assumed > 0).map(([id]) => id)).toEqual(["planned/day-templates-plan/both"]);
  });
});
