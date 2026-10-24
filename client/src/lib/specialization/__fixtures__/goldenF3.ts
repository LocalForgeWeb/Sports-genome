import { expect } from "vitest";
import type { NodeExposure, SpecializationSummary } from "@shared/specialization/types";

/**
 * Release F3's allowed differences in the forearm's golden summaries (11-forearm-research-and-stack.md
 * §1.7, "The list of moved numbers is generated, never written by hand"): each golden case is
 * computed as wave A left the tree (the forearm under `forearm_mappings_v1`, goldenWaveA.ts's
 * `waveAInputs`) and as the tree computes it (`forearm_mappings_v2`). What may move is the mapping
 * version the summary names and the rows of the muscles v2 credits differently; every number that
 * moves is listed, one line per case, and the list is the release's (golden.test.ts per arm,
 * golden.both.test.ts both arms as one, each held to its committed file). In the release
 * histories region totals and completeness may not move at all: there v2's new rows fall on sets
 * the finger flexors already put in the region. They do move where v2's brachioradialis rows put
 * sets in the region that v1 left out of it (the seven pulls, none tagged `forearms`): the pulls
 * case (releaseGateHistories.ts `pullsWeekSummaries`, goldenF3.pulls.test.ts) lists those moves
 * too (`regionMayMove`).
 */

const NODE_NUMBERS = [
  "directDynamicBouts", "contributingDynamicBouts", "deliberateHoldBouts", "deliberateHoldSeconds", "incidentalBouts", "mixedBouts", "unknownBouts",
  "directDynamicReps", "contributingDynamicReps", "pendingReviewBouts",
] as const;
const UNKNOWN_SIDE_NUMBERS = ["bouts", "directDynamicBouts", "deliberateHoldBouts", "deliberateHoldSeconds", "pendingReviewBouts"] as const;

const short = (nodeId: string) => nodeId.replace(/^forearm\./, "");
const COMPLETENESS_NUMBERS = ["boutsConsidered", "boutsWithReviewedMapping", "boutsPendingReview", "boutsRegionOnly", "boutsNameMatched", "boutsUnknownSide", "boutsListedUnmapped"] as const;

/** Every region-level number that differs, as `name a→b`: the region's totals, its row lists' lengths and completeness. */
function regionMoves(before: SpecializationSummary, after: SpecializationSummary): string[] {
  const pairs: [string, number, number][] = [
    ["regionDistinctBouts", before.regionDistinctBouts, after.regionDistinctBouts],
    ["regionUnknownSideBouts", before.regionUnknownSideBouts, after.regionUnknownSideBouts],
    ["regionUnclassified", before.regionUnclassified.bouts, after.regionUnclassified.bouts],
    ["regionRows", before.regionBoutRows?.length ?? 0, after.regionBoutRows?.length ?? 0],
    ["regionUnknownSideRows", before.regionUnknownSideRows?.length ?? 0, after.regionUnknownSideRows?.length ?? 0],
    ["regionUnclassifiedRows", before.regionUnclassifiedRows?.length ?? 0, after.regionUnclassifiedRows?.length ?? 0],
    ...COMPLETENESS_NUMBERS.map((field): [string, number, number] => [`completeness.${field}`, before.completeness[field], after.completeness[field]]),
    ["completeness.boutsExcluded.notCompleted", before.completeness.boutsExcluded.notCompleted, after.completeness.boutsExcluded.notCompleted],
    ["completeness.boutsExcluded.warmup", before.completeness.boutsExcluded.warmup, after.completeness.boutsExcluded.warmup],
  ];
  return pairs.filter(([, a, b]) => a !== b).map(([name, a, b]) => `${name} ${a}→${b}`);
}

/** A region row list may only gain rows: every row wave A had is in the tree's list, unchanged. */
function expectRowsKept(caseId: string, name: string, before: readonly { boutId: string }[] | undefined, after: readonly { boutId: string }[] | undefined): void {
  const now = new Map((after ?? []).map((row) => [row.boutId, row]));
  for (const row of before ?? []) expect(now.get(row.boutId), `${caseId}: ${name} ${row.boutId}`).toEqual(row);
}

/** Every number of one node that differs, as `field a→b`, with the node's coverage and its row counts. */
function nodeMoves(before: NodeExposure, after: NodeExposure): string[] {
  const moves: string[] = [];
  for (const field of NODE_NUMBERS) if (before[field] !== after[field]) moves.push(`${field} ${before[field]}→${after[field]}`);
  for (const field of UNKNOWN_SIDE_NUMBERS) {
    const [a, b] = [before.unknownSide[field] ?? 0, after.unknownSide[field] ?? 0];
    if (a !== b) moves.push(`unknownSide.${field} ${a}→${b}`);
  }
  if (before.mappingCoverage !== after.mappingCoverage) moves.push(`coverage ${before.mappingCoverage}→${after.mappingCoverage}`);
  const rows = (node: NodeExposure) => [node.contributions.length, node.notCounted?.length ?? 0];
  const [[c0, n0], [c1, n1]] = [rows(before), rows(after)];
  if (c0 !== c1) moves.push(`rows ${c0}→${c1}`);
  if (n0 !== n1) moves.push(`notCounted ${n0}→${n1}`);
  return moves;
}

/**
 * One case's moved numbers under F3, as one line (`<case>: <muscle> <moves>; …`), or null when
 * nothing moved but the version's name. Holds that the region's totals, rows and completeness, the
 * goals' values and every node with no moved number are exactly as they were; with `regionMayMove`
 * (the pulls case), the region's totals and completeness are listed first instead (`region …`), and
 * its row lists may only gain rows.
 */
export function f3Moves(caseId: string, waveA: SpecializationSummary, tree: SpecializationSummary, options: { regionMayMove?: boolean } = {}): string | null {
  expect(waveA.mappingVersion, caseId).toBe("forearm_mappings_v1");
  expect(tree.mappingVersion, caseId).toBe("forearm_mappings_v2");
  const parts: string[] = [];
  if (options.regionMayMove) {
    const moved = regionMoves(waveA, tree);
    if (moved.length) parts.push(`region ${moved.join(", ")}`);
    expectRowsKept(caseId, "regionBoutRows", waveA.regionBoutRows, tree.regionBoutRows);
    expectRowsKept(caseId, "regionUnknownSideRows", waveA.regionUnknownSideRows, tree.regionUnknownSideRows);
    expectRowsKept(caseId, "regionUnclassifiedRows", waveA.regionUnclassifiedRows, tree.regionUnclassifiedRows);
    tree = { ...tree, regionDistinctBouts: waveA.regionDistinctBouts, regionUnknownSideBouts: waveA.regionUnknownSideBouts, regionUnclassified: waveA.regionUnclassified, regionBoutRows: waveA.regionBoutRows, regionUnknownSideRows: waveA.regionUnknownSideRows, regionUnclassifiedRows: waveA.regionUnclassifiedRows, completeness: waveA.completeness };
  } else {
    // Region totals and completeness: unmoved in the release histories (§1.7).
    expect([tree.regionDistinctBouts, tree.regionUnknownSideBouts, tree.regionUnclassified], `${caseId}: region totals`).toEqual([waveA.regionDistinctBouts, waveA.regionUnknownSideBouts, waveA.regionUnclassified]);
    expect(tree.completeness, `${caseId}: completeness`).toEqual(waveA.completeness);
  }
  const goals = tree.goals.map((progress) => {
    const was = waveA.goals.find((item) => item.goal.id === progress.goal.id)!;
    if (was.value !== progress.value) parts.push(`target ${progress.goal.id} ${was.value}→${progress.value}`);
    return was.value === progress.value ? progress : was;
  });
  const nodes = tree.nodes.map((node) => {
    const was = waveA.nodes.find((item) => item.nodeId === node.nodeId)!;
    const moves = nodeMoves(was, node);
    if (moves.length) parts.push(`${short(node.nodeId)} ${moves.join(", ")}`);
    // A node whose numbers moved is put back whole; any other must be exactly as it was, its rows included.
    return moves.length ? was : node;
  });
  expect({ ...tree, mappingVersion: waveA.mappingVersion, goals, nodes }, `${caseId}: nothing else may differ`).toEqual(waveA);
  return parts.length ? `${caseId}: ${parts.join("; ")}` : null;
}
