import { formatDisplayWeight, type DisplayWeightUnit } from "@/lib/weightUnits";
import { exposureCategoryLabels } from "@shared/specialization/rules";
import type { AnatomyNode, Contribution, ContributionSegment, ExposureCategory, GoalMetric, GoalProgress, NodeExposure, SpecializationRegionData, SpecializationSummary } from "@shared/specialization/types";

/**
 * What the specialization page shows, worked out from one summary (design §7). Pure, so
 * the bins, the sentences and the findings are tested without rendering anything, and
 * the diagram, the list and the sheet all say the same thing about a muscle.
 */

/** A diagram fill, as every renderer reads it (design §12). */
export type DiagramFill = { kind: "bin"; step: number } | { kind: "zero" } | { kind: "hatch" } | { kind: "none" };

/**
 * Fixed bins, never rescaled to the busiest muscle (brief §6): the same number of bouts is
 * the same colour every week. Five steps on the exposure ramp, and zero drawn as its own thing.
 */
export const volumeBins = ["1–2", "3–5", "6–9", "10–14", "15+"] as const;
export function volumeStep(bouts: number): number {
  if (!(bouts > 0)) return 0;
  if (bouts <= 2) return 1;
  if (bouts <= 5) return 2;
  if (bouts <= 9) return 3;
  if (bouts <= 14) return 4;
  return 5;
}

/** Target attainment bins. Above target keeps the top step and its number: no extra reward colour. */
export const targetBins = ["Under 25%", "25–49%", "50–74%", "75–99%", "100% and over"] as const;
export function targetStep(fraction: number): number {
  if (fraction >= 1) return 5;
  if (fraction >= 0.75) return 4;
  if (fraction >= 0.5) return 3;
  if (fraction >= 0.25) return 2;
  return 1;
}

const DIRECT: readonly ExposureCategory[] = ["direct_dynamic", "deliberate_isometric"];

/** A contribution in which the muscle is the target: a direct dynamic set or a deliberate hold, alone or as part of a mixed bout. */
export function isDirectWork(contribution: Contribution): boolean {
  return DIRECT.includes(contribution.category) || (contribution.category === "mixed" && contribution.parts.some((part) => DIRECT.includes(part.category)));
}

/**
 * The map's volume: bouts in which the muscle is the target, dynamic or held, each counted
 * once, on this arm. Seconds are not bouts and are not turned into any; work a muscle only
 * helps with or steadies stays in the list and the ledger, off the map.
 */
export function directWorkBouts(node: NodeExposure): number {
  return new Set(node.contributions.filter((item) => item.side !== "unknown" && isDirectWork(item)).map((item) => item.boutId)).size;
}

export function goalsForNode(summary: SpecializationSummary | null, nodeId: string): GoalProgress[] {
  return summary ? summary.goals.filter((progress) => progress.goal.nodeId === nodeId) : [];
}

/** The fill for one muscle: hatched without a reviewed mapping, then volume or target attainment. */
export function fillForNode(node: NodeExposure | null, map: "volume" | "target", goals: readonly GoalProgress[]): DiagramFill {
  if (!node || node.mappingCoverage !== "reviewed") return { kind: "hatch" };
  if (map === "target") {
    if (!goals.length) return { kind: "none" };
    return { kind: "bin", step: targetStep(Math.min(...goals.map((progress) => progress.fraction))) };
  }
  const step = volumeStep(directWorkBouts(node));
  return step ? { kind: "bin", step } : { kind: "zero" };
}

export function formatSeconds(seconds: number): string {
  const rounded = Math.round(seconds);
  if (rounded < 60) return `${rounded} s`;
  const minutes = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`;
}

/** Hold time, or that it was not recorded: holds logged before seconds were kept have none, and that is not zero. */
export function holdTime(seconds: number): string {
  return seconds > 0 ? formatSeconds(seconds) : "time not recorded";
}

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/** The parts of a muscle's exposure that are not zero, in the brief's order (§5 "Default muscle totals"). */
export function exposureParts(node: NodeExposure): string[] {
  const parts: string[] = [];
  if (node.directDynamicBouts) parts.push(`${plural(node.directDynamicBouts, "direct dynamic bout")}`);
  if (node.contributingDynamicBouts) parts.push(`${node.contributingDynamicBouts} other dynamic`);
  if (node.deliberateHoldBouts) parts.push(`${plural(node.deliberateHoldBouts, "deliberate hold")}, ${holdTime(node.deliberateHoldSeconds)}`);
  if (node.incidentalBouts) parts.push(`${node.incidentalBouts} incidental grip or steadying`);
  if (node.mixedBouts) parts.push(`${node.mixedBouts} mixed`);
  if (node.unknownBouts) parts.push(`${node.unknownBouts} unclassified`);
  return parts;
}

/** One line for a muscle: what it got, or why there is nothing to count. */
export function exposureSentence(node: NodeExposure | null): string {
  if (!node || node.mappingCoverage === "none") return "No exercise is mapped to this muscle yet, so nothing can be counted for it.";
  const parts = exposureParts(node);
  const pending = node.pendingReviewBouts ? `${plural(node.pendingReviewBouts, "set")} matched a mapping still under review and ${node.pendingReviewBouts === 1 ? "is" : "are"} not counted.` : "";
  const unknownSide = node.unknownSide.bouts ? `${plural(node.unknownSide.bouts, "set")} with no arm recorded ${node.unknownSide.bouts === 1 ? "is" : "are"} kept apart.` : "";
  const head = parts.length ? `${parts.join(" · ")}.` : node.mappingCoverage === "pending_review" ? "Its exercise mapping is still under review." : "No work for it in this window.";
  return [head, pending, unknownSide].filter(Boolean).join(" ");
}

/** Every bout counted in the list's bar, by kind, on this arm. */
export function barParts(node: NodeExposure) {
  return {
    direct: node.directDynamicBouts,
    other: node.contributingDynamicBouts,
    holds: node.deliberateHoldBouts,
    incidental: node.incidentalBouts,
    rest: node.mixedBouts + node.unknownBouts,
  };
}

/** The bar's fixed scale: 20 bouts fill it, more stays at full width with its number shown. */
export const BAR_SCALE = 20;

/** The muscles the list and the diagram can select: muscles and heads, not the compartments that group them. */
export function selectableNodes(data: SpecializationRegionData): AnatomyNode[] {
  return data.nodes.filter((node) => node.kind === "muscle" || node.kind === "head");
}

export const layerLabels: Record<AnatomyNode["layer"], string> = { surface: "Surface", intermediate: "Middle layer", deep: "Deep", mixed: "Mixed layers" };

/** The list's order: most direct work first, then other work, then the region's own order. */
export function sortForList(nodes: readonly AnatomyNode[], exposureOf: (id: string) => NodeExposure | null): AnatomyNode[] {
  const position = new Map(nodes.map((node, index) => [node.id, index] as const));
  const score = (node: AnatomyNode) => {
    const exposure = exposureOf(node.id);
    if (!exposure) return [0, 0];
    const parts = barParts(exposure);
    return [directWorkBouts(exposure), parts.direct + parts.other + parts.holds + parts.incidental + parts.rest];
  };
  return [...nodes].sort((left, right) => {
    const [leftDirect, leftAll] = score(left);
    const [rightDirect, rightAll] = score(right);
    return rightDirect - leftDirect || rightAll - leftAll || (position.get(left.id) ?? 0) - (position.get(right.id) ?? 0);
  });
}

export const goalMetricLabels: Record<GoalMetric, string> = {
  direct_dynamic_bouts: "Direct dynamic bouts",
  deliberate_hold_bouts: "Deliberate hold bouts",
  deliberate_hold_seconds: "Deliberate hold seconds",
};

export function categoryLabel(category: ExposureCategory): string {
  return exposureCategoryLabels[category];
}

/** One segment of a bout, as the athlete logged it: "20 kg × 12", "30 s", "× 10". */
export function formatSegment(segment: ContributionSegment, unit: DisplayWeightUnit): string {
  const load = segment.loadKg !== null && segment.loadKg > 0 ? formatDisplayWeight(segment.loadKg, unit) : null;
  const work = segment.holdSeconds !== null ? formatSeconds(segment.holdSeconds) : segment.reps !== null ? `× ${segment.reps}` : "no reps recorded";
  return load ? `${load} ${work.startsWith("×") ? work : `· ${work}`}` : work;
}

export type LedgerExercise = { key: string; name: string; catalogExerciseId: number | null; matchedBy: Contribution["matchedBy"]; rows: Contribution[] };

/** The ledger, grouped by exercise, most recent work first inside each (brief §6, item 5). */
export function ledgerByExercise(rows: readonly Contribution[]): LedgerExercise[] {
  const groups = new Map<string, LedgerExercise>();
  for (const row of rows) {
    const key = row.catalogExerciseId !== null ? `id:${row.catalogExerciseId}` : `name:${row.exerciseName}`;
    const group = groups.get(key) ?? { key, name: row.exerciseName, catalogExerciseId: row.catalogExerciseId, matchedBy: row.matchedBy, rows: [] };
    group.rows.push(row);
    groups.set(key, group);
  }
  const latest = (group: LedgerExercise) => group.rows.reduce((max, row) => (row.performedAt && row.performedAt > max ? row.performedAt : max), "");
  return Array.from(groups.values())
    .map((group) => ({ ...group, rows: [...group.rows].sort((left, right) => (right.performedAt ?? "").localeCompare(left.performedAt ?? "")) }))
    .sort((left, right) => right.rows.length - left.rows.length || latest(right).localeCompare(latest(left)) || left.name.localeCompare(right.name));
}

export const sideLabels: Record<Contribution["side"], string> = { left: "Left arm", right: "Right arm", bilateral: "Both arms", unknown: "Arm not recorded" };

// ---------------------------------------------------------------- findings

export type FindingAction = { kind: "inspect"; nodeId: string } | { kind: "add"; nodeId: string } | { kind: "method" };
export type Finding = { id: string; title: string; detail: string; action: FindingAction | null; actionLabel: string | null };

/**
 * "Coverage to review" (design §7, item 6): facts about the records and the mapping, in
 * neutral words, most useful first. A target behind leads, because the athlete set it;
 * after it what the numbers cannot see (no arm, no mapping, a mapping under review); then
 * a difference between the arms, and grip a strapped set did not earn. Nothing here is a
 * score, and nothing suggests training only to fill a muscle (brief §10).
 */
export function findingsFor(input: {
  data: SpecializationRegionData;
  summary: SpecializationSummary;
  otherSide: SpecializationSummary | null;
}): Finding[] {
  const { data, summary, otherSide } = input;
  const findings: Finding[] = [];
  const nodeById = new Map(data.nodes.map((node) => [node.id, node] as const));
  const nameOf = (id: string) => nodeById.get(id)?.name ?? id;
  const window = summary.mode === "planned" ? "in this plan week" : "in this window";
  const arm = summary.side === "left" ? "left arm" : "right arm";
  const region = data.region.label.toLowerCase();

  for (const progress of summary.goals) {
    if (progress.fraction >= 1) continue;
    const subject = progress.goal.nodeId ? nameOf(progress.goal.nodeId) : data.actions.find((action) => action.id === progress.goal.actionId)?.label ?? "This movement";
    findings.push({
      id: `goal:${progress.goal.id}`,
      title: `${subject}: ${progress.label}`,
      // Planned mode reads the plan week on screen; completed mode reads the target's own period.
      detail: `${goalMetricLabels[progress.goal.metric]}, ${arm}, ${summary.mode === "planned" ? `${summary.interval.label}` : progress.goal.period === "calendar_week" ? "this calendar week" : "the last 7 days"}. The target is yours, not a prescription.`,
      action: progress.goal.nodeId ? { kind: "add", nodeId: progress.goal.nodeId } : null,
      actionLabel: progress.goal.nodeId ? "See exercises for it" : null,
    });
  }

  if (summary.regionUnknownSideBouts > 0) {
    findings.push({
      id: "unknown-side",
      title: `${plural(summary.regionUnknownSideBouts, "set")} with no arm recorded`,
      detail: `They are kept apart and counted for neither arm. One-arm work logged from now on asks which arm.`,
      action: { kind: "method" },
      actionLabel: "How this is counted",
    });
  }

  if (summary.regionUnclassified.bouts > 0) {
    const names = summary.regionUnclassified.exercises.slice(0, 3).map((item) => item.name);
    findings.push({
      id: "region-only",
      title: `${plural(summary.regionUnclassified.bouts, "set")} count for the ${region} as a whole only`,
      detail: `${names.join(", ")}${summary.regionUnclassified.exercises.length > 3 ? " and others" : ""} ${summary.regionUnclassified.exercises.length === 1 ? "is" : "are"} tagged with the ${region} but not mapped to ${summary.regionUnclassified.exercises.length === 1 ? "a muscle" : "muscles"} yet, so ${summary.regionUnclassified.exercises.length === 1 ? "it adds" : "they add"} to no single muscle.`,
      action: { kind: "method" },
      actionLabel: "How this is counted",
    });
  }

  const pending = summary.nodes.filter((node) => node.pendingReviewBouts > 0);
  if (pending.length) {
    findings.push({
      id: "pending-review",
      title: `Mapping under review for ${pending.slice(0, 2).map((node) => nameOf(node.nodeId)).join(" and ")}${pending.length > 2 ? ` and ${pending.length - 2} more` : ""}`,
      detail: `${plural(pending.reduce((sum, node) => sum + node.pendingReviewBouts, 0), "set")} ${window} matched a mapping that is not reviewed yet. ${pending.length === 1 ? "It is" : "They are"} shown in the ledger and not counted.`,
      action: { kind: "inspect", nodeId: pending[0].nodeId },
      actionLabel: "Inspect coverage",
    });
  }

  const unmapped = selectableNodes(data).filter((node) => node.role === "target" && summary.nodes.find((item) => item.nodeId === node.id)?.mappingCoverage !== "reviewed");
  if (unmapped.length) {
    findings.push({
      id: "no-mapping",
      title: `${unmapped.length === 1 ? unmapped[0].name : `${unmapped.length} muscles`} without a reviewed exercise mapping`,
      detail: `${unmapped.length === 1 ? "It is" : `${unmapped.slice(0, 3).map((node) => node.shortName).join(", ")}${unmapped.length > 3 ? " and others are" : " are"}`} hatched on the drawing. That is missing mapping, not missing training.`,
      action: { kind: "inspect", nodeId: unmapped[0].id },
      actionLabel: "Inspect coverage",
    });
  }

  if (otherSide) {
    const gaps = summary.nodes
      .map((node) => {
        const other = otherSide.nodes.find((item) => item.nodeId === node.nodeId);
        return other && node.mappingCoverage === "reviewed" ? { node, here: directWorkBouts(node), there: directWorkBouts(other) } : null;
      })
      .filter((item): item is { node: NodeExposure; here: number; there: number } => item !== null && Math.abs(item.here - item.there) >= 2)
      .sort((left, right) => Math.abs(right.here - right.there) - Math.abs(left.here - left.there));
    if (gaps.length) {
      const top = gaps[0];
      const otherArm = summary.side === "left" ? "right" : "left";
      findings.push({
        id: `arms:${top.node.nodeId}`,
        title: `${nameOf(top.node.nodeId)}: ${top.here} direct bouts on the ${summary.side} arm, ${top.there} on the ${otherArm}`,
        detail: `${gaps.length > 1 ? `${gaps.length - 1} more muscle${gaps.length === 2 ? "" : "s"} differ by two or more bouts. ` : ""}Two-handed sets count for both arms; only one-arm sets make the arms differ.`,
        action: { kind: "inspect", nodeId: top.node.nodeId },
        actionLabel: "Inspect coverage",
      });
    }
  }

  const strapped = new Set<string>();
  for (const node of summary.nodes) for (const row of node.notCounted ?? []) if (row.notes.some((note) => /strap/i.test(note) && /not counted/i.test(note))) strapped.add(row.boutId);
  if (strapped.size) {
    findings.push({
      id: "straps",
      title: `${plural(strapped.size, "strapped set")} earned no grip credit`,
      detail: "Straps hold the bar for the hand, so the finger flexors are not credited for those sets. The rest of each set still counts.",
      action: { kind: "method" },
      actionLabel: "How this is counted",
    });
  }

  return findings;
}

/** The exercises that loaded the region in the window, distinct bouts each, for "Exercises in this window". */
export function exercisesInWindow(summary: SpecializationSummary, data: SpecializationRegionData): { name: string; catalogExerciseId: number | null; bouts: number; directFor: string[] }[] {
  const regionNodes = new Set(data.nodes.filter((node) => node.regionId === data.region.id).map((node) => node.id));
  const byExercise = new Map<string, { name: string; catalogExerciseId: number | null; bouts: Set<string>; directFor: Set<string> }>();
  const shortName = new Map(data.nodes.map((node) => [node.id, node.shortName] as const));
  for (const node of summary.nodes) {
    if (!regionNodes.has(node.nodeId)) continue;
    for (const row of node.contributions) {
      if (row.side === "unknown") continue;
      const key = row.catalogExerciseId !== null ? `id:${row.catalogExerciseId}` : `name:${row.exerciseName}`;
      const entry = byExercise.get(key) ?? { name: row.exerciseName, catalogExerciseId: row.catalogExerciseId, bouts: new Set<string>(), directFor: new Set<string>() };
      entry.bouts.add(row.boutId);
      if (isDirectWork(row)) entry.directFor.add(shortName.get(node.nodeId) ?? node.nodeId);
      byExercise.set(key, entry);
    }
  }
  return Array.from(byExercise.values())
    .map((entry) => ({ name: entry.name, catalogExerciseId: entry.catalogExerciseId, bouts: entry.bouts.size, directFor: Array.from(entry.directFor) }))
    .sort((left, right) => right.bouts - left.bouts || left.name.localeCompare(right.name));
}

/** Distinct region bouts per local day of the window (completed mode), Monday first. */
export function boutsByDay(summary: SpecializationSummary, data: SpecializationRegionData, dayKeyOf: (iso: string) => string): Map<string, number> {
  const regionNodes = new Set(data.nodes.filter((node) => node.regionId === data.region.id).map((node) => node.id));
  const byDay = new Map<string, Set<string>>();
  for (const node of summary.nodes) {
    if (!regionNodes.has(node.nodeId)) continue;
    for (const row of node.contributions) {
      if (row.side === "unknown" || !row.performedAt) continue;
      const key = dayKeyOf(row.performedAt);
      const set = byDay.get(key) ?? new Set<string>();
      set.add(row.boutId);
      byDay.set(key, set);
    }
  }
  return new Map(Array.from(byDay.entries()).map(([key, set]) => [key, set.size]));
}

export type SessionOverlap = { key: string; sessionLabel: string; performedAt: string | null; nodeId: string; nodeShortName: string; exercises: string[] };

/**
 * Repeated direct exposure inside one session (brief §7: "Offer a review of overlapping
 * repeated exposures, using neutral factual wording"): a muscle loaded directly by two or
 * more different exercises in the same workout or plan day. Facts only; no recovery score.
 */
export function overlapsInWindow(summary: SpecializationSummary, data: SpecializationRegionData): SessionOverlap[] {
  const regionNodes = new Map(data.nodes.filter((node) => node.regionId === data.region.id).map((node) => [node.id, node] as const));
  const bySessionNode = new Map<string, SessionOverlap & { names: Set<string> }>();
  for (const node of summary.nodes) {
    const meta = regionNodes.get(node.nodeId);
    if (!meta) continue;
    for (const row of node.contributions) {
      if (row.side === "unknown" || !isDirectWork(row)) continue;
      const session = row.sessionId ?? row.sessionLabel;
      const key = `${session}|${node.nodeId}`;
      const entry = bySessionNode.get(key) ?? { key, sessionLabel: row.sessionLabel, performedAt: row.performedAt, nodeId: node.nodeId, nodeShortName: meta.shortName, exercises: [], names: new Set<string>() };
      entry.names.add(row.exerciseName);
      bySessionNode.set(key, entry);
    }
  }
  return Array.from(bySessionNode.values())
    .filter((entry) => entry.names.size >= 2)
    .map(({ names, ...entry }) => ({ ...entry, exercises: Array.from(names).sort((left, right) => left.localeCompare(right)) }))
    .sort((left, right) => (left.performedAt ?? "").localeCompare(right.performedAt ?? "") || left.sessionLabel.localeCompare(right.sessionLabel) || left.nodeShortName.localeCompare(right.nodeShortName));
}

