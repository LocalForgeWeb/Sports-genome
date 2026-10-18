import { formatDisplayWeight, type DisplayWeightUnit } from "@/lib/weightUnits";
import { categoryFor, exposureCategoryLabels } from "@shared/specialization/rules";
import type { AnatomyNode, Contribution, ContributionSegment, ExposureCategory, GoalMetric, GoalProgress, MappingEvidenceBasis, MuscleMode, NodeExposure, NodeId, RegionBoutRow, Relationship, SpecializationRegionData, SpecializationSummary, VariantMapping } from "@shared/specialization/types";

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

/**
 * The parts of a muscle's exposure that are not zero, in the brief's order (§5 "Default muscle
 * totals"). `incidentalWork` is the region's word for incidental work (`region.wording`).
 */
export function exposureParts(node: NodeExposure, incidentalWork: string): string[] {
  const parts: string[] = [];
  if (node.directDynamicBouts) parts.push(`${plural(node.directDynamicBouts, "direct dynamic bout")}`);
  if (node.contributingDynamicBouts) parts.push(`${node.contributingDynamicBouts} other dynamic`);
  if (node.deliberateHoldBouts) parts.push(`${plural(node.deliberateHoldBouts, "deliberate hold")}, ${holdTime(node.deliberateHoldSeconds)}`);
  if (node.incidentalBouts) parts.push(`${node.incidentalBouts} incidental ${incidentalWork} or steadying`);
  if (node.mixedBouts) parts.push(`${node.mixedBouts} mixed`);
  if (node.unknownBouts) parts.push(`${node.unknownBouts} unclassified`);
  return parts;
}

/** One line for a muscle: what it got, or why there is nothing to count. */
export function exposureSentence(node: NodeExposure | null, incidentalWork: string): string {
  if (!node || node.mappingCoverage === "none") return "No exercise is mapped to this muscle yet, so nothing can be counted for it.";
  const parts = exposureParts(node, incidentalWork);
  const pending = node.pendingReviewBouts ? `${plural(node.pendingReviewBouts, "set")} matched a mapping still under review and ${node.pendingReviewBouts === 1 ? "is" : "are"} not counted.` : "";
  const noArmPending = node.unknownSide.pendingReviewBouts ?? 0;
  const pendingNoArm = noArmPending ? `${plural(noArmPending, "set")} with no arm recorded matched a mapping still under review and ${noArmPending === 1 ? "is" : "are"} not counted.` : "";
  const unknownSide = node.unknownSide.bouts ? `${plural(node.unknownSide.bouts, "set")} with no arm recorded ${node.unknownSide.bouts === 1 ? "is" : "are"} kept apart.` : "";
  const head = parts.length ? `${parts.join(" · ")}.` : node.mappingCoverage === "pending_review" ? "Its exercise mapping is still under review." : "No work for it in this window.";
  return [head, pending, pendingNoArm, unknownSide].filter(Boolean).join(" ");
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

/** The same, short enough for one line in the selected-muscle strip on a 375 px phone. */
export const goalMetricShortLabels: Record<GoalMetric, string> = {
  direct_dynamic_bouts: "Direct bouts",
  deliberate_hold_bouts: "Hold bouts",
  deliberate_hold_seconds: "Hold seconds",
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

/** What the ledger groups: any bout row that names its exercise (a muscle's contribution, a movement's bout, a region bout). */
export type LedgerRow = Pick<Contribution, "boutId" | "catalogExerciseId" | "exerciseName" | "matchedBy" | "performedAt">;
export type LedgerExercise<T extends LedgerRow = Contribution> = { key: string; name: string; catalogExerciseId: number | null; matchedBy: Contribution["matchedBy"]; rows: T[] };

/** The key one exercise is grouped by: its catalog id, else its name. */
export const exerciseKeyOf = (row: Pick<LedgerRow, "catalogExerciseId" | "exerciseName">) => (row.catalogExerciseId !== null ? `id:${row.catalogExerciseId}` : `name:${row.exerciseName}`);

/** The ledger, grouped by exercise, most recent work first inside each (brief §6, item 5). */
export function ledgerByExercise<T extends LedgerRow>(rows: readonly T[]): LedgerExercise<T>[] {
  const groups = new Map<string, LedgerExercise<T>>();
  for (const row of rows) {
    const key = exerciseKeyOf(row);
    const group = groups.get(key) ?? { key, name: row.exerciseName, catalogExerciseId: row.catalogExerciseId, matchedBy: row.matchedBy, rows: [] };
    group.rows.push(row);
    groups.set(key, group);
  }
  const latest = (group: LedgerExercise<T>) => group.rows.reduce((max, row) => (row.performedAt && row.performedAt > max ? row.performedAt : max), "");
  return Array.from(groups.values())
    .map((group) => ({ ...group, rows: [...group.rows].sort((left, right) => (right.performedAt ?? "").localeCompare(left.performedAt ?? "")) }))
    .sort((left, right) => right.rows.length - left.rows.length || latest(right).localeCompare(latest(left)) || left.name.localeCompare(right.name));
}

export const sideLabels: Record<Contribution["side"], string> = { left: "Left arm", right: "Right arm", bilateral: "Both arms", unknown: "Arm not recorded" };

// ---------------------------------------------------------------- findings

/** Which region-level list of bouts a total opens: the region's distinct bouts, the ones with no arm, or work mapped to no muscle. */
export type RegionBoutList = "region" | "unknown-side" | "region-only";
export type FindingAction =
  | { kind: "inspect"; nodeId: string }
  | { kind: "add"; nodeId: string }
  | { kind: "movement"; actionId: string }
  | { kind: "bouts"; list: RegionBoutList }
  | { kind: "method" };
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
      // A muscle target opens the muscle's exercises; a movement target opens the movement: its sets and its exercises.
      action: progress.goal.nodeId ? { kind: "add", nodeId: progress.goal.nodeId } : progress.goal.actionId ? { kind: "movement", actionId: progress.goal.actionId } : null,
      actionLabel: progress.goal.nodeId ? "See exercises for it" : progress.goal.actionId ? "See its sets and exercises" : null,
    });
  }

  if (summary.regionUnknownSideBouts > 0) {
    findings.push({
      id: "unknown-side",
      title: `${plural(summary.regionUnknownSideBouts, "set")} with no arm recorded`,
      detail: `They are kept apart and counted for neither arm. One-arm work logged from now on asks which arm.`,
      action: { kind: "bouts", list: "unknown-side" },
      actionLabel: "See these sets",
    });
  }

  if (summary.regionUnclassified.bouts > 0) {
    const names = summary.regionUnclassified.exercises.slice(0, 3).map((item) => item.name);
    findings.push({
      id: "region-only",
      title: `${plural(summary.regionUnclassified.bouts, "set")} count for the ${region} as a whole only`,
      detail: `${names.join(", ")}${summary.regionUnclassified.exercises.length > 3 ? " and others" : ""} ${summary.regionUnclassified.exercises.length === 1 ? "is" : "are"} tagged with the ${region} but not mapped to ${summary.regionUnclassified.exercises.length === 1 ? "a muscle" : "muscles"} yet, so ${summary.regionUnclassified.exercises.length === 1 ? "it adds" : "they add"} to no single muscle.`,
      action: { kind: "bouts", list: "region-only" },
      actionLabel: "See these sets",
    });
  }

  // Sets with no arm recorded are in neither arm's count (unknownSide), and are named as such.
  const noArmPendingOf = (node: NodeExposure) => node.unknownSide.pendingReviewBouts ?? 0;
  const pending = summary.nodes.filter((node) => node.pendingReviewBouts > 0 || noArmPendingOf(node) > 0);
  if (pending.length) {
    const onArm = pending.reduce((sum, node) => sum + node.pendingReviewBouts, 0);
    const noArm = pending.reduce((sum, node) => sum + noArmPendingOf(node), 0);
    findings.push({
      id: "pending-review",
      title: `Mapping under review for ${pending.slice(0, 2).map((node) => nameOf(node.nodeId)).join(" and ")}${pending.length > 2 ? ` and ${pending.length - 2} more` : ""}`,
      detail: `${plural(onArm + noArm, "set")} ${window} matched a mapping that is not reviewed yet${noArm ? `, ${noArm} of them with no arm recorded` : ""}. ${onArm + noArm === 1 ? "It is" : "They are"} shown in the ledger and not counted.`,
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

// ---------------------------------------------------------------- region totals, opened

/**
 * The bouts behind a region-level total (brief §1: "Every total opens the contributing
 * exercises and actual set records"): the region's distinct bouts on this arm, the ones with
 * no arm recorded, or the work tagged with the region and mapped to no muscle. A summary made
 * before the calculator kept these rows has none, and the list then says so rather than guess.
 */
export function regionBoutRows(summary: SpecializationSummary, list: RegionBoutList): RegionBoutRow[] {
  if (list === "region") return summary.regionBoutRows ?? [];
  if (list === "unknown-side") return summary.regionUnknownSideRows ?? [];
  return summary.regionUnclassifiedRows ?? [];
}

/**
 * The bouts behind one bar of "Exercises in this window" (bouts per day): the region's
 * distinct bouts on this arm done on that local day, the same bouts `boutsByDay` counts.
 */
export function regionBoutRowsOnDay(summary: SpecializationSummary, dayKey: string, dayKeyOf: (iso: string) => string): RegionBoutRow[] {
  return regionBoutRows(summary, "region").filter((row) => row.performedAt !== null && dayKeyOf(row.performedAt) === dayKey);
}

// ---------------------------------------------------------------- exercises for a muscle, in words

/** The key of the entry the recommender adds to `AlreadyCovered.days` for sets logged in the window (recommendations.ts). */
export const LOGGED_ENTRY_KEY = "logged";

function listWords(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * One "Already covered by" entry in words: the plan days it is on, then what was logged.
 * The recommender carries logged work as an extra entry in `days` whose label is already a
 * phrase ("4 sets logged in this window"); it is said as that phrase, never as a day.
 */
export function coveredWords(item: { name: string; days: readonly { key: string; label: string }[] }): string {
  const planned = item.days.filter((day) => day.key !== LOGGED_ENTRY_KEY).map((day) => day.label);
  const logged = item.days.filter((day) => day.key === LOGGED_ENTRY_KEY).map((day) => day.label);
  const parts = [...(planned.length ? [`planned on ${listWords(planned)}`] : []), ...logged];
  return parts.length ? `${item.name}: ${parts.join("; ")}` : item.name;
}

/** The parts of a recommendation result the missing-action line reads (recommendations.ts `Recommendations`, kind "candidates"). */
export type MissingActionInput = {
  missingActions?: readonly string[];
  candidates: readonly { catalogExerciseId: number; missingActions?: readonly string[] }[];
  excludedCount: number;
  skippedAtTarget: number;
};

type MissingReason = "none" | "excluded" | "met" | "either";

/**
 * One neutral sentence for a main action of the muscle that has no direct work in the window
 * and that no suggestion covers (brief §7, "Recommendations explain a missing action"): what
 * the records show, and plainly why nothing is offered for it. Usually no reviewed exercise
 * trains it directly (supination for the biceps: only Lever Supination works it, and there
 * the biceps only helps); otherwise every exercise that does was left out by the athlete (the
 * exercise, or its equipment) or answers a target already met, which the recommender skips.
 * A fact about the records and the mapping, never a shortfall: there is no target in it.
 *
 * The reason follows `recommendFor`: an exercise with a credited direct mapping for the action
 * is a candidate, excluded, or skipped at target. `equipmentOf` (the catalog the recommender
 * read) tells an equipment exclusion apart; without it the result's counts decide, and
 * "either" is said only when they cannot.
 */
export function missingActionNote(input: {
  data: SpecializationRegionData;
  nodeId: NodeId;
  result: MissingActionInput;
  mode: SpecializationSummary["mode"];
  exclusions?: { catalogExerciseIds?: readonly number[]; equipment?: readonly string[] };
  equipmentOf?: (catalogExerciseId: number) => string | null;
}): string | null {
  const { data, nodeId, result } = input;
  const covered = new Set(result.candidates.flatMap((candidate) => candidate.missingActions ?? []));
  const uncovered = (result.missingActions ?? []).filter((actionId) => !covered.has(actionId));
  if (!uncovered.length) return null;
  const variantById = new Map(data.variants.map((variant) => [variant.id, variant] as const));
  /** The exercises the recommender counts as direct work on this action for this muscle: a reviewed direct mapping it credits (moved, or held on purpose). */
  const directExercises = (actionId: string) => Array.from(new Set(data.mappings
    .filter((mapping) => mapping.versionKey === data.mappingVersion.key && mapping.reviewStatus === "reviewed" && mapping.nodeId === nodeId && mapping.actionId === actionId && mapping.relationship === "direct")
    .filter((mapping) => {
      const variant = variantById.get(mapping.variantId);
      if (!variant) return false;
      const category = categoryFor(mapping.relationship, mapping.muscleMode, variant.deliberateHold);
      return category !== "incidental_isometric" && category !== "unknown";
    })
    .map((mapping) => variantById.get(mapping.variantId)!.catalogExerciseId)));
  const excludedIds = new Set(input.exclusions?.catalogExerciseIds ?? []);
  const excludedEquipment = new Set(input.exclusions?.equipment ?? []);
  /** What became of one such exercise: left out by the athlete, or skipped as answering a met target (not a candidate, so one of the two). */
  const fate = (catalogExerciseId: number): Exclude<MissingReason, "none"> => {
    if (excludedIds.has(catalogExerciseId)) return "excluded";
    if (input.equipmentOf) {
      const equipment = input.equipmentOf(catalogExerciseId);
      return equipment !== null && excludedEquipment.has(equipment) ? "excluded" : "met";
    }
    if (!excludedEquipment.size || !result.excludedCount) return "met";
    return result.skippedAtTarget ? "either" : "excluded";
  };
  const reasonFor = (actionId: string): MissingReason => {
    const fates = new Set(directExercises(actionId).map(fate));
    if (!fates.size) return "none";
    return fates.size === 1 ? Array.from(fates)[0] : "either";
  };
  const label = (actionId: string) => data.actions.find((action) => action.id === actionId)?.label ?? actionId;
  const lowerFirst = (text: string) => (text ? text.charAt(0).toLowerCase() + text.slice(1) : text);
  const names = (actionIds: readonly string[], capital: boolean) => listWords(actionIds.map((actionId, position) => (capital && !position ? label(actionId) : lowerFirst(label(actionId)))));
  const where = input.mode === "planned" ? "planned in this week" : "in this window";

  const groups = new Map<MissingReason, string[]>();
  for (const actionId of uncovered) {
    const reason = reasonFor(actionId);
    groups.set(reason, [...(groups.get(reason) ?? []), actionId]);
  }
  const lead = `${names(uncovered, true)}, ${uncovered.length > 1 ? "main actions of this muscle, have" : "a main action of this muscle, has"} no direct work ${where}`;
  const clauses = Array.from(groups.entries()).map(([reason, actionIds]) => {
    // With more than one reason, each clause names the actions it is about.
    const them = groups.size > 1 ? names(actionIds, false) : actionIds.length > 1 ? "them" : "it";
    if (reason === "none") return `no reviewed exercise trains ${them} directly yet`;
    if (reason === "excluded") return `the exercises that train ${them} directly are left out by your choices under What is suggested`;
    if (reason === "met") return `the exercises that train ${them} directly answer a target you have already met, so none is suggested`;
    return `the exercises that train ${them} directly are left out by your choices or answer a target you have already met`;
  });
  return `${lead}${clauses.length === 1 ? ", and " : "; "}${clauses.join("; ")}.`;
}

// ---------------------------------------------------------------- a movement

/** One bout behind a movement's numbers: the set, the kinds of work it gave the movement, and the muscles that did it. */
export type MovementBout = RegionBoutRow & {
  /** The kinds of work this bout gave the movement, strongest first: one set can move it directly with one muscle and help with another. */
  categories: ExposureCategory[];
  /** The region's muscles credited with this movement in this bout. */
  nodeIds: NodeId[];
  /** The reviewed mappings that credit it, for "Why this counts". */
  mappingIds: string[];
  holdSeconds: number;
  notes: string[];
};

/**
 * A movement's numbers, counted the way a movement target is (exposure.ts goalProgressFor):
 * distinct bouts in which a credited mapping for that movement on one of the region's own
 * muscles is that kind of work; hold seconds once per bout; a bout with no arm recorded is
 * listed apart and counted for neither arm.
 */
export type MovementTotals = { directDynamicBouts: number; deliberateHoldBouts: number; deliberateHoldSeconds: number; otherBouts: number; unknownSideBouts: number };

const CATEGORY_ORDER: readonly ExposureCategory[] = ["direct_dynamic", "deliberate_isometric", "contributing_dynamic", "incidental_isometric", "mixed", "unknown"];

/**
 * The contributions behind a movement (brief §7, "Targets attach to muscle or action"): every
 * contribution on a region muscle whose parts carry that action, one row per bout however
 * many muscles it moved, so "3 of your 10" for wrist extension opens the three sets.
 */
export function movementLedger(summary: SpecializationSummary, data: SpecializationRegionData, actionId: string): { bouts: MovementBout[]; totals: MovementTotals } {
  const regionNodes = new Set(data.nodes.filter((node) => node.regionId === data.region.id).map((node) => node.id));
  const byBout = new Map<string, MovementBout>();
  for (const node of summary.nodes) {
    if (!regionNodes.has(node.nodeId)) continue;
    for (const row of node.contributions) {
      const parts = row.parts.filter((part) => part.actionId === actionId);
      if (!parts.length) continue;
      const entry = byBout.get(row.boutId) ?? {
        boutId: row.boutId, side: row.side, sideSource: row.sideSource, catalogExerciseId: row.catalogExerciseId, exerciseName: row.exerciseName, matchedBy: row.matchedBy,
        sessionId: row.sessionId, sessionLabel: row.sessionLabel, performedAt: row.performedAt, kind: row.kind, segments: row.segments,
        categories: [], nodeIds: [], mappingIds: [], holdSeconds: row.holdSeconds, notes: [],
      };
      for (const part of parts) {
        if (!entry.categories.includes(part.category)) entry.categories.push(part.category);
        if (!entry.mappingIds.includes(part.mappingId)) entry.mappingIds.push(part.mappingId);
      }
      if (!entry.nodeIds.includes(node.nodeId)) entry.nodeIds.push(node.nodeId);
      for (const note of row.notes) if (!entry.notes.includes(note)) entry.notes.push(note);
      byBout.set(row.boutId, entry);
    }
  }
  const bouts = Array.from(byBout.values()).map((bout) => ({ ...bout, categories: [...bout.categories].sort((left, right) => CATEGORY_ORDER.indexOf(left) - CATEGORY_ORDER.indexOf(right)) }));
  const totals: MovementTotals = { directDynamicBouts: 0, deliberateHoldBouts: 0, deliberateHoldSeconds: 0, otherBouts: 0, unknownSideBouts: 0 };
  for (const bout of bouts) {
    if (bout.side === "unknown") { totals.unknownSideBouts += 1; continue; }
    const direct = bout.categories.includes("direct_dynamic");
    const held = bout.categories.includes("deliberate_isometric");
    if (direct) totals.directDynamicBouts += 1;
    if (held) { totals.deliberateHoldBouts += 1; totals.deliberateHoldSeconds += bout.holdSeconds; }
    if (!direct && !held) totals.otherBouts += 1;
  }
  return { bouts, totals };
}

// ---------------------------------------------------------------- why an exercise counts

/** A mapping's relationship, in words (brief §2: say what kind of claim each number rests on). */
export const relationshipLabels: Record<Relationship, string> = {
  direct: "Direct target",
  contributing: "Helps (contributing)",
  stabilizer: "Steadies the joint",
  incidental: "Incidental",
  unknown: "Role not known",
};
export const muscleModeLabels: Record<MuscleMode, string> = {
  dynamic: "moves the joint",
  isometric: "holds still",
  mixed: "moves and holds",
  unknown: "mode not known",
};
/** What a mapping rests on. Inference, measurement and anatomy reference are told apart (brief §2, §4). */
export const evidenceBasisLabels: Record<MappingEvidenceBasis, string> = {
  anatomy: "Anatomy reference",
  biomechanics: "Biomechanics",
  emg: "Measured by EMG",
  longitudinal: "Measured in training studies",
  inference: "Inferred from anatomy",
  unknown: "Basis not recorded",
};

/**
 * The muscle an add for a movement leads its preview with: the region muscle the chosen
 * exercise's reviewed mapping credits with that movement, else the movement's main mover.
 */
export function movementFocusNodeId(data: SpecializationRegionData, actionId: string, mappingIds: readonly string[]): NodeId | null {
  const regionNodes = new Set(data.nodes.filter((node) => node.regionId === data.region.id).map((node) => node.id));
  const credited = mappingsBehind(data, mappingIds).find((mapping) => mapping.actionId === actionId && regionNodes.has(mapping.nodeId));
  if (credited) return credited.nodeId;
  const movers = data.nodeActions.filter((row) => row.actionId === actionId && regionNodes.has(row.nodeId));
  return (movers.find((row) => row.role === "prime") ?? movers[0])?.nodeId ?? null;
}

/** The plan day of the most recent workout with one (athleteRecord's rule: the latest start), for `trainingWeekFor`. */
export function latestSessionDayLabel(sessions: readonly { dayLabel?: string | null; startedAt: string }[]): string | null {
  let latest: { at: number; label: string } | null = null;
  for (const session of sessions) {
    const at = Date.parse(session.startedAt);
    if (!session.dayLabel || Number.isNaN(at)) continue;
    if (!latest || at > latest.at) latest = { at, label: session.dayLabel };
  }
  return latest?.label ?? null;
}

/** The mappings with these ids, each once, in the order given. Ids the region does not have are skipped. */
export function mappingsBehind(data: SpecializationRegionData, ids: readonly string[]): VariantMapping[] {
  const byId = new Map(data.mappings.map((mapping) => [mapping.id, mapping] as const));
  const seen = new Set<string>();
  const out: VariantMapping[] = [];
  for (const id of ids) {
    const mapping = byId.get(id);
    if (!mapping || seen.has(id)) continue;
    seen.add(id);
    out.push(mapping);
  }
  return out;
}

