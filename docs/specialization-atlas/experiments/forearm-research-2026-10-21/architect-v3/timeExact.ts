import { exercises } from "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/client/src/lib/exerciseCatalog";
import { gymAccessProfiles } from "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/client/src/lib/equipmentProfile";
import { splitDaysForFrequency } from "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/client/src/lib/splitCycle";
import { buildDaySlots, commitDay, emptyDayStore } from "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/client/src/lib/trainingDayPlan";
import { forearmRegionData as R } from "/home/user/Sports-genome/.claude/worktrees/wf_ada23e77-21a-1/shared/specialization/regions/forearm/index";
import { designStack } from "./stackDesigner";
const byId = new Map(exercises.map((e) => [e.id, e] as const));
const NOW = "2026-10-21T12:00:00.000Z";
function planOf(days: number, content: number[][]) { const slots = buildDaySlots(splitDaysForFrequency(days)); let store = emptyDayStore(); slots.forEach((slot, i) => { store = commitDay(store, slot.key, { workout: (content[i] ?? []).map((id) => byId.get(id)!), prescriptions: {}, settings: {}, context: [] }); }); return { slots, store }; }
const g = (id: string, nodeId: string | null, actionId: string | null, metric: any, target: number) => ({ id, regionId: "forearm", nodeId, actionId, side: "right", metric, target, period: "calendar_week", startsOn: "2026-10-19", endsOn: null, timezone: "Europe/London", createdAt: NOW, updatedAt: NOW });
const B = planOf(4, [[1, 43, 103, 57, 121, 150], [161, 186, 171, 194, 221], [5, 47, 66, 111, 148, 123], [41, 173, 206, 195, 222]]);
const goals = [g("fcu", "forearm.fcu", null, "direct_dynamic_bouts", 8), g("fds", "forearm.fds", null, "deliberate_hold_seconds", 120), g("sup", null, "forearm.supination", "direct_dynamic_bouts", 6)];
for (const verify of [false, true, false, true]) {
  const t = performance.now();
  const r = designStack({ region: R as any, catalog: exercises, week: 1, slots: B.slots, store: B.store, goal: "Muscle growth", gymMinutes: 75, equipment: { gymAccess: "Commercial gym", availableEquipment: gymAccessProfiles["Commercial gym"] }, exclusions: { catalogExerciseIds: [], equipment: [] }, goals: goals as any, totalPerArm: null, leaveOut: [], includeHolds: false, now: NOW, keepOneDayFree: false, verifyPlacement: verify });
  console.log(verify ? "with exact" : "local only", (performance.now() - t).toFixed(1), "ms", JSON.stringify(r.timings.placement));
}
