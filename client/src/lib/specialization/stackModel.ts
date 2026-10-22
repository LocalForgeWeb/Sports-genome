import { isDirectHoldPart, isDirectMovingPart, ownTargetNodeIds } from "@shared/specialization/directWork";
import { indexRegion } from "@shared/specialization/exposure";
import { categoryFor } from "@shared/specialization/rules";
import type { ActionId, ExerciseVariant, ExposureCategory, NodeId, SpecializationRegionData, SpecializationSummary, VariantId, VariantMapping } from "@shared/specialization/types";

/**
 * The stack designer's model of a region (docs/specialization-atlas, note 11,
 * §3.4, "Model"): the prime node actions of the region's own target muscles as slots, in two modes
 * (moving and hold); the movements (slots of one mode covered by exactly the same reviewed variants,
 * so shared rows stay together); the gaps (moving slots no reviewed exercise covers); and the
 * reviewed variants that cover them. From region data only, cached per region.
 *
 * Kept apart from the designer (stack.ts, which imports it) because the page reads one thing of it
 * with the stack card closed: in Planned mode, "Coverage to review" says how many movements the plan
 * week gives no direct moving work (`movementsWithoutDirectWork`), the same movements the stack
 * would fill. The page fetches this small file only in Planned mode, and the designer only when
 * the card opens (§3.10, §7.5). Region-agnostic: no region is named here.
 */

// ---------------------------------------------------------------- public types

export type StackMode = "moving" | "hold";

/** Slots of one mode covered by exactly the same variants: shared rows stay together. */
export interface StackMovement {
  /** Stable, from the data: the mode and its slots. */
  key: string;
  mode: StackMode;
  /** Its actions' labels, in the region's order; a hold movement says "(hold)". */
  label: string;
  actionIds: ActionId[];
  /** The region's own target muscles this movement gives direct work to, in the region's order. */
  nodeIds: NodeId[];
  slots: { nodeId: NodeId; actionId: ActionId }[];
  /** Every reviewed variant that covers it, before the athlete's equipment, exclusions or settings. */
  variantIds: VariantId[];
  /** The region's action order of its first action (lower first). */
  actionOrder: number;
}

/** A main action of an own muscle that no reviewed exercise trains directly. */
export interface StackGap {
  nodeId: NodeId;
  actionId: ActionId;
  /** Reviewed exercises that credit the muscle as a helper (contributing work), by catalog id. */
  helpers: { variantId: VariantId; catalogExerciseId: number }[];
}

export interface StackModel {
  regionId: string;
  mappingVersion: string;
  ownTargets: NodeId[];
  /** Prime node actions of the own target muscles, per mode (moving and hold). */
  slotCount: { moving: number; hold: number };
  movements: StackMovement[];
  gaps: StackGap[];
}
// ---------------------------------------------------------------- the model (region data only; cached per region)

export type StackCandidate = {
  variant: ExerciseVariant;
  catalogExerciseId: number;
  /** Movement keys it covers. */
  covers: string[];
  movingNodes: NodeId[];
  holdNodes: NodeId[];
  kind: StackMode;
  oneSided: boolean;
  /** The single category one set gives each own node it credits (`mixed` for two), as a target counts it. */
  credits: Map<NodeId, ExposureCategory>;
  /** Each own-node mapping's action and category, as a movement target counts it. */
  actionCredits: { actionId: ActionId; category: ExposureCategory }[];
  sharedGroups: NodeId[][];
};

/** The model with the reviewed variants that cover it, as the designer reads it. */
export type StackModelIndex = StackModel & { candidates: StackCandidate[]; candidateByCatalogId: Map<number, StackCandidate>; actionIndex: Map<ActionId, number> };

const modelCache = new WeakMap<SpecializationRegionData, StackModelIndex>();

export const slotKey = (nodeId: NodeId, actionId: ActionId) => `${nodeId}|${actionId}`;
const lowerFirst = (text: string) => (text ? text.charAt(0).toLowerCase() + text.slice(1) : text);

/** Whether a variant is done one side at a time on the limb its sets record (`sidedBy`); two-sided and either-way work is not. */
function oneSidedOf(variant: ExerciseVariant): boolean {
  if (variant.sidedBy === "none") return false;
  const laterality = variant.sidedBy === "arm" ? variant.laterality : variant.legLaterality;
  return laterality === "unilateral";
}

function modeOfMapping(mapping: VariantMapping, variant: ExerciseVariant): StackMode | null {
  const part = { relationship: mapping.relationship, category: categoryFor(mapping.relationship, mapping.muscleMode, variant.deliberateHold) };
  if (isDirectMovingPart(part)) return "moving";
  if (isDirectHoldPart(part)) return "hold";
  return null;
}

/** The region's stack model: slots, movements, gaps and the reviewed variants that cover them. Cached per region data. */
export function stackModelFor(region: SpecializationRegionData): StackModel {
  return stackModelIndexFor(region);
}

/** The model and its candidates, cached per region data. */
export function stackModelIndexFor(region: SpecializationRegionData): StackModelIndex {
  const cached = modelCache.get(region);
  if (cached) return cached;
  const index = indexRegion(region);
  const own = ownTargetNodeIds(region);
  const ownSet = new Set(own);
  const nodeOrder = new Map(region.nodes.map((node, position) => [node.id, position] as const));
  const actionIndex = new Map(region.actions.map((action, position) => [action.id, position] as const));
  const actionLabel = (id: ActionId) => region.actions.find((action) => action.id === id)?.label ?? id;
  const byNodeOrder = (a: NodeId, b: NodeId) => (nodeOrder.get(a) ?? 0) - (nodeOrder.get(b) ?? 0);
  const primes = region.nodeActions.filter((row) => row.role === "prime" && ownSet.has(row.nodeId));
  const slots: { nodeId: NodeId; actionId: ActionId }[] = [];
  const seenSlots = new Set<string>();
  for (const row of primes) {
    const key = slotKey(row.nodeId, row.actionId);
    if (seenSlots.has(key)) continue;
    seenSlots.add(key);
    slots.push({ nodeId: row.nodeId, actionId: row.actionId });
  }
  const primeKeys = new Set(slots.map((slot) => slotKey(slot.nodeId, slot.actionId)));

  // The variant a plan entry of each catalog exercise is read as (the default `cat-<id>` one).
  const variants = Array.from(index.variantByCatalogId.values()).sort((a, b) => a.catalogExerciseId - b.catalogExerciseId);
  type Raw = { variant: ExerciseVariant; slotModes: Map<string, StackMode>; credits: Map<NodeId, Set<ExposureCategory>>; actionCredits: { actionId: ActionId; category: ExposureCategory }[]; shared: Map<string, NodeId[]> };
  const raws: Raw[] = [];
  for (const variant of variants) {
    const mappings = (index.mappingsByVariant.get(variant.id) ?? []).filter((mapping) => mapping.reviewStatus === "reviewed");
    const raw: Raw = { variant, slotModes: new Map(), credits: new Map(), actionCredits: [], shared: new Map() };
    for (const mapping of mappings) {
      // A strapped variant never earns the grip a bare hand would; the calculator withholds it.
      if (mapping.requiresNoStraps && variant.straps === "yes") continue;
      if (!index.regionNodeIds.has(mapping.nodeId)) continue;
      const category = categoryFor(mapping.relationship, mapping.muscleMode, variant.deliberateHold);
      const set = raw.credits.get(mapping.nodeId) ?? new Set<ExposureCategory>();
      set.add(category);
      raw.credits.set(mapping.nodeId, set);
      if (mapping.actionId) raw.actionCredits.push({ actionId: mapping.actionId, category });
      if (!ownSet.has(mapping.nodeId) || !mapping.actionId) continue;
      const mode = modeOfMapping(mapping, variant);
      if (!mode) continue;
      const key = slotKey(mapping.nodeId, mapping.actionId);
      if (!primeKeys.has(key)) continue;
      raw.slotModes.set(`${mode}:${key}`, mode);
      if (mapping.allocation === "shared") {
        const group = raw.shared.get(`${mode}:${mapping.actionId}`) ?? [];
        group.push(mapping.nodeId);
        raw.shared.set(`${mode}:${mapping.actionId}`, group);
      }
    }
    if (raw.slotModes.size) raws.push(raw);
  }

  // Movements: slots of one mode covered by exactly the same variants.
  const coverersOf = new Map<string, VariantId[]>();
  for (const raw of raws) for (const modeSlot of Array.from(raw.slotModes.keys())) {
    const list = coverersOf.get(modeSlot) ?? [];
    list.push(raw.variant.id);
    coverersOf.set(modeSlot, list);
  }
  const groups = new Map<string, { mode: StackMode; slots: { nodeId: NodeId; actionId: ActionId }[]; variantIds: VariantId[] }>();
  for (const mode of ["moving", "hold"] as const) {
    for (const slot of slots) {
      const variantIds = coverersOf.get(`${mode}:${slotKey(slot.nodeId, slot.actionId)}`);
      if (!variantIds?.length) continue;
      const signature = `${mode}#${variantIds.join(",")}`;
      const group = groups.get(signature) ?? { mode, slots: [], variantIds };
      group.slots.push(slot);
      groups.set(signature, group);
    }
  }
  const movements: StackMovement[] = Array.from(groups.values()).map((group) => {
    const actionIds = Array.from(new Set(group.slots.map((slot) => slot.actionId))).sort((a, b) => (actionIndex.get(a) ?? Infinity) - (actionIndex.get(b) ?? Infinity));
    const nodeIds = Array.from(new Set(group.slots.map((slot) => slot.nodeId))).sort(byNodeOrder);
    const words = actionIds.map((id, position) => (position ? lowerFirst(actionLabel(id)) : actionLabel(id))).join(" and ");
    const sortedSlots = [...group.slots].sort((a, b) => byNodeOrder(a.nodeId, b.nodeId) || (actionIndex.get(a.actionId) ?? 0) - (actionIndex.get(b.actionId) ?? 0));
    return {
      key: `${group.mode}:${sortedSlots.map((slot) => slotKey(slot.nodeId, slot.actionId)).join("+")}`,
      mode: group.mode,
      label: group.mode === "hold" ? `${words} (hold)` : words,
      actionIds,
      nodeIds,
      slots: sortedSlots,
      variantIds: group.variantIds,
      actionOrder: Math.min(...actionIds.map((id) => actionIndex.get(id) ?? Number.MAX_SAFE_INTEGER)),
    };
  }).sort((a, b) => (a.mode === b.mode ? 0 : a.mode === "moving" ? -1 : 1) || a.actionOrder - b.actionOrder || a.key.localeCompare(b.key));

  const movementOfSlot = new Map<string, string>();
  for (const movement of movements) for (const slot of movement.slots) movementOfSlot.set(`${movement.mode}:${slotKey(slot.nodeId, slot.actionId)}`, movement.key);

  const candidates: StackCandidate[] = raws.map((raw) => {
    const covers = Array.from(new Set(Array.from(raw.slotModes.keys()).map((modeSlot) => movementOfSlot.get(modeSlot)!))).sort();
    const nodesOf = (mode: StackMode) => Array.from(new Set(Array.from(raw.slotModes.keys()).filter((key) => key.startsWith(`${mode}:`)).map((key) => key.slice(mode.length + 1).split("|")[0]))).sort(byNodeOrder);
    const movingNodes = nodesOf("moving");
    const credits = new Map<NodeId, ExposureCategory>();
    for (const [nodeId, set] of Array.from(raw.credits.entries())) credits.set(nodeId, set.size === 1 ? Array.from(set)[0] : "mixed");
    return {
      variant: raw.variant,
      catalogExerciseId: raw.variant.catalogExerciseId,
      covers,
      movingNodes,
      holdNodes: nodesOf("hold"),
      kind: movingNodes.length ? "moving" : "hold",
      oneSided: oneSidedOf(raw.variant),
      credits,
      actionCredits: raw.actionCredits,
      sharedGroups: Array.from(raw.shared.values()).filter((group) => group.length > 1).map((group) => Array.from(new Set(group)).sort(byNodeOrder)),
    };
  });

  const covered = new Set(movements.flatMap((movement) => movement.slots.filter(() => movement.mode === "moving").map((slot) => slotKey(slot.nodeId, slot.actionId))));
  const gaps: StackGap[] = slots
    .filter((slot) => !covered.has(slotKey(slot.nodeId, slot.actionId)))
    .map((slot) => ({
      ...slot,
      helpers: variants
        .filter((variant) => (index.mappingsByVariant.get(variant.id) ?? []).some((mapping) => mapping.reviewStatus === "reviewed" && mapping.nodeId === slot.nodeId && categoryFor(mapping.relationship, mapping.muscleMode, variant.deliberateHold) === "contributing_dynamic"))
        .map((variant) => ({ variantId: variant.id, catalogExerciseId: variant.catalogExerciseId })),
    }));

  const model: StackModelIndex = {
    regionId: region.region.id,
    mappingVersion: region.mappingVersion.key,
    ownTargets: own,
    slotCount: { moving: slots.length, hold: slots.length },
    movements,
    gaps,
    candidates,
    candidateByCatalogId: new Map(candidates.map((candidate) => [candidate.catalogExerciseId, candidate] as const)),
    actionIndex,
  };
  modelCache.set(region, model);
  return model;
}
// ---------------------------------------------------------------- what a plan week trains directly

/** Own-muscle slot and mode pairs (`<mode>:<node>|<action>`) the summary gives direct work. */
export function coveredSlots(region: SpecializationRegionData, summary: SpecializationSummary): Set<string> {
  const own = new Set(ownTargetNodeIds(region));
  const out = new Set<string>();
  for (const node of summary.nodes) {
    if (!own.has(node.nodeId)) continue;
    for (const contribution of node.contributions) {
      if (contribution.countedSide === "unknown") continue;
      for (const part of contribution.parts) {
        if (!part.actionId) continue;
        if (isDirectMovingPart(part)) out.add(`moving:${slotKey(node.nodeId, part.actionId)}`);
        else if (isDirectHoldPart(part)) out.add(`hold:${slotKey(node.nodeId, part.actionId)}`);
      }
    }
  }
  return out;
}

/**
 * The region's moving movements the summary gives no direct moving work (§3.2, "Coverage to
 * review"): each movement none of whose slots has a direct moving part in the summary, as the
 * designer reads its needs. A plan's carry or hang never covers a moving movement. The gaps (main
 * actions no reviewed exercise trains directly) are not movements, so they are never counted here.
 */
export function movementsWithoutDirectWork(region: SpecializationRegionData, summary: SpecializationSummary): StackMovement[] {
  const covered = coveredSlots(region, summary);
  return stackModelIndexFor(region).movements.filter((movement) => movement.mode === "moving" && !movement.slots.some((slot) => covered.has(`moving:${slotKey(slot.nodeId, slot.actionId)}`)));
}
