import { exercises } from "@/lib/exerciseCatalog";
import { boutsFromSessions } from "@/lib/specialization/bouts";
import { catalogMusclesLookup } from "@/lib/specialization/useSpecializationSummary";
import type { DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { forearmRegionData as data } from "@shared/specialization/regions/forearm";
import { calendarWeekInterval, addDaysToDateKey, customInterval, intervalContains } from "@shared/specialization/time";
const ids = [66, 43, 132, 139, 140, 145, 41, 57, 121, 135, 402, 142];
const sessions: DeviceWorkoutSession[] = [];
let k = 0;
for (let d = 0; d < 365; d += 2) {
  const day = addDaysToDateKey("2025-10-20", d);
  sessions.push({ id: `s${d}`, title: "t", dayLabel: "t", startedAt: `${day}T17:00:00.000Z`, completedAt: `${day}T18:00:00.000Z`, status: "completed", weightUnit: "kg",
    exercises: ids.slice(d % 3 * 4, d % 3 * 4 + 6).map((id, i) => ({ id: `e${d}-${i}`, exerciseName: exercises.find(e => e.id === id)!.name, catalogId: id, plannedPrescription: "", sets: Array.from({ length: 4 }, () => ({ id: `x${++k}`, weight: "20", reps: "10", completed: true })) })) });
}
const deps = { catalog: exercises, variants: data.variants, fallbackUnit: "kg" as const };
let t = performance.now();
const bouts = boutsFromSessions(sessions, deps);
console.log("bouts", bouts.length, "adapter ms", (performance.now() - t).toFixed(1));
const cm = catalogMusclesLookup(exercises);
t = performance.now();
for (let w = 0; w < 8; w++) for (const side of ["left", "right"] as const) for (let pass = 0; pass < 2; pass++) {
  const from = addDaysToDateKey("2026-08-31", 7 * w);
  const interval = customInterval(from, addDaysToDateKey(from, 6), "Europe/London");
  const inside = bouts.filter(b => intervalContains(interval, b.performedAt));
  getSpecializationSummary({ region: data, bouts: inside, interval, side, mode: "completed", goals: [], catalogMusclesFor: cm, sourceRevision: "", planRevision: null, now: "2026-10-20T12:00:00Z" });
}
console.log("32 weekly summaries ms", (performance.now() - t).toFixed(1));
t = performance.now();
for (const side of ["left", "right"] as const) {
  const interval = customInterval("2026-08-31", "2026-10-25", "Europe/London");
  const inside = bouts.filter(b => intervalContains(interval, b.performedAt));
  getSpecializationSummary({ region: data, bouts: inside, interval, side, mode: "completed", goals: [], catalogMusclesFor: cm, sourceRevision: "", planRevision: null, now: "2026-10-20T12:00:00Z" });
}
console.log("2 eight-week summaries ms (after warm-up)", (performance.now() - t).toFixed(1));
t = performance.now();
for (let w = 0; w < 8; w++) for (const side of ["left", "right"] as const) for (let pass = 0; pass < 2; pass++) {
  const from = addDaysToDateKey("2026-08-31", 7 * w);
  const interval = customInterval(from, addDaysToDateKey(from, 6), "Europe/London");
  const inside = bouts.filter(b => intervalContains(interval, b.performedAt));
  getSpecializationSummary({ region: data, bouts: inside, interval, side, mode: "completed", goals: [], catalogMusclesFor: cm, sourceRevision: "", planRevision: null, now: "2026-10-20T12:00:00Z" });
}
console.log("32 weekly summaries ms (after warm-up)", (performance.now() - t).toFixed(1));
