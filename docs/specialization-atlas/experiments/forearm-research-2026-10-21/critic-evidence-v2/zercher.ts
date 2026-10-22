/** Critic experiment: does a plan's own carry or hang (a deliberate hold) count as "direct" coverage of finger flexion, with Holds off? */
import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
import { gymAccessProfiles } from "/home/user/Sports-genome/client/src/lib/equipmentProfile";
import { splitDaysForFrequency } from "/home/user/Sports-genome/client/src/lib/splitCycle";
import { buildDaySlots, commitDay, emptyDayStore } from "/home/user/Sports-genome/client/src/lib/trainingDayPlan";
import { forearmRegionData as R } from "/home/user/Sports-genome/shared/specialization/regions/forearm/index";
import { designStack } from "../architect-v2/stackDesigner";
const byId = new Map(exercises.map((e) => [e.id, e] as const));
const NOW = "2026-10-21T12:00:00.000Z";
function planOf(content: number[][]) {
  const slots = buildDaySlots(splitDaysForFrequency(content.length));
  let store = emptyDayStore();
  slots.forEach((slot, i) => { store = commitDay(store, slot.key, { workout: (content[i] ?? []).map((id) => byId.get(id)!), prescriptions: {}, settings: {}, context: [] }); });
  return { slots, store };
}
const base = [[161, 1, 43, 103, 150], [41, 4, 66, 111, 121], [173, 2, 54, 186]];
const withCarry = [[161, 1, 43, 103, 150, 300], [41, 4, 66, 111, 121], [173, 2, 54, 186]];
for (const [label, content] of [["Plan A without Hammer Curl", base], ["Plan A without Hammer Curl + Zercher Carry (300) on Day 01", withCarry]] as const) {
  const { slots, store } = planOf(content as number[][]);
  const r = designStack({ region: R, catalog: exercises, week: 1, slots, store, goal: "Muscle growth", gymMinutes: 60, equipment: { gymAccess: "Commercial gym", availableEquipment: gymAccessProfiles["Commercial gym"] }, exclusions: { catalogExerciseIds: [], equipment: [] }, goals: [], totalPerArm: null, leaveOut: [], includeHolds: false, now: NOW, keepOneDayFree: false });
  console.log(`== ${label} (Holds off): plan's own direct sets right ${r.existingDirectPerArm.right}; start ${r.startValue}; adds ${r.entries.map((e) => `${e.name} ${e.setsPerWeek}`).join(", ")}`);
  console.log(`   muscles with direct work ${r.check.musclesWithDirect.before} -> ${r.check.musclesWithDirect.after}; gaps left: ${r.check.remainingGaps.join("; ") || "none"}`);
}
