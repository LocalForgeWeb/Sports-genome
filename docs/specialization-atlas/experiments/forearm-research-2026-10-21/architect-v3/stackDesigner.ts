/**
 * PROTOTYPE (scratch, not app code): the forearm stack designer.
 *
 * Pure: plan week + summaries in, a proposed list of plan adds out. It reads only the app's
 * REVIEWED mappings (forearm_mappings_v1 through the region data), counts through the app's own
 * calculator (getSpecializationSummary over boutsFromPlan), and proposes changes in the exact
 * shape Home already applies (SpecializationPlanChange, applyPlanChangeToRecord).
 *
 * It never reads the research package's 0-4 grades, never sums muscle sets, never invents a
 * per-muscle requirement: "need" is (1) the athlete's own unmet targets and (2) main actions with
 * no direct work planned this week. Everything else is a scheduling choice, named as one.
 */
import type { Exercise } from "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/client/src/lib/exerciseCatalog";
import { equipmentMatchesProfile, type AthleteEquipmentProfile } from "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/client/src/lib/equipmentProfile";
import { boutsFromPlan } from "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/client/src/lib/specialization/planBouts";
import { applyPlanChangeToRecord } from "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/client/src/lib/specialization/planChange";
import { planningVariantsFor, catalogMusclesLookup } from "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/client/src/lib/specialization/useSpecializationSummary";
import type { SpecializationPlanChange } from "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/client/src/lib/specialization/viewState";
import { commitDay, loadDay, type DaySlot, type WeeklyDayStore } from "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/client/src/lib/trainingDayPlan";
import { getWorkoutDiagnostics, prescriptionOf, type TrainingGoal } from "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/client/src/lib/workoutPlanner";
import { catalogIdOf } from "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/client/src/lib/workoutSwap";
import { parseSetCount } from "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/client/src/lib/sessionVolume";
import { getSpecializationSummary, indexRegion } from "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/shared/specialization/exposure";
import { categoryFor } from "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/shared/specialization/rules";
import { planWeekInterval } from "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/shared/specialization/time";
import type { ActionId, ExerciseVariant, ExposureBout, ExposureCategory, GoalProgress, NodeId, SpecializationGoal, SpecializationRegionData, SpecializationSummary, VariantMapping } from "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/shared/specialization/types";

// ------------------------------------------------------------------ scheduling choices (named, not doses)

export const STACK_RULES = {
  /** Smallest entry the stack writes: a scheduling choice so each exercise is worth setting up, not a dose. */
  floorSetsPerExercise: 1,
  /** Most sets of one stack exercise on one day; more is split over two days. */
  maxSetsPerExercisePerDay: 3,
  /** Most forearm exercises with direct work on one day, the plan's own included. */
  maxForearmExercisesPerDay: 4,
  /** Planner constants (workoutPlanner.getWorkoutDiagnostics): 1.05 min per set plus the default 90 s rest. */
  minutesPerPerformedSet: 1.05,
  restMinutes: 1.5,
  /** Typo guard for the stepper, not a safety ceiling. */
  stepperMax: 60,
  /** A seconds target is filled in holds of this length, whatever the goal (critique: evidence #2). */
  targetHoldSeconds: 30,
  /** Region data in the app (`coverageOnly` on the variant): 05-mappings.md:91, "Small-muscle coverage, not high-volume defaults". */
  coverageOnly: [412, 413, 414] as readonly number[],
} as const;

/** The package's task families (rep-profiles.json), chosen by what the exercise does, never by the muscle. */
export type TaskFamily = "wrist" | "rotation" | "elbow" | "finger" | "thumb" | "isometric_grip" | "hold_other";
/** The coverage chips the athlete can leave out. */
export type CoverageGroup = "wrist" | "rotation" | "elbow" | "fingers" | "thumb" | "holds";

const REP_PROFILES: Record<Exclude<TaskFamily, "isometric_grip" | "hold_other">, { hyp: [number, number]; str: [number, number] | null }> = {
  wrist: { hyp: [10, 25], str: [6, 12] },
  rotation: { hyp: [10, 20], str: [6, 12] },
  elbow: { hyp: [6, 20], str: [3, 6] },
  finger: { hyp: [10, 25], str: [5, 10] },
  thumb: { hyp: [12, 25], str: null },
};

export type StackInput = {
  region: SpecializationRegionData;
  catalog: readonly Exercise[];
  week: number;
  slots: readonly DaySlot[];
  store: WeeklyDayStore;
  goal: TrainingGoal;
  gymMinutes: number;
  equipment: AthleteEquipmentProfile | null;
  exclusions: { catalogExerciseIds: number[]; equipment: string[] };
  goals: readonly SpecializationGoal[];
  /** Direct forearm sets per arm per week the athlete wants, the plan's own included. null: start value. */
  totalPerArm: number | null;
  leaveOut: readonly CoverageGroup[];
  /** Grip holds join only with a hold target, or when the athlete turns them on. */
  includeHolds: boolean;
  now: string;
  /** Soft rule: leave one training day without added forearm work when the plan has 3 or more days. */
  keepOneDayFree: boolean;
  /** Prototype only: also run the exact placement search, to report the local search's gap. */
  verifyPlacement?: boolean;
};

type Candidate = {
  variant: ExerciseVariant;
  exercise: Exercise;
  family: TaskFamily;
  group: CoverageGroup;
  /** `${nodeId}|${actionId}` the exercise trains directly (direct relationship, credited category). */
  covers: Set<string>;
  /** node -> the single category one set gives it (mixed when two). */
  credits: Map<NodeId, ExposureCategory>;
  directNodes: Set<NodeId>;
  sidesPerformed: 1 | 2;
  isHold: boolean;
  isCarry: boolean;
  coverageOnly: boolean;
};

export type StackEntry = {
  catalogExerciseId: number;
  name: string;
  family: TaskFamily;
  setsPerWeek: number;
  days: { slot: DaySlot; sets: number; prescription: string }[];
  reasons: string[];
  sharedNote: string | null;
};

export type StackResult = {
  totalPerArm: number;
  startValue: number;
  stepper: { min: number; max: number; fitsTime: number };
  existingDirectPerArm: { left: number; right: number };
  added: number;
  leftUnplanned: number;
  entries: StackEntry[];
  changes: SpecializationPlanChange[];
  notInStack: string[];
  notes: string[];
  days: { slot: DaySlot; minutesBefore: number; minutesAfter: number; secondArm: number; exercisesBefore: number; exercisesAfter: number; added: string[]; overWindow: boolean }[];
  adjacency: string[];
  check: { left: { before: number; after: number }; right: { before: number; after: number }; musclesWithDirect: { before: number; after: number }; holdSecondsRight: { before: number; after: number }; remainingGaps: string[]; targets: string[] };
  timings: { totalMs: number; placeMs: number; searched: number; placement: { localCost: number; exactCost: number | null; exactComplete: boolean; evaluations: number; exactNodes: number } };
  storeAfter: WeeklyDayStore;
};

// ------------------------------------------------------------------ reading the region

/** "move" for direct moving work, "hold" for a direct deliberate hold; a contributing hold (cat-300 BR) is neither. */
const modeOf = (relationship: VariantMapping["relationship"], category: ExposureCategory): "move" | "hold" | null =>
  category === "direct_dynamic" ? "move" : relationship === "direct" && category === "deliberate_isometric" ? "hold" : null;
const countsAsDirectSet = (category: ExposureCategory) => category === "direct_dynamic" || category === "deliberate_isometric";

function familyOf(variant: ExerciseVariant, actions: Set<ActionId>): { family: TaskFamily; group: CoverageGroup } {
  if (variant.deliberateHold) {
    const grip = Array.from(actions).some((action) => action.startsWith("fingers.") || action.startsWith("thumb."));
    return { family: grip ? "isometric_grip" : "hold_other", group: "holds" };
  }
  const list = Array.from(actions);
  if (list.some((a) => a.startsWith("thumb."))) return { family: "thumb", group: "thumb" };
  if (list.some((a) => a.startsWith("fingers.") || a.includes("finger"))) return { family: "finger", group: "fingers" };
  if (list.some((a) => a.startsWith("forearm."))) return { family: "rotation", group: "rotation" };
  if (list.some((a) => a.startsWith("elbow."))) return { family: "elbow", group: "elbow" };
  return { family: "wrist", group: "wrist" };
}

export function candidatesOf(region: SpecializationRegionData, catalog: readonly Exercise[]): Candidate[] {
  const index = indexRegion(region);
  const targets = new Set(region.nodes.filter((node) => node.role === "target").map((node) => node.id));
  const byId = new Map(catalog.map((exercise) => [exercise.id, exercise] as const));
  const out: Candidate[] = [];
  for (const variant of region.variants) {
    const mappings = (index.mappingsByVariant.get(variant.id) ?? []).filter((mapping) => mapping.reviewStatus === "reviewed" && targets.has(mapping.nodeId));
    const covers = new Set<string>();
    const actions = new Set<ActionId>();
    const perNode = new Map<NodeId, Set<ExposureCategory>>();
    const directNodes = new Set<NodeId>();
    for (const mapping of mappings) {
      const category = categoryFor(mapping.relationship, mapping.muscleMode, variant.deliberateHold);
      (perNode.get(mapping.nodeId) ?? perNode.set(mapping.nodeId, new Set()).get(mapping.nodeId)!).add(category);
      const mode = modeOf(mapping.relationship, category);
      if (mode && mapping.actionId) {
        covers.add(`${mapping.nodeId}|${mapping.actionId}|${mode}`);
        actions.add(mapping.actionId);
        directNodes.add(mapping.nodeId);
      }
    }
    const credits = new Map<NodeId, ExposureCategory>();
    for (const [nodeId, set] of perNode) credits.set(nodeId, set.size === 1 ? Array.from(set)[0] : "mixed");
    // A candidate is one the calculator credits as direct work (or a deliberate hold, which a hold target takes).
    const anyCounted = Array.from(credits.values()).some(countsAsDirectSet);
    if (!anyCounted) continue;
    const exercise = byId.get(variant.catalogExerciseId);
    if (!exercise) continue;
    if (!actions.size) for (const mapping of mappings) if (mapping.actionId) actions.add(mapping.actionId);
    const { family, group } = familyOf(variant, actions);
    out.push({ variant, exercise, family, group, covers, credits, directNodes, sidesPerformed: variant.laterality === "unilateral" ? 2 : 1, isHold: variant.deliberateHold, isCarry: (exercise as { movement?: string }).movement === "Loaded carry", coverageOnly: STACK_RULES.coverageOnly.includes(exercise.id) });
  }
  return out;
}

// ------------------------------------------------------------------ reading the plan week

export function plannedSummaries(input: Pick<StackInput, "region" | "catalog" | "week" | "slots" | "store" | "goal" | "goals" | "now">, store = input.store) {
  const bouts = boutsFromPlan({ week: input.week, slots: input.slots, store, variants: planningVariantsFor(input.region), goal: input.goal });
  const catalogMusclesFor = catalogMusclesLookup(input.catalog as Exercise[]);
  const both = getSpecializationSummary({
    region: input.region, bouts, interval: planWeekInterval(input.week), side: "both", mode: "planned", goals: input.goals,
    catalogMusclesFor, sourceRevision: "", planRevision: null, now: input.now,
  } as any);
  return { bouts, both };
}

/** The one shared count (critique: evidence #3): distinct bouts with a direct moving part on an own target muscle, and, apart, direct holds. */
export function directWork(region: SpecializationRegionData, summary: SpecializationSummary): { moving: Set<string>; holds: Set<string> } {
  const targets = new Set(region.nodes.filter((node) => node.role === "target").map((node) => node.id));
  const moving = new Set<string>(); const holds = new Set<string>();
  for (const node of summary.nodes) {
    if (!targets.has(node.nodeId)) continue;
    for (const c of node.contributions) {
      const parts = c.parts?.length ? c.parts : [{ relationship: "direct", category: c.category } as any];
      if (parts.some((p: any) => modeOf(p.relationship, p.category) === "move")) moving.add(c.boutId);
      else if (parts.some((p: any) => modeOf(p.relationship, p.category) === "hold")) holds.add(c.boutId);
    }
  }
  for (const id of moving) holds.delete(id);
  return { moving, holds };
}
export const directBoutsOnArm = (region: SpecializationRegionData, summary: SpecializationSummary) => directWork(region, summary).moving;

/** `${nodeId}|${actionId}` with direct work on this arm in the plan week. */
function coveredPairs(summary: SpecializationSummary): Set<string> {
  const out = new Set<string>();
  for (const node of summary.nodes) for (const c of node.contributions) {
    for (const p of c.parts) { const mode = modeOf(p.relationship, p.category); if (p.actionId && mode) out.add(`${node.nodeId}|${p.actionId}|${mode}`); }
  }
  return out;
}

const metricCategory = { direct_dynamic_bouts: "direct_dynamic", deliberate_hold_bouts: "deliberate_isometric", deliberate_hold_seconds: "deliberate_isometric" } as const;

/** Whether one set of this candidate counts toward the goal, as goalProgressFor counts it. */
function countsToward(candidate: Candidate, goal: SpecializationGoal, region: SpecializationRegionData): boolean {
  const wanted = metricCategory[goal.metric];
  if (goal.nodeId !== null) return candidate.credits.get(goal.nodeId) === wanted;
  // A movement target: any of the region's muscles on that action with that category.
  const index = indexRegion(region);
  return (index.mappingsByVariant.get(candidate.variant.id) ?? []).some((m) => m.reviewStatus === "reviewed" && m.actionId === goal.actionId && index.regionNodeIds.has(m.nodeId) && categoryFor(m.relationship, m.muscleMode, candidate.variant.deliberateHold) === wanted);
}

// ------------------------------------------------------------------ prescriptions

const HOLD_SECONDS = { hyp: 30, str: 10 } as const;

export function prescriptionFor(family: TaskFamily, goal: TrainingGoal, sets: number, forSecondsTarget = false): { text: string; holdSeconds: number | null; note: string | null } {
  const strength = goal === "Max strength";
  if (family === "isometric_grip" || family === "hold_other") {
    const seconds = forSecondsTarget ? 30 : strength ? HOLD_SECONDS.str : HOLD_SECONDS.hyp;
    return { text: `${sets} × ${seconds} sec`, holdSeconds: seconds, note: family === "hold_other" ? "No package range for a non-grip hold; the app's hold default." : null };
  }
  const profile = REP_PROFILES[family];
  const range = strength && profile.str ? profile.str : profile.hyp;
  const note = strength && !profile.str ? "No strength range for thumb isolation in the package; its 12–25 is kept." : null;
  return { text: `${sets} × ${range[0]}–${range[1]}`, holdSeconds: null, note };
}

// ------------------------------------------------------------------ time

const minutesPerArmSet = (_c: Pick<Candidate, "sidesPerformed">) => STACK_RULES.minutesPerPerformedSet + STACK_RULES.restMinutes;

function dayMinutes(store: WeeklyDayStore, slot: DaySlot, goal: TrainingGoal, gymMinutes: number) {
  const record = loadDay(store, slot.key);
  return getWorkoutDiagnostics(record.workout, record.prescriptions, record.settings, goal, gymMinutes).estimatedMinutes;
}

// ------------------------------------------------------------------ the designer

export function designStack(input: StackInput): StackResult {
  const t0 = performance.now();
  const { region } = input;
  const index = indexRegion(region);
  const nodeName = (id: NodeId) => index.nodeById.get(id)?.name ?? id;
  const actionLabel = (id: ActionId) => region.actions.find((a) => a.id === id)?.label ?? id;
  const before = plannedSummaries(input);
  const beforeWork = directWork(region, before.both);
  const existingPerArm = beforeWork.moving.size;
  const existing = { left: existingPerArm, right: existingPerArm };
  const coveredBoth = coveredPairs(before.both);
  const notInStack: string[] = [];
  const notes: string[] = [];

  // 1. Candidates the athlete can do and has not left out.
  const all = candidatesOf(region, input.catalog);
  const holdGoals = input.goals.filter((g) => g.metric !== "direct_dynamic_bouts");
  const usable = all.filter((c) => {
    if (input.exclusions.catalogExerciseIds.includes(c.exercise.id) || input.exclusions.equipment.includes(c.exercise.equipment)) return false;
    if (input.equipment && !equipmentMatchesProfile(c.exercise.equipment, input.equipment.availableEquipment)) return false;
    if (input.leaveOut.includes(c.group)) return false;
    if (c.isHold && !input.includeHolds && !holdGoals.some((g) => countsToward(c, g, region))) return false;
    return true;
  });

  // 2. Needs. (a) unmet targets, both arms; the plan holds no one-arm-only work, so the larger shortfall stands.
  type Need = { key: string; kind: "target" | "gap"; label: string; units: number; goal?: SpecializationGoal; pair?: string; tier: number };
  const needs: Need[] = [];
  const progress = [...before.both.goals];
  const targetKey = (g: SpecializationGoal) => `${g.nodeId ?? g.actionId}|${g.metric}`;
  const byTarget = new Map<string, { goal: SpecializationGoal; shortfall: number; sides: string[] }>();
  for (const p of progress as GoalProgress[]) {
    if (p.fraction >= 1) continue;
    const key = targetKey(p.goal);
    const shortfall = p.goal.target - p.value;
    const entry = byTarget.get(key);
    if (!entry || shortfall > entry.shortfall) byTarget.set(key, { goal: p.goal, shortfall, sides: [...(entry?.sides ?? []), p.goal.side] });
    else entry.sides.push(p.goal.side);
  }
  for (const [key, { goal, shortfall, sides }] of byTarget) {
    const subject = goal.nodeId ? nodeName(goal.nodeId) : actionLabel(goal.actionId!);
    const units = goal.metric === "deliberate_hold_seconds" ? Math.ceil(shortfall / STACK_RULES.targetHoldSeconds) : Math.ceil(shortfall);
    needs.push({ key: `t:${key}`, kind: "target", label: `${subject}: your target, ${shortfall} short (${goal.metric.replace(/_/g, " ")})`, units, goal, tier: 0 });
  }

  // (b) main actions with no direct work this plan week (on either arm), each a pair the catalog can or cannot fill.
  const primes = region.nodeActions.filter((na) => na.role === "prime" && index.nodeById.get(na.nodeId)?.role === "target");
  const withDirect = new Set<NodeId>();
  for (const pair of coveredBoth) if (pair.endsWith("|move")) withDirect.add(pair.split("|")[0]);
  const holdsOn = input.includeHolds || holdGoals.length > 0;
  for (const na of primes) for (const mode of (holdsOn ? ["move", "hold"] : ["move"])) {
    const pair = `${na.nodeId}|${na.actionId}|${mode}`;
    if (coveredBoth.has(pair)) continue;
    const anyReviewed = all.some((c) => c.covers.has(pair));
    const anyUsable = usable.some((c) => c.covers.has(pair));
    const label = `${actionLabel(na.actionId)}${mode === "hold" ? " (hold)" : ""} (${nodeName(na.nodeId)})`;
    if (!anyReviewed) { if (mode === "move") notInStack.push(`${label}: no reviewed exercise trains it directly.`); continue; }
    if (!anyUsable) { notInStack.push(`${label}: the exercises that train it directly are left out (your equipment, exclusions or the groups you left out).`); continue; }
    needs.push({ key: `g:${pair}`, kind: "gap", label: `${label}: no direct work planned this week`, units: 1, pair, tier: withDirect.has(na.nodeId) ? 2 : 1 });
  }

  // 3. Fewest exercises that meet every need, exactly (over distinct cover signatures).
  const fills = (c: Candidate, need: Need) => (need.kind === "gap" ? c.covers.has(need.pair!) : countsToward(c, need.goal!, region));
  const plannedIds = new Set(input.slots.flatMap((s) => (input.store.plan[s.key] ?? []).map((e) => catalogIdOf(e))));
  const prefer = (a: Candidate, b: Candidate) =>
    Number(a.isHold) - Number(b.isHold) // direct dynamic before holds
    || Number(plannedIds.has(a.exercise.id)) - Number(plannedIds.has(b.exercise.id)) // not already in the week
    || Number(a.isCarry) - Number(b.isCarry) // not a whole-body task
    || a.sidesPerformed - b.sidesPerformed // two-handed first: same per-arm count in half the time
    || a.exercise.id - b.exercise.id;
  const signature = (c: Candidate) => needs.filter((n) => fills(c, n)).map((n) => n.key).sort().join(",");
  const bySig = new Map<string, Candidate>();
  for (const c of usable) {
    const sig = signature(c);
    if (!sig) continue;
    const best = bySig.get(sig);
    if (!best || prefer(c, best) < 0) bySig.set(sig, c);
  }
  for (const n of needs.filter((x) => x.kind === "target")) {
    if (usable.some((c) => fills(c, n))) continue;
    const reviewed = all.some((c) => fills(c, n));
    notInStack.push(`${n.label.split(":")[0]}: ${reviewed ? "the exercises that count toward this target are left out (your equipment, exclusions or the groups you left out)" : "no reviewed exercise counts toward this target"} (${n.goal!.metric.replace(/_/g, " ")}).`);
  }
  const sigs = Array.from(bySig.entries());
  const allKeys = new Set(needs.filter((n) => usable.some((c) => fills(c, n))).map((n) => n.key));
  let cover: Candidate[] = [];
  let searched = 0;
  if (allKeys.size) {
    const sets = sigs.map(([sig]) => new Set(sig.split(",")));
    let bestSize = Infinity; let bestPick: number[] = [];
    let bestScore = Infinity;
    const n = sigs.length;
    // Exhaustive over subsets in size order; n is ~10-16 here (2^16 = 65,536 at most).
    for (let mask = 1; mask < 1 << n; mask += 1) {
      const size = popcount(mask);
      if (size > bestSize) continue;
      searched += 1;
      const got = new Set<string>();
      for (let i = 0; i < n; i += 1) if (mask & (1 << i)) for (const k of sets[i]) got.add(k);
      if (got.size !== allKeys.size) continue;
      const picked = Array.from({ length: n }, (_, i) => i).filter((i) => mask & (1 << i));
      const score = picked.reduce((s, i) => s + (sigs[i][1].isHold ? 10 : 0) + sigs[i][1].sidesPerformed, 0);
      if (size < bestSize || score < bestScore) { bestSize = size; bestPick = picked; bestScore = score; }
    }
    cover = bestPick.map((i) => sigs[i][1]);
  }

  // 4. Order the cover by need, re-read after each pick: targets, then muscles with no direct work yet,
  //    then a muscle's other main actions. A budget cut keeps the front of this list.
  const floor = STACK_RULES.floorSetsPerExercise;
  const ordered: Candidate[] = [];
  {
    const reachedMuscles = new Set(withDirect);
    const closed = new Set<string>();
    const pool = [...cover];
    while (pool.length) {
      const score = (c: Candidate) => {
        let v = 0;
        for (const n of needs) if (!closed.has(n.key) && fills(c, n)) v += n.kind === "target" ? 1000 : 1;
        for (const m of c.directNodes) if (!reachedMuscles.has(m)) v += 10;
        return v;
      };
      pool.sort((a, b) => score(b) - score(a) || prefer(a, b));
      const c = pool.shift()!;
      ordered.push(c);
      for (const m of c.directNodes) reachedMuscles.add(m);
      for (const n of needs) if (fills(c, n)) closed.add(n.key);
    }
  }
  const days = input.slots;
  const N = days.length;
  const room = days.map((slot) => input.gymMinutes - dayMinutes(input.store, slot, input.goal, input.gymMinutes));
  const existingByDay = days.map((slot) => {
    const entries = input.store.plan[slot.key] ?? [];
    const directMuscles = new Set<NodeId>();
    let directEntries = 0;
    for (const e of entries) {
      const c = all.find((x) => x.exercise.id === catalogIdOf(e));
      if (c && c.directNodes.size) { directEntries += 1; for (const m of c.directNodes) directMuscles.add(m); }
    }
    return { ids: new Set(entries.map((e) => catalogIdOf(e))), directMuscles, directEntries };
  });
  /** Exercise slots left in the week at the per-day limit, the plan's own forearm exercises included. */
  const capacity = existingByDay.reduce((s, d) => s + Math.max(0, STACK_RULES.maxForearmExercisesPerDay - d.directEntries), 0);
  const weekCap = STACK_RULES.maxSetsPerExercisePerDay * Math.min(2, N);
  const usableDays = input.keepOneDayFree && N >= 3 ? N - 1 : N;
  const movingOrdered = ordered.filter((c) => !c.isHold);
  const holdOrdered = ordered.filter((c) => c.isHold);
  const avgMin = 2.55;

  const metAfter = (remaining: Map<string, number>, g: SpecializationGoal) => {
    const rem = remaining.get(`t:${targetKey(g)}`);
    if (rem !== undefined) return rem <= 0;
    return (progress as GoalProgress[]).some((p) => targetKey(p.goal) === targetKey(g) && p.fraction >= 1);
  };
  const onlyMetTargets = (remaining: Map<string, number>, c: Candidate) => Array.from(c.directNodes).every((node) => {
    const kind = c.credits.get(node);
    const gs = input.goals.filter((g) => g.nodeId === node && metricCategory[g.metric] === kind);
    return gs.length > 0 && gs.every((g) => metAfter(remaining, g));
  });
  const chunksOf = (s: number) => Math.ceil(s / STACK_RULES.maxSetsPerExercisePerDay);

  /** The allocation for one budget: which exercises, how many sets, what stays short. */
  const allocate = (budgetIn: number, spread: boolean) => {
    let budget = budgetIn;
    const k = Math.min(Math.floor(budget / floor), capacity, movingOrdered.length);
    const kept = movingOrdered.slice(0, k);
    const sets = new Map<number, number>(kept.map((c) => [c.exercise.id, floor] as const));
    budget -= floor * kept.length;
    const chunkCount = () => kept.reduce((s, c) => s + chunksOf(sets.get(c.exercise.id)!), 0);
    const canAdd = (c: Candidate) => { const s = sets.get(c.exercise.id)!; return s < weekCap && (chunksOf(s + 1) === chunksOf(s) || chunkCount() < capacity); };
    // Unmet targets first, in their own units (a seconds target in sets of the written hold).
    const remaining = new Map(needs.filter((n) => n.kind === "target").map((n) => [n.key, n.units] as const));
    for (const c of kept) for (const n of needs) if (n.kind === "target" && fills(c, n)) remaining.set(n.key, (remaining.get(n.key) ?? 0) - floor);
    while (budget > 0) {
      const open = Array.from(remaining.entries()).filter(([, u]) => u > 0).map(([key]) => key);
      if (!open.length) break;
      const newChunk = (c: Candidate) => Number(chunksOf(sets.get(c.exercise.id)! + 1) > chunksOf(sets.get(c.exercise.id)!));
      const pick = kept.filter(canAdd).map((c) => ({ c, n: needs.filter((n) => open.includes(n.key) && fills(c, n)).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n || newChunk(a.c) - newChunk(b.c) || prefer(a.c, b.c))[0];
      if (!pick) break;
      sets.set(pick.c.exercise.id, sets.get(pick.c.exercise.id)! + 1);
      budget -= 1;
      for (const n of needs) if (open.includes(n.key) && fills(pick.c, n)) remaining.set(n.key, remaining.get(n.key)! - 1);
    }
    // Then an even spread by exercise, never by muscle count, and never onto work whose every target is met (design §8).
    if (spread) {
      while (budget > 0) {
        const open = kept.filter((c) => canAdd(c) && !onlyMetTargets(remaining, c) && !c.coverageOnly);
        if (!open.length) break;
        const newChunk = (c: Candidate) => Number(chunksOf(sets.get(c.exercise.id)! + 1) > chunksOf(sets.get(c.exercise.id)!));
        open.sort((a, b) => newChunk(a) - newChunk(b) || sets.get(a.exercise.id)! - sets.get(b.exercise.id)! || ordered.indexOf(a) - ordered.indexOf(b));
        sets.set(open[0].exercise.id, sets.get(open[0].exercise.id)! + 1);
        budget -= 1;
      }
    }
    return { kept, sets, remaining, left: budget, cut: movingOrdered.slice(k) };
  };
  /** Holds, outside the total: the floor each, plus what a hold target asks, at most the weekly cap. */
  const holdAllocate = (cap: number) => {
    const kept = holdOrdered.slice(0, Math.max(0, Math.min(holdOrdered.length, cap)));
    const sets = new Map<number, number>(kept.map((c) => [c.exercise.id, floor] as const));
    const remaining = new Map(needs.filter((n) => n.kind === "target" && n.goal!.metric !== "direct_dynamic_bouts").map((n) => [n.key, n.units] as const));
    for (const c of kept) for (const n of needs) if (remaining.has(n.key) && fills(c, n)) remaining.set(n.key, remaining.get(n.key)! - floor);
    for (let guard = 0; guard < 100; guard += 1) {
      const open = Array.from(remaining.entries()).filter(([, u]) => u > 0).map(([key]) => key);
      const pick = kept.find((c) => sets.get(c.exercise.id)! < weekCap && needs.some((n) => open.includes(n.key) && fills(c, n)));
      if (!pick) break;
      sets.set(pick.exercise.id, sets.get(pick.exercise.id)! + 1);
      for (const n of needs) if (open.includes(n.key) && fills(pick, n)) remaining.set(n.key, remaining.get(n.key)! - 1);
    }
    return { kept, sets, remaining, cut: holdOrdered.slice(kept.length) };
  };

  // The start value: every need met at the floor plus what the targets ask, if it fits the days' windows.
  const needAll = allocate(10_000, false);
  const needed = Array.from(needAll.sets.values()).reduce((s, v) => s + v, 0);
  const holdPreview = holdAllocate(capacity - needAll.kept.length);
  const holdMinutes = Array.from(holdPreview.sets.values()).reduce((s, v) => s + v, 0) * avgMin;
  const fitsTime = existingPerArm + Math.max(0, Math.floor(([...room].sort((a, b) => b - a).slice(0, usableDays).reduce((s, r) => s + Math.max(0, r), 0) - holdMinutes) / avgMin));
  const startValue = Math.max(existingPerArm, Math.min(existingPerArm + needed, fitsTime));
  const most = allocate(10_000, true);
  const stepper = { min: existingPerArm, max: Math.min(STACK_RULES.stepperMax, existingPerArm + Array.from(most.sets.values()).reduce((s, v) => s + v, 0)), fitsTime };
  const total = Math.max(stepper.min, Math.min(stepper.max, input.totalPerArm ?? startValue));
  if (input.totalPerArm !== null && input.totalPerArm < existingPerArm) notes.push(`Your plan already has ${existingPerArm} direct forearm sets per arm; the stack never removes your own exercises, so it adds nothing below that.`);
  if (input.totalPerArm !== null && input.totalPerArm > stepper.max) notes.push(`${input.totalPerArm} is more than ${STACK_RULES.maxForearmExercisesPerDay} forearm exercises a day can hold in this plan (${stepper.max}).`);
  if (ordered.length > capacity) notes.push(`Meeting every need takes ${ordered.length} exercises; ${STACK_RULES.maxForearmExercisesPerDay} forearm exercises a day on ${N} day(s), your own included, leave room for ${capacity}.`);
  if (existingPerArm + needed > fitsTime) notes.push(`What fits the day limit takes ${existingPerArm + needed} sets per arm; about ${fitsTime} fit your ${input.gymMinutes}-minute days, so the start value is ${startValue}.`);
  const alloc = allocate(total - existingPerArm, true);
  const holdAlloc = holdAllocate(capacity - alloc.kept.length);
  const kept = [...alloc.kept, ...holdAlloc.kept];
  const sets = new Map<number, number>([...alloc.sets, ...holdAlloc.sets]);
  const remaining = new Map<string, number>([...alloc.remaining]);
  for (const [k2, v] of holdAlloc.remaining) remaining.set(k2, v);
  for (const c of alloc.cut) {
    const what = needs.filter((n) => fills(c, n) && !kept.some((k) => fills(k, n))).map((n) => n.label.split(":")[0]);
    if (!what.length) continue;
    const why = kept.length >= capacity ? `no room: ${STACK_RULES.maxForearmExercisesPerDay} forearm exercises a day` : `needs ${floor} more sets per arm; raise the total to include it`;
    notInStack.push(`${what.join(", ")} (${c.exercise.name}): ${why}.`);
  }
  for (const [key, units] of remaining) if (units > 0) notes.push(`${needs.find((n) => n.key === key)!.label}: still ${units} set(s) short at this total.`);
  const leftUnplanned = Math.max(0, alloc.left);
  if (leftUnplanned) notes.push(`${leftUnplanned} set(s) of the total are left unplanned: the chosen exercises are at ${weekCap} sets a week or the day limit, or would only add to muscles already at your targets.`);

  // 6. Days: chunks of at most 4 sets, placed by an exact search over the days.
  const tPlace = performance.now();
  type Chunk = { c: Candidate; sets: number; part: number };
  const chunks: Chunk[] = [];
  for (const c of kept) {
    const s = sets.get(c.exercise.id) ?? 0;
    const parts = Math.ceil(s / STACK_RULES.maxSetsPerExercisePerDay);
    for (let p = 0; p < parts; p += 1) chunks.push({ c, sets: Math.floor(s / parts) + (p < s % parts ? 1 : 0), part: p });
  }
  const adjacentPairs: [number, number][] = [];
  for (let d = 0; d < N; d += 1) { const e = (d + 1) % N; if (e !== d && !adjacentPairs.some(([a, b]) => (a === e && b === d))) adjacentPairs.push([d, e]); }
  chunks.sort((a, b) => b.c.directNodes.size - a.c.directNodes.size || b.sets - a.sets);
  // Lexicographic, so the order of the rules is the explanation: (1) fit the day's time window,
  // (2) keep one muscle's direct work off consecutive plan days, (3) leave a day free, (4) even out the days.
  const feasible = (assign: number[], i: number, d: number) => {
    const ch = chunks[i];
    if (existingByDay[d].ids.has(ch.c.exercise.id)) return false; // already in that day: the plan refuses a duplicate
    let count = existingByDay[d].directEntries;
    for (let j = 0; j < chunks.length; j += 1) {
      if (j === i || assign[j] !== d) continue;
      if (chunks[j].c.exercise.id === ch.c.exercise.id) return false;
      count += 1;
    }
    return count < STACK_RULES.maxForearmExercisesPerDay;
  };
  const costOf = (assign: number[], partial: boolean) => {
    const perDay = days.map(() => ({ muscles: new Set<NodeId>(), minutes: 0, count: 0 }));
    chunks.forEach((ch, i) => { const d = assign[i]; if (d < 0) return; perDay[d].count += 1; perDay[d].minutes += ch.sets * minutesPerArmSet(ch.c); for (const m of ch.c.directNodes) perDay[d].muscles.add(m); });
    let over = 0;
    perDay.forEach((p, d) => { over += Math.max(0, Math.ceil(p.minutes - Math.max(0, room[d]))); });
    let adjacent = 0;
    for (const [a, b] of adjacentPairs) {
      for (const m of perDay[a].muscles) if (perDay[b].muscles.has(m) || existingByDay[b].directMuscles.has(m)) adjacent += 1;
      for (const m of perDay[b].muscles) if (existingByDay[a].directMuscles.has(m) && !perDay[a].muscles.has(m)) adjacent += 1;
    }
    let everyDay = 0; let spreadMin = 0;
    if (!partial) {
      everyDay = input.keepOneDayFree && N >= 3 && perDay.every((p) => p.count > 0) ? 1 : 0;
      const mins = perDay.map((p) => p.minutes);
      spreadMin = Math.round(Math.max(...mins) - Math.min(...mins));
    }
    return over * 1e6 + adjacent * 1e4 + everyDay * 1e3 + spreadMin;
  };
  // Greedy, most direct muscles first, each onto the day that costs least now; then moves and swaps until none helps.
  chunks.sort((a, b) => b.c.directNodes.size - a.c.directNodes.size || b.sets - a.sets || a.c.exercise.id - b.c.exercise.id);
  let assign = new Array<number>(chunks.length).fill(-1);
  let evaluations = 0;
  for (let i = 0; i < chunks.length; i += 1) {
    let bestD = -1; let bestC = Infinity;
    for (let d = 0; d < N; d += 1) {
      if (!feasible(assign, i, d)) continue;
      assign[i] = d; const c = costOf(assign, true); evaluations += 1; assign[i] = -1;
      if (c < bestC) { bestC = c; bestD = d; }
    }
    assign[i] = bestD;
  }
  let current = costOf(assign, false);
  for (let improved = true; improved;) {
    improved = false;
    for (let i = 0; i < chunks.length; i += 1) for (let d = 0; d < N; d += 1) {
      if (assign[i] === d || assign[i] < 0 || !feasible(assign, i, d)) continue;
      const was = assign[i]; assign[i] = d; const c = costOf(assign, false); evaluations += 1;
      if (c < current) { current = c; improved = true; } else assign[i] = was;
    }
    for (let i = 0; i < chunks.length; i += 1) for (let j = i + 1; j < chunks.length; j += 1) {
      if (assign[i] === assign[j] || assign[i] < 0 || assign[j] < 0) continue;
      const a = assign[i]; const b = assign[j];
      assign[i] = b; assign[j] = a;
      if (feasible(assign, i, b) && feasible(assign, j, a)) { const c = costOf(assign, false); evaluations += 1; if (c < current) { current = c; improved = true; continue; } }
      assign[i] = a; assign[j] = b;
    }
  }
  // Exact search, for the prototype's report only: does the local search find the optimum?
  let exactCost = Infinity; let nodesVisited = 0; const limit = 300_000;
  if (input.verifyPlacement) {
    const trial = new Array<number>(chunks.length).fill(-1);
    const dfs = (i: number) => {
      nodesVisited += 1;
      if (nodesVisited > limit) return;
      if (costOf(trial, true) >= exactCost) return;
      if (i === chunks.length) { exactCost = Math.min(exactCost, costOf(trial, false)); return; }
      for (let d = 0; d < N; d += 1) { if (!feasible(trial, i, d)) continue; trial[i] = d; dfs(i + 1); trial[i] = -1; }
    };
    dfs(0);
  }
  const placeMs = performance.now() - tPlace;
  const placement = assign;
  const unplaced = chunks.filter((_, i) => assign[i] < 0);
  if (unplaced.length) notes.push(`No day has room under the ${STACK_RULES.maxForearmExercisesPerDay}-exercise limit for: ${unplaced.map((c) => c.c.exercise.name).join(", ")}.`);
  const placementReport = { localCost: current, exactCost: input.verifyPlacement ? exactCost : null, exactComplete: nodesVisited <= limit, evaluations, exactNodes: nodesVisited };

  // 7. Changes in Home's shape, applied with the shipped pure edit (adds at the end, the plan's own untouched).
  const servesSeconds = (c: Candidate) => needs.some((n) => n.kind === "target" && n.goal!.metric === "deliberate_hold_seconds" && fills(c, n));
  const changes: SpecializationPlanChange[] = [];
  const entries = new Map<number, StackEntry>();
  let storeAfter = input.store;
  const order = (c: Candidate) => (c.isHold ? 9 : ({ elbow: 0, wrist: 1, rotation: 2, finger: 3, thumb: 4 } as Record<string, number>)[c.family] ?? 5);
  const placed = chunks.map((ch, i) => ({ ch, d: placement[i] })).filter((x) => x.d !== undefined && x.d >= 0).sort((a, b) => a.d - b.d || order(a.ch.c) - order(b.ch.c));
  for (const { ch, d } of placed) {
    const slot = days[d];
    const rx = prescriptionFor(ch.c.family, input.goal, ch.sets, servesSeconds(ch.c));
    const change: SpecializationPlanChange = { week: input.week, slotIndex: slot.index, dayKey: slot.key, catalogExerciseId: ch.c.exercise.id, prescription: rx.text };
    const outcome = applyPlanChangeToRecord(loadDay(storeAfter, slot.key), change, ch.c.exercise);
    if (!outcome.ok) { notes.push(`${ch.c.exercise.name} on ${slot.label}: ${outcome.reason}`); continue; }
    storeAfter = commitDay(storeAfter, slot.key, outcome.record);
    changes.push(change);
    const entry = entries.get(ch.c.exercise.id) ?? {
      catalogExerciseId: ch.c.exercise.id, name: ch.c.exercise.name, family: ch.c.family, setsPerWeek: 0, days: [],
      reasons: [`Direct ${ch.c.isHold ? "hold" : "moving"} work for ${Array.from(ch.c.directNodes).filter((id) => index.nodeById.get(id)?.role === "target").map((id) => index.nodeById.get(id)?.shortName ?? id).join(", ")}${ch.c.coverageOnly ? " (coverage only: stays at its floor unless you raise it)" : ""}`, ...needs.filter((n) => fills(ch.c, n)).map((n) => n.label)],
      sharedNote: sharedOf(region, ch.c, nodeName),
    };
    entry.setsPerWeek += ch.sets;
    entry.days.push({ slot, sets: ch.sets, prescription: rx.text + (rx.note ? ` (${rx.note})` : "") });
    entries.set(ch.c.exercise.id, entry);
  }

  // Consecutive plan days (the cycle wraps) where one muscle gets direct work on both, an added exercise involved.
  const adjacency: string[] = [];
  if (N >= 2) for (const [a, b] of adjacentPairs) {
    const addedOn = (d: number) => new Set(placed.filter((x) => x.d === d).flatMap((x) => Array.from(x.ch.c.directNodes)));
    const onA = addedOn(a); const onB = addedOn(b);
    const shared = new Set<NodeId>();
    for (const m of onA) if (onB.has(m) || existingByDay[b].directMuscles.has(m)) shared.add(m);
    for (const m of onB) if (existingByDay[a].directMuscles.has(m)) shared.add(m);
    if (shared.size) adjacency.push(`${days[a].ordinal} and ${days[b].ordinal}: ${Array.from(shared).map((m) => index.nodeById.get(m)?.shortName ?? m).join(", ")}`);
  }

  // 8. Check through the app's calculator: per-arm distinct direct bouts, muscles reached, gaps left.
  const after = plannedSummaries(input, storeAfter);
  const isTarget = (id: string) => index.nodeById.get(id)?.role === "target";
  const reachedMoving = (s: SpecializationSummary) => new Set(Array.from(coveredPairs(s)).filter((k2) => k2.endsWith("|move")).map((k2) => k2.split("|")[0]).filter(isTarget)).size;
  const reached = (s: SpecializationSummary) => new Set(Array.from(coveredPairs(s)).map((k2) => k2.split("|")[0]).filter(isTarget)).size;
  const holdSeconds = (s: SpecializationSummary) => Math.max(0, ...s.nodes.map((n) => n.deliberateHoldSeconds ?? 0));
  const afterCovered = coveredPairs(after.both);
  const remainingGaps = primes.map((na) => `${na.nodeId}|${na.actionId}|move`).filter((pair) => !afterCovered.has(pair)).map((pair) => { const [node, action] = pair.split("|"); return `${actionLabel(action)} (${nodeName(node)})`; });
  const targets = [...after.both.goals].map((p) => `${p.goal.nodeId ?? p.goal.actionId} ${p.goal.metric}: ${p.label}`);
  const afterWork = directWork(region, after.both);
  (globalThis as any).__lastCheck = { movingBefore: beforeWork.moving.size, movingAfter: afterWork.moving.size, holdsBefore: beforeWork.holds.size, holdsAfter: afterWork.holds.size, movingMusclesBefore: reachedMoving(before.both), movingMusclesAfter: reachedMoving(after.both), anyMusclesBefore: reached(before.both), anyMusclesAfter: reached(after.both) };
  const dayRows = days.map((slot) => {
    const minutesBefore = dayMinutes(input.store, slot, input.goal, input.gymMinutes);
    const addedHere = placed.filter((x) => days[x.d].key === slot.key);
    const minutesAfter = minutesBefore + addedHere.reduce((s, x) => s + x.ch.sets * minutesPerArmSet(x.ch.c), 0);
    const secondArm = addedHere.reduce((s, x) => s + (x.ch.c.sidesPerformed === 2 ? x.ch.sets * STACK_RULES.minutesPerPerformedSet : 0), 0);
    return { slot, minutesBefore, secondArm: Math.round(secondArm), exercisesBefore: (input.store.plan[slot.key] ?? []).length, exercisesAfter: (input.store.plan[slot.key] ?? []).length + addedHere.length, minutesAfter: Math.round(minutesAfter), added: addedHere.map((x) => `${x.ch.c.exercise.name} ${prescriptionFor(x.ch.c.family, input.goal, x.ch.sets).text}`), overWindow: minutesAfter > input.gymMinutes };
  });
  return {
    totalPerArm: total, startValue, stepper, existingDirectPerArm: existing, added: total - existingPerArm - leftUnplanned,
    leftUnplanned, entries: Array.from(entries.values()), changes, notInStack: groupNotInStack(notInStack), notes, days: dayRows, adjacency,
    check: {
      left: { before: existingPerArm, after: afterWork.moving.size },
      right: { before: existingPerArm, after: afterWork.moving.size },
      musclesWithDirect: { before: reachedMoving(before.both), after: reachedMoving(after.both) },
      holdSecondsRight: { before: holdSeconds(before.both), after: holdSeconds(after.both) },
      remainingGaps, targets,
    },
    timings: { totalMs: performance.now() - t0, placeMs, searched, placement: placementReport },
    storeAfter,
  };
}

function sharedOf(region: SpecializationRegionData, c: Candidate, nodeName: (id: NodeId) => string): string | null {
  const index = indexRegion(region);
  const shared = (index.mappingsByVariant.get(c.variant.id) ?? []).filter((m) => m.reviewStatus === "reviewed" && m.allocation === "shared" && c.directNodes.has(m.nodeId) && m.relationship === "direct");
  if (shared.length < 2) return null;
  return `Shared between ${shared.map((m) => nodeName(m.nodeId)).join(" and ")}; the evidence does not split it.`;
}

/** One sentence per reason, as the page would say it, rather than a line per action. */
function groupNotInStack(lines: string[]): string[] {
  const unreviewed = lines.filter((l) => l.endsWith("no reviewed exercise trains it directly.")).map((l) => l.split(":")[0]);
  const leftOut = lines.filter((l) => l.includes("are left out (")).map((l) => l.split(":")[0]);
  const rest = lines.filter((l) => !l.endsWith("no reviewed exercise trains it directly.") && !l.includes("are left out ("));
  const out: string[] = [];
  if (unreviewed.length) out.push(`No reviewed exercise trains these directly: ${unreviewed.join("; ")}.`);
  if (leftOut.length) out.push(`Left out by your equipment, exclusions or the groups you turned off: ${leftOut.join("; ")}.`);
  return [...out, ...rest];
}

function popcount(x: number) { let n = 0; while (x) { x &= x - 1; n += 1; } return n; }

export { parseSetCount, prescriptionOf };
