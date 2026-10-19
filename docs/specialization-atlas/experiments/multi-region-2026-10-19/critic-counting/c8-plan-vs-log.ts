// Draft §2.1 rule 1 (midline: every bout once) and rule 5 (planned one-sided: each side) on
// one exercise the core will map: 409 Suitcase Carry, one hand, planned "3 x 30".
import { exercises } from "/home/user/Sports-genome/client/src/lib/exerciseCatalog";
import { buildDaySlots, emptyDayStore } from "/home/user/Sports-genome/client/src/lib/trainingDayPlan";
import { boutsFromPlan } from "/home/user/Sports-genome/client/src/lib/specialization/planBouts";
import { boutsFromSessions } from "/home/user/Sports-genome/client/src/lib/specialization/bouts";
import { forearmRegionData as f } from "/home/user/Sports-genome/shared/specialization/regions/forearm";
const carry = exercises.find((e) => e.id === 409)!;
const slots = buildDaySlots(["Pull"]);
const store = { ...emptyDayStore(), plan: { [slots[0].key]: [carry] }, prescriptions: { [slots[0].key]: { [carry.id]: "3 × 30" } } } as any;
const planned = boutsFromPlan({ week: 1, slots, store, variants: f.variants, goal: "Muscle growth" });
console.log("planned bouts:", planned.length, planned.map((b) => `${b.side}/${b.sideSource}`).join(", "));
// Logged as the tracker builds it for an athlete with a target (perArm: Right then Left per planned set).
const sets = [0, 1, 2].flatMap(() => ["right", "left"]).map((side, i) => ({ id: `set-${i}`, weight: "24", reps: "", holdSeconds: "30", completed: true, skipped: false, side }));
const session = { id: "s1", status: "completed", startedAt: "2026-10-14T10:00:00Z", completedAt: "2026-10-14T11:00:00Z", dayLabel: "Pull", title: "Pull", exercises: [{ id: "e1", exerciseName: carry.name, catalogId: 409, plannedPrescription: "3 × 30", perArm: true, sets }] } as any;
const logged = boutsFromSessions([session], { catalog: exercises, variants: f.variants, fallbackUnit: "kg" });
console.log("logged bouts:", logged.length, logged.map((b) => b.side).join(", "));
const onArm = (b: any, side: string) => b.side === "bilateral" || b.side === side;
console.log("paired (forearm, left arm): planned", planned.filter((b) => onArm(b, "left")).length, "| logged", logged.filter((b) => onArm(b, "left")).length);
console.log("midline (core, rule 1: every bout once): planned", planned.length, "| logged", logged.length);
