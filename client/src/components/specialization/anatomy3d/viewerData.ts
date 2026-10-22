import type { AnatomyNode, ArmSide, GoalMetric, GoalPeriod, GoalProgress, NodeExposure, SpecializationRegionData, SpecializationSummary, SummaryMode, SummarySide } from "@shared/specialization/types";
import type { SpecializationWindow } from "@/lib/specialization/viewState";
import { categoryLabel, layerLabels, ledgerByExercise } from "../model";
import { modelSourceForCanonical } from "./modelIdentity";

/**
 * What the 3D view's panel shows for one muscle (SG-FOREARM-INTEGRATION-20261019 §5).
 *
 * The viewer is a presentation layer: every number here is read from the summary the rest of
 * the page reads (`useSpecializationSummary` → `getSpecializationSummary`), for the arm, mode
 * and window on screen. Nothing is calculated again, nothing is estimated, and a number the
 * summary does not have is `null`, never 0. The handoff's field names are kept, with what each
 * one is in the app's engine:
 *
 * - `directDynamicSets`: the engine's direct dynamic bouts (one per set; a drop set is one bout).
 * - `supportingExerciseExposure`: other dynamic bouts, with their unit.
 * - `deliberateIsometricBouts` / `isometricHoldSeconds`: deliberate holds, kept apart; the
 *   seconds are the logged hold time and null when holds were logged with no time.
 * - `incidentalGripExposure`: incidental grip or steadying bouts, never direct sets.
 * - `targetSets`: the athlete's own direct-dynamic target, only when its period is the window
 *   on screen. There is no default target.
 * - `exercises`: the real contributing records, grouped by exercise.
 * - `physicalFunction` / `visibleShapeContribution`: the node's reviewed content.
 * - `dataStatus` / `dataNote`: loading, error, an unknown muscle, no mapping, partial, zero.
 */

export type ViewerDataStatus = "loading" | "error" | "unavailable" | "missing" | "partial" | "zero" | "complete";

export type ViewerCount = { value: number; unit: "bouts" };

export type ViewerTarget = {
  metric: GoalMetric;
  period: GoalPeriod;
  target: number;
  value: number;
  fraction: number;
  /** "8 of your 20" */
  label: string;
  /** Whether the target's own period is the window on screen, so value and target can be set side by side. */
  matchesWindow: boolean;
};

export type ViewerExercise = {
  key: string;
  catalogExerciseId: number | null;
  name: string;
  bouts: number;
  /** "2 direct dynamic · 1 deliberate hold" */
  breakdown: string;
  matchedBy: "id" | "name" | "none";
};

export type ViewerMuscleData = {
  nodeId: string;
  displayName: string;
  shortName: string;
  layerLabel: string;
  /** Whether the 3D model draws it (the upper-arm muscles credited here are not in it). */
  inModel: boolean;
  physicalFunction: { text: string; reviewed: boolean; actions: { label: string; role: "prime" | "assist" }[] };
  visibleShapeContribution: { text: string; caveats: string[]; reviewed: boolean };
  directDynamicSets: { bouts: number; reps: number } | null;
  supportingExerciseExposure: ViewerCount | null;
  deliberateIsometricBouts: number | null;
  isometricHoldSeconds: number | null;
  incidentalGripExposure: ViewerCount | null;
  targetSets: ViewerTarget | null;
  targets: ViewerTarget[];
  exercises: ViewerExercise[];
  /** Mixed and unclassified bouts, counted once each and shown apart. */
  otherBouts: number | null;
  dataStatus: ViewerDataStatus;
  dataNote: string | null;
};

export type ViewerSummaryState =
  | { kind: "loading"; note: string }
  | { kind: "error"; note: string }
  | { kind: "ready"; summary: SpecializationSummary };

export type ViewerWindow = { mode: SummaryMode; window: SpecializationWindow; side: SummarySide; timeZone: string };

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/** A target's value and the window's numbers describe the same days only when the periods are the same. */
export function targetMatchesWindow(goal: { period: GoalPeriod; timezone: string }, view: Pick<ViewerWindow, "mode" | "window" | "timeZone">): boolean {
  // A planned summary reads every target over the plan week on screen.
  if (view.mode === "planned") return true;
  if (view.window === "week") return goal.period === "calendar_week" && goal.timezone === view.timeZone;
  if (view.window === "7d") return goal.period === "rolling_7d";
  return false;
}

function targetOf(progress: GoalProgress, view: ViewerWindow): ViewerTarget {
  return {
    metric: progress.goal.metric,
    period: progress.goal.period,
    target: progress.goal.target,
    value: progress.value,
    fraction: progress.fraction,
    label: progress.label,
    matchesWindow: targetMatchesWindow(progress.goal, view),
  };
}

function exercisesOf(exposure: NodeExposure, wording: SpecializationRegionData["region"]["wording"]): ViewerExercise[] {
  return ledgerByExercise(exposure.contributions).map((group) => {
    const counts = new Map<string, number>();
    for (const row of group.rows) counts.set(categoryLabel(row.category, wording), (counts.get(categoryLabel(row.category, wording)) ?? 0) + 1);
    return {
      key: group.key,
      catalogExerciseId: group.catalogExerciseId,
      name: group.name,
      bouts: group.rows.length,
      breakdown: Array.from(counts, ([label, count]) => `${count} ${label.toLowerCase()}`).join(" · "),
      matchedBy: group.matchedBy,
    };
  });
}

function partialNote(exposure: NodeExposure): string | null {
  const lines: string[] = [];
  if (exposure.mappingCoverage === "pending_review") lines.push("Its exercise mapping is still under review, so nothing is counted for it yet.");
  if (exposure.pendingReviewBouts > 0) lines.push(`${plural(exposure.pendingReviewBouts, "set")} matched a mapping still under review and ${exposure.pendingReviewBouts === 1 ? "is" : "are"} shown, not counted.`);
  const noArmPending = exposure.unknownSide.pendingReviewBouts ?? 0;
  if (exposure.unknownSide.bouts + noArmPending > 0) lines.push(`${plural(exposure.unknownSide.bouts + noArmPending, "set")} with no arm recorded ${exposure.unknownSide.bouts + noArmPending === 1 ? "is" : "are"} kept apart and counted for neither arm.`);
  if (exposure.unknownBouts > 0) lines.push(`${plural(exposure.unknownBouts, "bout")} could not be classified.`);
  const byName = new Set(exposure.contributions.filter((row) => row.matchedBy === "name").map((row) => row.boutId)).size;
  if (byName > 0) lines.push(`${plural(byName, "set")} matched by exercise name, not by catalog id.`);
  return lines.length ? lines.join(" ") : null;
}

/**
 * The panel's data for one canonical id. `node` is looked up by exact id; an id the region
 * does not have is "unavailable", with no numbers, never another muscle's.
 */
export function viewerMuscleData(input: { data: SpecializationRegionData; nodeId: string; state: ViewerSummaryState; view: ViewerWindow }): ViewerMuscleData {
  const { data, nodeId, state, view } = input;
  const node: AnatomyNode | undefined = data.nodes.find((item) => item.id === nodeId && (item.kind === "muscle" || item.kind === "head"));
  const empty = {
    directDynamicSets: null,
    supportingExerciseExposure: null,
    deliberateIsometricBouts: null,
    isometricHoldSeconds: null,
    incidentalGripExposure: null,
    targetSets: null,
    targets: [],
    exercises: [],
    otherBouts: null,
  } satisfies Partial<ViewerMuscleData>;
  if (!node) {
    return {
      nodeId,
      displayName: "Muscle not found",
      shortName: "",
      layerLabel: "",
      inModel: false,
      physicalFunction: { text: "", reviewed: false, actions: [] },
      visibleShapeContribution: { text: "", caveats: [], reviewed: false },
      ...empty,
      dataStatus: "unavailable",
      dataNote: "This muscle is not in the atlas, so there are no numbers for it. Choose a muscle from the list.",
    };
  }
  const actionById = new Map(data.actions.map((action) => [action.id, action] as const));
  const actions = data.nodeActions
    .filter((item) => item.nodeId === node.id)
    .sort((left, right) => (left.role === right.role ? 0 : left.role === "prime" ? -1 : 1))
    .flatMap((item) => {
      const action = actionById.get(item.actionId);
      return action ? [{ label: action.label, role: item.role }] : [];
    });
  const appearanceReviewed = data.claims.some((claim) => claim.nodeId === node.id && claim.kind === "appearance" && claim.reviewStatus === "reviewed");
  const base = {
    nodeId: node.id,
    displayName: node.name,
    shortName: node.shortName,
    layerLabel: layerLabels[node.layer],
    inModel: modelSourceForCanonical(node.id) !== null,
    physicalFunction: { text: node.whatItDoes, reviewed: node.status === "reviewed", actions },
    visibleShapeContribution: { text: node.shapeNote, caveats: node.caveats, reviewed: appearanceReviewed },
  };
  if (state.kind !== "ready") return { ...base, ...empty, dataStatus: state.kind, dataNote: state.note };

  const exposure = state.summary.nodes.find((item) => item.nodeId === node.id) ?? null;
  const targets = state.summary.goals.filter((progress) => progress.goal.nodeId === node.id).map((progress) => targetOf(progress, view));
  if (!exposure || exposure.mappingCoverage === "none") {
    return { ...base, ...empty, targets, dataStatus: "missing", dataNote: "No exercise is mapped to this muscle yet, so there is nothing to count. That is missing mapping, not missing training." };
  }
  const note = partialNote(exposure);
  const counted = exposure.directDynamicBouts + exposure.contributingDynamicBouts + exposure.deliberateHoldBouts + exposure.incidentalBouts + exposure.mixedBouts + exposure.unknownBouts;
  const status: ViewerDataStatus = note ? "partial" : counted === 0 ? "zero" : "complete";
  const nothing = `Nothing ${view.mode === "planned" ? "planned" : "logged"} for it${view.side === "both" ? "" : ` on the ${view.side} arm`} in this window.`;
  return {
    ...base,
    directDynamicSets: { bouts: exposure.directDynamicBouts, reps: exposure.directDynamicReps },
    supportingExerciseExposure: { value: exposure.contributingDynamicBouts, unit: "bouts" },
    deliberateIsometricBouts: exposure.deliberateHoldBouts,
    // Holds logged with no time have no seconds to show: that is unknown, not zero.
    isometricHoldSeconds: exposure.deliberateHoldBouts > 0 && exposure.deliberateHoldSeconds === 0 ? null : exposure.deliberateHoldSeconds,
    incidentalGripExposure: { value: exposure.incidentalBouts, unit: "bouts" },
    targetSets: targets.find((target) => target.metric === "direct_dynamic_bouts" && target.matchesWindow) ?? null,
    targets,
    exercises: exercisesOf(exposure, data.region.wording),
    otherBouts: exposure.mixedBouts + exposure.unknownBouts,
    dataStatus: status,
    dataNote: status === "zero" ? nothing : status === "partial" && counted === 0 ? `${nothing} ${note}` : note,
  };
}
