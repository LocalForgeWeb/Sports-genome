import { exercises } from "@/lib/exerciseCatalog";
import { buildDaySlots, emptyDayStore } from "@/lib/trainingDayPlan";

/**
 * One week of forearm work, and a plan, that reaches every kind of row on the forearm page:
 * two-handed, one-arm, either-way with Both, one and no arm, holds, straps, region-only work, a set
 * matched by name, a warm-up, an unfinished workout, more one-arm work on the right than on the left
 * (the finding on a difference between the arms), and a sled push (296: an exercise the forearm
 * leaves unmapped by name, listed under "How this is counted"); with targets on target muscles, on a
 * movement, and saved earlier on the biceps (external, right arm only) and the anconeus (adjacent,
 * left arm only), so each arm shows each of them both with a target and without one, and the
 * brachialis with none. The page's reading tests (pageNumbers.render.test.ts,
 * pageText.render.test.ts) render it, and so did their reference readings at 3986178, the shipped
 * page, so the scenario lives here once.
 */

export const NOW = "2026-10-16T12:00:00.000Z";

const byId = (id: number) => exercises.find((exercise) => exercise.id === id)!;
const nameOf = (id: number) => byId(id).name;

export const slots = buildDaySlots(["Upper", "Lower", "Upper", "Lower"]);
export const store = { ...emptyDayStore(), plan: { [slots[0].key]: [byId(1), byId(45), byId(132)], [slots[1].key]: [byId(167)], [slots[2].key]: [byId(3), byId(139), byId(140)], [slots[3].key]: [byId(168)] } };
/** The same plan with a one-arm exercise on Day 01, the One-Arm Dumbbell Wrist Curl (410), which the plan assumes on both sides. */
export const storeWithOneArm = { ...store, plan: { ...store.plan, [slots[0].key]: [...store.plan[slots[0].key], byId(410)] } };

const set = (over: Record<string, unknown> = {}) => ({ weight: "30", reps: "12", unit: "lb", completed: true, ...over });
const hold = (seconds: number, over: Record<string, unknown> = {}) => ({ weight: "", reps: "", holdSeconds: String(seconds), unit: "lb", completed: true, ...over });
const ex = (id: string, catalogId: number | null, sets: Record<string, unknown>[], over: Record<string, unknown> = {}) => ({ id, exerciseName: catalogId === null ? "Reverse Wrist Curl" : nameOf(catalogId), ...(catalogId === null ? {} : { catalogId }), plannedPrescription: `${sets.length} × 12`, sets, ...over });
const workout = (id: string, completedAt: string, exercisesDone: unknown[], over: Record<string, unknown> = {}) => ({ id, title: "Pull", dayLabel: "Week 1 · Day 02 · Pull", startedAt: new Date(Date.parse(completedAt) - 3_600_000).toISOString(), completedAt, status: "completed", exercises: exercisesDone, ...over });

export const sessions = [
  workout("w-12", "2026-10-12T18:00:00.000Z", [ex("f1", 410, [set({ side: "right" }), set({ side: "right" }), set({ side: "right" })])]),
  workout("w-8", "2026-10-08T18:00:00.000Z", [ex("a1", 139, [set(), set(), set()]), ex("a2", 143, [hold(40), hold(35)])]),
  workout("w-13", "2026-10-13T18:00:00.000Z", [ex("b1", 132, [set(), set(), set({ reps: "10" })]), ex("b2", 139, [set({ weight: "60" }), set({ weight: "60" }), set({ weight: "60", warmup: true })])]),
  workout("w-14", "2026-10-14T18:00:00.000Z", [
    ex("c1", 350, [set({ side: "both" }), set({ side: "left" }), set()]),
    ex("c2", 410, [set({ side: "right" }), set({ side: "left" }), set()]),
    ex("c3", 145, [hold(45), hold(30)], { straps: "yes" }),
    ex("c4", 43, [set({ weight: "135" }), set({ weight: "135" })], { straps: "no" }),
    ex("c5", 46, [set({ side: "right" }), set()], { straps: "yes" }),
    ex("c6", 24, [set(), set({ side: "right" })]),
    ex("c7", 190, [set()]),
    ex("c8", null, [set(), set()]),
    ex("c9", 409, [hold(40, { side: "left" }), hold(40)]),
  ]),
  workout("w-15", "2026-10-15T18:00:00.000Z", [ex("d1", 140, [set(), set(), set()]), ex("d2", 135, [set()]), ex("d3", 296, [set({ weight: "180", reps: "1" })])]),
  { ...workout("w-16", "2026-10-16T10:00:00.000Z", [ex("e1", 411, [set(), set({ side: "right" })])]), status: "active", completedAt: undefined },
];

const goal = (id: string, over: Record<string, unknown>) => ({ id, regionId: "forearm", nodeId: null, actionId: null, side: "left", metric: "direct_dynamic_bouts", target: 6, period: "calendar_week", startsOn: "2026-01-01", endsOn: null, timezone: "UTC", createdAt: "2026-01-01T08:00:00.000Z", updatedAt: "2026-01-01T08:00:00.000Z", ...over });
export const goals = (["left", "right"] as const).flatMap((side) => [
  goal(`br-${side}`, { side, nodeId: "forearm.br" }),
  goal(`fds-${side}`, { side, nodeId: "forearm.fds", metric: "deliberate_hold_seconds", target: 300 }),
  goal(`wrist-${side}`, { side, actionId: "wrist.flexion", target: 8 }),
  ...(side === "right" ? [goal(`biceps-${side}`, { side, nodeId: "upper_arm.biceps", target: 5 })] : []),
  ...(side === "left" ? [goal(`anconeus-${side}`, { side, nodeId: "forearm.anconeus", target: 3 })] : []),
]);
