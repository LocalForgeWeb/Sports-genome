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
  GoalMetric,
  GoalProgress,
  Laterality,
  NodeExposure,
  NodeId,
  NodeRole,
  Relationship,
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
 * A candidate is an exercise with a REVIEWED mapping that the calculator credits as work for
 * the selected muscle (or movement): direct dynamic work, a direct deliberate hold, or a
 * contributing mover's work. Relevance is read through the rule the calculator applies
 * (`categoryFor`), so an exercise the page counts only as incidental grip or steadying is
 * never a suggestion and never "already covered by". Draft mappings never produce a
 * suggestion: a muscle whose mapping is not reviewed gets "not reviewed yet", which asks for
 * the mapping to be fixed, not for more training. A muscle at or above every target the
 * athlete set gets no suggestion at all, only a neutral note: nothing is suggested to raise
 * a number.
 *
 * Each candidate's "why" names only a target gap its own mappings can fill, counted the way
 * the calculator counts it: a muscle target takes a set only when that set's work on the
 * muscle is the target's kind (direct dynamic for dynamic bouts, a deliberate hold for hold
 * bouts and hold seconds); a set that loads the muscle two ways counts as mixed, for neither.
 * A target no reviewed exercise can fill is said plainly instead of being claimed.
 *
 * Ranking, in order:
 * 1. work that counts toward one of the athlete's unmet targets for it;
 * 2. direct work on one of the muscle's main (prime) actions that had no direct work in the
 *    window while another action did (the "why" then leads with the missing action);
 * 3. relevance (direct dynamic, direct hold, contributing);
 * 4. equipment the athlete has;
 * 5. overlap: an exercise already in the plan week, or in completed mode already logged in the
 *    window, ranks lower and is listed under "Already covered by";
 * 6. one-arm work first when the selected arm is behind the other;
 * 7. name.
 * Exercises or equipment the athlete excluded are removed.
 */

export type RecommendationTarget = { nodeId: NodeId; actionId?: never } | { actionId: ActionId; nodeId?: never };

export type RecommendationRequest = {
  region: SpecializationRegionData;
  target: RecommendationTarget;
  side: ArmSide;
  /** The summary on screen, for the selected arm. In completed mode its ledger says what was already logged. */
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
  /** The unmet target it counts toward, as the calculator counts it; null when none (or no target is set). Always set by `recommendFor`. */
  targetGap?: GoalProgress | null;
  /** The muscle's main actions with no direct work in the window that it trains directly. Always set by `recommendFor`. */
  missingActions?: ActionId[];
  /** Completed mode: already logged in the window on this arm (or with no arm recorded), so it ranks lower like a planned one. Always set by `recommendFor`. */
  alreadyLogged?: boolean;
  /** Sets of it logged in the window that loaded the target (0 when none). Always set by `recommendFor`. */
  loggedBouts?: number;
};

export type AlreadyCovered = {
  catalogExerciseId: number;
  name: string;
  /** Its days in the plan week, then, when it was logged in the window, one "N sets logged in this window" entry (key "logged"; it says how many had no arm recorded). */
  days: PlannedExercise["days"];
  category: ExposureCategory;
  /** Sets logged in the window that loaded the target; present only when it was logged (completed mode). */
  loggedBouts?: number;
};

export type Recommendations =
  | { kind: "mapping_not_reviewed"; message: string }
  | { kind: "at_target"; note: string; goals: GoalProgress[]; alreadyCoveredBy: AlreadyCovered[] }
  | {
      kind: "candidates";
      candidates: RecommendationCandidate[];
      alreadyCoveredBy: AlreadyCovered[];
      /** Exercises removed by the athlete's exclusions. */
      excludedCount: number;
      /** Exercises left out because they only answer a target already met. */
      skippedAtTarget: number;
      emptyReason: string | null;
      /** An unmet target that no reviewed exercise can count toward, said plainly; null when there is none. Always set by `recommendFor`. */
      targetNote?: string | null;
      /** The muscle's main actions with no direct work in the window, when another action had some. Always set by `recommendFor`. */
      missingActions?: ActionId[];
    };

const RELEVANCE_ORDER: Record<Relevance, number> = { direct_dynamic: 0, direct_isometric: 1, contributing: 2 };

/** The category each goal metric counts: the calculator's table (exposure.ts). */
const metricCategory: Record<GoalMetric, ExposureCategory> = {
  direct_dynamic_bouts: "direct_dynamic",
  deliberate_hold_bouts: "deliberate_isometric",
  deliberate_hold_seconds: "deliberate_isometric",
};

/**
 * What a mapping (or a ledger part) is worth as a suggestion, from the category the
 * calculator gives it: incidental holding, steadying and unknown work are worth nothing.
 */
function relevanceFrom(relationship: Relationship, category: ExposureCategory): Relevance | null {
  if (category === "incidental_isometric" || category === "unknown") return null;
  if (relationship === "direct") return category === "direct_dynamic" ? "direct_dynamic" : "direct_isometric";
  if (relationship === "contributing") return "contributing";
  return null;
}

const categoryOf = (mapping: VariantMapping, variant: ExerciseVariant) => categoryFor(mapping.relationship, mapping.muscleMode, variant.deliberateHold);
const relevanceOf = (mapping: VariantMapping, variant: ExerciseVariant) => relevanceFrom(mapping.relationship, categoryOf(mapping, variant));

/** Direct work on an action: a direct mapping the calculator credits, moved or deliberately held. */
const isDirectWork = (part: { relationship: Relationship; category: ExposureCategory }) => part.relationship === "direct" && relevanceFrom(part.relationship, part.category) !== null;

const lowerFirst = (text: string) => (text ? text.charAt(0).toLowerCase() + text.slice(1) : text);
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const amount = (value: number) => (Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10));

function listWords(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function mergeCategories(categories: Iterable<ExposureCategory>): ExposureCategory {
  const distinct = new Set(categories);
  return distinct.size === 1 ? Array.from(distinct)[0] : "mixed";
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

const metricWords: Record<GoalMetric, string> = {
  direct_dynamic_bouts: "direct dynamic bouts",
  deliberate_hold_bouts: "deliberate hold bouts",
  // The label already ends in "seconds".
  deliberate_hold_seconds: "of deliberate holds",
};

/** "2 of your 10 direct dynamic bouts this week", "90 of your 120 seconds of deliberate holds this week". */
function progressPhrase(summary: SpecializationSummary, progress: GoalProgress): string {
  return `${progress.label} ${metricWords[progress.goal.metric]} ${periodWords(summary, progress)}`;
}

/** "your target of 3 deliberate hold bouts this week", "your target of 120 seconds of deliberate holds this week". */
function targetPhrase(summary: SpecializationSummary, progress: GoalProgress): string {
  const unit = progress.goal.metric === "deliberate_hold_seconds" ? " seconds" : "";
  return `your target of ${amount(progress.goal.target)}${unit} ${metricWords[progress.goal.metric]} ${periodWords(summary, progress)}`;
}

/** "in this window", or "planned in this week" for the plan. */
const whereWords = (summary: SpecializationSummary) => (summary.mode === "planned" ? "planned in this week" : "in this window");

/**
 * What one set of this exercise adds to the target, as the calculator counts it. A muscle
 * counts a set once, under one category, or `mixed` when the set loads it two ways; a
 * movement target reads each reviewed mapping for that movement on one of the region's
 * muscles. `mappings` are the exercise's reviewed mappings that match the target.
 */
function creditedBy(mappings: readonly VariantMapping[], variant: ExerciseVariant, target: RecommendationTarget): Set<ExposureCategory> {
  const categories = new Set(mappings.map((mapping) => categoryOf(mapping, variant)));
  return target.nodeId !== undefined && categories.size > 1 ? new Set<ExposureCategory>(["mixed"]) : categories;
}

type Logged = { catalogExerciseId: number; name: string; bouts: Set<string>; unknownSide: Set<string>; categories: Set<ExposureCategory> };

/**
 * Completed mode: the exercises logged in the window, on this arm or with no arm recorded,
 * whose credited work loads the target. They overlap exactly as a planned exercise does. Sets
 * with no arm recorded are not in the arm's totals, so they are named as such. Incidental
 * holding is not "covered", for the same reason it is not a suggestion.
 */
function loggedFor(request: RecommendationRequest, names: ReadonlyMap<number, string>): Map<number, Logged> {
  const out = new Map<number, Logged>();
  const { summary, target, region } = request;
  if (summary.mode !== "completed") return out;
  const index = indexRegion(region);
  const rows = target.nodeId !== undefined
    ? [nodeRow(summary, target.nodeId)].filter((row): row is NodeExposure => row !== null)
    : summary.nodes.filter((row) => index.regionNodeIds.has(row.nodeId));
  for (const row of rows) {
    for (const contribution of row.contributions) {
      if (contribution.catalogExerciseId === null) continue;
      const parts = contribution.parts.filter((part) => (target.actionId === undefined || part.actionId === target.actionId) && relevanceFrom(part.relationship, part.category) !== null);
      if (!parts.length) continue;
      const id = contribution.catalogExerciseId;
      const entry = out.get(id) ?? { catalogExerciseId: id, name: names.get(id) ?? contribution.exerciseName, bouts: new Set<string>(), unknownSide: new Set<string>(), categories: new Set<ExposureCategory>() };
      entry.bouts.add(contribution.boutId);
      if (contribution.side === "unknown") entry.unknownSide.add(contribution.boutId);
      if (target.nodeId !== undefined) entry.categories.add(contribution.category);
      else for (const part of parts) entry.categories.add(part.category);
      out.set(id, entry);
    }
  }
  return out;
}

/**
 * The muscle's main (prime) actions with no direct work in the window. Named only when the
 * muscle had direct work on some other action: then the missing one is something the totals
 * do not show. With no direct work at all, the gap clause already says so.
 */
function missingPrimeActions(request: RecommendationRequest): ActionId[] {
  const { region, summary, target } = request;
  if (target.nodeId === undefined) return [];
  const row = nodeRow(summary, target.nodeId);
  // "Had direct work" is the arm's own count, the one the gap clause reads. Work whose side was
  // not recorded, or a set counted as mixed, is not in that count: naming a missing action then
  // would sit beside "it has no direct work in this window" and contradict it.
  if (!row || row.directDynamicBouts + row.deliberateHoldBouts === 0) return [];
  const primes = Array.from(new Set(region.nodeActions.filter((item) => item.nodeId === target.nodeId && item.role === "prime").map((item) => item.actionId)));
  // Any direct work on an action covers it, whatever its side: a missing action is never claimed while work for it exists.
  const covered = new Set<ActionId>();
  for (const contribution of row.contributions) {
    for (const part of contribution.parts) if (part.actionId && isDirectWork(part)) covered.add(part.actionId);
  }
  if (!covered.size) return [];
  return primes.filter((actionId) => !covered.has(actionId));
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
  const logged = loggedFor(request, new Map(request.catalog.map((exercise) => [exercise.id, exercise.name] as const)));

  // Every reviewed mapping of each exercise that matches the target, incidental ones included:
  // the calculator reads them all when it decides what one set counts as.
  const matching = new Map<VariantId, { variant: ExerciseVariant; mappings: VariantMapping[] }>();
  for (const mapping of relevant) {
    const variant = variantById.get(mapping.variantId);
    if (!variant) continue;
    const entry = matching.get(variant.id) ?? { variant, mappings: [] };
    entry.mappings.push(mapping);
    matching.set(variant.id, entry);
  }
  const usableOf = (entry: { variant: ExerciseVariant; mappings: VariantMapping[] }) => entry.mappings.filter((mapping) => relevanceOf(mapping, entry.variant) !== null);

  // Already covered: in the plan week, or logged in the window, with credited work on the target.
  const coveredBy = new Map<number, AlreadyCovered>();
  for (const entry of Array.from(matching.values())) {
    const item = planned.get(entry.variant.catalogExerciseId);
    const usable = usableOf(entry);
    if (!item || !usable.length) continue;
    const category = target.nodeId !== undefined ? mergeCategories(creditedBy(entry.mappings, entry.variant, target)) : mergeCategories(usable.map((mapping) => categoryOf(mapping, entry.variant)));
    coveredBy.set(item.catalogExerciseId, { catalogExerciseId: item.catalogExerciseId, name: item.name, days: [...item.days], category });
  }
  for (const entry of Array.from(logged.values())) {
    const existing = coveredBy.get(entry.catalogExerciseId);
    const count = entry.bouts.size;
    coveredBy.set(entry.catalogExerciseId, {
      catalogExerciseId: entry.catalogExerciseId,
      name: existing?.name ?? entry.name,
      days: [...(existing?.days ?? []), { key: "logged", label: `${plural(count, "set")} logged in this window${noSideWords(count, entry.unknownSide.size)}` }],
      category: mergeCategories([...Array.from(entry.categories), ...(existing ? [existing.category] : [])]),
      loggedBouts: count,
    });
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

  const unmet = goals.filter((progress) => progress.fraction < 1);
  const met = goals.filter((progress) => progress.fraction >= 1);
  const counts = (credits: ReadonlySet<ExposureCategory>, progress: GoalProgress) => credits.has(metricCategory[progress.goal.metric]);

  // A kind of work whose every target is already met is not suggested again: with a hold
  // target met and a dynamic one not, only dynamic work is offered. Contributing work answers
  // no target directly and stays, ranked after the work that does.
  const metKinds = new Set<Relevance>();
  for (const kind of ["direct_dynamic", "direct_isometric"] as const) {
    const forKind = goals.filter((progress) => goalKindOf(progress.goal.metric) === kind);
    if (forKind.length && forKind.every((progress) => progress.fraction >= 1)) metKinds.add(kind);
  }

  // Unmet targets that no reviewed exercise for this can count toward at all, before exclusions.
  const allCredits = Array.from(matching.values()).filter((entry) => usableOf(entry).length).map((entry) => creditedBy(entry.mappings, entry.variant, target));
  const unfillable = unmet.filter((progress) => !allCredits.some((credits) => counts(credits, progress)));
  const targetNote = unfillable.length ? `No reviewed exercise for ${lowerFirst(subject)} counts toward ${listWords(unfillable.map((progress) => targetPhrase(summary, progress)))}.` : null;
  const missing = missingPrimeActions(request);
  const where = whereWords(summary);

  // One candidate per exercise variant, at the best relevance any of its usable mappings gives.
  type Entry = { variant: ExerciseVariant; mappings: VariantMapping[]; relevance: Relevance; credits: Set<ExposureCategory>; answers: GoalProgress[] };
  const byVariant = new Map<VariantId, Entry>();
  const offered = new Set<VariantId>();
  for (const entry of Array.from(matching.values())) {
    const usable = usableOf(entry);
    if (!usable.length) continue;
    offered.add(entry.variant.id);
    const relevance = usable.map((mapping) => relevanceOf(mapping, entry.variant)!).reduce((best, next) => (RELEVANCE_ORDER[next] < RELEVANCE_ORDER[best] ? next : best));
    const credits = creditedBy(entry.mappings, entry.variant, target);
    const answers = unmet.filter((progress) => counts(credits, progress));
    if (!answers.length && (metKinds.has(relevance) || met.some((progress) => counts(credits, progress)))) continue;
    byVariant.set(entry.variant.id, { variant: entry.variant, mappings: usable, relevance, credits, answers });
  }

  const trailing = armTrails(request);
  const excludedIds = new Set(request.exclusions?.catalogExerciseIds ?? []);
  const excludedEquipment = new Set(request.exclusions?.equipment ?? []);
  const allReviewed = reviewedMappingsOf(region);
  let excludedCount = 0;
  const candidates: RecommendationCandidate[] = [];

  for (const { variant, mappings, relevance, credits, answers } of Array.from(byVariant.values())) {
    const catalogEntry = catalogById.get(variant.catalogExerciseId);
    const equipment = catalogEntry?.equipment ?? null;
    if (excludedIds.has(variant.catalogExerciseId) || (equipment !== null && excludedEquipment.has(equipment))) {
      excludedCount += 1;
      continue;
    }
    const equipmentAvailable = request.equipmentProfile === null ? true : equipment !== null && equipmentMatchesProfile(equipment, request.equipmentProfile.availableEquipment);
    const alreadyPlanned = planned.has(variant.catalogExerciseId);
    const loggedEntry = logged.get(variant.catalogExerciseId);
    const loggedBouts = loggedEntry?.bouts.size ?? 0;
    const targetNodes = new Set(mappings.map((mapping) => mapping.nodeId));
    const others = allReviewed.filter((mapping) => mapping.variantId === variant.id && !targetNodes.has(mapping.nodeId));
    const alsoLoads = alsoLoadedBy(region, variant, others);
    const actions = Array.from(new Set(mappings.filter((mapping) => relevanceOf(mapping, variant) === relevance).map((mapping) => actionLabel(mapping.actionId)).filter((label): label is string => Boolean(label)))).map(lowerFirst);
    const shared = Array.from(new Set(Array.from(targetNodes).flatMap((nodeId) => sharedPartnersOf(region, variant, nodeId)))).filter((nodeId) => !targetNodes.has(nodeId));
    const missingActions = missing.filter((actionId) => mappings.some((mapping) => mapping.actionId === actionId && isDirectWork({ relationship: mapping.relationship, category: categoryOf(mapping, variant) })));
    const gap = gapClause({ request, nodeName, answers, unmet, unfillable, credits });
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
      why: whySentence({
        relevance,
        actions,
        nodeName,
        gap,
        missing: missingActions.map((actionId) => actionLabel(actionId) ?? actionId),
        where,
        shared: shared.map((nodeId) => index.nodeById.get(nodeId)?.name ?? nodeId),
        trailing: trailing && variant.laterality !== "bilateral",
        side,
        alreadyPlanned,
        loggedBouts,
        loggedNoSide: loggedEntry?.unknownSide.size ?? 0,
        equipmentAvailable,
        equipment,
      }),
      alsoLoads,
      targetGap: answers[0] ?? null,
      missingActions,
      alreadyLogged: loggedBouts > 0,
      loggedBouts,
    });
  }

  const lateralityRank = (candidate: RecommendationCandidate) => (trailing ? (candidate.laterality === "bilateral" ? 1 : 0) : 0);
  const overlaps = (candidate: RecommendationCandidate) => Number(candidate.alreadyPlanned || Boolean(candidate.alreadyLogged));
  candidates.sort((a, b) =>
    Number(!a.targetGap) - Number(!b.targetGap)
    || Number(!a.missingActions?.length) - Number(!b.missingActions?.length)
    || RELEVANCE_ORDER[a.relevance] - RELEVANCE_ORDER[b.relevance]
    || Number(!a.equipmentAvailable) - Number(!b.equipmentAvailable)
    || overlaps(a) - overlaps(b)
    || lateralityRank(a) - lateralityRank(b)
    || a.name.localeCompare(b.name)
    || a.catalogExerciseId - b.catalogExerciseId);

  const skippedAtTarget = offered.size - byVariant.size;
  return {
    kind: "candidates",
    candidates,
    alreadyCoveredBy,
    excludedCount,
    skippedAtTarget,
    emptyReason: candidates.length ? null : emptyReasonFor({ excludedCount, skippedAtTarget, targetNote }),
    targetNote,
    missingActions: missing,
  };
}

/** Logged sets with no arm recorded are not in the arm's totals: " with no arm recorded", ", 1 with no arm recorded" or nothing. */
function noSideWords(sets: number, noSide: number): string {
  if (!noSide) return "";
  return noSide === sets ? " with no arm recorded" : `, ${noSide} with no arm recorded`;
}

/**
 * Why the list is empty, naming every cause and only a true one. With no candidate, each
 * exercise that trains this was either left out by the athlete (the exercise or its
 * equipment, under "What is suggested") or skipped as answering a target already met; when
 * both happened the sentence says "either", as `missingActionNote` in model.ts does.
 */
function emptyReasonFor(input: { excludedCount: number; skippedAtTarget: number; targetNote: string | null }): string {
  const lead = input.targetNote ? `${input.targetNote} ` : "";
  if (input.excludedCount && input.skippedAtTarget) return `${lead}The exercises that train this either answer a target you have already met or are left out by your choices under What is suggested.`;
  if (input.excludedCount) return `${lead}Every reviewed exercise for this is left out by your choices under What is suggested.`;
  if (input.skippedAtTarget) return `${lead}The exercises that train this answer a target you have already met. Nothing is suggested to add more.`;
  return input.targetNote ?? "No reviewed exercise trains this directly or as a main helper yet.";
}

/** The kind of work a goal's metric counts. */
function goalKindOf(metric: GoalMetric): Relevance {
  return metric === "direct_dynamic_bouts" ? "direct_dynamic" : "direct_isometric";
}

function alsoLoadedBy(region: SpecializationRegionData, variant: ExerciseVariant, mappings: readonly VariantMapping[]): AlsoLoaded[] {
  const index = indexRegion(region);
  const byNode = new Map<NodeId, Set<ExposureCategory>>();
  for (const mapping of mappings) {
    const set = byNode.get(mapping.nodeId) ?? new Set<ExposureCategory>();
    set.add(categoryOf(mapping, variant));
    byNode.set(mapping.nodeId, set);
  }
  const order = new Map(region.nodes.map((node, position) => [node.id, position] as const));
  return Array.from(byNode.entries())
    .map(([nodeId, categories]) => {
      const node = index.nodeById.get(nodeId);
      return { nodeId, name: node?.name ?? nodeId, role: node?.role ?? "external", category: mergeCategories(categories) };
    })
    .sort((a, b) => (order.get(a.nodeId) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.nodeId) ?? Number.MAX_SAFE_INTEGER));
}

/**
 * What the target is missing, as it bears on THIS exercise: the unmet target it counts
 * toward; else, with targets set, plainly that it counts toward none of them (and why, when
 * the reason is the kind of work); else, with no target, the work the target has.
 */
function gapClause(input: { request: RecommendationRequest; nodeName: string | null; answers: readonly GoalProgress[]; unmet: readonly GoalProgress[]; unfillable: readonly GoalProgress[]; credits: ReadonlySet<ExposureCategory> }): string {
  const { request, nodeName, answers, unmet, unfillable, credits } = input;
  const { summary, target } = request;
  if (answers.length) return progressPhrase(summary, answers[0]);
  if (unmet.length) {
    const targets = listWords(unmet.map((progress) => targetPhrase(summary, progress)));
    // The result's targetNote, shown once above the list, says which target nothing can fill and why.
    if (unfillable.length === unmet.length) return "it counts toward none of your targets here";
    if (target.nodeId !== undefined && credits.has("mixed")) return `one set of it loads this muscle two ways, so it counts as mixed work, not toward ${targets}`;
    const wanted = new Set(unmet.map((progress) => metricCategory[progress.goal.metric]));
    if (wanted.size === 1 && wanted.has("deliberate_isometric") && credits.has("direct_dynamic")) return `not a hold, so it does not count toward ${targets}`;
    if (wanted.size === 1 && wanted.has("direct_dynamic") && credits.has("deliberate_isometric")) return `a hold, so it does not count toward ${targets}`;
    return `it does not count toward ${targets}`;
  }
  if (target.nodeId === undefined) return "no target set";
  const row = nodeRow(summary, target.nodeId);
  const where = whereWords(summary);
  if (!row || row.directDynamicBouts + row.deliberateHoldBouts === 0) return `${nodeName ? "it has" : "there is"} no direct work ${where}`;
  return `${row.directDynamicBouts} direct dynamic and ${row.deliberateHoldBouts} hold bouts ${where}, no target set`;
}

function whySentence(input: { relevance: Relevance; actions: string[]; nodeName: string | null; gap: string; missing: string[]; where: string; shared: string[]; trailing: boolean; side: ArmSide; alreadyPlanned: boolean; loggedBouts: number; loggedNoSide: number; equipmentAvailable: boolean; equipment: string | null }): string {
  const what = input.actions.length ? listWords(input.actions) : "work";
  const lead = input.relevance === "direct_dynamic" ? `Direct ${what}` : input.relevance === "direct_isometric" ? `Direct ${what} hold` : `Helps with ${what}`;
  const sentences: string[] = [];
  // The missing main action comes first: it is why this exercise, and not another, is on top.
  if (input.missing.length) sentences.push(`${listWords(input.missing.map((label, position) => (position ? lowerFirst(label) : label)))}: no direct work ${input.where}.`);
  sentences.push(`${lead}${input.nodeName ? ` for ${lowerFirst(input.nodeName)}` : ""}; ${input.gap}.`);
  if (input.shared.length) sentences.push(`The work is shared with ${listWords(input.shared.map(lowerFirst))}; the evidence does not split it between them.`);
  if (input.trailing) sentences.push(`Done one arm at a time, so the ${input.side} arm can be trained on its own.`);
  if (input.alreadyPlanned) sentences.push("Already in this plan week.");
  if (input.loggedBouts) sentences.push(`Already logged in this window: ${plural(input.loggedBouts, "set")}${noSideWords(input.loggedBouts, input.loggedNoSide)}.`);
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
