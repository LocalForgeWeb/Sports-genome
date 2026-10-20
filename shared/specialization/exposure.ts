import type {
  AnatomyNode,
  ArmSide,
  SummarySide,
  Contribution,
  ContributionSegment,
  ExerciseVariant,
  ExposureBout,
  ExposureCategory,
  GoalProgress,
  MappingCoverage,
  NodeExposure,
  NodeId,
  RegionBoutRow,
  SpecializationGoal,
  SpecializationRegionData,
  SpecializationSummary,
  SummaryCompleteness,
  SummaryRequest,
  VariantId,
  VariantMapping,
} from "./types";
import { categoryFor, exposureRuleV1 } from "./rules";
import { variantIdFor } from "./ids";
import { intervalContains } from "./time";
import { goalPeriodInterval, goalProgressLabel, isGoalActiveAt } from "./goals";

/**
 * `getSpecializationSummary`: the accounting model `specialization_exposure_v1`
 * (rules.ts, design §3) applied to plain bouts.
 *
 * Region-agnostic by construction. Everything that differs between one body region and
 * another — nodes, variants, mappings, which catalog key counts as "this region" — is read
 * from the `SpecializationRegionData` passed in; nothing here names a region, a muscle or
 * an exercise (a test greps this file to keep it that way).
 *
 * The calculator does not read storage, the plan or the clock. The device adapters turn
 * the workout log and the plan into `ExposureBout`s, and the caller says what "now" is,
 * so the same request always gives the same answer.
 */

type Part = Contribution["parts"][number];

/** What one bout does to one node, before the arm and the window are applied. */
type NodeEffect = {
  /** Reviewed mappings that credit the node, as ledger parts. */
  parts: Part[];
  credited: VariantMapping[];
  /** Reviewed grip mappings withheld because the set was strapped. */
  strapped: VariantMapping[];
  /** Draft mappings: shown as pending, never counted. */
  pending: VariantMapping[];
};

type BoutClass =
  | { kind: "mapped"; variant: ExerciseVariant; effects: Map<NodeId, NodeEffect>; hasReviewed: boolean }
  | { kind: "region_only" }
  | { kind: "unrelated" };

// ---------------------------------------------------------------- region index

export type RegionIndex = {
  nodeById: ReadonlyMap<NodeId, AnatomyNode>;
  /** Nodes that belong to the region itself (not external contributors such as an upper-arm muscle). */
  regionNodeIds: ReadonlySet<NodeId>;
  variantByCatalogId: ReadonlyMap<number, ExerciseVariant>;
  /** Mappings of the region's current mapping version, rejected ones dropped, in id order. */
  mappingsByVariant: ReadonlyMap<VariantId, readonly VariantMapping[]>;
  /** Whether any reviewed mapping can credit a node at all, independent of any window. */
  coverage: ReadonlyMap<NodeId, MappingCoverage>;
  /** Catalog muscle keys of the region's target nodes: work tagged with these is region work. */
  regionCatalogKeys: ReadonlySet<string>;
};

const indexCache = new WeakMap<SpecializationRegionData, RegionIndex>();

const byId = <T extends { id: string }>(a: T, b: T) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * Lookups over a region's content, built once per region object. Only the region's
 * current mapping version is read: an older generation of mappings left in the data never
 * adds a second set of credits (brief §11 "Mapping revision: no double-counting").
 */
export function indexRegion(region: SpecializationRegionData): RegionIndex {
  const cached = indexCache.get(region);
  if (cached) return cached;
  const regionId = region.region.id;
  const nodeById = new Map(region.nodes.map((node) => [node.id, node] as const));
  const regionNodeIds = new Set(region.nodes.filter((node) => node.regionId === regionId).map((node) => node.id));
  const variantByCatalogId = new Map<number, ExerciseVariant>();
  for (const variant of region.variants) {
    const existing = variantByCatalogId.get(variant.catalogExerciseId);
    // The default variant (`cat-<id>`) is the one a logged set means; any other only fills a gap.
    if (!existing || (existing.id !== variantIdFor(variant.catalogExerciseId) && variant.id === variantIdFor(variant.catalogExerciseId))) {
      variantByCatalogId.set(variant.catalogExerciseId, variant);
    }
  }
  const current = region.mappings.filter((mapping) => mapping.versionKey === region.mappingVersion.key && mapping.reviewStatus !== "rejected");
  const mappingsByVariant = new Map<VariantId, VariantMapping[]>();
  for (const mapping of [...current].sort(byId)) {
    const list = mappingsByVariant.get(mapping.variantId) ?? [];
    list.push(mapping);
    mappingsByVariant.set(mapping.variantId, list);
  }
  const coverage = new Map<NodeId, MappingCoverage>();
  for (const node of region.nodes) {
    const forNode = current.filter((mapping) => mapping.nodeId === node.id);
    coverage.set(node.id, forNode.some((mapping) => mapping.reviewStatus === "reviewed") ? "reviewed" : forNode.length ? "pending_review" : "none");
  }
  const regionCatalogKeys = new Set(
    region.nodes
      .filter((node) => node.regionId === regionId && node.role === "target" && node.catalogMuscleKey)
      .map((node) => node.catalogMuscleKey as string),
  );
  const index: RegionIndex = { nodeById, regionNodeIds, variantByCatalogId, mappingsByVariant, coverage, regionCatalogKeys };
  indexCache.set(region, index);
  return index;
}

/** The variant a bout of this catalog exercise is read as, or null when the region has none. */
export function variantForCatalogId(region: SpecializationRegionData, catalogExerciseId: number | null): ExerciseVariant | null {
  if (catalogExerciseId === null) return null;
  return indexRegion(region).variantByCatalogId.get(catalogExerciseId) ?? null;
}

// ---------------------------------------------------------------- one bout

function classifyBout(index: RegionIndex, bout: ExposureBout, catalogMusclesFor: SummaryRequest["catalogMusclesFor"]): BoutClass {
  const variant = bout.catalogExerciseId === null ? undefined : index.variantByCatalogId.get(bout.catalogExerciseId);
  const mappings = variant ? index.mappingsByVariant.get(variant.id) ?? [] : [];
  if (variant && mappings.length) {
    const effects = new Map<NodeId, NodeEffect>();
    let hasReviewed = false;
    for (const mapping of mappings) {
      const effect = effects.get(mapping.nodeId) ?? { parts: [], credited: [], strapped: [], pending: [] };
      effects.set(mapping.nodeId, effect);
      if (mapping.reviewStatus !== "reviewed") {
        effect.pending.push(mapping);
        continue;
      }
      hasReviewed = true;
      // Grip that needs a bare hand is not earned by a strapped set; unknown straps keep it (noted).
      if (mapping.requiresNoStraps && bout.straps === "yes") {
        effect.strapped.push(mapping);
        continue;
      }
      effect.credited.push(mapping);
      effect.parts.push(partOf(mapping, variant));
    }
    return { kind: "mapped", variant, effects, hasReviewed };
  }
  // No mapping for this exercise in the region: region work if the catalog tags it so,
  // and then ONLY at region level. It never fans out into credit for every node.
  const tags = catalogMusclesFor(bout.catalogExerciseId, bout.exerciseName);
  if (tags && [...tags.primary, ...tags.secondary].some((key) => index.regionCatalogKeys.has(key))) return { kind: "region_only" };
  return { kind: "unrelated" };
}

function partOf(mapping: VariantMapping, variant: ExerciseVariant): Part {
  return {
    mappingId: mapping.id,
    actionId: mapping.actionId,
    relationship: mapping.relationship,
    muscleMode: mapping.muscleMode,
    category: categoryFor(mapping.relationship, mapping.muscleMode, variant.deliberateHold),
  };
}

/** A node counts a bout once: one category, or `mixed` when the bout loads it two ways. */
function categoryOfParts(parts: readonly Part[]): ExposureCategory {
  const categories = new Set(parts.map((part) => part.category));
  return categories.size === 1 ? parts[0].category : "mixed";
}

const sum = (values: readonly (number | null)[]) => values.reduce<number>((total, value) => total + (value !== null && Number.isFinite(value) ? value : 0), 0);

function segmentsOf(bout: ExposureBout): ContributionSegment[] {
  return bout.segments.map((segment) => ({ id: segment.id, reps: segment.reps, loadKg: segment.loadKg, holdSeconds: segment.holdSeconds }));
}

/**
 * Other nodes that share this node's work in an exercise: reviewed `shared` mappings of the
 * same variant giving the same category. The work is real but the evidence cannot split it
 * between them. Grouping by category, not by action, keeps two nodes whose actions differ
 * (one bends the middle finger joints, the other the fingertips) together for one grip, and
 * keeps a set's shared dynamic work apart from the shared holding in the same set.
 */
function sharedWithOf(index: RegionIndex, variant: ExerciseVariant, nodeId: NodeId, credited: readonly VariantMapping[]): NodeId[] {
  const categories = new Set(credited.filter((mapping) => mapping.allocation === "shared").map((mapping) => partOf(mapping, variant).category));
  if (!categories.size) return [];
  const others = (index.mappingsByVariant.get(variant.id) ?? []).filter(
    (mapping) => mapping.reviewStatus === "reviewed" && mapping.allocation === "shared" && mapping.nodeId !== nodeId && categories.has(partOf(mapping, variant).category),
  );
  return Array.from(new Set(others.map((mapping) => mapping.nodeId))).sort();
}

/** The nodes a node's work in this exercise is shared with (see sharedWithOf), for the ledger and suggestions. */
export function sharedPartnersOf(region: SpecializationRegionData, variant: ExerciseVariant, nodeId: NodeId): NodeId[] {
  const index = indexRegion(region);
  const own = (index.mappingsByVariant.get(variant.id) ?? []).filter((mapping) => mapping.reviewStatus === "reviewed" && mapping.nodeId === nodeId);
  return sharedWithOf(index, variant, nodeId, own);
}

/** A bout as a region total lists it: the set record, with no node and no category. */
function regionRowOf(bout: ExposureBout): RegionBoutRow {
  return {
    boutId: bout.id,
    side: bout.side,
    sideSource: bout.sideSource,
    catalogExerciseId: bout.catalogExerciseId,
    exerciseName: bout.exerciseName,
    matchedBy: bout.matchedBy,
    sessionId: bout.sessionId,
    sessionLabel: bout.sessionLabel,
    performedAt: bout.performedAt,
    kind: bout.kind,
    segments: segmentsOf(bout),
  };
}

function contributionOf(bout: ExposureBout, nodeId: NodeId, category: ExposureCategory, parts: Part[], notes: string[], sharedWith: NodeId[]): Contribution {
  const segments = segmentsOf(bout);
  return {
    boutId: bout.id,
    nodeId,
    category,
    parts,
    side: bout.side,
    sideSource: bout.sideSource,
    catalogExerciseId: bout.catalogExerciseId,
    exerciseName: bout.exerciseName,
    matchedBy: bout.matchedBy,
    sessionId: bout.sessionId,
    sessionLabel: bout.sessionLabel,
    performedAt: bout.performedAt,
    kind: bout.kind,
    segments,
    reps: sum(segments.map((segment) => segment.reps)),
    holdSeconds: sum(segments.map((segment) => segment.holdSeconds)),
    notes,
    sharedWith,
  };
}

/** The plain-language notes the ledger shows beside a row. */
function notesFor(bout: ExposureBout, effect: NodeEffect): string[] {
  const notes: string[] = [];
  if (effect.strapped.length) notes.push("Strapped: grip not counted");
  if (bout.straps === "unknown" && effect.credited.some((mapping) => mapping.requiresNoStraps)) notes.push("Straps not recorded");
  if (bout.sideSource === "plan_assumption") notes.push("Each side assumed");
  if (bout.matchedBy === "name") notes.push("Matched by name");
  return notes;
}

// ---------------------------------------------------------------- the summary

function emptyNode(nodeId: NodeId, coverage: MappingCoverage): NodeExposure {
  return {
    nodeId,
    directDynamicBouts: 0,
    contributingDynamicBouts: 0,
    deliberateHoldBouts: 0,
    deliberateHoldSeconds: 0,
    incidentalBouts: 0,
    mixedBouts: 0,
    unknownBouts: 0,
    directDynamicReps: 0,
    contributingDynamicReps: 0,
    unknownSide: { bouts: 0, directDynamicBouts: 0, deliberateHoldBouts: 0, deliberateHoldSeconds: 0, pendingReviewBouts: 0 },
    pendingReviewBouts: 0,
    mappingCoverage: coverage,
    contributions: [],
    notCounted: [],
  };
}

function addToArm(node: NodeExposure, contribution: Contribution): void {
  switch (contribution.category) {
    case "direct_dynamic":
      node.directDynamicBouts += 1;
      node.directDynamicReps += contribution.reps;
      break;
    case "contributing_dynamic":
      node.contributingDynamicBouts += 1;
      node.contributingDynamicReps += contribution.reps;
      break;
    case "deliberate_isometric":
      node.deliberateHoldBouts += 1;
      node.deliberateHoldSeconds += contribution.holdSeconds;
      break;
    case "incidental_isometric":
      node.incidentalBouts += 1;
      break;
    case "mixed":
      node.mixedBouts += 1;
      break;
    case "unknown":
      node.unknownBouts += 1;
      break;
  }
}

function addToUnknownSide(node: NodeExposure, contribution: Contribution): void {
  node.unknownSide.bouts += 1;
  if (contribution.category === "direct_dynamic") node.unknownSide.directDynamicBouts += 1;
  if (contribution.category === "deliberate_isometric") {
    node.unknownSide.deliberateHoldBouts += 1;
    node.unknownSide.deliberateHoldSeconds += contribution.holdSeconds;
  }
}

/** Natural order, so "…/2" sorts before "…/10". */
const naturalCompare = (a: string, b: string) => a.localeCompare(b, "en", { numeric: true });

function byTimeThenId(a: Pick<Contribution, "performedAt" | "boutId">, b: Pick<Contribution, "performedAt" | "boutId">): number {
  if (a.performedAt !== b.performedAt) {
    if (a.performedAt === null) return 1;
    if (b.performedAt === null) return -1;
    const diff = Date.parse(a.performedAt) - Date.parse(b.performedAt);
    if (diff !== 0) return diff;
  }
  return naturalCompare(a.boutId, b.boutId);
}

/** One record per id; a duplicate (an import replayed twice) is read once. */
function distinctBouts(bouts: readonly ExposureBout[]): ExposureBout[] {
  const seen = new Set<string>();
  const out: ExposureBout[] = [];
  for (const bout of bouts) {
    if (seen.has(bout.id)) continue;
    seen.add(bout.id);
    out.push(bout);
  }
  return out;
}

function inWindow(bout: ExposureBout, request: Pick<SummaryRequest, "mode" | "interval">): boolean {
  if (request.mode === "completed") return bout.mode === "completed" && intervalContains(request.interval, bout.performedAt);
  return bout.mode === "planned" && (request.interval.planWeek === null || bout.planWeek === request.interval.planWeek);
}

/** Whether a bout counts for the side a summary reads. With "both", every bout does, a bout with no arm recorded included. */
const onArm = (bout: ExposureBout, side: SummarySide) => side === "both" || bout.side === "bilateral" || bout.side === side;

export function getSpecializationSummary(request: SummaryRequest): SpecializationSummary {
  const { region, side } = request;
  const index = indexRegion(region);
  const classes = new Map<string, BoutClass>();
  const classOf = (bout: ExposureBout) => {
    let found = classes.get(bout.id);
    if (!found) {
      found = classifyBout(index, bout, request.catalogMusclesFor);
      classes.set(bout.id, found);
    }
    return found;
  };

  const nodes = new Map(region.nodes.map((node) => [node.id, emptyNode(node.id, index.coverage.get(node.id) ?? "none")] as const));
  // Region totals keep the bouts they count, so every total opens its set records (brief §1).
  const regionBouts = new Map<string, RegionBoutRow>();
  const regionUnknownSide = new Map<string, RegionBoutRow>();
  const unclassified = new Map<string, { name: string; catalogExerciseId: number | null; bouts: number }>();
  const unclassifiedRows: RegionBoutRow[] = [];
  const completeness: SummaryCompleteness = {
    boutsConsidered: 0,
    boutsWithReviewedMapping: 0,
    boutsPendingReview: 0,
    boutsRegionOnly: 0,
    boutsNameMatched: 0,
    boutsUnknownSide: 0,
    boutsExcluded: { notCompleted: 0, warmup: 0 },
  };

  const all = distinctBouts(request.bouts);
  for (const bout of all) {
    if (!inWindow(bout, request)) continue;
    const armOrUnknown = onArm(bout, side) || bout.side === "unknown";
    // Kept apart as "no arm recorded" only when the summary is for one arm; for both, an arm is not asked.
    const noArm = side !== "both" && bout.side === "unknown";
    // The other arm's one-arm work says nothing about this arm.
    if (!armOrUnknown) continue;
    const found = classOf(bout);
    if (found.kind === "unrelated") continue;
    if (bout.excluded === "not_completed") { completeness.boutsExcluded.notCompleted += 1; continue; }
    if (bout.warmup) { completeness.boutsExcluded.warmup += 1; continue; }

    completeness.boutsConsidered += 1;
    if (bout.matchedBy === "name") completeness.boutsNameMatched += 1;
    if (noArm) completeness.boutsUnknownSide += 1;

    if (found.kind === "region_only") {
      completeness.boutsRegionOnly += 1;
      const key = bout.catalogExerciseId !== null ? `id:${bout.catalogExerciseId}` : `name:${bout.exerciseName}`;
      const entry = unclassified.get(key) ?? { name: bout.exerciseName, catalogExerciseId: bout.catalogExerciseId, bouts: 0 };
      entry.bouts += 1;
      unclassified.set(key, entry);
      unclassifiedRows.push(regionRowOf(bout));
      continue;
    }

    if (found.hasReviewed) completeness.boutsWithReviewedMapping += 1;
    else completeness.boutsPendingReview += 1;

    for (const [nodeId, effect] of Array.from(found.effects)) {
      const node = nodes.get(nodeId);
      // A mapping to a node the region does not list cannot be shown anywhere; it is skipped, not invented.
      if (!node) continue;
      const notes = notesFor(bout, effect);
      if (!effect.parts.length) {
        if (effect.strapped.length) {
          node.notCounted!.push(contributionOf(bout, nodeId, categoryOfParts(effect.strapped.map((mapping) => partOf(mapping, found.variant))), effect.strapped.map((mapping) => partOf(mapping, found.variant)), notes, []));
        } else if (effect.pending.length) {
          // Like credited work, a bout with no arm recorded is kept apart: it is never either arm's.
          if (noArm) node.unknownSide.pendingReviewBouts = (node.unknownSide.pendingReviewBouts ?? 0) + 1;
          else node.pendingReviewBouts += 1;
          const parts = effect.pending.map((mapping) => partOf(mapping, found.variant));
          node.notCounted!.push(contributionOf(bout, nodeId, categoryOfParts(parts), parts, [...notes, "Mapping pending review"], []));
        }
        continue;
      }
      const contribution = contributionOf(bout, nodeId, categoryOfParts(effect.parts), effect.parts, notes, sharedWithOf(index, found.variant, nodeId, effect.credited));
      node.contributions.push(contribution);
      if (noArm) {
        addToUnknownSide(node, contribution);
        if (index.regionNodeIds.has(nodeId) && !regionUnknownSide.has(bout.id)) regionUnknownSide.set(bout.id, regionRowOf(bout));
      } else {
        addToArm(node, contribution);
        if (index.regionNodeIds.has(nodeId) && !regionBouts.has(bout.id)) regionBouts.set(bout.id, regionRowOf(bout));
      }
    }
  }

  for (const node of Array.from(nodes.values())) {
    node.contributions.sort(byTimeThenId);
    node.notCounted!.sort(byTimeThenId);
  }

  return {
    regionId: region.region.id,
    interval: request.interval,
    side,
    mode: request.mode,
    mappingVersion: region.mappingVersion.key,
    ruleVersion: exposureRuleV1.id,
    sourceRevision: request.sourceRevision,
    planRevision: request.planRevision,
    nodes: region.nodes.map((node) => nodes.get(node.id)!),
    regionDistinctBouts: regionBouts.size,
    regionUnknownSideBouts: regionUnknownSide.size,
    regionUnclassified: {
      bouts: Array.from(unclassified.values()).reduce((total, entry) => total + entry.bouts, 0),
      exercises: Array.from(unclassified.values()).sort((a, b) => b.bouts - a.bouts || naturalCompare(a.name, b.name)),
    },
    regionBoutRows: Array.from(regionBouts.values()).sort(byTimeThenId),
    regionUnknownSideRows: Array.from(regionUnknownSide.values()).sort(byTimeThenId),
    regionUnclassifiedRows: unclassifiedRows.sort(byTimeThenId),
    goals: goalProgressFor(request, index, all, classOf),
    completeness,
    calculatedAt: request.now,
  };
}

// ---------------------------------------------------------------- goals

const metricCategory: Record<SpecializationGoal["metric"], ExposureCategory> = {
  direct_dynamic_bouts: "direct_dynamic",
  deliberate_hold_bouts: "deliberate_isometric",
  deliberate_hold_seconds: "deliberate_isometric",
};

/**
 * Progress for the active goals of this region and arm, each over its OWN period (a
 * calendar-week goal reads this calendar week in the goal's zone, whatever window the page
 * shows). Planned summaries have no dates, so there a goal reads the plan week on screen.
 *
 * - A muscle goal reads the muscle's own bucket: the same number the muscle row shows.
 * - A movement goal counts distinct bouts in which a reviewed mapping for that movement on
 *   one of the region's muscles is the goal's kind of work; seconds are counted once per bout.
 * - Unknown-side bouts never count toward an arm's goal.
 */
function goalProgressFor(
  request: SummaryRequest,
  index: RegionIndex,
  all: readonly ExposureBout[],
  classOf: (bout: ExposureBout) => BoutClass,
): GoalProgress[] {
  const out: GoalProgress[] = [];
  const both = request.side === "both";
  // For both arms, a target saved once per arm (the old "Both arms" choice) is one target.
  const seen = new Set<string>();
  for (const goal of request.goals) {
    if (goal.regionId !== request.region.region.id || (!both && goal.side !== request.side)) continue;
    if (both) {
      const key = [goal.nodeId, goal.actionId, goal.metric, goal.period, goal.target, goal.startsOn, goal.endsOn].join("|");
      if (seen.has(key)) continue;
      seen.add(key);
    }
    if (!isGoalActiveAt(goal, request.now)) continue;
    const period = request.mode === "completed" ? goalPeriodInterval(goal, request.now) : request.interval;
    const wanted = metricCategory[goal.metric];
    let value = 0;
    for (const bout of all) {
      if (!inWindow(bout, { mode: request.mode, interval: period })) continue;
      if (!onArm(bout, both ? "both" : goal.side) || bout.warmup || bout.excluded) continue;
      const found = classOf(bout);
      if (found.kind !== "mapped") continue;
      let counts = false;
      if (goal.nodeId !== null) {
        const effect = found.effects.get(goal.nodeId);
        counts = Boolean(effect && effect.parts.length && categoryOfParts(effect.parts) === wanted);
      } else {
        for (const [nodeId, effect] of Array.from(found.effects)) {
          if (!index.regionNodeIds.has(nodeId)) continue;
          if (effect.parts.some((part) => part.actionId === goal.actionId && part.category === wanted)) counts = true;
        }
      }
      if (!counts) continue;
      value += goal.metric === "deliberate_hold_seconds" ? sum(bout.segments.map((segment) => segment.holdSeconds)) : 1;
    }
    out.push({ goal, value, fraction: value / goal.target, label: goalProgressLabel(value, goal) });
  }
  return out;
}

/** A node's row in a summary, or null for a node the region does not have. */
export function nodeExposureIn(summary: SpecializationSummary, nodeId: NodeId): NodeExposure | null {
  return summary.nodes.find((node) => node.nodeId === nodeId) ?? null;
}
