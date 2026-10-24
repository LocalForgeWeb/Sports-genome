import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { regionDataFor } from "@shared/specialization/registry";
import { calendarWeekInterval } from "@shared/specialization/time";
import type { Contribution, ExposureBout, RegionBoutRow, SpecializationSummary } from "@shared/specialization/types";
import { catalogMusclesLookup } from "./useSpecializationSummary";
import { canonicalJson, goldenSummaries, summaryTotals } from "./__fixtures__/releaseGateHistories";
import { expectOnlyTwoHandedMoves, expectOnlyUpperArmCredit, libraryOnlyInputs, twoHandedNew, waveAInputs, waveZeroInputs, type UpperArmCredit } from "./__fixtures__/goldenWaveA";
import { f3Moves } from "./__fixtures__/goldenF3";

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
 *    since the forearm reads every tag;
 * 4. the ledger note "Each side assumed" on a planned row assumed on both arms, which no row says
 *    now (`withAssumedNote`): the day templates plan three one-arm exercises;
 *
 * and wave A's (23 Oct 2026; §4.3 and §11 decision 11(b), (c)), taken apart in
 * __fixtures__/goldenWaveA.ts: each case is computed with wave 0's inputs, which must give the
 * reference exactly (1-4 aside), then with the library records wave A brings, then as the tree
 * computes it, and each step may differ from the one before only as stated:
 * 5. the rule version: v2;
 * 6. the biceps' and brachialis' rows, and the biceps' targets, credited by the upper arm's version,
 *    each set gained or lost explained by the two versions' rows (pulls and face pulls gained);
 * 7. 406 Lever Supination: the biceps' row there is the upper arm's individual row, the same
 *    category; the supinator's shared row is as it was (the lanes expected it to lose the biceps as
 *    its partner, but the two were never partners: they differ in category);
 * 8. region-only sets of a forearm-tagged exercise whose new variant is two-handed move from "no
 *    arm recorded" to both arms (in these histories, 24 Dumbbell Pullover in the edge week).
 *
 * and F3's (24 Oct 2026; 11-forearm-research-and-stack.md §1.7), taken apart in
 * __fixtures__/goldenF3.ts: wave A's summaries are computed with the forearm under
 * forearm_mappings_v1 (`waveAInputs`), and the tree's differ from them only by
 * 9. the mapping version's name (v2) and the numbers of the muscles v2 credits differently, every
 *    one listed, generated, in __fixtures__/goldenF3.moved.perArm.txt (per arm, a calculator
 *    capability no page shows); region totals and completeness do not move in these histories,
 *    which hold none of the seven pulls whose brachioradialis v2 adds (goldenF3.pulls.test.ts lists
 *    where they do).
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

type Seen = { splitIds: number; newFields: number; listed: number; assumed: number };

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

/**
 * Allowed difference 4: no ledger note names a side (the release review, 22 Oct 2026), so a planned row
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
  const row = (item: RegionBoutRow): RegionBoutRow => {
    expectNewSideFields(item, summary);
    const plain = withoutNew(item, NEW_ROW_FIELDS, seen);
    return { ...plain, boutId: unsplit(plain.boutId, seen), segments: plain.segments.map((segment) => ({ ...segment, id: unsplit(segment.id, seen) })) };
  };
  const contribution = (item: Contribution): Contribution => {
    expectNewSideFields(item, summary);
    const plain = withoutNew(item, NEW_CONTRIBUTION_FIELDS, seen);
    return { ...plain, notes: withAssumedNote(plain, seen), boutId: unsplit(plain.boutId, seen), segments: plain.segments.map((segment) => ({ ...segment, id: unsplit(segment.id, seen) })) };
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
  // Wave 0's inputs: the reference must come back exactly (allowed differences 1-4 aside).
  const computed = goldenSummaries(["left", "right"], waveZeroInputs);
  const byId = new Map(computed.map((item) => [item.id, item.summary] as const));
  const libraryOnly = new Map(goldenSummaries(["left", "right"], libraryOnlyInputs).map((item) => [item.id, item.summary] as const));
  const waveA = new Map(goldenSummaries(["left", "right"], waveAInputs).map((item) => [item.id, item.summary] as const));
  const actual = new Map(goldenSummaries().map((item) => [item.id, item.summary] as const));
  const f3 = new Map<string, string | null>();
  const seen = new Map<string, Seen>();
  const moved = new Map<string, string[]>();
  const credit: UpperArmCredit = { gained: new Map(), lost: new Map(), partnerDropped: 0 };

  it("computes every case the reference holds, in the same order", () => {
    expect(reference.from).toBe("6738eeb");
    expect(computed.map((item) => item.id)).toEqual(reference.cases.map((item) => item.id));
  });

  for (const expected of reference.cases) {
    it(expected.id, () => {
      const counts: Seen = { splitIds: 0, newFields: 0, listed: 0, assumed: 0 };
      const summary = normalised(byId.get(expected.id)!, counts);
      seen.set(expected.id, counts);
      if ("summary" in expected) expect(summary).toEqual(expected.summary);
      else expect(summaryTotals(summary)).toEqual(expected.totals);
      expect(createHash("sha256").update(canonicalJson(summary)).digest("hex")).toBe(expected.sha256);
    });
    it(`${expected.id}: wave A differs from wave 0 only as allowed (5-8)`, () => {
      const steps = expectOnlyTwoHandedMoves(byId.get(expected.id)!, libraryOnly.get(expected.id)!);
      if (steps.length) moved.set(expected.id, steps);
      expectOnlyUpperArmCredit(libraryOnly.get(expected.id)!, waveA.get(expected.id)!, credit);
    });
    it(`${expected.id}: F3 (forearm_mappings_v2) differs from wave A only by its listed moves (9)`, () => {
      f3.set(expected.id, f3Moves(expected.id, waveA.get(expected.id)!, actual.get(expected.id)!));
    });
  }

  it("found wave A's differences where they belong, and prints the release's generated list (§4.3)", () => {
    // The release's list: the forearm-tagged exercises whose variant arrives in wave A and is two-handed.
    const list = twoHandedNew.map((variant) => `${variant.catalogExerciseId} ${variant.catalogName}`);
    console.log(`Wave A, region-only sets that move from "no arm recorded" to both arms: ${list.join("; ")}`);
    console.log(`Golden cases where they did: ${Array.from(moved).map(([id, bouts]) => `${id} (${bouts.join(", ")})`).join("; ")}`);
    const changes = (map: Map<string, Set<number>>) => Array.from(map).map(([node, ids]) => `${node}: ${Array.from(ids).sort((a, b) => a - b).join(", ")}`).join("; ");
    console.log(`Credited by the upper arm, gained: ${changes(credit.gained)}; lost: ${changes(credit.lost) || "none"}; 406's shared partner dropped on ${credit.partnerDropped} rows`);
    // 24 Dumbbell Pullover: the edge week's set with no arm recorded (x10a; x10b was logged Right), in each window, on each arm (§11 decision 11(c)).
    expect(Array.from(moved.keys())).toEqual(["calendar-week", "rolling-7d", "custom-year"].flatMap((window) => ["left", "right"].map((side) => `completed/edge-week/${window}/${side}`)));
    expect(Array.from(new Set(Array.from(moved.values()).flat()))).toEqual(["x10a"]);
    expect(twoHandedNew.map((variant) => variant.catalogExerciseId)).toContain(24);
    // Curl credit is unchanged: nothing is lost; the upper arm adds the rows and pulldowns (43, 45, 46, 66 in these histories).
    expect(credit.lost.size).toBe(0);
    expect(Array.from(credit.gained.keys()).sort()).toEqual(["upper_arm.biceps", "upper_arm.brachialis"]);
    // Allowed difference 6 names the exact sets gained; hold them, not just print them.
    for (const node of ["upper_arm.biceps", "upper_arm.brachialis"]) {
      expect(Array.from(credit.gained.get(node)!).sort((a, b) => a - b), node).toEqual([43, 45, 46, 66]);
    }
  });

  it("lists F3's moved numbers, generated: the release's list, per arm (allowed difference 9)", async () => {
    const lines = reference.cases.map((item) => f3.get(item.id)).filter((line): line is string => typeof line === "string");
    console.log(`F3, the moved numbers (per arm, dormant on the page):\n${lines.join("\n")}`);
    expect(f3.size).toBe(reference.cases.length);
    await expect(`${lines.join("\n")}\n`).toMatchFileSnapshot("./__fixtures__/goldenF3.moved.perArm.txt");
  });

  it("credits the biceps on 406 Lever Supination by the upper arm's individual row, and leaves the supinator's row as it was (allowed difference 7)", () => {
    // No golden history logs 406, so one set of it, computed both ways. The forearm's v1 rows there were both `shared`, but
    // never partners: the supinator's is direct, the biceps' contributing, and partners share a category (exposure.ts).
    const set: ExposureBout = {
      id: "s406", mode: "completed", performedAt: "2026-10-14T18:00:00.000Z", sessionId: "s", sessionLabel: "Day", planWeek: null, dayKey: null, exerciseEntryId: "e", catalogExerciseId: 406,
      exerciseName: "Lever Supination", matchedBy: "id", armSide: { side: "right", source: "recorded" }, legSide: null, straps: "unknown", warmup: false, effort: null, kind: "standard", segments: [{ id: "s406", reps: 12, loadKg: null, holdSeconds: null }],
    };
    const request = { bouts: [set], interval: calendarWeekInterval("2026-10-16T12:00:00.000Z", "Europe/London"), side: "both" as const, mode: "completed" as const, goals: [], catalogMusclesFor: catalogMusclesLookup(exercises), sourceRevision: "", planRevision: null, now: "2026-10-16T12:00:00.000Z" };
    const before = getSpecializationSummary({ ...request, region: libraryOnlyInputs.region!, rule: libraryOnlyInputs.rule });
    // Wave A's tree: the forearm under v1 (F3's v2 adds the pronator quadratus's steadying row on 406, which is F3's to list).
    const now = getSpecializationSummary({ ...request, region: waveAInputs.region! });
    const rows = (summary: SpecializationSummary, nodeId: string) => summary.nodes.find((node) => node.nodeId === nodeId)!.contributions.map((item) => [item.parts.map((part) => [part.mappingId, part.category]), item.sharedWith]);
    expect(rows(before, "forearm.supinator")).toEqual([[[["cat-406:forearm.supinator", "direct_dynamic"]], []]]);
    expect(rows(now, "forearm.supinator")).toEqual(rows(before, "forearm.supinator"));
    expect(rows(before, "upper_arm.biceps")).toEqual([[[["cat-406:upper_arm.biceps", "contributing_dynamic"]], []]]);
    expect(rows(now, "upper_arm.biceps")).toEqual([[[["upper_arm_mappings_v1/cat-406:upper_arm.biceps", "contributing_dynamic"]], []]]);
    const credit: UpperArmCredit = { gained: new Map(), lost: new Map(), partnerDropped: 0 };
    expectOnlyUpperArmCredit(before, now, credit);
    expect(credit.partnerDropped).toBe(0);
  });

  it("found the allowed differences where they belong, and only there", () => {
    const split = Array.from(seen).filter(([, counts]) => counts.splitIds > 0).map(([id]) => id);
    // The day templates plan three one-arm exercises (46, 410, 411): one bout per planned set, as at 6738eeb.
    expect(split).toEqual([]);
    expect(Array.from(seen.values()).every((counts) => counts.newFields > 0)).toBe(true);
    // The edge week's two sled-push sets, listed on each arm's summary of it in every window (the plans hold none).
    expect(Array.from(seen).filter(([, counts]) => counts.listed > 0).map(([id, counts]) => `${id}: ${counts.listed}`)).toEqual(
      ["calendar-week", "rolling-7d", "custom-year"].flatMap((window) => ["left", "right"].map((side) => `completed/edge-week/${window}/${side}: 2`)),
    );
    // The day templates' one-arm sets, planned and assumed on both arms: the only rows that said "Each side assumed".
    expect(Array.from(seen).filter(([, counts]) => counts.assumed > 0).map(([id]) => id)).toEqual(["left", "right"].map((side) => `planned/day-templates-plan/${side}`));
  });
});
