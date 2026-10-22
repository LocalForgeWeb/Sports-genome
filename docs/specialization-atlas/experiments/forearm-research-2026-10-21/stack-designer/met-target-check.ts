import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
import { gymAccessProfiles } from "/home/user/Sports-genome/client/src/lib/equipmentProfile";
import { splitDaysForFrequency } from "/home/user/Sports-genome/client/src/lib/splitCycle";
import { buildDaySlots, commitDay, emptyDayStore } from "/home/user/Sports-genome/client/src/lib/trainingDayPlan";
import { forearmRegionData as R } from "/home/user/Sports-genome/shared/specialization/regions/forearm/index";
import type { SpecializationGoal } from "/home/user/Sports-genome/shared/specialization/types";
import { designStack } from "./stackDesigner";
const byId = new Map(exercises.map((e) => [e.id, e] as const));
const slots = buildDaySlots(splitDaysForFrequency(4));
let store = emptyDayStore();
const content = [[1, 43, 103, 57, 121], [161, 186, 171, 194], [5, 47, 66, 111, 139, 140], [41, 173, 206, 195]];
slots.forEach((s, i) => { store = commitDay(store, s.key, { workout: content[i].map((id) => byId.get(id)!), prescriptions: i === 2 ? { 139: "3 × 15", 140: "3 × 15" } : {}, settings: {}, context: [] }); });
const NOW = "2026-10-21T12:00:00.000Z";
const g = (id: string, nodeId: string, side: "left" | "right"): SpecializationGoal => ({ id, regionId: "forearm", nodeId, actionId: null, side, metric: "direct_dynamic_bouts", target: 3, period: "calendar_week", startsOn: "2026-10-19", endsOn: null, timezone: "Europe/London", createdAt: NOW, updatedAt: NOW });
const goals = ["forearm.fcu", "forearm.ecu"].flatMap((n) => [g(`${n}:l`, n, "left"), g(`${n}:r`, n, "right")]);
for (const total of [null, 40]) {
  const r = designStack({ region: R, catalog: exercises, week: 1, slots, store, goal: "Muscle growth", gymMinutes: 90, equipment: { gymAccess: "Commercial gym", availableEquipment: gymAccessProfiles["Commercial gym"] }, exclusions: { catalogExerciseIds: [], equipment: [] }, goals, totalPerArm: total, leaveOut: [], includeHolds: false, now: NOW, keepOneDayFree: true });
  console.log(`total ${total ?? `start ${r.startValue}`} → ${r.totalPerArm}, existing ${r.existingDirectPerArm.right}, added ${r.added}, unplanned ${r.leftUnplanned}`);
  for (const e of r.entries) console.log(`  ${e.name}: ${e.setsPerWeek}`);
  for (const n of r.notes) console.log("  note:", n);
}
