import type {
  AnatomyNode,
  BoutSide,
  Contribution,
  ContributionSegment,
  CountedSide,
  ExerciseVariant,
  ExposureBout,
  ExposureCategory,
  GoalProgress,
  Limb,
  ListedUnmappedRow,
  MappingCoverage,
  NodeExposure,
  NodeId,
  RecordedSide,
  RegionBoutRow,
  SideRelation,
  SideSource,
  StoredSide,
  SpecializationGoal,
  SpecializationRegion,
  SpecializationRegionData,
  SpecializationSummary,
  SummaryCompleteness,
  SummaryRequest,
  SummarySide,
  VariantId,
  VariantMapping,
} from "./types";
import { categoryFor, currentExposureRule, type RuleBranch } from "./rules";
import { variantIdFor } from "./ids";
import { sideRelationOf, versionedMappingKey } from "./compose";
import { variantFor } from "./variants";
import { intervalContains } from "./time";
import { goalPeriodInterval, goalProgressLabel, isGoalActiveAt } from "./goals";

/**
 * `getSpecializationSummary`: the published accounting rule (rules.ts, design §3) applied to plain
 * bouts.
 *
 * Region-agnostic by construction. Everything that differs between one body region and
 * another (nodes, variants, mappings, which catalog keys count as "this region", how sides are
 * counted) is read from the `SpecializationRegionData` passed in; nothing here names a region, a
 * muscle or an exercise (a test scans this file to keep it that way).
 *
 * The calculator does not read storage, the plan or the clock. The device adapters turn
 * the workout log and the plan into `ExposureBout`s, and the caller says what "now" is,
 * so the same request always gives the same answer.
 */

type Part = Contribution["parts"][number];

// ---------------------------------------------------------------- sides

/** How one mapping reads a bout's sides (`nodeSideFor`). */
export interface NodeSideReading {
  /** The sides the work is counted on: both, one, `midline`, or none (unknown: kept apart, never counted). */
  sides: readonly StoredSide[];
  /** The clause of the rule that decided it (rules.ts `ruleClauses`). */
  branch: RuleBranch;
  /** The side recorded for the limb that decided it; where none did, the side recorded for another limb; null when none was. */
  recorded: RecordedSide | null;
  relation: SideRelation;
  /** How the side is known, for the summary's single reading of it (`BoutSide`). */
  source: SideSource;
}

const BOTH: readonly StoredSide[] = ["left", "right"];
const NONE: readonly StoredSide[] = [];
const otherSide = (side: "left" | "right") => (side === "left" ? "right" : "left");

function recordedFor(bout: Pick<ExposureBout, "armSide" | "legSide">, limb: Limb): RecordedSide | null {
  const record = limb === "arm" ? bout.armSide : bout.legSide;
  return record ? { limb, side: record.side, source: record.source } : null;
}

/** The variant's laterality for one limb: `laterality` for the arms, `legLaterality` for the legs. */
function lateralityFor(variant: ExerciseVariant | null, limb: Limb) {
  return limb === "arm" ? variant?.laterality : variant?.legLaterality;
}

const sourceOf = (recorded: RecordedSide | null, otherwise: SideSource): SideSource => (recorded ? (recorded.source === "plan_assumption" ? "plan_assumption" : "recorded") : otherwise);

/**
 * The sides one mapping's work in one bout is counted on (10-multi-region.md §2.1):
 * 1. a midline region counts it once, `midline`, whatever was recorded;
 * 2. a mapping loaded on both sides (`sideRelation: both`) counts on each side, side or none;
 * 3. a variant two-sided for the region's limb by definition counts on each side, as today;
 * 4. a side recorded for the region's limb counts on that side (`same`) or the other (`opposite`),
 *    and a recorded `both` on each side;
 * 5. a variant the region's limb plays no part in gives no side (its mappings are `both`, so rule 2
 *    has answered for them);
 * 6. anything else, a side recorded only for the other limb included, is unknown.
 *
 * Rule 4 is read before rule 3. "As today" is the calculator as it first shipped: a side recorded on
 * a two-handed exercise (only an import or a swapped exercise can hold one; the logger does not ask
 * there) counted on that side alone, and a shipped region's numbers do not change at wave 0 (§4.3,
 * the golden test). Read in the other order, such a set would count on both sides.
 *
 * `mapping` null reads the bout as the region does when no mapping speaks (region-only and
 * unrelated work): relation `same`, and no rule 5, which is about mappings, so a limb the exercise
 * does not use gives no side by rule 6.
 */
export function nodeSideFor(
  region: Pick<SpecializationRegion, "sides">,
  variant: ExerciseVariant | null,
  mapping: Pick<VariantMapping, "sideRelation"> | null,
  bout: Pick<ExposureBout, "armSide" | "legSide">,
): NodeSideReading {
  const relation = mapping ? sideRelationOf(mapping) : "same";
  if (region.sides.model === "midline") {
    const own = variant?.sidedBy === "leg" ? "leg" : "arm";
    const recorded = recordedFor(bout, own) ?? recordedFor(bout, own === "arm" ? "leg" : "arm");
    return { sides: ["midline"], branch: "side.midline", recorded, relation, source: sourceOf(recorded, "structural") };
  }
  const limb = region.sides.limb;
  const recorded = recordedFor(bout, limb);
  const laterality = lateralityFor(variant, limb);
  if (relation === "both") return { sides: BOTH, branch: `side.${limb}.relation_both`, recorded, relation, source: sourceOf(recorded, "structural") };
  if (recorded) {
    if (recorded.side === "both") return { sides: BOTH, branch: `side.${limb}.recorded`, recorded, relation, source: sourceOf(recorded, "recorded") };
    const opposite = relation === "opposite";
    return { sides: [opposite ? otherSide(recorded.side) : recorded.side], branch: opposite ? `side.${limb}.recorded_opposite` : `side.${limb}.recorded`, recorded, relation, source: sourceOf(recorded, "recorded") };
  }
  if (laterality === "bilateral") return { sides: BOTH, branch: `side.${limb}.structural`, recorded, relation, source: "structural" };
  const elsewhere = recordedFor(bout, limb === "arm" ? "leg" : "arm");
  if (laterality === "not_applicable" && mapping) return { sides: NONE, branch: `side.${limb}.not_applicable`, recorded: elsewhere, relation, source: "unknown" };
  return { sides: NONE, branch: `side.${limb}.unknown`, recorded: elsewhere, relation, source: "unknown" };
}

/**
 * The summary's single reading of a side (`BoutSide`), as the page read it before sides were
 * resolved per mapping: `unknown` for a row kept apart; `bilateral` for a row counted on both
 * sides, on the midline, or on the sides a plan assumes; else the one side counted.
 */
function singleReading(reading: NodeSideReading, counted: boolean): { side: BoutSide; sideSource: SideSource } {
  if (!counted || !reading.sides.length) return { side: "unknown", sideSource: "unknown" };
  if (reading.source === "plan_assumption") return { side: "bilateral", sideSource: "plan_assumption" };
  const [only] = reading.sides;
  if (reading.sides.length > 1 || only === "midline") return { side: "bilateral", sideSource: reading.source };
  return { side: only, sideSource: reading.source };
}

// ---------------------------------------------------------------- region index

/** One mapping as it bears on one bout: its ledger part and the sides it is counted on. */
type MappingEffect = { mapping: VariantMapping; part: Part; reading: NodeSideReading };

/** What one bout does to one node, before the summary's side and window are applied. */
type NodeEffect = {
  /** Reviewed mappings that credit the node. */
  credited: MappingEffect[];
  /** Reviewed grip mappings withheld because the set was strapped. */
  strapped: MappingEffect[];
  /** Draft mappings: shown as pending, never counted. */
  pending: MappingEffect[];
};

/**
 * How a bout relates to the region, by the region's OWN muscles (10-multi-region.md §4.2):
 * - `mapped`: an own member has a mapping for the variant; external members' effects are credited too;
 * - `region_only`: no own member is mapped, and the catalog tags carry the region's catalog keys
 *   within its tag scope: counted at region level only, never fanned out to own nodes; any
 *   external member's effects are still credited to that member's row;
 * - `external_only`: only external members are mapped and the tags do not match: their rows are
 *   credited, and the bout is in no region total and not in completeness;
 * - `unrelated`: nothing above.
 * `reading` is the bout as the region reads it with no mapping (relation `same`).
 */
type BoutClass = {
  kind: "mapped" | "region_only" | "external_only" | "unrelated";
  variant: ExerciseVariant | null;
  effects: Map<NodeId, NodeEffect>;
  reading: NodeSideReading;
};

export type RegionIndex = {
  nodeById: ReadonlyMap<NodeId, AnatomyNode>;
  /** Nodes whose home is the region (not external members such as another region's muscle). */
  regionNodeIds: ReadonlySet<NodeId>;
  variantByCatalogId: ReadonlyMap<number, ExerciseVariant>;
  /** The mappings that credit the region's nodes, each node by exactly one version, rejected ones dropped, in id order. */
  mappingsByVariant: ReadonlyMap<VariantId, readonly VariantMapping[]>;
  /** The version each node is credited by, and the branch of the rule that chose it. */
  creditedBy: ReadonlyMap<NodeId, { versionKey: string; branch: Extract<RuleBranch, `version.${string}`> }>;
  /** Whether any reviewed mapping can credit a node at all, independent of any window. */
  coverage: ReadonlyMap<NodeId, MappingCoverage>;
  /** The region's catalog keys (`SpecializationRegion.catalogKeys`): work tagged with these is region work. */
  regionCatalogKeys: ReadonlySet<string>;
  /** The region's listed unmapped exercises and their reasons, by catalog id. */
  unmappedReasons: ReadonlyMap<number, string>;
};

const indexCache = new WeakMap<SpecializationRegionData, RegionIndex>();

const byId = (a: VariantMapping, b: VariantMapping) => (a.id < b.id ? -1 : a.id > b.id ? 1 : a.versionKey < b.versionKey ? -1 : a.versionKey > b.versionKey ? 1 : 0);

/**
 * Lookups over a region's content, built once per region object. Each node is credited by exactly
 * one version (brief §11 "Mapping revision: no double-counting"; 10-multi-region.md §4.2): a node of
 * the region by the region's current version; an external member by its home region's current
 * version where that region has published one, else by the region's own rows for it. An older
 * generation of mappings left in the data is never read.
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
  const usable = (mapping: VariantMapping, versionKey: string) => mapping.versionKey === versionKey && mapping.reviewStatus !== "rejected";
  const own = region.mappings.filter((mapping) => usable(mapping, region.mappingVersion.key));
  const creditedBy = new Map<NodeId, { versionKey: string; branch: Extract<RuleBranch, `version.${string}`> }>();
  const credited: VariantMapping[] = [];
  for (const node of region.nodes) {
    const home = node.regionId === regionId ? null : region.externalMappingVersions.find((external) => external.regionId === node.regionId);
    if (home) {
      creditedBy.set(node.id, { versionKey: home.version.key, branch: "version.home" });
      credited.push(...home.mappings.filter((mapping) => mapping.nodeId === node.id && usable(mapping, home.version.key)));
    } else {
      creditedBy.set(node.id, { versionKey: region.mappingVersion.key, branch: node.regionId === regionId ? "version.own" : "version.listing_fallback" });
      credited.push(...own.filter((mapping) => mapping.nodeId === node.id));
    }
  }
  const mappingsByVariant = new Map<VariantId, VariantMapping[]>();
  for (const mapping of credited.sort(byId)) {
    const list = mappingsByVariant.get(mapping.variantId) ?? [];
    list.push(mapping);
    mappingsByVariant.set(mapping.variantId, list);
  }
  const coverage = new Map<NodeId, MappingCoverage>();
  for (const node of region.nodes) {
    const forNode = credited.filter((mapping) => mapping.nodeId === node.id);
    coverage.set(node.id, forNode.some((mapping) => mapping.reviewStatus === "reviewed") ? "reviewed" : forNode.length ? "pending_review" : "none");
  }
  const regionCatalogKeys = new Set(region.region.catalogKeys);
  const unmappedReasons = new Map(region.unmappedTagged.map((entry) => [entry.catalogId, entry.reason] as const));
  const index: RegionIndex = { nodeById, regionNodeIds, variantByCatalogId, mappingsByVariant, creditedBy, coverage, regionCatalogKeys, unmappedReasons };
  indexCache.set(region, index);
  return index;
}

/** The variant a bout of this catalog exercise is read as, or null when the region has none. */
export function variantForCatalogId(region: SpecializationRegionData, catalogExerciseId: number | null): ExerciseVariant | null {
  if (catalogExerciseId === null) return null;
  return indexRegion(region).variantByCatalogId.get(catalogExerciseId) ?? null;
}

/**
 * A mapping's key in this region's data: its id within the region's own version, and
 * `<version>/<id>` for a mapping of another version (an external member's home version), so two
 * versions' mappings never share a key (10-multi-region.md §4.1). Ledger parts carry it.
 */
export function mappingKeyIn(region: SpecializationRegionData, mapping: Pick<VariantMapping, "versionKey" | "id">): string {
  return mapping.versionKey === region.mappingVersion.key ? mapping.id : versionedMappingKey(mapping);
}

/** The credited mappings behind ledger keys (`mappingKeyIn`), each once, in the order given; unknown keys are skipped. */
/**
 * The mappings that credit one node on this region's page, as `indexRegion` chooses them: the
 * region's own version for its own muscles; an external member's home version once that region
 * has published one, else the region's own rows for it. A page reader that asks what credits a
 * muscle reads this, never `region.mappings` filtered by the page's own version, which would read
 * the listing region's fallback rows for an external member whose home has published (§4.2).
 */
export function creditedMappingsFor(region: SpecializationRegionData, nodeId: NodeId): VariantMapping[] {
  return Array.from(indexRegion(region).mappingsByVariant.values()).flat().filter((mapping) => mapping.nodeId === nodeId);
}

export function mappingsByKey(region: SpecializationRegionData, keys: readonly string[]): VariantMapping[] {
  const all = new Map(Array.from(indexRegion(region).mappingsByVariant.values()).flat().map((mapping) => [mappingKeyIn(region, mapping), mapping] as const));
  return Array.from(new Set(keys)).flatMap((key) => (all.has(key) ? [all.get(key)!] : []));
}

// ---------------------------------------------------------------- one bout

/** Whether the catalog tags put this exercise in the region within its tag scope, outside it only, or not at all. */
function tagsOf(region: SpecializationRegionData, index: RegionIndex, bout: ExposureBout, catalogMusclesFor: SummaryRequest["catalogMusclesFor"]): "in_scope" | "secondary" | "none" {
  const tags = catalogMusclesFor(bout.catalogExerciseId, bout.exerciseName);
  if (!tags) return "none";
  const has = (keys: readonly string[]) => keys.some((key) => index.regionCatalogKeys.has(key));
  if (has(tags.primary)) return "in_scope";
  if (!has(tags.secondary)) return "none";
  return region.region.regionOnlyTagScope === "any" ? "in_scope" : "secondary";
}

function classifyBout(region: SpecializationRegionData, index: RegionIndex, bout: ExposureBout, catalogMusclesFor: SummaryRequest["catalogMusclesFor"]): BoutClass {
  const mine = bout.catalogExerciseId === null ? undefined : index.variantByCatalogId.get(bout.catalogExerciseId);
  const mappings = mine ? index.mappingsByVariant.get(mine.id) ?? [] : [];
  // A bout no mapping speaks for is read with the shared library's variant (10-multi-region.md §3).
  const variant = mine ?? variantFor(bout.catalogExerciseId);
  const reading = nodeSideFor(region.region, variant, null, bout);
  const effects = new Map<NodeId, NodeEffect>();
  let ownMapped = false;
  for (const mapping of mappings) {
    const effect = effects.get(mapping.nodeId) ?? { credited: [], strapped: [], pending: [] };
    effects.set(mapping.nodeId, effect);
    ownMapped ||= index.regionNodeIds.has(mapping.nodeId);
    // A mapping is listed under its variant, so a bout with mappings has the region's variant.
    const entry: MappingEffect = { mapping, part: partOf(region, mapping, mine!), reading: nodeSideFor(region.region, mine!, mapping, bout) };
    if (mapping.reviewStatus !== "reviewed") {
      effect.pending.push(entry);
      continue;
    }
    // Grip that needs a bare hand is not earned by a strapped set; unknown straps keep it (noted).
    if (mapping.requiresNoStraps && bout.straps === "yes") {
      effect.strapped.push(entry);
      continue;
    }
    effect.credited.push(entry);
  }
  if (ownMapped) return { kind: "mapped", variant, effects, reading };
  // No own muscle is mapped: region work if the catalog tags it so, and then ONLY at region
  // level. It never fans out into credit for every node.
  const tagged = tagsOf(region, index, bout, catalogMusclesFor) === "in_scope";
  if (tagged) return { kind: "region_only", variant, effects, reading };
  return { kind: effects.size ? "external_only" : "unrelated", variant, effects, reading };
}

function partOf(region: SpecializationRegionData, mapping: VariantMapping, variant: ExerciseVariant): Part {
  return {
    mappingId: mappingKeyIn(region, mapping),
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
 * Whether one reading counts on the summary's side. A `both` summary (what the page shows for a
 * paired region, owner 20 Oct 2026) counts every reading once, whichever side it is on, and one
 * with no side too: nothing is kept apart for want of a side. A per-side summary (`left`, `right`:
 * dormant capability) or a midline one counts a reading on its own side only.
 */
const countsOn = (reading: NodeSideReading, side: SummarySide) => side === "both" || reading.sides.includes(side);
const onSide = (effects: readonly MappingEffect[], side: SummarySide) => effects.filter((effect) => countsOn(effect.reading, side));
/** Effects kept apart with no side: only a per-side summary has any (a `both` summary counts them). */
const sideless = (effects: readonly MappingEffect[], side: SummarySide) => (side === "both" ? [] : effects.filter((effect) => !effect.reading.sides.length));

/**
 * What one node shows for one bout on one side: work counted on that side; else work kept apart
 * with no side (unknown); else, with nothing credited here, the withheld (strapped) mappings, then
 * the pending ones, that apply on that side, else those that have no side. Work counted only on
 * the other side is nothing.
 */
type NodeOnSide =
  | { kind: "counted" | "unknown"; effects: MappingEffect[] }
  | { kind: "strapped" | "pending"; effects: MappingEffect[]; unknown: boolean };

function nodeOnSide(effect: NodeEffect, side: SummarySide): NodeOnSide | null {
  const counted = onSide(effect.credited, side);
  if (counted.length) return { kind: "counted", effects: counted };
  const unknown = sideless(effect.credited, side);
  if (unknown.length) return { kind: "unknown", effects: unknown };
  for (const kind of ["strapped", "pending"] as const) {
    const here = onSide(effect[kind], side);
    if (here.length) return { kind, effects: here, unknown: false };
    const apart = sideless(effect[kind], side);
    if (apart.length) return { kind, effects: apart, unknown: true };
  }
  return null;
}

/**
 * Other nodes that share this node's work in an exercise: reviewed `shared` mappings of the
 * same variant giving the same category, in the same version. The work is real but the evidence
 * cannot split it between them. Grouping by category, not by action, keeps two nodes whose actions
 * differ (one bends the middle finger joints, the other the fingertips) together for one grip, and
 * keeps a set's shared dynamic work apart from the shared holding in the same set. Two versions'
 * mappings are never grouped: one version made no claim about the other's muscles.
 */
function sharedWithOf(region: SpecializationRegionData, index: RegionIndex, variant: ExerciseVariant, nodeId: NodeId, credited: readonly VariantMapping[]): NodeId[] {
  const shared = credited.filter((mapping) => mapping.allocation === "shared");
  const categories = new Set(shared.map((mapping) => partOf(region, mapping, variant).category));
  if (!categories.size) return [];
  const versions = new Set(shared.map((mapping) => mapping.versionKey));
  const others = (index.mappingsByVariant.get(variant.id) ?? []).filter(
    (mapping) => mapping.reviewStatus === "reviewed" && mapping.allocation === "shared" && mapping.nodeId !== nodeId && versions.has(mapping.versionKey) && categories.has(partOf(region, mapping, variant).category),
  );
  return Array.from(new Set(others.map((mapping) => mapping.nodeId))).sort();
}

/** The nodes a node's work in this exercise is shared with (see sharedWithOf), for the ledger and suggestions. */
export function sharedPartnersOf(region: SpecializationRegionData, variant: ExerciseVariant, nodeId: NodeId): NodeId[] {
  const index = indexRegion(region);
  const own = (index.mappingsByVariant.get(variant.id) ?? []).filter((mapping) => mapping.reviewStatus === "reviewed" && mapping.nodeId === nodeId);
  return sharedWithOf(region, index, variant, nodeId, own);
}

/** A bout as a region total lists it: the set record, with no node and no category. */
function regionRowOf(bout: ExposureBout, reading: NodeSideReading, countedSide: CountedSide): RegionBoutRow {
  return {
    boutId: bout.id,
    ...singleReading(reading, countedSide !== "unknown"),
    countedSide,
    recordedSide: reading.recorded,
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

function contributionOf(bout: ExposureBout, nodeId: NodeId, effects: readonly MappingEffect[], countedSide: CountedSide, notes: string[], sharedWith: NodeId[]): Contribution {
  const segments = segmentsOf(bout);
  const parts = effects.map((effect) => effect.part);
  const [first] = effects;
  return {
    boutId: bout.id,
    nodeId,
    category: categoryOfParts(parts),
    parts,
    ...singleReading(first.reading, countedSide !== "unknown"),
    countedSide,
    recordedSide: first.reading.recorded,
    sideRelation: first.reading.relation,
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
function notesFor(bout: ExposureBout, shown: readonly MappingEffect[], strapped: readonly MappingEffect[]): string[] {
  const notes: string[] = [];
  if (strapped.length) notes.push("Strapped: grip not counted");
  if (bout.straps === "unknown" && shown.some((effect) => effect.mapping.reviewStatus === "reviewed" && effect.mapping.requiresNoStraps)) notes.push("Straps not recorded");
  if (shown[0]?.reading.source === "plan_assumption") notes.push("Each side assumed");
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

function addCounted(node: NodeExposure, contribution: Contribution): void {
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

/** Where readings put a bout on one side: `on` it, `unknown` (no side here, and none of them on a side), or `elsewhere` (only the other side's). */
type Standing = "on" | "unknown" | "elsewhere";

function standingOf(readings: readonly NodeSideReading[], side: SummarySide): Standing {
  if (readings.some((reading) => countsOn(reading, side))) return "on";
  return side !== "both" && readings.some((reading) => !reading.sides.length) ? "unknown" : "elsewhere";
}

/**
 * Where a bout stands for the region's own totals and completeness on one side, and whether
 * reviewed work puts it there. Region-only and unrelated work is read with no mapping. A mapped
 * bout is read from its own members' mappings in the order a node row reads them: credited, then
 * strapped, then pending; the first kind that has the bout on this side or with no side decides.
 * So a bout is `on` this side for completeness exactly when it is in the region's distinct bouts
 * here, or none of its own work is credited here and withheld or pending work is on this side; it
 * is `unknown` exactly when it is in the region's unknown-side set, or none of its own work is
 * credited here and the rest has no side; and it is reviewed here only when credited or strapped
 * work decides (10-multi-region.md §2.1, §4.2).
 */
function ownStanding(found: BoutClass, index: RegionIndex, side: SummarySide): { standing: Standing; reviewed: boolean } {
  if (found.kind !== "mapped") return { standing: standingOf([found.reading], side), reviewed: false };
  const own = Array.from(found.effects).filter(([nodeId]) => index.regionNodeIds.has(nodeId)).map(([, effect]) => effect);
  for (const kind of ["credited", "strapped", "pending"] as const) {
    const standing = standingOf(own.flatMap((effect) => effect[kind].map((item) => item.reading)), side);
    if (standing !== "elsewhere") return { standing, reviewed: kind !== "pending" };
  }
  return { standing: "elsewhere", reviewed: false };
}

/**
 * The request's side fits the region: `both` (the page's) or `left` / `right` (per side, dormant)
 * for a paired region, `midline` for a midline one.
 */
function checkSide(region: SpecializationRegion, side: SummarySide): void {
  const midline = region.sides.model === "midline";
  if (midline !== (side === "midline")) throw new Error(`Region ${region.id} is counted ${midline ? "on the midline" : "for its two sides"}; a summary for side ${side} does not fit it`);
}

export function getSpecializationSummary(request: SummaryRequest): SpecializationSummary {
  const { region, side } = request;
  checkSide(region.region, side);
  const index = indexRegion(region);
  const classes = new Map<string, BoutClass>();
  const classOf = (bout: ExposureBout) => {
    let found = classes.get(bout.id);
    if (!found) {
      found = classifyBout(region, index, bout, request.catalogMusclesFor);
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
  const listedUnmappedRows: ListedUnmappedRow[] = [];
  const completeness: SummaryCompleteness = {
    boutsConsidered: 0,
    boutsWithReviewedMapping: 0,
    boutsPendingReview: 0,
    boutsRegionOnly: 0,
    boutsNameMatched: 0,
    boutsUnknownSide: 0,
    boutsExcluded: { notCompleted: 0, warmup: 0 },
    boutsListedUnmapped: 0,
  };

  const all = distinctBouts(request.bouts);
  for (const bout of all) {
    if (!inWindow(bout, request)) continue;
    const found = classOf(bout);
    const { standing, reviewed } = ownStanding(found, index, side);
    // What is not counted here is shown (§8): a set that tags the region and is in none of its totals.
    if ((found.kind === "unrelated" || found.kind === "external_only") && !bout.excluded && !bout.warmup && standing !== "elsewhere") {
      const listed = listedUnmappedOf(region, index, bout, request.catalogMusclesFor, found, side, standing === "on" ? side : "unknown");
      if (listed) listedUnmappedRows.push(listed);
    }
    if (found.kind === "unrelated") continue;
    // Only own work makes a bout the region's: an external-only bout is credited on its rows and nowhere else.
    const regionWork = found.kind !== "external_only" && standing !== "elsewhere";
    if (bout.excluded === "not_completed") { if (regionWork) completeness.boutsExcluded.notCompleted += 1; continue; }
    if (bout.warmup) { if (regionWork) completeness.boutsExcluded.warmup += 1; continue; }

    if (regionWork) {
      completeness.boutsConsidered += 1;
      if (bout.matchedBy === "name") completeness.boutsNameMatched += 1;
      if (standing === "unknown") completeness.boutsUnknownSide += 1;
      if (found.kind === "region_only") {
        completeness.boutsRegionOnly += 1;
        const key = bout.catalogExerciseId !== null ? `id:${bout.catalogExerciseId}` : `name:${bout.exerciseName}`;
        const entry = unclassified.get(key) ?? { name: bout.exerciseName, catalogExerciseId: bout.catalogExerciseId, bouts: 0 };
        entry.bouts += 1;
        unclassified.set(key, entry);
        unclassifiedRows.push(regionRowOf(bout, found.reading, standing === "on" ? side : "unknown"));
      } else if (reviewed) completeness.boutsWithReviewedMapping += 1;
      else completeness.boutsPendingReview += 1;
    }

    let ownCounted: MappingEffect | null = null;
    let ownUnknown: MappingEffect | null = null;
    for (const [nodeId, effect] of Array.from(found.effects)) {
      const node = nodes.get(nodeId);
      // A mapping to a node the region does not list cannot be shown anywhere; it is skipped, not invented.
      if (!node || !found.variant) continue;
      const here = nodeOnSide(effect, side);
      if (!here) continue;
      const own = index.regionNodeIds.has(nodeId);
      const strappedHere = here.kind === "strapped" ? here.effects : [...onSide(effect.strapped, side), ...sideless(effect.strapped, side)];
      const notes = notesFor(bout, here.effects, strappedHere);
      if (here.kind === "strapped") {
        node.notCounted!.push(contributionOf(bout, nodeId, here.effects, here.unknown ? "unknown" : side, notes, []));
        continue;
      }
      if (here.kind === "pending") {
        // Like credited work, a bout with no side here is kept apart: it is never either side's.
        if (here.unknown) node.unknownSide.pendingReviewBouts = (node.unknownSide.pendingReviewBouts ?? 0) + 1;
        else node.pendingReviewBouts += 1;
        node.notCounted!.push(contributionOf(bout, nodeId, here.effects, here.unknown ? "unknown" : side, [...notes, "Mapping pending review"], []));
        continue;
      }
      const countedSide: CountedSide = here.kind === "counted" ? side : "unknown";
      const contribution = contributionOf(bout, nodeId, here.effects, countedSide, notes, sharedWithOf(region, index, found.variant, nodeId, here.effects.map((item) => item.mapping)));
      node.contributions.push(contribution);
      if (here.kind === "counted") {
        addCounted(node, contribution);
        if (own && !ownCounted) ownCounted = here.effects[0];
      } else {
        addToUnknownSide(node, contribution);
        if (own && !ownUnknown) ownUnknown = here.effects[0];
      }
    }
    // A bout is in the region's total on this side when an own node counts it here, and in its
    // unknown-side set only when none does, so no set is in both.
    if (found.kind === "mapped") {
      if (ownCounted) regionBouts.set(bout.id, regionRowOf(bout, ownCounted.reading, side));
      else if (ownUnknown) regionUnknownSide.set(bout.id, regionRowOf(bout, ownUnknown.reading, "unknown"));
    }
  }

  for (const node of Array.from(nodes.values())) {
    node.contributions.sort(byTimeThenId);
    node.notCounted!.sort(byTimeThenId);
  }
  completeness.boutsListedUnmapped = listedUnmappedRows.length;

  return {
    regionId: region.region.id,
    interval: request.interval,
    side,
    mode: request.mode,
    mappingVersion: region.mappingVersion.key,
    ruleVersion: (request.rule ?? currentExposureRule).id,
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
    listedUnmappedRows: listedUnmappedRows.sort(byTimeThenId),
    goals: goalProgressFor(request, index, all, classOf),
    completeness,
    calculatedAt: request.now,
  };
}

/**
 * A set that tags the region but is in none of its totals (10-multi-region.md §8): an unrelated or
 * external-only set whose exercise tags the region as a secondary muscle where the region reads
 * primary tags only, or is one of the region's listed unmapped exercises. An external-only set
 * names the external members whose rows show it on this side (`creditedTo`): their home region
 * credits it, this region does not count it. Null for any other set.
 */
function listedUnmappedOf(region: SpecializationRegionData, index: RegionIndex, bout: ExposureBout, catalogMusclesFor: SummaryRequest["catalogMusclesFor"], found: BoutClass, side: SummarySide, countedSide: CountedSide): ListedUnmappedRow | null {
  const reason = bout.catalogExerciseId === null ? undefined : index.unmappedReasons.get(bout.catalogExerciseId);
  const secondary = tagsOf(region, index, bout, catalogMusclesFor) === "secondary";
  if (!secondary && reason === undefined) return null;
  const shown = (effect: NodeEffect) => {
    const kind = nodeOnSide(effect, side)?.kind;
    return kind === "counted" || kind === "unknown";
  };
  const creditedTo = Array.from(found.effects).filter(([nodeId, effect]) => index.nodeById.has(nodeId) && !index.regionNodeIds.has(nodeId) && shown(effect)).map(([nodeId]) => nodeId);
  return { ...regionRowOf(bout, found.reading, countedSide), tag: secondary ? "secondary" : "listed", reason: reason ?? null, creditedTo };
}

// ---------------------------------------------------------------- goals

const metricCategory: Record<SpecializationGoal["metric"], ExposureCategory> = {
  direct_dynamic_bouts: "direct_dynamic",
  deliberate_hold_bouts: "deliberate_isometric",
  deliberate_hold_seconds: "deliberate_isometric",
};

/**
 * Progress for the active goals of this region and side, each over its OWN period (a
 * calendar-week goal reads this calendar week in the goal's zone, whatever window the page
 * shows). Planned summaries have no dates, so there a goal reads the plan week on screen.
 *
 * Goals read the same per-node, per-side contributions the rows are made of (10-multi-region.md §2.2):
 * - a muscle goal reads the muscle's own bucket: the number its row shows over the goal's period;
 * - a movement goal counts distinct bouts with a contribution of one of the region's own muscles
 *   on this side whose part is that movement and the goal's kind of work; seconds once per bout.
 * Work kept apart with no side never counts toward a side's goal.
 *
 * A `both` summary (the page's, owner 20 Oct 2026) reads every target of the region whatever side
 * it was saved for, counts work from either side and work with no side recorded, and reads a target
 * saved once per side (the old "Both arms" choice, two copies differing only in side) as one.
 */
function goalProgressFor(
  request: SummaryRequest,
  index: RegionIndex,
  all: readonly ExposureBout[],
  classOf: (bout: ExposureBout) => BoutClass,
): GoalProgress[] {
  const out: GoalProgress[] = [];
  const both = request.side === "both";
  // Both sides as one: a target saved once per side is one target.
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
      if (bout.warmup || bout.excluded) continue;
      const found = classOf(bout);
      let counts = false;
      for (const [nodeId, effect] of Array.from(found.effects)) {
        if (goal.nodeId !== null ? nodeId !== goal.nodeId : !index.regionNodeIds.has(nodeId)) continue;
        const counted = onSide(effect.credited, both ? "both" : goal.side);
        if (!counted.length) continue;
        const parts = counted.map((item) => item.part);
        if (goal.nodeId !== null ? categoryOfParts(parts) === wanted : parts.some((part) => part.actionId === goal.actionId && part.category === wanted)) counts = true;
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

// ---------------------------------------------------------------- which clauses the data reaches

/**
 * The branches of the rule (rules.ts `RuleBranch`) a region's data can reach, read from the data
 * alone: its side model, the variants and relations of the mappings that credit its nodes, the
 * version each node is credited by, the classes of bout its mappings allow, and its tag scope. A
 * bout no mapping speaks for, whatever its variant, reaches only the side branches every paired
 * region lists (two-sided, recorded, unknown) or the midline. A test refuses production data that
 * reaches a branch no published rule holds.
 */
export function ruleBranchesOf(region: SpecializationRegionData): Set<RuleBranch> {
  const index = indexRegion(region);
  const branches = new Set<RuleBranch>(["class.mapped", "class.region_only", "class.unrelated", `scope.${region.region.regionOnlyTagScope}`]);
  for (const { branch } of Array.from(index.creditedBy.values())) branches.add(branch);
  const sides = region.region.sides;
  if (sides.model === "midline") branches.add("side.midline");
  else for (const branch of ["structural", "recorded", "unknown"] as const) branches.add(`side.${sides.limb}.${branch}`);
  const variants = new Map(region.variants.map((variant) => [variant.id, variant] as const));
  for (const [variantId, mappings] of Array.from(index.mappingsByVariant)) {
    const variant = variants.get(variantId) ?? null;
    if (variant && (variant.sidedBy === "arm" || variant.sidedBy === "leg") && lateralityFor(variant, variant.sidedBy) === "unilateral") branches.add(`plan.${variant.sidedBy}.one_bout`);
    if (!mappings.some((mapping) => index.regionNodeIds.has(mapping.nodeId))) {
      branches.add("class.region_only_external");
      branches.add("class.external_only");
    }
    if (sides.model === "midline") continue;
    for (const mapping of mappings) {
      const relation = sideRelationOf(mapping);
      if (relation === "both") {
        branches.add(`side.${sides.limb}.relation_both`);
        continue;
      }
      // A recorded side is read before the exercise's own two sides, so an opposite mapping reaches its branch on any variant.
      if (relation === "opposite") branches.add(`side.${sides.limb}.recorded_opposite`);
      if (lateralityFor(variant, sides.limb) === "not_applicable") branches.add(`side.${sides.limb}.not_applicable`);
    }
  }
  return branches;
}
