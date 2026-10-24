import { expect } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { forearmContent } from "@shared/specialization/regions/forearm";
import { upperArmMuscleIds } from "@shared/specialization/regions/upper_arm/ids";
import { regionDataFor } from "@shared/specialization/registry";
import { exposureRuleIds, exposureRuleV1 } from "@shared/specialization/rules";
import type { Contribution, GoalProgress, NodeExposure, RegionBoutRow, SpecializationRegionData, SpecializationSummary, VariantMapping } from "@shared/specialization/types";
import { planningVariantsFor } from "../useSpecializationSummary";
import type { GoldenInputs } from "./releaseGateHistories";

/**
 * Wave A's allowed differences in the forearm's golden summaries (10-multi-region.md §4.3), taken
 * apart one at a time so that each is checked on its own and nothing else can hide behind them.
 * Every golden case is computed three ways:
 *
 * 1. with wave 0's inputs (`waveZeroInputs`): the forearm's own variants only, no home version for
 *    the biceps and brachialis (its own rows credit them), no library record of an exercise it
 *    does not map, its plan laid out by its own variants (the library held only those 119 then),
 *    and rule v1. This must equal the reference exactly: the calculator itself did not change.
 * 2. adding the library records wave A brings that the page reads (`libraryOnlyInputs`): what moves
 *    is §4.3's "every release" difference (§11 decision 11(c)): region-only sets of a forearm-tagged
 *    exercise whose new variant is two-handed move from "no arm recorded" to both arms, and nothing
 *    else (`expectOnlyTwoHandedMoves`).
 * 3. as the tree computes it, the upper arm's published version crediting the biceps and
 *    brachialis, under rule v2: what moves is the rule version, the biceps' and brachialis' rows
 *    (on 406 Lever Supination the biceps' row is the upper arm's individual row) and the biceps'
 *    targets, and nothing else (`expectOnlyUpperArmCredit`). A shared partner a forearm row lost to
 *    the change of version would be put back here, counted, and checked; none does (the
 *    supinator and the biceps on 406 differ in category, so they were never partners).
 */

const region = regionDataFor("forearm")!;
const withoutTagged = ({ taggedVariants: _tagged, ...rest }: SpecializationRegionData): SpecializationRegionData => rest;

export const waveZeroInputs: GoldenInputs = {
  region: { ...withoutTagged(region), variants: forearmContent.variants, externalMappingVersions: [] },
  planningVariants: forearmContent.variants,
  rule: exposureRuleV1,
};

export const libraryOnlyInputs: GoldenInputs = {
  region: { ...region, externalMappingVersions: [] },
  planningVariants: planningVariantsFor(region),
  rule: exposureRuleV1,
};

const shipped = new Set(forearmContent.variants.map((variant) => variant.id));
/** The library records new with wave A that the forearm page reads: its homes' rows' and the forearm-tagged exercises'. */
export const newLibraryRecords = [...region.variants, ...(region.taggedVariants ?? [])].filter((variant) => !shipped.has(variant.id));
const forearmKeys = new Set(region.region.catalogKeys);
const forearmTagged = new Set(exercises.filter((exercise) => [...exercise.primaryMuscles, ...exercise.secondaryMuscles].some((key) => forearmKeys.has(key))).map((exercise) => exercise.id));
/**
 * Of those, the forearm-tagged two-handed ones: their region-only sets move from "no arm recorded"
 * to both arms (§4.3, "every release"; the release's generated list). The others are not the
 * forearm's region work; where the upper arm credits the biceps or brachialis on them, that is
 * allowed difference 6.
 */
export const twoHandedNew = newLibraryRecords.filter((variant) => variant.laterality === "bilateral" && forearmTagged.has(variant.catalogExerciseId));
const movedCatalogIds = new Set(twoHandedNew.map((variant) => variant.catalogExerciseId));

const rowLists = ["regionBoutRows", "regionUnknownSideRows", "regionUnclassifiedRows"] as const;

/** The bouts of a two-handed new variant that a region row lists with no arm recorded (on wave 0's summary). */
function movedBoutIds(summary: SpecializationSummary): Set<string> {
  return new Set(rowLists.flatMap((list) => summary[list] ?? []).filter((row) => row.catalogExerciseId !== null && movedCatalogIds.has(row.catalogExerciseId) && row.side === "unknown").map((row) => row.boutId));
}

/**
 * Step 2: the only difference the new library records make is that a two-handed new variant's
 * region-only sets are read on both arms, not as "no arm recorded". Returns those bouts.
 */
export function expectOnlyTwoHandedMoves(waveZero: SpecializationSummary, libraryOnly: SpecializationSummary): string[] {
  const moved = movedBoutIds(waveZero);
  expect(movedBoutIds(libraryOnly), "none is left with no arm recorded").toEqual(new Set());
  const at = `${waveZero.side} summary`;
  for (const row of rowLists.flatMap((list) => waveZero[list] ?? []).filter((item) => moved.has(item.boutId))) {
    expect([row.side, row.sideSource], `${row.boutId} at wave 0, ${at}`).toEqual(["unknown", "unknown"]);
  }
  for (const row of rowLists.flatMap((list) => libraryOnly[list] ?? []).filter((item) => moved.has(item.boutId))) {
    expect([row.side, row.sideSource], `${row.boutId} with the new variant, ${at}`).toEqual(["bilateral", "structural"]);
  }
  // Every moved set is a region-only one: no muscle's row names it.
  for (const summary of [waveZero, libraryOnly]) expect(summary.nodes.flatMap((node) => [...node.contributions, ...(node.notCounted ?? [])]).filter((item) => moved.has(item.boutId))).toEqual([]);
  const strip = (summary: SpecializationSummary): SpecializationSummary => {
    const copy = { ...summary } as SpecializationSummary;
    for (const list of rowLists) if (summary[list]) copy[list] = summary[list]!.filter((row: RegionBoutRow) => !moved.has(row.boutId));
    return copy;
  };
  const before = strip(waveZero);
  const after = strip(libraryOnly);
  // On a per-arm summary each moved set leaves the no-arm count for the arm's distinct bouts; on `both` it was counted already.
  const unknownBefore = (waveZero.regionUnknownSideRows ?? []).filter((row) => moved.has(row.boutId)).length;
  expect(after.regionDistinctBouts - before.regionDistinctBouts, at).toBe(unknownBefore);
  expect(before.regionUnknownSideBouts - after.regionUnknownSideBouts, at).toBe(unknownBefore);
  // A per-arm summary's completeness counts the sets with no arm recorded; the moved ones now have their arms. A `both`
  // summary counts none (nothing is kept apart for want of an arm), so there only the rows' reading changes.
  const consideredMoved = new Set(rowLists.flatMap((list) => waveZero[list] ?? []).filter((row) => moved.has(row.boutId)).map((row) => row.boutId)).size;
  expect(before.completeness.boutsUnknownSide - after.completeness.boutsUnknownSide, at).toBe(waveZero.side === "both" ? 0 : consideredMoved);
  expect({ ...after, regionDistinctBouts: before.regionDistinctBouts, regionUnknownSideBouts: before.regionUnknownSideBouts, completeness: { ...after.completeness, boutsUnknownSide: before.completeness.boutsUnknownSide } }).toEqual(before);
  return Array.from(moved).sort();
}

const creditedHere = new Set<string>([upperArmMuscleIds.biceps, upperArmMuscleIds.brachialis]);
const upperArmRows = region.externalMappingVersions.find((external) => external.regionId === "upper_arm")!.mappings;
const forearmRowsOn = (nodeId: string) => forearmContent.mappings.filter((mapping) => mapping.nodeId === nodeId && mapping.reviewStatus === "reviewed");
const reviewedFor = (rows: readonly VariantMapping[], nodeId: string, variantId: string) => rows.some((mapping) => mapping.nodeId === nodeId && mapping.variantId === variantId && mapping.reviewStatus === "reviewed");

export type UpperArmCredit = { gained: Map<string, Set<number>>; lost: Map<string, Set<number>>; partnerDropped: number };

/**
 * Step 3: the upper arm's published version credits the biceps and brachialis (§4.2), under rule
 * v2. Their rows may change, each change explained by the two versions' rows: a set gained is of an
 * exercise the upper arm credits the muscle for and the forearm's v1 rows did not; a set lost, the
 * reverse. Every set credited is credited by an upper-arm row. The biceps' targets read its row. A
 * forearm row whose shared partner was the biceps or brachialis would lose it (partners are within
 * one version) and is counted in `partnerDropped`; none does, not even 406's supinator, which was
 * never the biceps' partner (they differ in category). Nothing else may differ.
 */
export function expectOnlyUpperArmCredit(libraryOnly: SpecializationSummary, actual: SpecializationSummary, credit: UpperArmCredit): void {
  expect(libraryOnly.ruleVersion).toBe(exposureRuleIds.v1);
  expect(actual.ruleVersion).toBe(exposureRuleIds.v2);
  const variantOf = new Map(region.variants.map((variant) => [variant.catalogExerciseId, variant.id] as const));
  const nodeOf = (summary: SpecializationSummary, nodeId: string) => summary.nodes.find((node) => node.nodeId === nodeId)!;
  for (const nodeId of Array.from(creditedHere)) {
    const now = nodeOf(actual, nodeId);
    const before = nodeOf(libraryOnly, nodeId);
    for (const item of [...now.contributions, ...(now.notCounted ?? [])]) for (const part of item.parts) expect(part.mappingId, `${item.boutId} on ${nodeId}`).toMatch(/^upper_arm_mappings_v1\//);
    const ids = (node: NodeExposure) => new Map(node.contributions.map((item: Contribution) => [item.boutId, item.catalogExerciseId] as const));
    const nowIds = ids(now);
    const beforeIds = ids(before);
    for (const [bout, catalogId] of Array.from(nowIds)) {
      if (beforeIds.has(bout)) continue;
      const variantId = variantOf.get(catalogId!)!;
      expect(reviewedFor(upperArmRows, nodeId, variantId) && !reviewedFor(forearmRowsOn(nodeId), nodeId, variantId), `${bout} (${catalogId}) gained on ${nodeId}`).toBe(true);
      credit.gained.set(nodeId, (credit.gained.get(nodeId) ?? new Set()).add(catalogId!));
    }
    for (const [bout, catalogId] of Array.from(beforeIds)) {
      if (nowIds.has(bout)) continue;
      const variantId = variantOf.get(catalogId!)!;
      expect(reviewedFor(forearmRowsOn(nodeId), nodeId, variantId) && !reviewedFor(upperArmRows, nodeId, variantId), `${bout} (${catalogId}) lost on ${nodeId}`).toBe(true);
      credit.lost.set(nodeId, (credit.lost.get(nodeId) ?? new Set()).add(catalogId!));
    }
  }
  // Put back what the two allowed changes touch, then nothing else may differ.
  // A target on the biceps reads its row (the brachialis has none in the golden histories' targets).
  const goals = actual.goals.map((progress: GoalProgress) => (progress.goal.nodeId !== null && creditedHere.has(progress.goal.nodeId) ? libraryOnly.goals.find((item) => item.goal.id === progress.goal.id)! : progress));
  const restored = {
    ...actual,
    ruleVersion: libraryOnly.ruleVersion,
    goals,
    nodes: actual.nodes.map((node) => {
      if (creditedHere.has(node.nodeId)) return nodeOf(libraryOnly, node.nodeId);
      const was = nodeOf(libraryOnly, node.nodeId);
      // A forearm row's shared partner that was the biceps or brachialis under the forearm's own rows, gone now that another
      // version credits them (partners are within one version, §4.2): put back and counted, and nothing else of the row may differ.
      const back = (now: Contribution, index: number, list: "contributions" | "notCounted") => {
        const before = (was[list] ?? [])[index];
        if (!before || before.boutId !== now.boutId || JSON.stringify(before.sharedWith) === JSON.stringify(now.sharedWith)) return now;
        const dropped = before.sharedWith.filter((id) => !now.sharedWith.includes(id));
        expect(dropped.every((id) => creditedHere.has(id)) && now.sharedWith.every((id) => before.sharedWith.includes(id)), `${now.boutId} on ${node.nodeId}: partners ${before.sharedWith} → ${now.sharedWith}`).toBe(true);
        credit.partnerDropped += 1;
        return { ...now, sharedWith: before.sharedWith };
      };
      return { ...node, contributions: node.contributions.map((item, index) => back(item, index, "contributions")), notCounted: node.notCounted?.map((item, index) => back(item, index, "notCounted")) };
    }),
  };
  expect(restored).toEqual(libraryOnly);
}
