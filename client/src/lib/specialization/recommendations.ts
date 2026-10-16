import { equipmentMatchesProfile, type AthleteEquipmentProfile } from "@/lib/equipmentProfile";
import type { Exercise } from "@/lib/exerciseCatalog";
import { getSpecializationSummary, indexRegion, sharedPartnersOf } from "@shared/specialization/exposure";
import { categoryFor } from "@shared/specialization/rules";
import { planWeekInterval } from "@shared/specialization/time";
import type {
  ActionId,
  ArmSide,
  ExerciseVariant,
  ExposureBout,
  ExposureCategory,
  GoalProgress,
  Laterality,
  NodeExposure,
  NodeId,
  NodeRole,
  SpecializationRegionData,
  SpecializationSummary,
  SummaryRequest,
  VariantId,
  VariantMapping,
} from "@shared/specialization/types";
import type { PlannedExercise } from "./planBouts";

/**
 * "Exercises for this muscle" and the add/swap preview (brief §7, design §8).
 *
 * A candidate is an exercise with a REVIEWED mapping that moves or holds the selected muscle
 * (or performs the selected movement) as its direct target, or as a contributing mover in the
 * last tier. Draft mappings never produce a suggestion: a muscle whose mapping is not
 * reviewed gets "not reviewed yet", which asks for the mapping to be fixed, not for more
 * training. A muscle at or above the athlete's target gets no suggestion at all, only a
 * neutral note: nothing is suggested to raise a number.
 *
 * Ranking, in order: relevance (direct dynamic, direct hold, contributing) → equipment the
 * athlete has → not already in the plan week (those rank lower and are also listed under
 * "Already covered by") → one-arm work first when the selected arm is behind the other →
 * name. Exercises or equipment the athlete excluded are removed.
 */

export type RecommendationTarget = { nodeId: NodeId; actionId?: never } | { actionId: ActionId; nodeId?: never };

export type RecommendationRequest = {
  region: SpecializationRegionData;
  target: RecommendationTarget;
  side: ArmSide;
  /** The summary on screen, for the selected arm. */
  summary: SpecializationSummary;
  /** The other arm, same window, when the page has it: a trailing arm prefers one-arm work. */
  otherSideSummary?: SpecializationSummary | null;
  /** Exercises already in the chosen plan week. */
  plannedExercises: readonly PlannedExercise[];
  catalog: readonly Pick<Exercise, "id" | "name" | "equipment">[];
  equipmentProfile: AthleteEquipmentProfile | null;
  exclusions?: { catalogExerciseIds?: readonly number[]; equipment?: readonly string[] };
};

export type Relevance = "direct_dynamic" | "direct_isometric" | "contributing";

export type AlsoLoaded = { nodeId: NodeId; name: string; role: NodeRole; category: ExposureCategory };

export type RecommendationCandidate = {
  catalogExerciseId: number;
  name: string;
  variantId: VariantId;
  equipment: string | null;
  relevance: Relevance;
  /** The reviewed mappings that make it a candidate. */
  mappingIds: string[];
  equipmentAvailable: boolean;
  alreadyPlanned: boolean;
  laterality: Laterality;
  /** One plain sentence: what it trains for this muscle or movement, and the gap it answers. */
  why: string;
  /** Every other muscle it loads, external contributors included, before anything is added. */
  alsoLoads: AlsoLoaded[];
};

export type AlreadyCovered = { catalogExerciseId: number; name: string; days: PlannedExercise["days"]; category: ExposureCategory };

export type Recommendations =
  | { kind: "mapping_not_reviewed"; message: string }
  | { kind: "at_target"; note: string; goals: GoalProgress[]; alreadyCoveredBy: AlreadyCovered[] }
  | { kind: "candidates"; candidates: RecommendationCandidate[]; alreadyCoveredBy: AlreadyCovered[]; excludedCount: number; emptyReason: string | null };

const RELEVANCE_ORDER: Record<Relevance, number> = { direct_dynamic: 0, direct_isometric: 1, contributing: 2 };

function relevanceOf(mapping: VariantMapping): Relevance | null {
  if (mapping.muscleMode === "unknown") return null;
  if (mapping.relationship === "direct") return mapping.muscleMode === "dynamic" ? "direct_dynamic" : "direct_isometric";
  if (mapping.relationship === "contributing") return "contributing";
  return null;
}

const lowerFirst = (text: string) => (text ? text.charAt(0).toLowerCase() + text.slice(1) : text);

function listWords(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function reviewedMappingsOf(region: SpecializationRegionData): VariantMapping[] {
  const index = indexRegion(region);
  return Array.from(index.mappingsByVariant.values()).flat().filter((mapping) => mapping.reviewStatus === "reviewed");
}

function targetMatches(region: SpecializationRegionData, target: RecommendationTarget, mapping: VariantMapping): boolean {
  if (target.nodeId !== undefined) return mapping.nodeId === target.nodeId;
  return mapping.actionId === target.actionId && indexRegion(region).regionNodeIds.has(mapping.nodeId);
}

function goalsFor(summary: SpecializationSummary | null | undefined, target: RecommendationTarget, side: ArmSide): GoalProgress[] {
  if (!summary) return [];
  return summary.goals.filter((progress) => progress.goal.side === side && (target.nodeId !== undefined ? progress.goal.nodeId === target.nodeId : progress.goal.actionId === target.actionId));
}

function nodeRow(summary: SpecializationSummary | null | undefined, nodeId: NodeId): NodeExposure | null {
  return summary?.nodes.find((node) => node.nodeId === nodeId) ?? null;
}

/** Whether the selected arm is behind the other on what the athlete measures (their goal's metric, else direct bouts). */
function armTrails(request: RecommendationRequest): boolean {
  const other = request.otherSideSummary;
  if (!other) return false;
  const mine = goalsFor(request.summary, request.target, request.side)[0];
  const theirs = goalsFor(other, request.target, request.side === "left" ? "right" : "left").find((progress) => !mine || progress.goal.metric === mine.goal.metric);
  if (mine && theirs) return mine.value < theirs.value;
  if (request.target.nodeId === undefined) return false;
  const a = nodeRow(request.summary, request.target.nodeId);
  const b = nodeRow(other, request.target.nodeId);
  return Boolean(a && b && a.directDynamicBouts < b.directDynamicBouts);
}

function periodWords(summary: SpecializationSummary, progress: GoalProgress): string {
  if (summary.mode === "planned") return `in ${summary.interval.label.replace(/, as written$/, "")}`;
  return progress.goal.period === "calendar_week" ? "this week" : "in the last 7 days";
}

const metricWords: Record<GoalProgress["goal"]["metric"], string> = {
  direct_dynamic_bouts: "direct dynamic bouts",
  deliberate_hold_bouts: "deliberate hold bouts",
  // The label already ends in "seconds".
  deliberate_hold_seconds: "of deliberate holds",
};

/** "2 of your 10 direct dynamic bouts this week", "90 of your 120 seconds of deliberate holds this week". */
function progressPhrase(summary: SpecializationSummary, progress: GoalProgress): string {
  return `${progress.label} ${metricWords[progress.goal.metric]} ${periodWords(summary, progress)}`;
}

export function recommendFor(request: RecommendationRequest): Recommendations {
  const { region, target, side, summary } = request;
  const index = indexRegion(region);
  const nodeName = target.nodeId !== undefined ? index.nodeById.get(target.nodeId)?.name ?? target.nodeId : null;
  const actionLabel = (actionId: ActionId | null) => (actionId ? region.actions.find((action) => action.id === actionId)?.label ?? actionId : null);
  const subject = nodeName ?? lowerFirst(actionLabel(target.actionId ?? null) ?? "this movement");

  const relevant = reviewedMappingsOf(region).filter((mapping) => targetMatches(region, target, mapping));
  if (!relevant.length) {
    return {
      kind: "mapping_not_reviewed",
      message: target.nodeId !== undefined
        ? "This muscle's exercise mapping is not reviewed yet. Suggestions appear once a reviewed mapping says which exercises train it."
        : "No exercise mapping for this movement is reviewed yet. Suggestions appear once one is.",
    };
  }

  const variantById = new Map(region.variants.map((variant) => [variant.id, variant] as const));
  const catalogById = new Map(request.catalog.map((exercise) => [exercise.id, exercise] as const));
  const planned = new Map(request.plannedExercises.map((item) => [item.catalogExerciseId, item] as const));

  // Already in the plan week and loading the target as direct or contributing work.
  const coveredBy = new Map<number, AlreadyCovered>();
  for (const mapping of relevant) {
    const variant = variantById.get(mapping.variantId);
    const item = variant ? planned.get(variant.catalogExerciseId) : undefined;
    if (!variant || !item || !relevanceOf(mapping)) continue;
    const category = categoryFor(mapping.relationship, mapping.muscleMode, variant.deliberateHold);
    const existing = coveredBy.get(item.catalogExerciseId);
    coveredBy.set(item.catalogExerciseId, { catalogExerciseId: item.catalogExerciseId, name: item.name, days: item.days, category: existing && existing.category !== category ? "mixed" : category });
  }
  const alreadyCoveredBy = Array.from(coveredBy.values()).sort((a, b) => a.name.localeCompare(b.name));

  const goals = goalsFor(summary, target, side);
  if (goals.length && goals.every((progress) => progress.fraction >= 1)) {
    const parts = goals.map((progress) => progressPhrase(summary, progress));
    return {
      kind: "at_target",
      note: `${nodeName ?? `Your ${subject}`} already has ${listWords(parts)}. Nothing is suggested to add more.`,
      goals,
      alreadyCoveredBy,
    };
  }

  // One candidate per exercise variant, at the best relevance any of its mappings gives.
  const byVariant = new Map<VariantId, { variant: ExerciseVariant; mappings: VariantMapping[]; relevance: Relevance }>();
  for (const mapping of relevant) {
    const variant = variantById.get(mapping.variantId);
    const relevance = relevanceOf(mapping);
    if (!variant || !relevance) continue;
    const entry = byVariant.get(variant.id) ?? { variant, mappings: [], relevance };
    entry.mappings.push(mapping);
    if (RELEVANCE_ORDER[relevance] < RELEVANCE_ORDER[entry.relevance]) entry.relevance = relevance;
    byVariant.set(variant.id, entry);
  }

  const trailing = armTrails(request);
  const excludedIds = new Set(request.exclusions?.catalogExerciseIds ?? []);
  const excludedEquipment = new Set(request.exclusions?.equipment ?? []);
  const allReviewed = reviewedMappingsOf(region);
  const gap = gapClause(request, goals, nodeName);
  let excludedCount = 0;
  const candidates: RecommendationCandidate[] = [];

  for (const { variant, mappings, relevance } of Array.from(byVariant.values())) {
    const catalogEntry = catalogById.get(variant.catalogExerciseId);
    const equipment = catalogEntry?.equipment ?? null;
    if (excludedIds.has(variant.catalogExerciseId) || (equipment !== null && excludedEquipment.has(equipment))) {
      excludedCount += 1;
      continue;
    }
    const equipmentAvailable = request.equipmentProfile === null ? true : equipment !== null && equipmentMatchesProfile(equipment, request.equipmentProfile.availableEquipment);
    const alreadyPlanned = planned.has(variant.catalogExerciseId);
    const targetNodes = new Set(mappings.map((mapping) => mapping.nodeId));
    const others = allReviewed.filter((mapping) => mapping.variantId === variant.id && !targetNodes.has(mapping.nodeId));
    const alsoLoads = alsoLoadedBy(region, variant, others);
    const actions = Array.from(new Set(mappings.filter((mapping) => relevanceOf(mapping) === relevance).map((mapping) => actionLabel(mapping.actionId)).filter((label): label is string => Boolean(label)))).map(lowerFirst);
    const shared = Array.from(new Set(Array.from(targetNodes).flatMap((nodeId) => sharedPartnersOf(region, variant, nodeId)))).filter((nodeId) => !targetNodes.has(nodeId));
    candidates.push({
      catalogExerciseId: variant.catalogExerciseId,
      name: catalogEntry?.name ?? variant.catalogName,
      variantId: variant.id,
      equipment,
      relevance,
      mappingIds: mappings.map((mapping) => mapping.id).sort(),
      equipmentAvailable,
      alreadyPlanned,
      laterality: variant.laterality,
      why: whySentence({ relevance, actions, nodeName, gap, shared: shared.map((nodeId) => index.nodeById.get(nodeId)?.name ?? nodeId), trailing: trailing && variant.laterality !== "bilateral", side, alreadyPlanned, equipmentAvailable, equipment }),
      alsoLoads,
    });
  }

  const lateralityRank = (candidate: RecommendationCandidate) => (trailing ? (candidate.laterality === "bilateral" ? 1 : 0) : 0);
  candidates.sort((a, b) =>
    RELEVANCE_ORDER[a.relevance] - RELEVANCE_ORDER[b.relevance]
    || Number(!a.equipmentAvailable) - Number(!b.equipmentAvailable)
    || Number(a.alreadyPlanned) - Number(b.alreadyPlanned)
    || lateralityRank(a) - lateralityRank(b)
    || a.name.localeCompare(b.name)
    || a.catalogExerciseId - b.catalogExerciseId);

  return {
    kind: "candidates",
    candidates,
    alreadyCoveredBy,
    excludedCount,
    emptyReason: candidates.length ? null : excludedCount ? "Every reviewed exercise for this is excluded by your settings." : "No reviewed exercise trains this directly or as a main helper yet.",
  };
}

function alsoLoadedBy(region: SpecializationRegionData, variant: ExerciseVariant, mappings: readonly VariantMapping[]): AlsoLoaded[] {
  const index = indexRegion(region);
  const byNode = new Map<NodeId, Set<ExposureCategory>>();
  for (const mapping of mappings) {
    const set = byNode.get(mapping.nodeId) ?? new Set<ExposureCategory>();
    set.add(categoryFor(mapping.relationship, mapping.muscleMode, variant.deliberateHold));
    byNode.set(mapping.nodeId, set);
  }
  const order = new Map(region.nodes.map((node, position) => [node.id, position] as const));
  return Array.from(byNode.entries())
    .map(([nodeId, categories]) => {
      const node = index.nodeById.get(nodeId);
      return { nodeId, name: node?.name ?? nodeId, role: node?.role ?? "external", category: categories.size === 1 ? Array.from(categories)[0] : "mixed" as ExposureCategory };
    })
    .sort((a, b) => (order.get(a.nodeId) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.nodeId) ?? Number.MAX_SAFE_INTEGER));
}

/** What the target is missing, said plainly: a target gap, or the work it has without a target. */
function gapClause(request: RecommendationRequest, goals: readonly GoalProgress[], nodeName: string | null): string {
  const below = goals.find((progress) => progress.fraction < 1);
  if (below) return progressPhrase(request.summary, below);
  if (request.target.nodeId === undefined) return "no target set";
  const row = nodeRow(request.summary, request.target.nodeId);
  const where = request.summary.mode === "planned" ? "planned in this week" : "in this window";
  if (!row || row.directDynamicBouts + row.deliberateHoldBouts === 0) return `${nodeName ? "it has" : "there is"} no direct work ${where}`;
  return `${row.directDynamicBouts} direct dynamic and ${row.deliberateHoldBouts} hold bouts ${where}, no target set`;
}

function whySentence(input: { relevance: Relevance; actions: string[]; nodeName: string | null; gap: string; shared: string[]; trailing: boolean; side: ArmSide; alreadyPlanned: boolean; equipmentAvailable: boolean; equipment: string | null }): string {
  const what = input.actions.length ? listWords(input.actions) : "work";
  const lead = input.relevance === "direct_dynamic" ? `Direct ${what}` : input.relevance === "direct_isometric" ? `Direct ${what} hold` : `Helps with ${what}`;
  const sentences = [`${lead}${input.nodeName ? ` for ${lowerFirst(input.nodeName)}` : ""}; ${input.gap}.`];
  if (input.shared.length) sentences.push(`The work is shared with ${listWords(input.shared.map(lowerFirst))}; the evidence does not split it between them.`);
  if (input.trailing) sentences.push(`Done one arm at a time, so the ${input.side} arm can be trained on its own.`);
  if (input.alreadyPlanned) sentences.push("Already in this plan week.");
  if (!input.equipmentAvailable) sentences.push(input.equipment ? `Needs ${input.equipment.toLowerCase()}, which is not in your equipment.` : "Its equipment is not listed.");
  return sentences.join(" ");
}

// ---------------------------------------------------------------- planned-change preview

export type PlannedValues = Pick<NodeExposure, "directDynamicBouts" | "contributingDynamicBouts" | "deliberateHoldBouts" | "deliberateHoldSeconds" | "incidentalBouts" | "mixedBouts" | "unknownBouts">;
export type PlannedNodeChange = { nodeId: NodeId; name: string; role: NodeRole; before: PlannedValues; after: PlannedValues };
export type PlannedChangePreview = {
  side: ArmSide;
  planWeek: number;
  /** Only the nodes whose planned values change, in the region's order. */
  nodes: PlannedNodeChange[];
  regionDistinctBouts: { before: number; after: number };
};

const plannedFields: (keyof PlannedValues)[] = ["directDynamicBouts", "contributingDynamicBouts", "deliberateHoldBouts", "deliberateHoldSeconds", "incidentalBouts", "mixedBouts", "unknownBouts"];
const valuesOf = (node: NodeExposure): PlannedValues => Object.fromEntries(plannedFields.map((field) => [field, node[field]])) as PlannedValues;

/**
 * Planned totals before and after a proposed add or swap, for one arm and one plan week.
 * Completed work is not read at all: a preview can only ever change what is planned
 * (brief §7, §11 "Add exercise preview").
 */
export function previewPlannedChange(input: {
  region: SpecializationRegionData;
  before: readonly ExposureBout[];
  after: readonly ExposureBout[];
  side: ArmSide;
  planWeek: number;
  catalogMusclesFor?: SummaryRequest["catalogMusclesFor"];
}): PlannedChangePreview {
  const summarize = (bouts: readonly ExposureBout[]) => getSpecializationSummary({
    region: input.region,
    bouts: bouts.filter((bout) => bout.mode === "planned"),
    interval: planWeekInterval(input.planWeek),
    side: input.side,
    mode: "planned",
    goals: [],
    catalogMusclesFor: input.catalogMusclesFor ?? (() => null),
    sourceRevision: "",
    planRevision: null,
    now: new Date(0).toISOString(),
  });
  const before = summarize(input.before);
  const after = summarize(input.after);
  const index = indexRegion(input.region);
  const nodes: PlannedNodeChange[] = [];
  before.nodes.forEach((node, position) => {
    const next = after.nodes[position];
    const was = valuesOf(node);
    const now = valuesOf(next);
    if (plannedFields.every((field) => was[field] === now[field])) return;
    const meta = index.nodeById.get(node.nodeId);
    nodes.push({ nodeId: node.nodeId, name: meta?.name ?? node.nodeId, role: meta?.role ?? "target", before: was, after: now });
  });
  return { side: input.side, planWeek: input.planWeek, nodes, regionDistinctBouts: { before: before.regionDistinctBouts, after: after.regionDistinctBouts } };
}
