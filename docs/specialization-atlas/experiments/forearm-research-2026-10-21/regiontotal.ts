import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
import { gymAccessProfiles } from "/home/user/Sports-genome/client/src/lib/equipmentProfile";
import { splitDaysForFrequency } from "/home/user/Sports-genome/client/src/lib/splitCycle";
import { buildDaySlots, commitDay, emptyDayStore } from "/home/user/Sports-genome/client/src/lib/trainingDayPlan";
import { forearmRegionData as R } from "/home/user/Sports-genome/shared/specialization/regions/forearm/index";
import { designStack, plannedSummaries, directBoutsOnArm } from "./stackDesigner";
const byId = new Map(exercises.map((e) => [e.id, e] as const));
const slots = buildDaySlots(splitDaysForFrequency(3));
let store = emptyDayStore();
const content = [[161, 1, 43, 103, 150], [41, 4, 66, 111, 121], [173, 2, 54, 186, 132]];
slots.forEach((s, i) => { store = commitDay(store, s.key, { workout: content[i].map((id) => byId.get(id)!), prescriptions: {}, settings: {}, context: [] }); });
const base = { region: R, catalog: exercises, week: 1, slots, store, goal: "Muscle growth" as const, goals: [], now: "2026-10-21T12:00:00Z" };
const before = plannedSummaries(base);
const r = designStack({ ...base, gymMinutes: 60, equipment: { gymAccess: "Commercial gym", availableEquipment: gymAccessProfiles["Commercial gym"] }, exclusions: { catalogExerciseIds: [], equipment: [] }, totalPerArm: null, leaveOut: [], includeHolds: false, keepOneDayFree: true });
const after = plannedSummaries(base, r.storeAfter);
for (const [label, s] of [["before", before], ["after", after]] as const) {
  console.log(label, "regionDistinctBouts right", s.right.regionDistinctBouts, "direct", directBoutsOnArm(R, s.right).size, "fds incidental", s.right.nodes.find((n) => n.nodeId === "forearm.fds")!.incidentalBouts, "br contributing", s.right.nodes.find((n) => n.nodeId === "forearm.br")!.contributingDynamicBouts);
}
// Undo check: revert every change in reverse and compare to the original store.
import { applyPlanChangeToRecord } from "/home/user/Sports-genome/client/src/lib/specialization/planChange";
import { loadDay } from "/home/user/Sports-genome/client/src/lib/trainingDayPlan";
let s2 = store; const reverts: { key: string; revert: (d: any) => any }[] = [];
for (const c of r.changes) { const o = applyPlanChangeToRecord(loadDay(s2, c.dayKey), c, byId.get(c.catalogExerciseId)!); if (!o.ok) throw new Error(o.reason); s2 = commitDay(s2, c.dayKey, o.record); reverts.push({ key: c.dayKey, revert: o.revert }); }
console.log("applied equals designer's storeAfter:", JSON.stringify(s2) === JSON.stringify(r.storeAfter));
for (const { key, revert } of reverts.reverse()) s2 = commitDay(s2, key, revert(loadDay(s2, key)));
console.log("undo restores the plan exactly:", JSON.stringify(s2) === JSON.stringify(store));
console.log("plan's own entries untouched:", slots.every((sl) => JSON.stringify(r.storeAfter.plan[sl.key].slice(0, store.plan[sl.key].length).map((e) => e.id)) === JSON.stringify(store.plan[sl.key].map((e) => e.id))));
console.log("prescriptions written:", JSON.stringify(r.storeAfter.prescriptions));
