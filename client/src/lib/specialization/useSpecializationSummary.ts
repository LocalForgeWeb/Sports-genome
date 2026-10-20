import { useEffect, useMemo, useState } from "react";
import { deviceWorkoutHistoryEvent, deviceWorkoutHistoryKey, loadDeviceWorkoutSessions, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises as exerciseCatalog, type Exercise } from "@/lib/exerciseCatalog";
import type { DaySlot, WeeklyDayStore } from "@/lib/trainingDayPlan";
import type { DisplayWeightUnit } from "@/lib/weightUnits";
import type { TrainingGoal } from "@/lib/workoutPlanner";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { currentExposureRule } from "@shared/specialization/rules";
import { calendarWeekInterval, customInterval, isDateKey, planWeekInterval, rolling7dInterval } from "@shared/specialization/time";
import type { ExposureBout, SpecializationGoal, SpecializationRegionData, SpecializationSummary, SummaryInterval, SummaryMode, SummaryRequest, SummarySide } from "@shared/specialization/types";
import { variantLibrary } from "@shared/specialization/variants";
import { boutsFromSessions, excludedRecordsFromSessions } from "./bouts";
import { boutsFromPlan } from "./planBouts";
import { planRevision, sourceRevision, stableStringify } from "./revision";
import { planFingerprint } from "@/lib/planSyncDecision";
import type { AccountScope } from "./stores";

/**
 * What the specialization page reads (brief §9, design §3–§4).
 *
 * Exposure is calculated on the device, on demand, from the same records Home, Review and
 * Progress read: the workout log in `localStorage` and the plan Home passes in. One call
 * computes every node of the region at once — the diagram, the list and the sheet all read
 * the same summary, so there is never a request per muscle.
 *
 * A summary is memoized by everything it depends on (the cache key below), so switching
 * sides or windows back and forth reuses the earlier answer, and any change to the log or
 * the plan — a set logged, edited, removed or swapped, an offline record arriving late —
 * changes a revision and is recalculated.
 */

/** One plan week as Home holds it, and the training goal that fills in prescriptions never saved. */
export type SpecializationPlanInput = { week: number; slots: readonly DaySlot[]; store: WeeklyDayStore; goal?: TrainingGoal };

export type SummaryCacheKeyParts = {
  accountScope: AccountScope;
  regionId: string;
  interval: Pick<SummaryInterval, "kind" | "startAt" | "endAtExclusive" | "planWeek">;
  timezone: string;
  side: SummarySide;
  mode: SummaryMode;
  planRevision: string | null;
  sourceRevision: string;
  ruleVersion: string;
  mappingVersion: string;
  /** Goals change the summary's goal rows. */
  goalsRevision: string;
  /** Goal periods are read relative to now; the minute is precise enough to reuse a summary. */
  nowMinute: string;
};

/** The cache key: account, region, interval, zone, side, mode, plan and source revisions, rule and mapping versions. */
export function summaryCacheKey(parts: SummaryCacheKeyParts): string {
  return stableStringify({ ...parts, accountScope: parts.accountScope ?? null });
}

const CACHE_LIMIT = 24;
const summaryCache = new Map<string, SpecializationSummary>();

/** Computes a summary, or returns the one already computed for the same key (least recently used are dropped). */
export function cachedSummary(key: string, compute: () => SpecializationSummary): SpecializationSummary {
  const hit = summaryCache.get(key);
  if (hit) {
    summaryCache.delete(key);
    summaryCache.set(key, hit);
    return hit;
  }
  const summary = compute();
  summaryCache.set(key, summary);
  while (summaryCache.size > CACHE_LIMIT) summaryCache.delete(summaryCache.keys().next().value as string);
  return summary;
}

export function clearSummaryCache(): void {
  summaryCache.clear();
}

const muscleIndexes = new WeakMap<readonly Exercise[], { byId: Map<number, Exercise>; byName: Map<string, Exercise> }>();
/** The catalog's muscle tags for an exercise, by id, else by exact name. */
export function catalogMusclesLookup(catalog: readonly Exercise[]): SummaryRequest["catalogMusclesFor"] {
  let index = muscleIndexes.get(catalog);
  if (!index) {
    index = { byId: new Map(catalog.map((exercise) => [exercise.id, exercise] as const)), byName: new Map(catalog.map((exercise) => [exercise.name, exercise] as const)) };
    muscleIndexes.set(catalog, index);
  }
  const found = index;
  return (catalogExerciseId, exerciseName) => {
    const exercise = (catalogExerciseId !== null ? found.byId.get(catalogExerciseId) : undefined) ?? found.byName.get(exerciseName);
    return exercise ? { primary: exercise.primaryMuscles, secondary: exercise.secondaryMuscles } : null;
  };
}

/** The window the page's controls describe. Planned mode always reads a plan week. */
export function intervalForView(view: { mode: SummaryMode; window: "week" | "7d" | "custom"; from: string | null; to: string | null; planWeek: number | null }, nowIso: string, timeZone: string, defaultPlanWeek = 1): SummaryInterval {
  if (view.mode === "planned") return planWeekInterval(view.planWeek ?? defaultPlanWeek, timeZone);
  if (view.window === "7d") return rolling7dInterval(nowIso, timeZone);
  // A window the address carries is validated there; this guard keeps any other caller from throwing.
  if (view.window === "custom" && view.from && view.to && isDateKey(view.from) && isDateKey(view.to)) return customInterval(view.from, view.to, timeZone);
  return calendarWeekInterval(nowIso, timeZone);
}

export type SummaryInputs = {
  region: SpecializationRegionData;
  accountScope?: AccountScope;
  interval: SummaryInterval;
  side: SummarySide;
  mode: SummaryMode;
  goals: readonly SpecializationGoal[];
  completedBouts: readonly ExposureBout[];
  plannedBouts: readonly ExposureBout[];
  sourceRevision: string;
  planRevision: string | null;
  catalogMusclesFor: SummaryRequest["catalogMusclesFor"];
  now: string;
};

/**
 * The pure core of the hook: one memoized summary for one side, window and mode. A completed
 * summary reads no plan and a planned one reads no workouts, so each carries (and is keyed
 * on) only the revision it reads: logging a set never recalculates the planned view, and
 * editing the plan never recalculates the completed one.
 */
export function computeSpecializationSummary(inputs: SummaryInputs): SpecializationSummary {
  const sourceRev = inputs.mode === "completed" ? inputs.sourceRevision : "";
  const planRev = inputs.mode === "planned" ? inputs.planRevision : null;
  const key = summaryCacheKey({
    accountScope: inputs.accountScope,
    regionId: inputs.region.region.id,
    interval: { kind: inputs.interval.kind, startAt: inputs.interval.startAt, endAtExclusive: inputs.interval.endAtExclusive, planWeek: inputs.interval.planWeek },
    timezone: inputs.interval.timezone,
    side: inputs.side,
    mode: inputs.mode,
    planRevision: planRev,
    sourceRevision: sourceRev,
    ruleVersion: currentExposureRule.id,
    mappingVersion: inputs.region.mappingVersion.key,
    goalsRevision: planFingerprint(stableStringify(inputs.goals)),
    nowMinute: inputs.now.slice(0, 16),
  });
  return cachedSummary(key, () => getSpecializationSummary({
    region: inputs.region,
    bouts: inputs.mode === "completed" ? inputs.completedBouts : inputs.plannedBouts,
    interval: inputs.interval,
    side: inputs.side,
    mode: inputs.mode,
    goals: inputs.goals,
    catalogMusclesFor: inputs.catalogMusclesFor,
    sourceRevision: sourceRev,
    planRevision: planRev,
    now: inputs.now,
  }));
}

/** The finished workouts on this device, kept current when one is logged, edited or removed (here or in another tab). */
export function useDeviceWorkoutSessions(): DeviceWorkoutSession[] {
  const [sessions, setSessions] = useState<DeviceWorkoutSession[]>(() => loadDeviceWorkoutSessions());
  useEffect(() => {
    const refresh = () => setSessions(loadDeviceWorkoutSessions());
    const onStorage = (event: StorageEvent) => { if (event.key === null || event.key === deviceWorkoutHistoryKey) refresh(); };
    refresh();
    window.addEventListener(deviceWorkoutHistoryEvent, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(deviceWorkoutHistoryEvent, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return sessions;
}

export type UseSpecializationSummaryInput = {
  region: SpecializationRegionData;
  accountScope?: AccountScope;
  interval: SummaryInterval;
  side: SummarySide;
  mode: SummaryMode;
  /** The plan week planned mode reads; Home passes it. Null when there is no plan. */
  plan: SpecializationPlanInput | null;
  goals: readonly SpecializationGoal[];
  catalog?: readonly Exercise[];
  /** The unit a set with no recorded unit was typed in (the profile's unit). */
  fallbackUnit?: DisplayWeightUnit;
  /** For tests; the page leaves it out and the hook reads the clock when its inputs change. */
  now?: string;
};

export type SpecializationSummaryState =
  | { status: "ready"; summary: SpecializationSummary; sourceRevision: string; planRevision: string | null }
  | { status: "error"; summary: null; message: string; sourceRevision: string; planRevision: string | null };

export function useSpecializationSummary(input: UseSpecializationSummaryInput): SpecializationSummaryState {
  const sessions = useDeviceWorkoutSessions();
  const catalog = input.catalog ?? exerciseCatalog;
  const fallbackUnit = input.fallbackUnit ?? "lb";
  // The plan is laid out by the shared library, as the tracker lays it out, so every region's page
  // reads the same planned bouts; a region's own variants come first, for a test region's records.
  const regionVariants = input.region.variants;
  const variants = useMemo(() => [...regionVariants, ...variantLibrary], [regionVariants]);
  const source = useMemo(() => sourceRevision(sessions), [sessions]);
  const completedBouts = useMemo(
    () => {
      const deps = { catalog, fallbackUnit };
      return [...boutsFromSessions(sessions, deps), ...excludedRecordsFromSessions(sessions, deps)];
    },
    // The revision, not the array: a reload that read the same workouts keeps the same bouts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source, catalog, fallbackUnit],
  );
  const plan = input.plan;
  const planRev = useMemo(() => (plan ? planRevision(plan.store, plan.slots, plan.week, plan.goal) : null), [plan]);
  const plannedBouts = useMemo(
    () => (plan ? boutsFromPlan({ week: plan.week, slots: plan.slots, store: plan.store, variants, goal: plan.goal }) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [planRev, variants],
  );
  const catalogMusclesFor = useMemo(() => catalogMusclesLookup(catalog), [catalog]);
  const goalsKey = stableStringify(input.goals);
  const intervalKey = stableStringify(input.interval);
  return useMemo<SpecializationSummaryState>(() => {
    const now = input.now ?? new Date().toISOString();
    try {
      const summary = computeSpecializationSummary({
        region: input.region,
        accountScope: input.accountScope,
        interval: input.interval,
        side: input.side,
        mode: input.mode,
        goals: input.goals,
        completedBouts,
        plannedBouts,
        sourceRevision: source,
        planRevision: planRev,
        catalogMusclesFor,
        now,
      });
      return { status: "ready", summary, sourceRevision: source, planRevision: planRev };
    } catch (error) {
      return { status: "error", summary: null, message: error instanceof Error ? error.message : "The summary could not be calculated.", sourceRevision: source, planRevision: planRev };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input.region, input.accountScope, intervalKey, input.side, input.mode, goalsKey, completedBouts, plannedBouts, source, planRev, catalogMusclesFor, input.now]);
}
