import { equipmentMatchesProfile, type AthleteEquipmentProfile } from "@/lib/equipmentProfile";
import type { Exercise } from "@/lib/exerciseCatalog";
import { commitDay, loadDay, type DaySlot, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { getGoalPrescription, getWorkoutDiagnostics, holdDefaultTarget, type TrainingGoal } from "@/lib/workoutPlanner";
import { catalogIdOf } from "@/lib/workoutSwap";
import { directWorkCount, isDirectHoldPart, isDirectMovingPart, ownTargetNodeIds, type DirectWorkCount } from "@shared/specialization/directWork";
import { getSpecializationSummary, indexRegion } from "@shared/specialization/exposure";
import { prescriptionText, repProfileOf, repTargetFor, type RepRangeKind } from "@shared/specialization/repProfiles";
import { categoryFor } from "@shared/specialization/rules";
import { planWeekInterval } from "@shared/specialization/time";
import type {
  ActionId,
  ExerciseVariant,
  ExposureBout,
  ExposureCategory,
  GoalMetric,
  GoalProgress,
  NodeId,
  RegionExtras,
  SpecializationGoal,
  SpecializationRegionData,
  SpecializationSummary,
  SummarySide,
  VariantId,
  VariantMapping,
} from "@shared/specialization/types";
import type { SpecializationExclusions } from "./exclusions";
import { boutsFromPlan } from "./planBouts";
import { applyPlanChangeToRecord } from "./planChange";
import { catalogMusclesLookup, planningVariantsFor } from "./useSpecializationSummary";
import type { SpecializationPlanChange } from "./viewState";

/**
 * The stack designer's core (docs/specialization-atlas, note 11, §3.3,
 * §3.4, §3.8): the athlete picks one number, the region's direct moving sets a week (both sides as
 * one, the plan's own included); this designs the fewest reviewed exercises that fill the
 * athlete's unmet targets and give every movement the plan week does not train directly one set,
 * spreads the rest of the number evenly over the stack's exercises, places them on the plan's days
 * and returns the plan changes that add them, with the planned totals before and after.
 *
 * Pure and deterministic: plan week, summary inputs and settings in, a design out; nothing is
 * read from or written to storage, and nothing is applied (lane S3 applies `changes` in one batch;
 * lane S4 renders the design). Region-agnostic: every muscle, action, movement and family comes
 * from the region's data and its extras (rep profiles, `coverageOnly`); no region is named here.
 *
 * What "the needs of the muscles" means, and nothing else (§3.1): (1) the athlete's own unmet
 * targets; (2) the main actions of the region's own muscles that the plan week gives no direct
 * work of their mode. Beyond those, the rest of the number goes to the stack's exercises evenly,
 * by exercise, never by how many muscles a movement reaches. No muscle is given a set number of
 * its own anywhere in a design; the only per-muscle numbers in it are the athlete's own targets.
 *
 * The unit is the shared count (`directWorkCount`, shared/specialization/directWork.ts): after the
 * changes are applied, the planned summary's direct moving sets equal the design's total. Holds
 * are a second number, never in the total, and never cover a moving movement.
 *
 * How the page (lane S4) and the batch (lane S3) use it:
 * - `designStack(input)` → `StackDesign`. `input.total` null starts at `design.start.value`; the
 *   card's − / + and its field commit a new `total` (clamped to `design.range`, `design.clamped`
 *   says why). "What changes" reads `design.counts` (before → after, holds apart), the days read
 *   `design.days` (Plan's own minutes and newly raised prompts), the rows `design.rows`, "Not in
 *   this stack" `design.movements` (status, choices, unusable), `design.gaps` and `design.cut`, the
 *   targets `design.targets`. Every sentence is the page's to write from these values.
 * - Edits return the next input: `leaveOutMovement`, `bringBackMovement`, `setRowSets` (1 to 3 a
 *   session; the total follows), `moveRow` (with `dayChoicesFor`), `chooseExercise`.
 * - Add: `design.changes` (each with its prescription) is the batch S3's `applyPlanBatch` applies;
 *   `design.storeAfter` is the week it would write, for `previewPlannedChange` ("See each muscle").
 *   The record to keep is `stackRecordFrom(design, …)` (stackStore.ts); to design again on a week
 *   that has a stack, design on `storeWithoutEntries(store, stackEntriesState(record, store).asWritten)`.
 * - The region's rep profiles come in `input.extras` (`regions/<region>/repProfiles.ts`, export
 *   `repProfileExtras`), loaded when the card opens; null designs with each goal's defaults.
 */

// ---------------------------------------------------------------- rules (named scheduling choices, not doses)

export const STACK_RULES = {
  /** The smallest entry: one set, so the starting total reaches every movement. */
  smallestEntry: 1,
  /** Sets of one exercise in one session (the Plan's own accessory default is 3). */
  maxSetsPerSession: 3,
  /** Sessions of one exercise in a week. */
  maxSessionsPerWeek: 2,
  /** The region's exercises a day, the plan's own with direct work included: the athlete's setting. */
  exercisesPerDay: { default: 4, min: 1, max: 6 },
  /** A guard against typing errors, not a dose. */
  maxTotal: 60,
  /** The Plan's own minute estimate per set (getWorkoutDiagnostics): 1.05 min of work plus the default 90 s rest. */
  minutesPerSet: 1.05,
  restMinutes: 1.5,
  /** A seconds target is filled in holds of this length, whatever the training goal. */
  targetHoldSeconds: 30,
  /** The seeded placement search stops after this many nodes, keeping any better placement it found. */
  placementNodeLimit: 5000,
  /** Above this many distinct cover patterns the exercise choice is greedy instead of exact. */
  exactCoverPatterns: 20,
} as const;

const MINUTES_PER_PLANNED_SET = STACK_RULES.minutesPerSet + STACK_RULES.restMinutes;

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

export interface StackSettings {
  /** The plan days the stack may use, by day key; null allows every day of the week. */
  days: string[] | null;
  /** The region's exercises a day, the plan's own with direct work included (1 to 6). */
  perDay: number;
  /** Holds: on, off, or null for the default (on when a hold target exists). */
  holds: boolean | null;
}

export const defaultStackSettings: StackSettings = { days: null, perDay: STACK_RULES.exercisesPerDay.default, holds: null };

/** The athlete's edits to a design, all optional. */
export interface StackEdits {
  /** Movements left out of this design (`StackMovement.key`). */
  leftOut?: string[];
  /** The exercise the athlete chose for a movement: movement key → catalog id. */
  exercise?: Record<string, number>;
  /** Sets per session the athlete set on an exercise's rows (each 1 to 3): catalog id → sets of each session. */
  sessions?: Record<number, number[]>;
  /** The day the athlete moved a row to: row key (`<catalog id>/<session>`) → day key. */
  days?: Record<string, string>;
}

export interface StackPlanWeek {
  week: number;
  /** The week's visible days, in the plan's cycle order. */
  slots: readonly DaySlot[];
  store: WeeklyDayStore;
  goal: TrainingGoal;
  /** The athlete's gym window, in minutes. */
  gymMinutes: number;
}

export interface StackInput {
  region: SpecializationRegionData;
  /** The region's lazily loaded extras (rep profiles, `coverageOnly`); null when it has none. */
  extras: RegionExtras | null;
  catalog: readonly Exercise[];
  plan: StackPlanWeek;
  /** The athlete's targets (any region's; the region's active ones are read). */
  goals: readonly SpecializationGoal[];
  equipment: AthleteEquipmentProfile | null;
  exclusions: SpecializationExclusions;
  settings: StackSettings;
  edits?: StackEdits;
  /** The athlete's number; null starts at the starting value. */
  total: number | null;
  /** ISO time, for which targets are active. */
  now: string;
  /** The summary's zone (the page's); UTC when absent. */
  timeZone?: string;
}

/** Why an exercise or a row is in the stack. */
export type StackReason =
  | { kind: "movement"; movementKeys: string[] }
  | { kind: "target"; goalIds: string[] }
  | { kind: "more_sets" }
  | { kind: "coverage_only" }
  | { kind: "set_by_athlete" };

export interface StackRow {
  /** `<catalog id>/<session>`: the row's key in `StackEdits.days`. */
  key: string;
  catalogExerciseId: number;
  name: string;
  equipment: string;
  variantId: VariantId;
  session: number;
  dayKey: string;
  dayLabel: string;
  slotIndex: number;
  /** This session's sets. */
  sets: number;
  prescription: string;
  kind: StackMode;
  /** Done one side at a time: each planned set is done once on each side, in what the plan counts as one set. */
  oneSided: boolean;
  coverageOnly: boolean;
  setByAthlete: boolean;
  /** The movements it fills. */
  movementKeys: string[];
  /** The own target muscles it gives direct work to, in the region's order. */
  directNodeIds: NodeId[];
  /** Groups of those muscles whose work is shared (the evidence does not split it). */
  sharedNodeIds: NodeId[][];
  /** The rep profile the prescription took, or null (the goal's default for its position). */
  profile: { id: string; label: string; kind: RepRangeKind; strengthWithheld: boolean } | null;
  reasons: StackReason[];
}

export interface StackExercise {
  catalogExerciseId: number;
  name: string;
  equipment: string;
  variantId: VariantId;
  kind: StackMode;
  /** 1 is the most needed. */
  rank: number;
  weeklySets: number;
  sessions: number[];
  /** Sets the athlete's targets took (part of `weeklySets`). */
  targetSets: number;
  /** Sets the spread of the rest of the total gave it (part of `weeklySets`). */
  spreadSets: number;
  movementKeys: string[];
  goalIds: string[];
  coverageOnly: boolean;
  setByAthlete: boolean;
  oneSided: boolean;
  /** Its rows' keys. */
  rowKeys: string[];
}

export type MovementStatus =
  | "in_plan" // the plan week trains it directly already
  | "added" // the stack gives it direct work
  | "left_out" // the athlete left it out of this design
  | "below_total" // cut because the total is too low
  | "no_room" // cut because the settings leave no place for it
  | "unplaced" // kept but no allowed day could take it
  | "not_usable" // every reviewed exercise for it is outside the athlete's equipment or exclusions
  | "holds_off"; // a hold movement while Holds is off

export interface StackMovementState {
  key: string;
  mode: StackMode;
  label: string;
  nodeIds: NodeId[];
  status: MovementStatus;
  /** The stack's exercises that fill it. */
  catalogExerciseIds: number[];
  /** The reviewed exercises for it that the athlete's equipment and exclusions allow ("Change" chips). */
  choices: { catalogExerciseId: number; name: string; equipment: string }[];
  /** The reviewed exercises for it that are not offered, each with why. */
  unusable: { catalogExerciseId: number; name: string; equipment: string; why: "equipment" | "excluded_exercise" | "excluded_equipment" }[];
}

export type TargetStatus = "met_before" | "met" | "short" | "no_reviewed_exercise" | "not_usable" | "left_out" | "holds_off" | "other_region";

export interface StackTarget {
  goalId: string;
  nodeId: NodeId | null;
  actionId: ActionId | null;
  metric: GoalMetric;
  target: number;
  /** In the target's own unit (bouts or seconds), in the plan week, before and after: what the stack places is the difference. */
  before: number;
  after: number;
  /**
   * `short` after the design: the total, the caps (3 sets a session, 2 sessions a week) or the
   * settings do not reach it. A target no reviewed exercise counts toward, or one on another
   * region's muscle, is never a shortfall of the stack's.
   */
  status: TargetStatus;
}

export interface StackDay {
  dayKey: string;
  label: string;
  slotIndex: number;
  allowed: boolean;
  changed: boolean;
  rowKeys: string[];
  addedSets: number;
  exercisesBefore: number;
  exercisesAfter: number;
  /** The Plan's own estimate (getWorkoutDiagnostics), before and after. */
  minutesBefore: number;
  minutesAfter: number;
  /** About the time the second side of one-sided sets takes, which the Plan counts once. */
  secondSideMinutes: number;
  gymMinutes: number;
  overWindow: boolean;
  /** Plan's own day prompts that the stack would newly bring up, in Plan's words. */
  planPromptsAdded: string[];
}

export interface StackDesign {
  regionId: string;
  planWeek: number;
  mappingVersion: string;
  status: "ok" | "no_days";
  /** The total this design is built to, after clamping. */
  total: number;
  requestedTotal: number | null;
  /** Why the requested total was not used: below the plan's own, or above what the settings place. */
  clamped: "below_own" | "above_max" | null;
  /** The plan's own direct moving sets: the lowest total. */
  own: number;
  range: { min: number; max: number; fitsTime: number };
  start: {
    value: number;
    /** Sets the athlete's unmet moving targets take at the start. */
    targetSets: number;
    /** Movements the plan does not train directly that a usable reviewed exercise reaches. */
    movementsReachable: number;
    /** Of those, the movements the settings leave a place for. */
    movementsFit: number;
    /** Exercises the start adds. */
    exercises: number;
    /** True when the gym windows hold the start below every need. */
    cappedByTime: boolean;
  };
  settings: StackSettings & { holdsOn: boolean; holdsByTarget: boolean };
  /** The shared count, before and after the changes. */
  counts: { before: DirectWorkCount; after: DirectWorkCount };
  /** Moving sets the stack adds (the total less the plan's own) and hold sets beside them. */
  added: { movingSets: number; holdSets: number; exercises: number; days: number };
  /** Moving sets of the total that no exercise or day could take (0 when the total is within range). */
  leftUnplanned: number;
  exercises: StackExercise[];
  rows: StackRow[];
  days: StackDay[];
  movements: StackMovementState[];
  gaps: StackGap[];
  targets: StackTarget[];
  /** Kept movements that did not fit: the exercises cut by the total, with the sets that would reach them. */
  cut: {
    byTotal: { catalogExerciseIds: number[]; movementKeys: string[]; raiseBy: number };
    byRoom: { catalogExerciseIds: number[]; movementKeys: string[]; perDayToFit: number | null };
    holdsNoRoom: { catalogExerciseIds: number[]; perDayToFit: number | null };
    unplaced: string[];
  };
  /** The plan changes that add the stack, in day order (`SpecializationPlanChange`, each with its prescription). */
  changes: SpecializationPlanChange[];
  /** The plan week with the changes applied (for previews: `boutsFromPlan`, `previewPlannedChange`). */
  storeAfter: WeeklyDayStore;
  /** How the placement search ended, for review. */
  search: { coverPatterns: number; coverExact: boolean; placementCost: number; placementNodes: number; placementImproved: boolean };
}

// ---------------------------------------------------------------- the model (region data only; cached per region)

type Candidate = {
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

type Model = StackModel & { candidates: Candidate[]; candidateByCatalogId: Map<number, Candidate>; actionIndex: Map<ActionId, number> };

const modelCache = new WeakMap<SpecializationRegionData, Model>();

const slotKey = (nodeId: NodeId, actionId: ActionId) => `${nodeId}|${actionId}`;
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
  return modelOf(region);
}

function modelOf(region: SpecializationRegionData): Model {
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

  const candidates: Candidate[] = raws.map((raw) => {
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

  const model: Model = {
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

// ---------------------------------------------------------------- the plan week as the page reads it

type CachedSummary = { region: SpecializationRegionData; catalog: readonly Exercise[]; summary: SpecializationSummary };
const summaryCache = new WeakMap<WeeklyDayStore, Map<string, CachedSummary>>();

/** The side a region's page summary reads: `midline` for a midline region, else both sides as one. */
export const pageSideOf = (region: SpecializationRegionData): SummarySide => (region.region.sides.model === "midline" ? "midline" : "both");

/** The plan week's planned bouts, as the page builds them (`boutsFromPlan` with the region's planning variants). */
export function plannedBoutsFor(region: SpecializationRegionData, plan: Pick<StackPlanWeek, "week" | "slots" | "goal">, store: WeeklyDayStore): ExposureBout[] {
  return boutsFromPlan({ week: plan.week, slots: plan.slots, store, variants: planningVariantsFor(region), goal: plan.goal });
}

/**
 * The plan week's planned summary as the page reads it: side `both` (or `midline`), mode planned,
 * the plan week's interval. Cached per stored week, so a design reads the plan once per revision.
 */
export function plannedSummaryFor(input: Pick<StackInput, "region" | "catalog" | "goals" | "now" | "timeZone"> & { plan: Pick<StackPlanWeek, "week" | "slots" | "goal"> }, store: WeeklyDayStore): SpecializationSummary {
  const key = [input.region.region.id, input.region.mappingVersion.key, input.plan.week, input.plan.goal, input.plan.slots.map((slot) => slot.key).join(","), input.now.slice(0, 16), input.timeZone ?? "UTC", JSON.stringify(input.goals)].join("|");
  let byKey = summaryCache.get(store);
  const hit = byKey?.get(key);
  // A cached summary is only reused for the same region object and catalog it was built from.
  if (hit && hit.region === input.region && hit.catalog === input.catalog) return hit.summary;
  const summary = getSpecializationSummary({
    region: input.region,
    bouts: plannedBoutsFor(input.region, input.plan, store),
    interval: planWeekInterval(input.plan.week, input.timeZone ?? "UTC"),
    side: pageSideOf(input.region),
    mode: "planned",
    goals: input.goals,
    catalogMusclesFor: catalogMusclesLookup(input.catalog as Exercise[]),
    sourceRevision: "",
    planRevision: null,
    now: input.now,
  });
  if (!byKey) {
    byKey = new Map();
    summaryCache.set(store, byKey);
  }
  byKey.set(key, { region: input.region, catalog: input.catalog, summary });
  return summary;
}

/** Own-muscle slot and mode pairs (`<mode>:<node>|<action>`) the summary gives direct work. */
function coveredSlots(region: SpecializationRegionData, summary: SpecializationSummary): Set<string> {
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

// ---------------------------------------------------------------- needs

const metricCategory: Record<GoalMetric, ExposureCategory> = {
  direct_dynamic_bouts: "direct_dynamic",
  deliberate_hold_bouts: "deliberate_isometric",
  deliberate_hold_seconds: "deliberate_isometric",
};

type Need =
  | { key: string; kind: "movement"; movement: StackMovement }
  | { key: string; kind: "target"; mode: StackMode; progress: GoalProgress; units: number };

/** Whether one planned set of a candidate counts toward a target, as the calculator's goal progress counts it. */
function countsToward(candidate: Candidate, goal: SpecializationGoal): boolean {
  const wanted = metricCategory[goal.metric];
  if (goal.nodeId !== null) return candidate.credits.get(goal.nodeId) === wanted;
  return candidate.actionCredits.some((credit) => credit.actionId === goal.actionId && credit.category === wanted);
}

const fills = (candidate: Candidate, need: Need) => (need.kind === "movement" ? candidate.covers.includes(need.movement.key) : candidate.kind === need.mode && countsToward(candidate, need.progress.goal));

// ---------------------------------------------------------------- the design

type Usable = Candidate & { exercise: Exercise; inWeek: boolean; carry: boolean; coverageOnly: boolean; profileOrder: number };

/** One candidate before another, in the design's tie order: direct moving work before holds, not already in the week, not a carry, done with both sides at once before one side at a time, the lower catalog id. */
function preferKey(candidate: Usable): number[] {
  return [Number(candidate.kind === "hold"), Number(candidate.inWeek), Number(candidate.carry), Number(candidate.oneSided), candidate.catalogExerciseId];
}

function compareKeys(a: readonly number[], b: readonly number[]): number {
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const diff = (a[index] ?? -Infinity) - (b[index] ?? -Infinity);
    if (diff) return diff;
  }
  return 0;
}

const clampInt = (value: number, low: number, high: number) => Math.min(high, Math.max(low, Math.round(value)));

/** The settings as the design reads them: the days the week has, the per-day number within its bounds. */
export function normalizeStackSettings(settings: Partial<StackSettings> | null | undefined, slots: readonly DaySlot[]): StackSettings {
  const keys = new Set(slots.map((slot) => slot.key));
  const days = Array.isArray(settings?.days) ? slots.map((slot) => slot.key).filter((key) => settings!.days!.includes(key) && keys.has(key)) : null;
  const perDay = typeof settings?.perDay === "number" && Number.isFinite(settings.perDay) ? clampInt(settings.perDay, STACK_RULES.exercisesPerDay.min, STACK_RULES.exercisesPerDay.max) : STACK_RULES.exercisesPerDay.default;
  const holds = settings?.holds === true || settings?.holds === false ? settings.holds : null;
  return { days, perDay, holds };
}

const sessionsOf = (sets: number) => Math.ceil(sets / STACK_RULES.maxSetsPerSession);
function splitSessions(sets: number): number[] {
  const parts = Math.max(1, sessionsOf(sets));
  return Array.from({ length: parts }, (_, part) => Math.floor(sets / parts) + (part < sets % parts ? 1 : 0));
}

export function designStack(input: StackInput): StackDesign {
  const { region, plan } = input;
  const model = modelOf(region);
  const edits: Required<StackEdits> = { leftOut: input.edits?.leftOut ?? [], exercise: input.edits?.exercise ?? {}, sessions: input.edits?.sessions ?? {}, days: input.edits?.days ?? {} };
  const settings = normalizeStackSettings(input.settings, plan.slots);
  const before = plannedSummaryFor(input, plan.store);
  const beforeCount = directWorkCount(region, before);
  const own = beforeCount.moving;
  const covered = coveredSlots(region, before);
  const strength = plan.goal === "Max strength";
  const catalogById = new Map(input.catalog.map((exercise) => [exercise.id, exercise] as const));
  const profileOrder = new Map((input.extras?.repProfiles ?? []).map((profile, position) => [profile.id, position] as const));

  // ---- targets of the region in the plan week, as the page reads them
  const ownSet = new Set(model.ownTargets);
  const regionGoals = before.goals.filter((progress) => progress.goal.regionId === region.region.id);
  // Holds turn on by themselves (and say so) when the athlete has a hold target a reviewed hold can count toward.
  const holdTargets = regionGoals.filter((progress) => progress.goal.metric !== "direct_dynamic_bouts" && (progress.goal.nodeId === null || ownSet.has(progress.goal.nodeId)) && model.candidates.some((candidate) => candidate.kind === "hold" && countsToward(candidate, progress.goal)));
  const holdsOn = settings.holds ?? holdTargets.length > 0;

  // ---- days
  const allowedKeys = new Set(settings.days ?? plan.slots.map((slot) => slot.key));
  const days = plan.slots.map((slot) => {
    const record = loadDay(plan.store, slot.key);
    const diagnostics = getWorkoutDiagnostics(record.workout, record.prescriptions, record.settings, plan.goal, plan.gymMinutes);
    const ids = new Set(record.workout.map((entry) => catalogIdOf(entry)));
    const directEntries = record.workout.filter((entry) => model.candidateByCatalogId.has(catalogIdOf(entry)));
    const directMuscles = new Set(directEntries.flatMap((entry) => {
      const candidate = model.candidateByCatalogId.get(catalogIdOf(entry))!;
      return [...candidate.movingNodes, ...candidate.holdNodes];
    }));
    return { slot, record, diagnostics, ids, directCount: directEntries.length, directMuscles, allowed: allowedKeys.has(slot.key), room: plan.gymMinutes - diagnostics.estimatedMinutes };
  });
  const allowedDays = days.filter((day) => day.allowed);
  const capacity = allowedDays.reduce((total, day) => total + Math.max(0, settings.perDay - day.directCount), 0);
  const capacityAt = (perDay: number) => allowedDays.reduce((total, day) => total + Math.max(0, perDay - day.directCount), 0);
  const plannedIds = new Set(days.flatMap((day) => Array.from(day.ids)));

  // ---- usable candidates
  const leftOut = new Set(edits.leftOut);
  const excludedIds = new Set(input.exclusions.catalogExerciseIds);
  const excludedEquipment = new Set(input.exclusions.equipment);
  const unusableWhy = (candidate: Candidate, exercise: Exercise | undefined): "equipment" | "excluded_exercise" | "excluded_equipment" | "missing" | null => {
    if (!exercise) return "missing";
    if (excludedIds.has(exercise.id)) return "excluded_exercise";
    if (excludedEquipment.has(exercise.equipment)) return "excluded_equipment";
    if (input.equipment && !equipmentMatchesProfile(exercise.equipment, input.equipment.availableEquipment)) return "equipment";
    return null;
  };
  const usable: Usable[] = [];
  const unusable = new Map<number, "equipment" | "excluded_exercise" | "excluded_equipment">();
  for (const candidate of model.candidates) {
    const exercise = catalogById.get(candidate.catalogExerciseId);
    const why = unusableWhy(candidate, exercise);
    if (why === "missing") continue;
    if (why) { unusable.set(candidate.catalogExerciseId, why); continue; }
    if (candidate.kind === "hold" && !holdsOn) continue;
    // Every row of a left-out movement leaves the design: an exercise that covers only left-out movements is not chosen for anything.
    if (candidate.covers.every((key) => leftOut.has(key))) continue;
    const profile = repProfileOf(input.extras, candidate.variant.id);
    usable.push({
      ...candidate,
      exercise: exercise!,
      inWeek: plannedIds.has(candidate.catalogExerciseId),
      carry: exercise!.movement === "Loaded carry",
      coverageOnly: profile?.assignment.coverageOnly ?? false,
      profileOrder: profile ? profileOrder.get(profile.profile.id) ?? Number.MAX_SAFE_INTEGER - 1 : Number.MAX_SAFE_INTEGER - 1,
    });
  }
  const usableByCatalogId = new Map(usable.map((candidate) => [candidate.catalogExerciseId, candidate] as const));

  // ---- needs: unmet targets first, then every movement of its mode the plan does not train directly
  const needs: Need[] = [];
  const targetLines: StackTarget[] = [];
  for (const progress of regionGoals) {
    const goal = progress.goal;
    const mode: StackMode = goal.metric === "direct_dynamic_bouts" ? "moving" : "hold";
    const base = { goalId: goal.id, nodeId: goal.nodeId, actionId: goal.actionId, metric: goal.metric, target: goal.target, before: progress.value, after: progress.value };
    if (goal.nodeId !== null && !ownSet.has(goal.nodeId)) { targetLines.push({ ...base, status: "other_region" }); continue; }
    if (progress.fraction >= 1) { targetLines.push({ ...base, status: "met_before" }); continue; }
    const reviewed = model.candidates.some((candidate) => candidate.kind === mode && countsToward(candidate, goal));
    if (!reviewed) { targetLines.push({ ...base, status: "no_reviewed_exercise" }); continue; }
    if (mode === "hold" && !holdsOn) { targetLines.push({ ...base, status: "holds_off" }); continue; }
    const shortfall = goal.target - progress.value;
    const units = goal.metric === "deliberate_hold_seconds" ? Math.ceil(shortfall / STACK_RULES.targetHoldSeconds) : Math.ceil(shortfall);
    const need: Need = { key: `target:${goal.id}`, kind: "target", mode, progress, units };
    if (!usable.some((candidate) => fills(candidate, need))) {
      const onlyLeftOut = model.candidates.some((candidate) => fills(candidate, need) && candidate.covers.every((key) => leftOut.has(key)) && !unusable.has(candidate.catalogExerciseId));
      targetLines.push({ ...base, status: onlyLeftOut ? "left_out" : "not_usable" });
      continue;
    }
    needs.push(need);
    targetLines.push({ ...base, status: "short" });
  }
  const movementStatus = new Map<string, MovementStatus>();
  for (const movement of model.movements) {
    const trained = movement.slots.some((slot) => covered.has(`${movement.mode}:${slotKey(slot.nodeId, slot.actionId)}`));
    if (trained) { movementStatus.set(movement.key, "in_plan"); continue; }
    if (movement.mode === "hold" && !holdsOn) { movementStatus.set(movement.key, "holds_off"); continue; }
    if (leftOut.has(movement.key)) { movementStatus.set(movement.key, "left_out"); continue; }
    if (!usable.some((candidate) => candidate.covers.includes(movement.key))) { movementStatus.set(movement.key, "not_usable"); continue; }
    needs.push({ key: `movement:${movement.key}`, kind: "movement", movement });
  }

  // ---- the fewest exercises that meet every need, exactly over distinct cover patterns
  const { chosen, patterns, exact } = chooseCover(usable, needs, edits.exercise, usableByCatalogId);

  // ---- ranked by need, per kind
  const reachedMoving = new Set(beforeCount.musclesWithMovingWork);
  const reachedHold = new Set<NodeId>();
  for (const key of Array.from(covered)) if (key.startsWith("hold:")) reachedHold.add(key.slice(5).split("|")[0]);
  const movingRanked = rankByNeed(chosen.filter((candidate) => candidate.kind === "moving"), needs, reachedMoving, "moving", model.actionIndex);
  const holdRanked = rankByNeed(chosen.filter((candidate) => candidate.kind === "hold"), needs, reachedHold, "hold", model.actionIndex);
  const rankOf = new Map([...movingRanked, ...holdRanked].map((candidate, position) => [candidate.catalogExerciseId, position] as const));

  // ---- allocation
  const weekCapOf = (candidate: Usable) => STACK_RULES.maxSetsPerSession * Math.min(STACK_RULES.maxSessionsPerWeek, allowedDays.filter((day) => !day.ids.has(candidate.catalogExerciseId)).length);
  const fixedOf = (candidate: Usable): number[] | null => {
    const sessions = edits.sessions[candidate.catalogExerciseId];
    if (!Array.isArray(sessions) || !sessions.length) return null;
    const clean = sessions.slice(0, STACK_RULES.maxSessionsPerWeek).map((sets) => clampInt(sets, STACK_RULES.smallestEntry, STACK_RULES.maxSetsPerSession));
    return clean;
  };
  const movingTargets = needs.filter((need): need is Extract<Need, { kind: "target" }> => need.kind === "target" && need.mode === "moving");
  const holdTargetNeeds = needs.filter((need): need is Extract<Need, { kind: "target" }> => need.kind === "target" && need.mode === "hold");
  const goalsByNode = new Map<NodeId, SpecializationGoal[]>();
  for (const progress of regionGoals) if (progress.goal.nodeId !== null) goalsByNode.set(progress.goal.nodeId, [...(goalsByNode.get(progress.goal.nodeId) ?? []), progress.goal]);

  type Allocation = { kept: Usable[]; sets: Map<number, number>; fromTargets: Map<number, number>; fromSpread: Map<number, number>; sessionsUsed: number; left: number; cutTotal: Usable[]; cutRoom: Usable[]; remaining: Map<string, number> };
  const allocate = (ranked: Usable[], targetNeeds: Extract<Need, { kind: "target" }>[], budgetIn: number, room: number, spread: boolean): Allocation => {
    let budget = budgetIn;
    const kept: Usable[] = [];
    const cutTotal: Usable[] = [];
    const cutRoom: Usable[] = [];
    const sets = new Map<number, number>();
    const fromTargets = new Map<number, number>();
    const fromSpread = new Map<number, number>();
    let sessionsUsed = 0;
    for (const candidate of ranked) {
      const fixed = fixedOf(candidate);
      const floorSets = fixed ? fixed.reduce((total, value) => total + value, 0) : STACK_RULES.smallestEntry;
      const floorSessions = fixed ? fixed.length : 1;
      // No place for it at these settings comes first: a total cannot make room. Then the total, which keeps the most needed.
      if (sessionsUsed + floorSessions > room || weekCapOf(candidate) < floorSessions) { cutRoom.push(candidate); continue; }
      if (cutTotal.length || floorSets > budget) { cutTotal.push(candidate); continue; }
      kept.push(candidate);
      sets.set(candidate.catalogExerciseId, floorSets);
      budget -= floorSets;
      sessionsUsed += floorSessions;
    }
    const isFixed = (candidate: Usable) => fixedOf(candidate) !== null;
    const canAdd = (candidate: Usable) => {
      if (isFixed(candidate)) return false;
      const current = sets.get(candidate.catalogExerciseId)!;
      if (current + 1 > weekCapOf(candidate)) return false;
      return sessionsOf(current + 1) === sessionsOf(current) || sessionsUsed < room;
    };
    const add = (candidate: Usable, into: Map<number, number>) => {
      const current = sets.get(candidate.catalogExerciseId)!;
      if (sessionsOf(current + 1) > sessionsOf(current)) sessionsUsed += 1;
      sets.set(candidate.catalogExerciseId, current + 1);
      into.set(candidate.catalogExerciseId, (into.get(candidate.catalogExerciseId) ?? 0) + 1);
      budget -= 1;
    };
    // Unmet targets first, in their own units: each set to the kept exercise that fills the most
    // open targets, then one that needs no new session, then the most needed.
    const remaining = new Map(targetNeeds.map((need) => [need.key, need.units] as const));
    for (const candidate of kept) for (const need of targetNeeds) if (fills(candidate, need)) remaining.set(need.key, remaining.get(need.key)! - sets.get(candidate.catalogExerciseId)!);
    for (let guard = 0; budget > 0 && guard < 1000; guard += 1) {
      const open = targetNeeds.filter((need) => remaining.get(need.key)! > 0);
      if (!open.length) break;
      const scored = kept.filter(canAdd).map((candidate) => ({ candidate, count: open.filter((need) => fills(candidate, need)).length })).filter((item) => item.count > 0);
      if (!scored.length) break;
      const newSession = (candidate: Usable) => Number(sessionsOf(sets.get(candidate.catalogExerciseId)! + 1) > sessionsOf(sets.get(candidate.catalogExerciseId)!));
      scored.sort((a, b) => b.count - a.count || newSession(a.candidate) - newSession(b.candidate) || rankOf.get(a.candidate.catalogExerciseId)! - rankOf.get(b.candidate.catalogExerciseId)!);
      const pick = scored[0].candidate;
      add(pick, fromTargets);
      for (const need of open) if (fills(pick, need)) remaining.set(need.key, remaining.get(need.key)! - 1);
    }
    // Then the rest of the total, evenly by exercise: each set to the kept exercise with the fewest
    // sets, ties to the more needed. A coverage-only exercise stays at its set; an exercise whose
    // every direct muscle has met the athlete's target of that kind takes no further set.
    const metEveryTarget = (candidate: Usable) => candidate.movingNodes.length > 0 && candidate.movingNodes.every((nodeId) => {
      const kind = candidate.credits.get(nodeId);
      const goals = (goalsByNode.get(nodeId) ?? []).filter((goal) => metricCategory[goal.metric] === kind);
      if (!goals.length) return false;
      return goals.every((goal) => {
        const need = targetNeeds.find((item) => item.progress.goal.id === goal.id);
        if (need) return remaining.get(need.key)! <= 0;
        return regionGoals.some((progress) => progress.goal.id === goal.id && progress.fraction >= 1);
      });
    });
    if (spread) {
      for (let guard = 0; budget > 0 && guard < 10_000; guard += 1) {
        const open = kept.filter((candidate) => canAdd(candidate) && !candidate.coverageOnly && !metEveryTarget(candidate));
        if (!open.length) break;
        open.sort((a, b) => sets.get(a.catalogExerciseId)! - sets.get(b.catalogExerciseId)! || rankOf.get(a.catalogExerciseId)! - rankOf.get(b.catalogExerciseId)!);
        add(open[0], fromSpread);
      }
    }
    return { kept, sets, fromTargets, fromSpread, sessionsUsed, left: budget, cutTotal, cutRoom, remaining };
  };

  const sum = (values: Iterable<number>) => Array.from(values).reduce((total, value) => total + value, 0);
  const unbounded = STACK_RULES.maxTotal * 100;
  const needAll = allocate(movingRanked, movingTargets, unbounded, capacity, false);
  const needed = sum(needAll.sets.values());
  const holdPreview = allocate(holdRanked, holdTargetNeeds, unbounded, capacity - needAll.sessionsUsed, false);
  const holdMinutes = sum(holdPreview.sets.values()) * MINUTES_PER_PLANNED_SET;
  const roomMinutes = sum(allowedDays.map((day) => Math.max(0, day.room)));
  const fitsTime = own + Math.max(0, Math.floor((roomMinutes - holdMinutes) / MINUTES_PER_PLANNED_SET));
  const most = allocate(movingRanked, movingTargets, unbounded, capacity, true);
  const max = Math.min(STACK_RULES.maxTotal, own + sum(most.sets.values()));
  const startValue = Math.min(max, Math.max(own, Math.min(own + needed, fitsTime)));
  const requested = input.total;
  const total = requested === null || !Number.isFinite(requested) ? startValue : clampInt(requested, own, Math.max(own, max));
  const clamped: StackDesign["clamped"] = requested === null || !Number.isFinite(requested) ? null : requested < own ? "below_own" : requested > max ? "above_max" : null;

  const moving = allocate(movingRanked, movingTargets, total - own, capacity, true);
  const holds = allocate(holdRanked, holdTargetNeeds, unbounded, capacity - moving.sessionsUsed, false);

  // ---- days: sessions of at most 3, placed by greedy, local moves and swaps, then a seeded search
  const keptAll = [...moving.kept, ...holds.kept];
  const setsOf = (candidate: Usable) => (candidate.kind === "moving" ? moving.sets : holds.sets).get(candidate.catalogExerciseId)!;
  type Chunk = { candidate: Usable; sets: number; session: number; pinned: number | null };
  const chunks: Chunk[] = [];
  const dayIndexOf = new Map(days.map((day, position) => [day.slot.key, position] as const));
  for (const candidate of keptAll) {
    const sessions = fixedOf(candidate) ?? splitSessions(setsOf(candidate));
    sessions.forEach((sets, session) => {
      const pinKey = edits.days[`${candidate.catalogExerciseId}/${session}`];
      const pinned = pinKey !== undefined && dayIndexOf.has(pinKey) ? dayIndexOf.get(pinKey)! : null;
      chunks.push({ candidate, sets, session, pinned });
    });
  }
  const placement = placeChunks(chunks, days, settings.perDay);

  // ---- rows, changes and the plan after
  const servesSeconds = (candidate: Usable) => holdTargetNeeds.some((need) => need.progress.goal.metric === "deliberate_hold_seconds" && fills(candidate, need));
  type Placed = { chunk: Chunk; day: (typeof days)[number] };
  const placed: Placed[] = [];
  const unplaced: Chunk[] = [];
  chunks.forEach((chunk, position) => {
    const at = placement.assign[position];
    if (at < 0) unplaced.push(chunk);
    else placed.push({ chunk, day: days[at] });
  });
  const kindOrder = (candidate: Usable) => (candidate.kind === "hold" ? 1 : 0);
  placed.sort((a, b) => dayIndexOf.get(a.day.slot.key)! - dayIndexOf.get(b.day.slot.key)! || kindOrder(a.chunk.candidate) - kindOrder(b.chunk.candidate) || a.chunk.candidate.profileOrder - b.chunk.candidate.profileOrder || rankOf.get(a.chunk.candidate.catalogExerciseId)! - rankOf.get(b.chunk.candidate.catalogExerciseId)! || a.chunk.session - b.chunk.session);

  const goalIdsOf = (candidate: Usable) => needs.filter((need): need is Extract<Need, { kind: "target" }> => need.kind === "target" && fills(candidate, need)).map((need) => need.progress.goal.id);
  const movementKeysOf = (candidate: Usable) => needs.filter((need): need is Extract<Need, { kind: "movement" }> => need.kind === "movement" && fills(candidate, need)).map((need) => need.movement.key);

  let storeAfter = plan.store;
  const changes: SpecializationPlanChange[] = [];
  const rows: StackRow[] = [];
  for (const { chunk, day } of placed) {
    const { candidate } = chunk;
    const current = loadDay(storeAfter, day.slot.key);
    const position = current.workout.length;
    const resolved = repTargetFor(input.extras, candidate.variant.id, { strength, holdSeconds: candidate.kind === "hold" && servesSeconds(candidate) ? STACK_RULES.targetHoldSeconds : null });
    const target = resolved?.target ?? (candidate.kind === "hold" || candidate.variant.measure === "seconds"
      ? (servesSeconds(candidate) ? `${STACK_RULES.targetHoldSeconds} sec` : holdDefaultTarget)
      : goalDefaultTarget(plan.goal, position));
    const prescription = prescriptionText(chunk.sets, target);
    const change: SpecializationPlanChange = { week: plan.week, slotIndex: day.slot.index, dayKey: day.slot.key, catalogExerciseId: candidate.catalogExerciseId, prescription };
    const outcome = applyPlanChangeToRecord(current, change, candidate.exercise);
    if (!outcome.ok) { unplaced.push(chunk); continue; }
    storeAfter = commitDay(storeAfter, day.slot.key, outcome.record);
    changes.push(change);
    const fixed = fixedOf(candidate) !== null;
    const reasons: StackReason[] = [];
    const movementKeys = movementKeysOf(candidate);
    const goalIds = goalIdsOf(candidate);
    if (movementKeys.length) reasons.push({ kind: "movement", movementKeys });
    if (goalIds.length) reasons.push({ kind: "target", goalIds });
    if (((candidate.kind === "moving" ? moving : holds).fromSpread.get(candidate.catalogExerciseId) ?? 0) > 0) reasons.push({ kind: "more_sets" });
    if (candidate.coverageOnly) reasons.push({ kind: "coverage_only" });
    if (fixed) reasons.push({ kind: "set_by_athlete" });
    rows.push({
      key: `${candidate.catalogExerciseId}/${chunk.session}`,
      catalogExerciseId: candidate.catalogExerciseId,
      name: candidate.exercise.name,
      equipment: candidate.exercise.equipment,
      variantId: candidate.variant.id,
      session: chunk.session,
      dayKey: day.slot.key,
      dayLabel: day.slot.label,
      slotIndex: day.slot.index,
      sets: chunk.sets,
      prescription,
      kind: candidate.kind,
      oneSided: candidate.oneSided,
      coverageOnly: candidate.coverageOnly,
      setByAthlete: fixed,
      movementKeys,
      directNodeIds: candidate.kind === "moving" ? candidate.movingNodes : candidate.holdNodes,
      sharedNodeIds: candidate.sharedGroups,
      profile: resolved ? { id: resolved.resolved.profile.id, label: resolved.resolved.profile.label, kind: resolved.resolved.kind, strengthWithheld: resolved.resolved.strengthWithheld } : null,
      reasons,
    });
  }

  const after = plannedSummaryFor(input, storeAfter);
  const afterCount = directWorkCount(region, after);
  const afterGoals = new Map(after.goals.map((progress) => [progress.goal.id, progress] as const));
  const targets: StackTarget[] = targetLines.map((line) => {
    const afterValue = afterGoals.get(line.goalId)?.value ?? line.before;
    if (line.status !== "short") return { ...line, after: afterValue };
    return { ...line, after: afterValue, status: afterValue >= line.target ? "met" : "short" };
  });

  // ---- movement states
  const placedIds = new Set(rows.map((row) => row.catalogExerciseId));
  const exerciseOfMovement = (key: string) => keptAll.filter((candidate) => candidate.covers.includes(key) && placedIds.has(candidate.catalogExerciseId)).map((candidate) => candidate.catalogExerciseId);
  for (const need of needs) {
    if (need.kind !== "movement") continue;
    const key = need.movement.key;
    if (exerciseOfMovement(key).length) movementStatus.set(key, "added");
    else if (moving.cutTotal.some((candidate) => candidate.covers.includes(key))) movementStatus.set(key, "below_total");
    else if ([...moving.cutRoom, ...holds.cutRoom, ...holds.cutTotal].some((candidate) => candidate.covers.includes(key))) movementStatus.set(key, "no_room");
    else movementStatus.set(key, "unplaced");
  }
  const movements: StackMovementState[] = model.movements.map((movement) => ({
    key: movement.key,
    mode: movement.mode,
    label: movement.label,
    nodeIds: movement.nodeIds,
    status: movementStatus.get(movement.key) ?? "not_usable",
    catalogExerciseIds: exerciseOfMovement(movement.key),
    choices: model.candidates
      .filter((candidate) => candidate.covers.includes(movement.key) && usableByCatalogId.has(candidate.catalogExerciseId))
      .map((candidate) => ({ catalogExerciseId: candidate.catalogExerciseId, name: usableByCatalogId.get(candidate.catalogExerciseId)!.exercise.name, equipment: usableByCatalogId.get(candidate.catalogExerciseId)!.exercise.equipment })),
    unusable: model.candidates
      .filter((candidate) => candidate.covers.includes(movement.key) && unusable.has(candidate.catalogExerciseId))
      .map((candidate) => {
        const exercise = catalogById.get(candidate.catalogExerciseId)!;
        return { catalogExerciseId: candidate.catalogExerciseId, name: exercise.name, equipment: exercise.equipment, why: unusable.get(candidate.catalogExerciseId)! };
      }),
  }));

  // ---- exercises and days
  const rowsOf = (id: number) => rows.filter((row) => row.catalogExerciseId === id);
  const exercises: StackExercise[] = keptAll.filter((candidate) => placedIds.has(candidate.catalogExerciseId)).map((candidate) => {
    const ownRows = rowsOf(candidate.catalogExerciseId);
    const allocation = candidate.kind === "moving" ? moving : holds;
    return {
      catalogExerciseId: candidate.catalogExerciseId,
      name: candidate.exercise.name,
      equipment: candidate.exercise.equipment,
      variantId: candidate.variant.id,
      kind: candidate.kind,
      rank: rankOf.get(candidate.catalogExerciseId)! + 1,
      weeklySets: sum(ownRows.map((row) => row.sets)),
      sessions: ownRows.map((row) => row.sets),
      targetSets: allocation.fromTargets.get(candidate.catalogExerciseId) ?? 0,
      spreadSets: allocation.fromSpread.get(candidate.catalogExerciseId) ?? 0,
      movementKeys: movementKeysOf(candidate),
      goalIds: goalIdsOf(candidate),
      coverageOnly: candidate.coverageOnly,
      setByAthlete: fixedOf(candidate) !== null,
      oneSided: candidate.oneSided,
      rowKeys: ownRows.map((row) => row.key),
    };
  }).sort((a, b) => a.rank - b.rank);

  const dayRows: StackDay[] = days.map((day) => {
    const here = rows.filter((row) => row.dayKey === day.slot.key);
    const record = loadDay(storeAfter, day.slot.key);
    const afterDiagnostics = getWorkoutDiagnostics(record.workout, record.prescriptions, record.settings, plan.goal, plan.gymMinutes);
    const secondSide = sum(here.filter((row) => row.oneSided).map((row) => row.sets)) * STACK_RULES.minutesPerSet;
    return {
      dayKey: day.slot.key,
      label: day.slot.label,
      slotIndex: day.slot.index,
      allowed: day.allowed,
      changed: here.length > 0,
      rowKeys: here.map((row) => row.key),
      addedSets: sum(here.map((row) => row.sets)),
      exercisesBefore: day.record.workout.length,
      exercisesAfter: record.workout.length,
      minutesBefore: day.diagnostics.estimatedMinutes,
      minutesAfter: afterDiagnostics.estimatedMinutes,
      secondSideMinutes: Math.round(secondSide),
      gymMinutes: plan.gymMinutes,
      overWindow: afterDiagnostics.estimatedMinutes > plan.gymMinutes,
      planPromptsAdded: here.length ? afterDiagnostics.prompts.filter((prompt) => !day.diagnostics.prompts.includes(prompt)) : [],
    };
  });

  // ---- what did not fit, and what the settings would need
  const perDayToFit = (sessionsNeeded: number) => {
    for (let perDay = settings.perDay + 1; perDay <= STACK_RULES.exercisesPerDay.max; perDay += 1) if (capacityAt(perDay) >= sessionsNeeded) return perDay;
    return null;
  };
  const coveredMovementKeys = (list: Usable[]) => Array.from(new Set(list.flatMap((candidate) => movementKeysOf(candidate))));
  const holdSessionsWanted = holds.sessionsUsed + holds.cutRoom.length + holds.cutTotal.length;
  const movingRows = rows.filter((row) => row.kind === "moving");
  const holdRows = rows.filter((row) => row.kind === "hold");

  return {
    regionId: region.region.id,
    planWeek: plan.week,
    mappingVersion: region.mappingVersion.key,
    status: plan.slots.length ? "ok" : "no_days",
    total,
    requestedTotal: requested,
    clamped,
    own,
    range: { min: own, max: Math.max(own, max), fitsTime },
    start: {
      value: startValue,
      targetSets: sum(needAll.fromTargets.values()),
      movementsReachable: needs.filter((need) => need.kind === "movement" && need.movement.mode === "moving").length,
      movementsFit: needs.filter((need) => need.kind === "movement" && need.movement.mode === "moving" && needAll.kept.some((candidate) => fills(candidate, need))).length,
      exercises: needAll.kept.length,
      cappedByTime: own + needed > fitsTime,
    },
    settings: { ...settings, holdsOn, holdsByTarget: settings.holds === null && holdTargets.length > 0 },
    counts: { before: beforeCount, after: afterCount },
    added: { movingSets: sum(movingRows.map((row) => row.sets)), holdSets: sum(holdRows.map((row) => row.sets)), exercises: exercises.length, days: dayRows.filter((day) => day.changed).length },
    leftUnplanned: Math.max(0, total - own - sum(movingRows.map((row) => row.sets))),
    exercises,
    rows,
    days: dayRows,
    movements,
    gaps: model.gaps,
    targets,
    cut: {
      byTotal: { catalogExerciseIds: moving.cutTotal.map((candidate) => candidate.catalogExerciseId), movementKeys: coveredMovementKeys(moving.cutTotal), raiseBy: sum(moving.cutTotal.map((candidate) => sum(fixedOf(candidate) ?? [STACK_RULES.smallestEntry]))) },
      byRoom: { catalogExerciseIds: moving.cutRoom.map((candidate) => candidate.catalogExerciseId), movementKeys: coveredMovementKeys(moving.cutRoom), perDayToFit: moving.cutRoom.length ? perDayToFit(moving.sessionsUsed + moving.cutRoom.length) : null },
      holdsNoRoom: { catalogExerciseIds: [...holds.cutRoom, ...holds.cutTotal].map((candidate) => candidate.catalogExerciseId), perDayToFit: holds.cutRoom.length ? perDayToFit(moving.sessionsUsed + holdSessionsWanted) : null },
      unplaced: unplaced.map((chunk) => `${chunk.candidate.catalogExerciseId}/${chunk.session}`),
    },
    changes,
    storeAfter,
    search: { coverPatterns: patterns, coverExact: exact, placementCost: placement.cost, placementNodes: placement.nodes, placementImproved: placement.improved },
  };
}

/** The rep target of the goal's default for an entry at this position ("8–12" from "3 × 8–12"). */
function goalDefaultTarget(goal: TrainingGoal, position: number): string {
  const text = getGoalPrescription(goal, position);
  const at = text.indexOf("×");
  return at < 0 ? text : text.slice(at + 1).trim();
}

// ---------------------------------------------------------------- exercise choice: the fewest that meet every need

function chooseCover(usable: Usable[], needs: Need[], chosenByAthlete: Record<string, number>, byCatalogId: Map<number, Usable>): { chosen: Usable[]; patterns: number; exact: boolean } {
  if (!needs.length) return { chosen: [], patterns: 0, exact: true };
  const needIndex = new Map(needs.map((need, position) => [need.key, position] as const));
  const words = Math.ceil(needs.length / 30);
  const empty = () => new Array<number>(words).fill(0);
  const setBit = (bits: number[], position: number) => { bits[Math.floor(position / 30)] |= 1 << (position % 30); };
  const bitsOf = (candidate: Usable) => {
    const bits = empty();
    needs.forEach((need, position) => { if (fills(candidate, need)) setBit(bits, position); });
    return bits;
  };
  const isZero = (bits: number[]) => bits.every((word) => word === 0);
  const or = (a: number[], b: number[]) => a.map((word, position) => word | b[position]);
  const andNot = (a: number[], b: number[]) => a.map((word, position) => word & ~b[position]);
  const same = (a: number[], b: number[]) => a.every((word, position) => word === b[position]);
  const all = empty();
  needs.forEach((_, position) => setBit(all, position));

  const picked: Usable[] = [];
  let have = empty();
  // The athlete's own choice of exercise for a movement comes first.
  for (const [movementKey, catalogExerciseId] of Object.entries(chosenByAthlete).sort(([a], [b]) => a.localeCompare(b))) {
    const candidate = byCatalogId.get(catalogExerciseId);
    if (!candidate || !candidate.covers.includes(movementKey) || !needIndex.has(`movement:${movementKey}`) || picked.includes(candidate)) continue;
    picked.push(candidate);
    have = or(have, bitsOf(candidate));
  }
  // One candidate per distinct pattern: the preferred one.
  const patternsOf = (list: Usable[], mask: number[]) => {
    const byPattern = new Map<string, { bits: number[]; candidate: Usable }>();
    for (const candidate of list) {
      if (picked.includes(candidate)) continue;
      const bits = andNot(bitsOf(candidate), mask);
      if (isZero(bits)) continue;
      const key = bits.join(",");
      const best = byPattern.get(key);
      if (!best || compareKeys(preferKey(candidate), preferKey(best.candidate)) < 0) byPattern.set(key, { bits, candidate });
    }
    return Array.from(byPattern.values()).sort((a, b) => compareKeys(preferKey(a.candidate), preferKey(b.candidate)));
  };
  // Forced: a need only one pattern can meet.
  for (let changed = true; changed;) {
    changed = false;
    const open = andNot(all, have);
    if (isZero(open)) break;
    const patterns = patternsOf(usable, have);
    for (let position = 0; position < needs.length; position += 1) {
      if (!(open[Math.floor(position / 30)] & (1 << (position % 30)))) continue;
      const meeting = patterns.filter((pattern) => pattern.bits[Math.floor(position / 30)] & (1 << (position % 30)));
      if (meeting.length !== 1) continue;
      picked.push(meeting[0].candidate);
      have = or(have, meeting[0].bits);
      changed = true;
      break;
    }
  }
  const open = andNot(all, have);
  const patterns = patternsOf(usable, have);
  if (isZero(open)) return { chosen: picked, patterns: patterns.length, exact: true };
  const reachable = patterns.reduce((bits, pattern) => or(bits, pattern.bits), empty());
  const target = reachable.map((word, position) => word & open[position]);
  const tieKey = (list: Usable[]) => {
    const keys = list.map(preferKey);
    const totals = [0, 1, 2, 3].map((field) => keys.reduce((total, key) => total + key[field], 0));
    return [...totals, ...list.map((candidate) => candidate.catalogExerciseId).sort((a, b) => a - b)];
  };
  if (patterns.length <= STACK_RULES.exactCoverPatterns) {
    // Exact: the smallest number of patterns that meet every open need, ties by the design's order.
    const and = (a: number[], b: number[]) => a.map((word, position) => word & b[position]);
    // What the patterns from each position on can still meet, to stop a branch that cannot finish.
    const suffix: number[][] = new Array(patterns.length + 1);
    suffix[patterns.length] = empty();
    for (let position = patterns.length - 1; position >= 0; position -= 1) suffix[position] = or(suffix[position + 1], patterns[position].bits);
    for (let size = 1; size <= patterns.length; size += 1) {
      let best: Usable[] | null = null;
      const combo: number[] = [];
      const walk = (from: number, bits: number[]) => {
        if (combo.length === size) {
          if (!same(and(bits, target), target)) return;
          const list = combo.map((position) => patterns[position].candidate);
          if (!best || compareKeys(tieKey(list), tieKey(best)) < 0) best = list;
          return;
        }
        if (!same(and(or(bits, suffix[from]), target), target)) return;
        for (let position = from; position <= patterns.length - (size - combo.length); position += 1) {
          combo.push(position);
          walk(position + 1, or(bits, patterns[position].bits));
          combo.pop();
        }
      };
      walk(0, empty());
      if (best) return { chosen: [...picked, ...(best as Usable[])], patterns: patterns.length, exact: true };
    }
    return { chosen: picked, patterns: patterns.length, exact: true };
  }
  // Greedy above the limit: the pattern meeting the most open needs, ties by preference.
  let remaining = target;
  const chosen = [...picked];
  while (!isZero(remaining)) {
    const scored = patterns.map((pattern) => ({ pattern, count: pattern.bits.reduce((total, word, position) => total + popcount(word & remaining[position]), 0) })).filter((item) => item.count > 0);
    if (!scored.length) break;
    scored.sort((a, b) => b.count - a.count || compareKeys(preferKey(a.pattern.candidate), preferKey(b.pattern.candidate)));
    chosen.push(scored[0].pattern.candidate);
    remaining = andNot(remaining, scored[0].pattern.bits);
  }
  return { chosen, patterns: patterns.length, exact: false };
}

function popcount(word: number): number {
  let count = 0;
  for (let value = word >>> 0; value; value &= value - 1) count += 1;
  return count;
}

/**
 * The chosen exercises, most needed first, re-read after each pick: one that counts toward an open
 * target first; then the one giving direct work to the most muscles still without any of its kind;
 * then the region's action order of the open movements it fills; then the design's tie order.
 */
function rankByNeed(chosen: Usable[], needs: Need[], reachedIn: Set<NodeId>, kind: StackMode, actionIndex: Map<ActionId, number>): Usable[] {
  const reached = new Set(reachedIn);
  const closed = new Set<string>();
  const pool = [...chosen];
  const out: Usable[] = [];
  while (pool.length) {
    const keyOf = (candidate: Usable) => {
      const open = needs.filter((need) => !closed.has(need.key) && fills(candidate, need));
      const target = open.some((need) => need.kind === "target") ? 0 : 1;
      const nodes = kind === "moving" ? candidate.movingNodes : candidate.holdNodes;
      const fresh = nodes.filter((nodeId) => !reached.has(nodeId)).length;
      const order = Math.min(Number.MAX_SAFE_INTEGER, ...open.filter((need): need is Extract<Need, { kind: "movement" }> => need.kind === "movement").map((need) => need.movement.actionOrder));
      const actionOrder = Number.isFinite(order) ? order : Math.min(Number.MAX_SAFE_INTEGER, ...candidate.actionCredits.map((credit) => actionIndex.get(credit.actionId) ?? Number.MAX_SAFE_INTEGER));
      return [target, -fresh, actionOrder, ...preferKey(candidate)];
    };
    pool.sort((a, b) => compareKeys(keyOf(a), keyOf(b)));
    const next = pool.shift()!;
    out.push(next);
    for (const nodeId of kind === "moving" ? next.movingNodes : next.holdNodes) reached.add(nodeId);
    for (const need of needs) if (fills(next, need)) closed.add(need.key);
  }
  return out;
}

// ---------------------------------------------------------------- placement

type DayInfo = { slot: DaySlot; ids: Set<number>; directCount: number; directMuscles: Set<NodeId>; allowed: boolean; room: number };
type ChunkInfo = { candidate: Usable; sets: number; session: number; pinned: number | null };

/**
 * Sessions onto days. Hard: an allowed day, the per-day number (the plan's own exercises with direct
 * work included), never a day that already holds the exercise, never one exercise twice in a day,
 * a day the athlete pinned the row to (when that day can take it). Then, in this order: keep every
 * chunk placed; keep each day within the gym window; keep one muscle's direct work off
 * neighbouring days of the plan's cycle; even out the minutes the stack adds per day.
 */
function placeChunks(chunks: ChunkInfo[], days: DayInfo[], perDay: number): { assign: number[]; cost: number; nodes: number; improved: boolean } {
  const order = chunks.map((_, position) => position).sort((a, b) => {
    const x = chunks[a];
    const y = chunks[b];
    const muscles = (chunk: ChunkInfo) => chunk.candidate.movingNodes.length + chunk.candidate.holdNodes.length;
    return muscles(y) - muscles(x) || y.sets - x.sets || x.candidate.catalogExerciseId - y.candidate.catalogExerciseId || x.session - y.session;
  });
  const count = days.length;
  const pairs: [number, number][] = [];
  for (let day = 0; day < count && count > 1; day += 1) {
    const next = (day + 1) % count;
    if (!pairs.some(([a, b]) => (a === day && b === next) || (a === next && b === day))) pairs.push([day, next]);
  }
  const musclesOf = (chunk: ChunkInfo) => [...chunk.candidate.movingNodes, ...chunk.candidate.holdNodes];
  const pinnable = (chunk: ChunkInfo) => chunk.pinned !== null && days[chunk.pinned].allowed && !days[chunk.pinned].ids.has(chunk.candidate.catalogExerciseId);
  const feasible = (assign: number[], position: number, day: number) => {
    const chunk = chunks[position];
    const info = days[day];
    if (!info.allowed || info.ids.has(chunk.candidate.catalogExerciseId)) return false;
    if (pinnable(chunk) && chunk.pinned !== day) return false;
    let used = info.directCount;
    for (let other = 0; other < chunks.length; other += 1) {
      if (other === position || assign[other] !== day) continue;
      if (chunks[other].candidate.catalogExerciseId === chunk.candidate.catalogExerciseId) return false;
      used += 1;
    }
    return used < perDay;
  };
  // Muscles as indexes, and the buffers every cost reads, allocated once: the search calls this often.
  const muscleIndex = new Map<NodeId, number>();
  const indexOf = (nodeId: NodeId) => {
    if (!muscleIndex.has(nodeId)) muscleIndex.set(nodeId, muscleIndex.size);
    return muscleIndex.get(nodeId)!;
  };
  const chunkMuscles = chunks.map((chunk) => musclesOf(chunk).map(indexOf));
  const ownMuscles = days.map((day) => Array.from(day.directMuscles).map(indexOf));
  const muscleCount = muscleIndex.size;
  const ownPresent = new Uint8Array(count * muscleCount);
  ownMuscles.forEach((list, day) => { for (const muscle of list) ownPresent[day * muscleCount + muscle] = 1; });
  const present = new Uint8Array(count * muscleCount);
  const minutes = new Float64Array(count);
  const costOf = (assign: number[], complete: boolean) => {
    present.fill(0);
    minutes.fill(0);
    let unplaced = 0;
    for (let position = 0; position < assign.length; position += 1) {
      const day = assign[position];
      if (day < 0) { if (complete) unplaced += 1; continue; }
      minutes[day] += chunks[position].sets * MINUTES_PER_PLANNED_SET;
      for (const muscle of chunkMuscles[position]) present[day * muscleCount + muscle] = 1;
    }
    let over = 0;
    for (let day = 0; day < count; day += 1) over += Math.max(0, Math.ceil(minutes[day] - Math.max(0, days[day].room)));
    let adjacent = 0;
    for (const [a, b] of pairs) {
      for (let muscle = 0; muscle < muscleCount; muscle += 1) {
        const onA = present[a * muscleCount + muscle];
        const onB = present[b * muscleCount + muscle];
        if (onA && (onB || ownPresent[b * muscleCount + muscle])) adjacent += 1;
        if (onB && ownPresent[a * muscleCount + muscle] && !onA) adjacent += 1;
      }
    }
    let spread = 0;
    if (complete) {
      let low = Infinity;
      let high = -Infinity;
      for (let day = 0; day < count; day += 1) {
        if (!days[day].allowed) continue;
        low = Math.min(low, minutes[day]);
        high = Math.max(high, minutes[day]);
      }
      spread = Number.isFinite(low) ? Math.round(high - low) : 0;
    }
    return unplaced * 1e9 + over * 1e6 + adjacent * 1e4 + spread;
  };

  // Greedy: most muscles first, each onto the day that costs least now.
  let assign = new Array<number>(chunks.length).fill(-1);
  for (const position of order) {
    let bestDay = -1;
    let bestCost = Infinity;
    for (let day = 0; day < count; day += 1) {
      if (!feasible(assign, position, day)) continue;
      assign[position] = day;
      const cost = costOf(assign, false);
      assign[position] = -1;
      if (cost < bestCost) { bestCost = cost; bestDay = day; }
    }
    assign[position] = bestDay;
  }
  // Moves and swaps until none helps.
  let current = costOf(assign, true);
  for (let improved = true, rounds = 0; improved && rounds < 100; rounds += 1) {
    improved = false;
    for (const position of order) for (let day = 0; day < count; day += 1) {
      if (assign[position] === day || !feasible(assign, position, day)) continue;
      const was = assign[position];
      assign[position] = day;
      const cost = costOf(assign, true);
      if (cost < current) { current = cost; improved = true; } else assign[position] = was;
    }
    for (let i = 0; i < chunks.length; i += 1) for (let j = i + 1; j < chunks.length; j += 1) {
      const a = assign[i];
      const b = assign[j];
      if (a === b || a < 0 || b < 0) continue;
      assign[i] = b;
      assign[j] = a;
      if (feasible(assign, i, b) && feasible(assign, j, a)) {
        const cost = costOf(assign, true);
        if (cost < current) { current = cost; improved = true; continue; }
      }
      assign[i] = a;
      assign[j] = b;
    }
  }
  // A branch-and-bound search seeded with that cost, stopped at the node limit, keeping any better placement.
  let nodes = 0;
  let improvedBySearch = false;
  const trial = new Array<number>(chunks.length).fill(-1);
  // Over, neighbouring days and chunks left out only grow as chunks are added, so a partial
  // placement's cost is a lower bound. Each step tries the cheapest days first.
  const walk = (depth: number, skipped: number) => {
    if (nodes >= STACK_RULES.placementNodeLimit) return;
    nodes += 1;
    if (depth === order.length) {
      const cost = costOf(trial, true);
      if (cost < current) { current = cost; assign = [...trial]; improvedBySearch = true; }
      return;
    }
    const position = order[depth];
    const options: { day: number; bound: number }[] = [];
    for (let day = 0; day < count; day += 1) {
      if (!feasible(trial, position, day)) continue;
      trial[position] = day;
      const bound = costOf(trial, false) + skipped * 1e9;
      trial[position] = -1;
      if (bound < current) options.push({ day, bound });
    }
    options.sort((a, b) => a.bound - b.bound || a.day - b.day);
    for (const { day, bound } of options) {
      if (bound >= current || nodes >= STACK_RULES.placementNodeLimit) break;
      trial[position] = day;
      walk(depth + 1, skipped);
      trial[position] = -1;
    }
    // Leaving a chunk out is the last resort, and always costs more than placing it.
    if (nodes < STACK_RULES.placementNodeLimit && costOf(trial, false) + (skipped + 1) * 1e9 < current) walk(depth + 1, skipped + 1);
  };
  if (chunks.length) walk(0, 0);
  return { assign, cost: current, nodes, improved: improvedBySearch };
}

// ---------------------------------------------------------------- the athlete's edits, as the next input

/**
 * Leaves a movement out at once (11 §3.6): every row of it leaves the design and the total drops by
 * its sets; no other row changes. Where a re-design would move or re-spread another row (a target
 * its exercise was filling, a freed place on a day), that row keeps its sets and day as edits.
 */
export function leaveOutMovement(input: StackInput, design: StackDesign, movementKey: string): StackInput {
  const goingIds = new Set(design.exercises.filter((exercise) => exercise.movementKeys.includes(movementKey) && exercise.movementKeys.every((key) => key === movementKey || (input.edits?.leftOut ?? []).includes(key))).map((exercise) => exercise.catalogExerciseId));
  const going = design.rows.filter((row) => goingIds.has(row.catalogExerciseId));
  const droppedMoving = going.filter((row) => row.kind === "moving").reduce((total, row) => total + row.sets, 0);
  const edits: StackEdits = { ...input.edits, leftOut: Array.from(new Set([...(input.edits?.leftOut ?? []), movementKey])) };
  let next: StackInput = { ...input, edits, total: Math.max(design.own, design.total - droppedMoving) };
  const kept = design.rows.filter((row) => !goingIds.has(row.catalogExerciseId));
  const unchanged = (rows: readonly StackRow[]) => rows.length === kept.length && kept.every((row) => rows.some((other) => other.key === row.key && other.dayKey === row.dayKey && other.sets === row.sets && other.prescription === row.prescription));
  let redesign = designStack(next);
  if (unchanged(redesign.rows)) return next;
  // A freed place lets the placement move rows: every remaining row keeps its day.
  const days = { ...(next.edits?.days ?? {}) };
  for (const row of kept) days[row.key] = row.dayKey;
  next = { ...next, edits: { ...next.edits, days } };
  redesign = designStack(next);
  if (unchanged(redesign.rows)) return next;
  // A target the left-out exercise was filling would re-spread its sets: the rows that would change keep theirs.
  const sessions = { ...(next.edits?.sessions ?? {}) };
  for (const id of Array.from(new Set(kept.map((row) => row.catalogExerciseId)))) {
    const ownRows = kept.filter((row) => row.catalogExerciseId === id).sort((a, b) => a.session - b.session);
    const now = redesign.rows.filter((row) => row.catalogExerciseId === id).sort((a, b) => a.session - b.session);
    if (now.length !== ownRows.length || now.some((row, position) => row.sets !== ownRows[position].sets)) sessions[id] = ownRows.map((row) => row.sets);
  }
  return { ...next, edits: { ...next.edits, sessions } };
}

/** Brings a left-out movement back: it leaves the left-out list and the total rises by its smallest entry. */
export function bringBackMovement(input: StackInput, movementKey: string): StackInput {
  const leftOut = (input.edits?.leftOut ?? []).filter((key) => key !== movementKey);
  const base = input.total ?? designStack(input).total;
  return { ...input, edits: { ...input.edits, leftOut }, total: base + STACK_RULES.smallestEntry };
}

/**
 * The athlete sets one row's sets (1 to 3 a session): the exercise's sessions become the
 * athlete's, and the total moves by the difference, so the rest is re-spread only over rows the
 * athlete did not set. Returns the input unchanged for a row the design does not have.
 */
export function setRowSets(input: StackInput, design: StackDesign, rowKey: string, sets: number): StackInput {
  const row = design.rows.find((item) => item.key === rowKey);
  if (!row) return input;
  const value = clampInt(sets, STACK_RULES.smallestEntry, STACK_RULES.maxSetsPerSession);
  const ownRows = design.rows.filter((item) => item.catalogExerciseId === row.catalogExerciseId).sort((a, b) => a.session - b.session);
  const nextSessions = ownRows.map((item) => (item.key === rowKey ? value : item.sets));
  const delta = row.kind === "moving" ? value - row.sets : 0;
  const days: Record<string, string> = { ...(input.edits?.days ?? {}) };
  for (const item of ownRows) days[item.key] = item.dayKey;
  return { ...input, total: design.total + delta, edits: { ...input.edits, sessions: { ...(input.edits?.sessions ?? {}), [row.catalogExerciseId]: nextSessions }, days } };
}

/** The athlete moves one row to another day ("Change" → Day): the row is pinned there. */
export function moveRow(input: StackInput, rowKey: string, dayKey: string): StackInput {
  return { ...input, edits: { ...input.edits, days: { ...(input.edits?.days ?? {}), [rowKey]: dayKey } } };
}

/** The athlete picks another reviewed exercise for a movement ("Change" → Exercise). */
export function chooseExercise(input: StackInput, movementKey: string, catalogExerciseId: number): StackInput {
  return { ...input, edits: { ...input.edits, exercise: { ...(input.edits?.exercise ?? {}), [movementKey]: catalogExerciseId } } };
}

/** The days a row could move to: allowed days that can take it, its own day first. */
export function dayChoicesFor(input: StackInput, design: StackDesign, rowKey: string): { dayKey: string; label: string; current: boolean }[] {
  const row = design.rows.find((item) => item.key === rowKey);
  if (!row) return [];
  const settings = normalizeStackSettings(input.settings, input.plan.slots);
  const allowed = new Set(settings.days ?? input.plan.slots.map((slot) => slot.key));
  const model = modelOf(input.region);
  return input.plan.slots
    .filter((slot) => allowed.has(slot.key))
    .filter((slot) => {
      if (slot.key === row.dayKey) return true;
      const own = (input.plan.store.plan[slot.key] ?? []).map((entry) => catalogIdOf(entry));
      if (own.includes(row.catalogExerciseId)) return false;
      if (design.rows.some((other) => other.dayKey === slot.key && other.catalogExerciseId === row.catalogExerciseId)) return false;
      const used = own.filter((id) => model.candidateByCatalogId.has(id)).length + design.rows.filter((other) => other.dayKey === slot.key).length;
      return used < settings.perDay;
    })
    .map((slot) => ({ dayKey: slot.key, label: slot.label, current: slot.key === row.dayKey }));
}
