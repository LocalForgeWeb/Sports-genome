import type { DeviceSetLog, DeviceWorkoutExercise, DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises as catalog } from "@/lib/exerciseCatalog";
import { buildDaySlots, emptyDayStore, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { boutsFromSessions, excludedRecordsFromSessions } from "@/lib/specialization/bouts";
import { boutsFromPlan } from "@/lib/specialization/planBouts";
import * as summaryHook from "@/lib/specialization/useSpecializationSummary";
import { catalogMusclesLookup } from "@/lib/specialization/useSpecializationSummary";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { regionDataFor } from "@shared/specialization/registry";
import { calendarWeekInterval, customInterval, planWeekInterval, rolling7dInterval } from "@shared/specialization/time";
import type { ExerciseVariant, ExposureBout, SpecializationGoal, SpecializationRegionData, SpecializationSummary, SummaryInterval } from "@shared/specialization/types";

/**
 * The forearm's golden histories (10-multi-region.md §4.3): the workout histories and plans the
 * forearm release measured itself on (scripts/specialization/release-gates/summary-cost.ts,
 * page-cost.mjs and page-offline.mjs), one week of edge cases beside them, and targets on every
 * kind of subject, run through the adapters and the calculator for both arms, every window and
 * both modes.
 *
 * It reads only what the calculator and its adapters exported when the forearm shipped (6738eeb),
 * by the same paths and with the same arguments (and the page's planning variants where the tree
 * has them, `planningVariants`), and names forearm ids as plain strings, so the same file runs
 * against that tree and against this one: scripts/specialization/release-gates/golden-summaries.ts
 * writes the reference, client/src/lib/specialization/golden.test.ts compares.
 */

const region = regionDataFor("forearm")!;
const TZ = "Europe/London";
export const GOLDEN_NOW = "2026-10-17T18:00:00.000Z";
const catalogMusclesFor = catalogMusclesLookup(catalog);
const nameOf = new Map(catalog.map((exercise) => [exercise.id, exercise.name]));
const exerciseOf = (id: number) => catalog.find((exercise) => exercise.id === id)!;
const holdIds = new Set(region.variants.filter((variant) => variant.measure === "seconds").map((variant) => variant.catalogExerciseId));
const oneArm = new Set(region.variants.filter((variant) => variant.laterality === "unilateral").map((variant) => variant.catalogExerciseId));
/**
 * The variants the page lays the plan out by (`planningVariantsFor`, from 10-multi-region.md wave
 * 0): the forearm's own, then the shared library's for every other exercise, so a variant a later
 * release adds to the library shows here as it shows on the page. The shipped tree has no such
 * helper and laid the plan out by the forearm's own variants.
 */
const planningVariants: readonly ExerciseVariant[] =
  (summaryHook as { planningVariantsFor?: (data: SpecializationRegionData) => readonly ExerciseVariant[] }).planningVariantsFor?.(region) ?? region.variants;

// summary-cost.ts's four day templates, rotated: pressing, pulling, legs, arms.
const days: { title: string; items: [number, number][] }[] = [
  { title: "Push", items: [[1, 4], [2, 4], [5, 3], [20, 3], [150, 3], [139, 3]] },
  { title: "Pull", items: [[43, 4], [66, 4], [46, 3], [81, 3], [121, 3], [143, 3]] },
  { title: "Legs", items: [[41, 4], [220, 3], [210, 3], [200, 3], [145, 3], [140, 3]] },
  { title: "Arms", items: [[132, 4], [135, 3], [410, 3], [411, 3], [160, 3], [100, 3]] },
];

/** summary-cost.ts `history`, as it was: completed workouts ending at GOLDEN_NOW. */
function history(weeks: number, perWeek: number, setsScale = 1): DeviceWorkoutSession[] {
  const sessions: DeviceWorkoutSession[] = [];
  const end = Date.parse(GOLDEN_NOW);
  for (let w = 0; w < weeks; w += 1) {
    for (let d = 0; d < perWeek; d += 1) {
      const started = new Date(end - (w * 7 + d * (7 / perWeek)) * 86_400_000 - 3_600_000);
      const day = days[(w * perWeek + d) % days.length];
      const exercises: DeviceWorkoutExercise[] = day.items.map(([id, sets], e) => ({
        id: `ex-${w}-${d}-${e}`,
        exerciseName: nameOf.get(id) ?? `Exercise ${id}`,
        catalogId: id,
        plannedPrescription: `${sets} × 8–12`,
        sets: Array.from({ length: Math.round(sets * setsScale) }, (_, s): DeviceSetLog => ({
          id: `set-${w}-${d}-${e}-${s}`,
          weight: "40",
          reps: holdIds.has(id) ? "" : "10",
          unit: "kg",
          completed: true,
          ...(holdIds.has(id) ? { holdSeconds: "40" } : {}),
          ...(oneArm.has(id) ? { side: s % 2 === 0 ? "right" : "left" } : {}),
        } as DeviceSetLog)),
      }));
      sessions.push({ id: `s-${w}-${d}`, title: day.title, dayLabel: day.title, startedAt: started.toISOString(), completedAt: new Date(started.getTime() + 3_600_000).toISOString(), status: "completed", exercises } as DeviceWorkoutSession);
    }
  }
  return sessions;
}

const set = (over: Record<string, unknown> = {}) => ({ weight: "30", reps: "12", unit: "lb", completed: true, ...over }) as DeviceSetLog;
const done = (id: string, completedAt: string, exercises: DeviceWorkoutExercise[], over: Partial<DeviceWorkoutSession> = {}): DeviceWorkoutSession =>
  ({ id, title: "Day", dayLabel: "Week 1 · Day 02 · Pull", startedAt: new Date(Date.parse(completedAt) - 3_600_000).toISOString(), completedAt, status: "completed", exercises, ...over }) as DeviceWorkoutSession;
const ex = (id: string, catalogId: number | undefined, sets: DeviceSetLog[], over: Record<string, unknown> = {}): DeviceWorkoutExercise =>
  ({ id, exerciseName: nameOf.get(catalogId ?? 139) ?? "Wrist Curl", ...(catalogId !== undefined ? { catalogId } : {}), plannedPrescription: `${sets.length} × 12`, sets, ...over }) as DeviceWorkoutExercise;

/** page-offline.mjs's workout: a hammer curl and a wrist curl in pounds, no arm recorded. */
const offlineSessions = [done("s1", "2026-10-13T18:00:00.000Z", [
  ex("e1", 132, [set({ weight: "30" }), set({ weight: "30" }), set({ weight: "30", reps: "10" })]),
  ex("e2", 139, [set({ weight: "60", reps: "15" }), set({ weight: "60", reps: "15" }), set({ weight: "60", reps: "14" }), set({ weight: "60", reps: "12" })]),
])];

/**
 * One week of what the release-gate histories leave out: Both, one arm and no arm recorded on an
 * either-way exercise (350), one arm and none on one-arm ones, one arm and Both recorded on a
 * two-handed one (132: the logger does not ask there, but an import or a swapped exercise can hold
 * a side, and the recorded side is what counts), a warm-up, a skipped set, straps yes, no and
 * unknown, a drop set, an exercise matched by name, holds, region-only work, a workout not
 * finished, a skipped-sets stamp and a skipped exercise.
 */
const edgeSessions: DeviceWorkoutSession[] = [
  done("edge-1", "2026-10-14T18:00:00.000Z", [
    ex("x1", 350, [set({ id: "x1a", side: "both" }), set({ id: "x1b", side: "left" }), set({ id: "x1c" }), set({ id: "x1d", warmup: true }), set({ id: "x1e", completed: false, skipped: true })]),
    ex("x2", 410, [set({ id: "x2a", side: "right" }), set({ id: "x2b", side: "left" }), set({ id: "x2c" })]),
    ex("x3", 145, [set({ id: "x3a", reps: "", holdSeconds: "45" }), set({ id: "x3b", reps: "", holdSeconds: "30" })], { straps: "yes" }),
    ex("x4", 143, [set({ id: "x4a", reps: "", holdSeconds: "35" })]),
    ex("x5", 43, [set({ id: "x5a", weight: "135" }), set({ id: "x5b", weight: "135" })], { straps: "no" }),
    ex("x6", 46, [set({ id: "x6a", side: "right" }), set({ id: "x6b" })], { straps: "yes" }),
    ex("x7", 139, [set({ id: "x7a", type: "drop", stages: [{ id: "x7a-1", weight: "60", reps: "10" }, { id: "x7a-2", weight: "40", reps: "8" }] })]),
    ex("x8", undefined, [set({ id: "x8a" }), set({ id: "x8b" })], { exerciseName: "Reverse Wrist Curl" }),
    ex("x9", 409, [set({ id: "x9a", reps: "", holdSeconds: "40", side: "left" }), set({ id: "x9b", reps: "", holdSeconds: "40" })]),
    ex("x10", 24, [set({ id: "x10a" }), set({ id: "x10b", side: "right" })]),
    ex("x11", 190, [set({ id: "x11a" })]),
    ex("x12", 200, [set({ id: "x12a" })]),
    ex("x13", 135, [set({ id: "x13a" })], { skippedSets: 2 }),
    ex("x14", 132, [set({ id: "x14a", side: "left" }), set({ id: "x14b", side: "right", warmup: true }), set({ id: "x14c", side: "both" })]),
  ], { notPerformed: [{ exerciseName: "Wrist Roller", catalogId: 141, plannedSets: 2, skipped: true }] } as Partial<DeviceWorkoutSession>),
  { ...done("edge-2", "2026-10-16T18:00:00.000Z", [ex("y1", 411, [set({ id: "y1a" }), set({ id: "y1b", side: "right" })])]), status: "active", completedAt: undefined } as unknown as DeviceWorkoutSession,
];

/** Targets on a muscle, a movement, an external muscle (the biceps) and an adjacent one (the anconeus), each arm, both periods. */
const goal = (id: string, over: Partial<SpecializationGoal>): SpecializationGoal => ({
  id, regionId: "forearm", nodeId: null, actionId: null, side: "left", metric: "direct_dynamic_bouts", target: 6, period: "calendar_week",
  startsOn: "2025-01-01", endsOn: null, timezone: TZ, createdAt: "2025-01-01T08:00:00.000Z", updatedAt: "2025-01-01T08:00:00.000Z", ...over,
});
export const goldenGoals: SpecializationGoal[] = (["left", "right"] as const).flatMap((side) => [
  goal(`br-${side}`, { side, nodeId: "forearm.br" }),
  goal(`fcu-${side}`, { side, nodeId: "forearm.fcu", period: "rolling_7d", target: 9 }),
  goal(`fds-hold-${side}`, { side, nodeId: "forearm.fds", metric: "deliberate_hold_seconds", target: 300 }),
  goal(`fdp-bouts-${side}`, { side, nodeId: "forearm.fdp", metric: "deliberate_hold_bouts", period: "rolling_7d", target: 4 }),
  goal(`wrist-flexion-${side}`, { side, actionId: "wrist.flexion", target: 8 }),
  goal(`pip-hold-${side}`, { side, actionId: "fingers.pip_flexion", metric: "deliberate_hold_seconds", period: "rolling_7d", target: 200 }),
  goal(`elbow-${side}`, { side, actionId: "elbow.flexion", metric: "direct_dynamic_bouts", target: 10 }),
  goal(`biceps-${side}`, { side, nodeId: "upper_arm.biceps", metric: "direct_dynamic_bouts", target: 5 }),
  goal(`anconeus-${side}`, { side, nodeId: "forearm.anconeus", metric: "direct_dynamic_bouts", target: 3 }),
]);

/** A plan week as Home holds it: day keys from the split, catalog rows as entries, prescriptions by entry id. */
function planWeek(split: string[], entries: [number, string | null][][]): { slots: ReturnType<typeof buildDaySlots>; store: WeeklyDayStore } {
  const slots = buildDaySlots(split as never);
  const store = emptyDayStore();
  slots.forEach((slot, index) => {
    store.plan[slot.key] = entries[index].map(([id]) => exerciseOf(id));
    store.prescriptions[slot.key] = Object.fromEntries(entries[index].filter(([, text]) => text !== null).map(([id, text]) => [id, text as string]));
  });
  return { slots, store };
}

/**
 * The plans: page-cost.mjs and page-offline.mjs's week (Upper: 1, 45, 132; Lower: 167; Upper: 3,
 * 139, 140; Lower: 168; prescriptions from the training goal), and the four day templates as
 * written prescriptions, holds in seconds, which plan the one-arm exercises (46, 410, 411).
 */
const plans = [
  { id: "release-gate-plan", goal: "Muscle growth" as const, ...planWeek(["Upper", "Lower", "Upper", "Lower"], [[[1, null], [45, null], [132, null]], [[167, null]], [[3, null], [139, null], [140, null]], [[168, null]]]) },
  { id: "day-templates-plan", goal: undefined, ...planWeek(days.map((day) => day.title), days.map((day) => day.items.map(([id, sets]): [number, string] => [id, holdIds.has(id) ? `${sets} × 40 sec` : `${sets} × 8–12`]))) },
];

export type GoldenCase = { id: string; summary: SpecializationSummary };

/** JSON with every object's keys sorted, so equal summaries give equal text whatever order their fields were built in. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, item) => (item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]])) : item));
}

/**
 * A summary's totals without its set records: the region's numbers, completeness, goals, and each
 * node's counts with the number of rows behind them. What the reference keeps in full where the
 * whole summary would be too large to commit; the digest holds the rest.
 */
export function summaryTotals(summary: SpecializationSummary): unknown {
  const { nodes, regionBoutRows, regionUnknownSideRows, regionUnclassifiedRows, ...rest } = summary;
  return {
    ...rest,
    rows: { regionBoutRows: regionBoutRows?.length ?? null, regionUnknownSideRows: regionUnknownSideRows?.length ?? null, regionUnclassifiedRows: regionUnclassifiedRows?.length ?? null },
    nodes: nodes.map(({ contributions, notCounted, ...counts }) => ({ ...counts, contributions: contributions.length, notCounted: notCounted?.length ?? null })),
  };
}

/** Every golden summary, in a fixed order. */
export function goldenSummaries(): GoldenCase[] {
  const deps = { catalog, variants: region.variants, fallbackUnit: "kg" as const };
  const completed: [string, DeviceWorkoutSession[]][] = [
    ["one-week-4", history(1, 4)],
    ["year-4", history(52, 4)],
    ["heavy-year-6x2.5", history(52, 6, 2.5)],
    ["offline-week", offlineSessions],
    ["edge-week", edgeSessions],
  ];
  const intervals: [string, SummaryInterval][] = [
    ["calendar-week", calendarWeekInterval(GOLDEN_NOW, TZ)],
    ["rolling-7d", rolling7dInterval(GOLDEN_NOW, TZ)],
    ["custom-year", customInterval("2025-10-18", "2026-10-17", TZ)],
  ];
  const out: GoldenCase[] = [];
  const summarize = (bouts: readonly ExposureBout[], interval: SummaryInterval, side: "left" | "right", mode: "completed" | "planned") =>
    getSpecializationSummary({ region, bouts, interval, side, mode, goals: goldenGoals, catalogMusclesFor, sourceRevision: "golden", planRevision: mode === "planned" ? "golden-plan" : null, now: GOLDEN_NOW });
  for (const [historyId, sessions] of completed) {
    const bouts = [...boutsFromSessions(sessions, deps), ...excludedRecordsFromSessions(sessions, deps)];
    for (const [intervalId, interval] of intervals) {
      for (const side of ["left", "right"] as const) out.push({ id: `completed/${historyId}/${intervalId}/${side}`, summary: summarize(bouts, interval, side, "completed") });
    }
  }
  for (const plan of plans) {
    const bouts = boutsFromPlan({ week: 1, slots: plan.slots, store: plan.store, variants: planningVariants, goal: plan.goal });
    for (const side of ["left", "right"] as const) out.push({ id: `planned/${plan.id}/${side}`, summary: summarize(bouts, planWeekInterval(1, TZ), side, "planned") });
  }
  return out;
}
