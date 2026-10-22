// Critic experiment: what Plan's own day review (getWorkoutDiagnostics) says about each day after the
// prototype stack is applied, against the stack's own minute estimate. Prototype functions, real catalog.
import { exercises as catalog, type Exercise } from "@/lib/exerciseCatalog";
import { splitDaysForFrequency } from "@/lib/splitCycle";
import { buildDaySlots, emptyDayStore, commitDay, loadDay, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { getWorkoutDiagnostics, type TrainingGoal } from "@/lib/workoutPlanner";
import { forearmRegionData as region } from "@shared/specialization/regions/forearm/index";
import type { SpecializationGoal } from "@shared/specialization/types";
import { applyAll, buildModel, designStack, equipmentFor, type StackInput } from "../stackDesigner";

const byId = new Map(catalog.map((e) => [e.id, e] as const));
const model = buildModel(region);
function planOf(days: number, content: (number | [number, string])[][]) {
  const slots = buildDaySlots(splitDaysForFrequency(days));
  let store = emptyDayStore();
  slots.forEach((slot, i) => {
    const items = content[i] ?? [];
    const workout: Exercise[] = items.map((item) => byId.get(Array.isArray(item) ? item[0] : item)!);
    const prescriptions: Record<number, string> = {};
    for (const item of items) if (Array.isArray(item)) prescriptions[item[0]] = item[1];
    store = commitDay(store, slot.key, { workout, prescriptions, settings: {}, context: [] });
  });
  return { slots, store };
}
const goalRow = (id: string, side: "left" | "right", nodeId: string, metric: SpecializationGoal["metric"], target: number): SpecializationGoal => ({ id, regionId: "forearm", nodeId, actionId: null, side, metric, target, period: "calendar_week", startsOn: "2026-10-01", endsOn: null, timezone: "UTC", createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z" });
const fullBody3 = [[161, 1, 43, 111], [42, 101, 57, 123], [169, 5, 54, 150]];
const upperLower4: (number | [number, string])[][] = [[1, 43, 101, 66, [132, "3 × 8–12"], 148], [161, 42, 171, 194, 221], [5, 54, 103, 57, 123, 150], [41, 163, 173, 206, [299, "3 × 30 sec"]]];
const split5: (number | [number, string])[][] = [[1, 101, 5, 111, 150], [41, 66, 43, 87, 121, [139, "3 × 12–15"]], [161, 42, 169, 194, 221], [4, 54, 103, 57, 132], [286, 271, 177, 299]];
const base = { maxExercisesPerDay: 4, maxSetsPerSession: 3, minutesPerDay: 15, includeHolds: false };
const scenarios = [
  { id: "P1", days: 3, content: fullBody3, goal: "Muscle growth" as TrainingGoal, gymMinutes: 60, access: "Commercial gym" as const, goals: [] as SpecializationGoal[], over: {} },
  { id: "P2", days: 4, content: upperLower4, goal: "Max strength" as TrainingGoal, gymMinutes: 75, access: "Commercial gym" as const, goals: [goalRow("g1", "right", "forearm.ecu", "direct_dynamic_bouts", 6), goalRow("g2", "left", "forearm.ecu", "direct_dynamic_bouts", 6), goalRow("g3", "right", "forearm.fds", "deliberate_hold_seconds", 120), goalRow("g4", "left", "forearm.fds", "deliberate_hold_seconds", 90)], over: {} },
  { id: "P3", days: 5, content: split5, goal: "Athleticism" as TrainingGoal, gymMinutes: 60, access: "Small gym" as const, goals: [], over: { totalSets: 20, includeHolds: true } },
];
for (const sc of scenarios) {
  const { slots, store } = planOf(sc.days, sc.content);
  const input: StackInput = { model, week: 1, slots, store, goal: sc.goal, gymMinutes: sc.gymMinutes, equipment: equipmentFor(sc.access), exclusions: { catalogExerciseIds: [], equipment: [] }, goals: sc.goals, ...base, ...sc.over } as StackInput;
  const design = designStack(input);
  const applied = applyAll(store, design.changes);
  if (!applied.ok) { console.log(sc.id, "refused", applied.reason); continue; }
  console.log(`## ${sc.id} (${sc.goal}, ${sc.gymMinutes} min)`);
  for (const slot of slots) {
    const diag = (s: WeeklyDayStore) => { const r = loadDay(s, slot.key); return getWorkoutDiagnostics(r.workout, r.prescriptions, r.settings, sc.goal, sc.gymMinutes); };
    const b = diag(store), a = diag(applied.store);
    const stackMin = design.placements.filter((p) => p.dayKey === slot.key).reduce((s, p) => s + p.minutes, 0);
    const newPrompts = a.prompts.filter((p) => !b.prompts.includes(p));
    console.log(`${slot.label}: exercises ${b.totalSets ? (loadDay(store, slot.key).workout.length) : 0}→${loadDay(applied.store, slot.key).workout.length}; Plan sets ${b.totalSets}→${a.totalSets} (band ${a.target.sessionSetBand.join("–")}); Plan minutes ${b.estimatedMinutes}→${a.estimatedMinutes} (+${a.estimatedMinutes - b.estimatedMinutes}); stack says about ${stackMin.toFixed(1)} min`);
    for (const p of newPrompts) console.log(`   NEW Plan prompt: ${p}`);
  }
}
