import { validateGoal } from "/home/user/Sports-genome/shared/specialization/goals";
import { getSpecializationSummary } from "/home/user/Sports-genome/shared/specialization/exposure";
import { forearmRegionData as f } from "/home/user/Sports-genome/shared/specialization/regions/forearm";
import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
import type { ExposureBout, SpecializationGoal } from "/home/user/Sports-genome/shared/specialization/types";
const base: SpecializationGoal = { id: "goal-1:left", regionId: "forearm", nodeId: "upper_arm.biceps", actionId: null, side: "left", metric: "direct_dynamic_bouts", target: 6, period: "calendar_week", startsOn: "2026-10-12", endsOn: null, timezone: "UTC", createdAt: "", updatedAt: "" };
console.log("today: a forearm-page target on the external biceps is accepted:", JSON.stringify(validateGoal(base, [])));
console.log("today: an adjacent (anconeus) target is accepted:", JSON.stringify(validateGoal({ ...base, id: "goal-2:left", nodeId: "forearm.anconeus" }, [])));
const upper = { ...base, id: "goal-3:left", regionId: "upper_arm" };
console.log("wave A: the same muscle, side, metric and period on the upper-arm page beside it:", JSON.stringify(validateGoal(upper, [base])));
// Goal progress on the forearm page counts the biceps through whatever version the index reads.
const catalogMusclesFor = (id: number | null) => { const e = exercises.find((x) => x.id === id); return e ? { primary: e.primaryMuscles, secondary: e.secondaryMuscles } : null; };
const bout = (id: string, cat: number, side: ExposureBout["side"]): ExposureBout => ({ id, mode: "completed", performedAt: "2026-10-14T10:00:00Z", sessionId: "s", sessionLabel: "s", planWeek: null, dayKey: null, exerciseEntryId: "e", catalogExerciseId: cat, exerciseName: "x", matchedBy: "id", side, sideSource: "recorded", straps: "unknown", warmup: false, effort: null, kind: "standard", segments: [{ id, reps: 10, loadKg: 20, holdSeconds: null }] });
const interval = { kind: "calendar_week" as const, startAt: "2026-10-12T00:00:00Z", endAtExclusive: "2026-10-19T00:00:00Z", timezone: "UTC", planWeek: null, label: "w" };
const s = getSpecializationSummary({ region: f, bouts: [bout("b1", 121, "bilateral"), bout("b2", 131, "unknown")], interval, side: "left", mode: "completed", goals: [base], catalogMusclesFor, sourceRevision: "r", planRevision: null, now: "2026-10-18T12:00:00Z" });
const row = s.nodes.find((n) => n.nodeId === "upper_arm.biceps")!;
console.log("forearm page today: biceps row direct", row.directDynamicBouts, "unknown-side", row.unknownSide.bouts, "| goal progress", s.goals.map((g) => g.label));
