/**
 * What the summary costs on a representative device history (brief §11: "Review bundle/asset
 * sizes and summary query plan on representative data"). The summary is computed on the device,
 * so its "query plan" is this: the adapters over the workout log, then the calculator, then the
 * page's memo (useSpecializationSummary.ts). Plain Node timings on whatever CPU runs it, not a
 * phone. Results: docs/specialization-atlas/README.md, "Release gates".
 *
 *   npx tsx scripts/specialization/release-gates/summary-cost.ts
 */
import type { DeviceSetLog, DeviceWorkoutExercise, DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises as catalog } from "@/lib/exerciseCatalog";
import { boutsFromSessions, excludedRecordsFromSessions } from "@/lib/specialization/bouts";
import { sourceRevision } from "@/lib/specialization/revision";
import { catalogMusclesLookup, clearSummaryCache, computeSpecializationSummary } from "@/lib/specialization/useSpecializationSummary";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { regionDataFor } from "@shared/specialization/registry";
import { calendarWeekInterval, customInterval, intervalContains, rolling7dInterval } from "@shared/specialization/time";
import type { ArmSide, ExposureBout, SummaryInterval } from "@shared/specialization/types";

const region = regionDataFor("forearm")!;
const TZ = "Europe/London";
const NOW = "2026-10-17T18:00:00.000Z";

// Four day templates, rotated: pressing, pulling, legs, arms. Forearm-mapped work sits beside
// exercises the atlas does not map, as in a real plan.
const days: { title: string; items: [number, number][] }[] = [
  { title: "Push", items: [[1, 4], [2, 4], [5, 3], [20, 3], [150, 3], [139, 3]] },
  { title: "Pull", items: [[43, 4], [66, 4], [46, 3], [81, 3], [121, 3], [143, 3]] },
  { title: "Legs", items: [[41, 4], [220, 3], [210, 3], [200, 3], [145, 3], [140, 3]] },
  { title: "Arms", items: [[132, 4], [135, 3], [410, 3], [411, 3], [160, 3], [100, 3]] },
];
const nameOf = new Map(catalog.map((exercise) => [exercise.id, exercise.name]));
const holdIds = new Set(region.variants.filter((variant) => variant.measure === "seconds").map((variant) => variant.catalogExerciseId));
const oneArm = new Set(region.variants.filter((variant) => variant.laterality === "unilateral").map((variant) => variant.catalogExerciseId));

function history(weeks: number, perWeek: number, setsScale = 1): DeviceWorkoutSession[] {
  const sessions: DeviceWorkoutSession[] = [];
  const end = Date.parse(NOW);
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

function time<T>(label: string, runs: number, fn: () => T): { ms: number; value: T } {
  let value = fn(); // warm-up run (JIT), not counted
  const t0 = performance.now();
  for (let i = 0; i < runs; i += 1) value = fn();
  const ms = (performance.now() - t0) / runs;
  console.log(`${label.padEnd(64)} ${ms.toFixed(2).padStart(8)} ms`);
  return { ms, value };
}

const catalogMusclesFor = catalogMusclesLookup(catalog);
const intervals: [string, SummaryInterval][] = [
  ["calendar week", calendarWeekInterval(NOW, TZ)],
  ["rolling 7 days", rolling7dInterval(NOW, TZ)],
  ["custom, the whole year", customInterval("2025-10-18", "2026-10-17", TZ)],
];

for (const [label, sessions] of [
  ["a year, 4 workouts a week, 6 exercises, 3-4 sets", history(52, 4)],
  ["a heavy year, 6 workouts a week, sets x2.5", history(52, 6, 2.5)],
] as const) {
  const sets = sessions.reduce((n, s) => n + s.exercises.reduce((m, e) => m + e.sets.length, 0), 0);
  console.log(`\n== ${label}: ${sessions.length} workouts, ${sets} sets, ${JSON.stringify(JSON.stringify(sessions).length)} bytes of JSON`);
  const deps = { catalog, variants: region.variants, fallbackUnit: "kg" as const };
  const rev = time("sourceRevision (once per change to the log)", 20, () => sourceRevision(sessions)).value;
  const bouts = time("boutsFromSessions + excluded records (once per change to the log)", 20, () => [...boutsFromSessions(sessions, deps), ...excludedRecordsFromSessions(sessions, deps)]).value as ExposureBout[];
  console.log(`  bouts: ${bouts.length}`);
  for (const [name, interval] of intervals) {
    time(`getSpecializationSummary, ${name}, one arm`, 20, () => getSpecializationSummary({ region, bouts, interval, side: "right", mode: "completed", goals: [], catalogMusclesFor, sourceRevision: rev, planRevision: null, now: NOW }));
  }
  // The page: this arm, the other arm, and the pair line (this week, planned). Completed mode, this week.
  const inputs = (side: ArmSide, interval: SummaryInterval) => ({ region, accountScope: null, interval, side, mode: "completed" as const, goals: [], completedBouts: bouts, plannedBouts: [], sourceRevision: rev, planRevision: null, catalogMusclesFor, now: NOW });
  const week = intervals[0][1];
  clearSummaryCache();
  let t0 = performance.now();
  computeSpecializationSummary(inputs("right", week));
  computeSpecializationSummary(inputs("left", week));
  const cold = performance.now() - t0;
  t0 = performance.now();
  for (let i = 0; i < 100; i += 1) {
    computeSpecializationSummary(inputs("right", week));
    computeSpecializationSummary(inputs("left", week));
  }
  const warm = (performance.now() - t0) / 100;
  console.log(`${"page render, both arms this week: cache cold".padEnd(64)} ${cold.toFixed(2).padStart(8)} ms`);
  console.log(`${"page render, both arms this week: cache hit (arm or window back)".padEnd(64)} ${warm.toFixed(3).padStart(8)} ms`);
  // Progress: eight weekly summaries per arm (MeasurementsPanel builds them from the week's bouts).
  time("Progress: bouts + 8 weekly summaries (each on its week's bouts), one arm", 10, () => {
    const all = boutsFromSessions(sessions, deps);
    for (let k = 0; k < 8; k += 1) {
      const start = new Date(Date.parse(NOW) - k * 7 * 86_400_000).toISOString();
      const interval = calendarWeekInterval(start, TZ);
      const weekBouts = all.filter((bout) => intervalContains(interval, bout.performedAt));
      getSpecializationSummary({ region, bouts: weekBouts, interval, side: "right", mode: "completed", goals: [], catalogMusclesFor, sourceRevision: "", planRevision: null, now: interval.startAt ?? NOW });
    }
  });
}
