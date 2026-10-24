import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { gymAccessProfiles, type GymAccess } from "@/lib/equipmentProfile";
import { splitDaysForFrequency } from "@/lib/splitCycle";
import { buildDaySlots, commitDay, emptyDayStore, loadDay, type DayRecord, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { NOTHING_TO_REVIEW_PROMPT, getGoalPrescription, type TrainingGoal } from "@/lib/workoutPlanner";
import { composeRegionData } from "@shared/specialization/compose";
import { directWorkCount } from "@shared/specialization/directWork";
import { forearmRegionData as forearmV2 } from "@shared/specialization/regions/forearm";
import { forearmRegionDataV1 as forearm } from "./__fixtures__/forearmV1";
import { repProfileExtras as forearmProfiles } from "@shared/specialization/regions/forearm/repProfiles";
import type { RegionExtras, SpecializationGoal, SpecializationRegionData } from "@shared/specialization/types";
import { applyPlanChangeToRecord } from "./planChange";
import {
  STACK_RULES,
  bringBackMovement,
  chooseExercise,
  dayChoicesFor,
  defaultStackSettings,
  designStack,
  leaveOutMovement,
  moveRow,
  plannedSummaryFor,
  setRowSets,
  stackModelFor,
  type StackDesign,
  type StackInput,
} from "./stack";
import { deltoidActionIds, deltoidContent, deltoidIds, deltoidRegionData, deltoidRepProfiles, fixtureArmContent } from "./__fixtures__/deltoidRegion";
import { fx, fxBackContent, fxCoreContent } from "./__fixtures__/multiRegion";

/**
 * The stack designer's core (11-forearm-research-and-stack.md §3.3, §3.4, §3.8, §7.4), on the real
 * forearm (the prototype's plans A to F, `experiments/forearm-research-2026-10-21/architect-v3/`),
 * the deltoid fixture and a midline fixture.
 *
 * The prototype ran on `forearm_mappings_v1`, so the plans are held to it on v1's content
 * (`forearmRegionDataV1`, the frozen rows); what F3's `forearm_mappings_v2` changes in the stack
 * (four new exercises among its choices, the two finger extensors it now reaches) is the last
 * describe block's, on the tree's data.
 */

const NOW = "2026-10-21T12:00:00.000Z";
const byId = new Map(exercises.map((item) => [item.id, item] as const));
const name = (id: number) => byId.get(id)!.name;

function planOf(days: number, content: number[][], prescriptions: Record<number, string>[] = []): { slots: ReturnType<typeof buildDaySlots>; store: WeeklyDayStore } {
  const slots = buildDaySlots(splitDaysForFrequency(days));
  let store = emptyDayStore();
  slots.forEach((slot, index) => {
    store = commitDay(store, slot.key, { workout: (content[index] ?? []).map((id) => byId.get(id)!), prescriptions: prescriptions[index] ?? {}, settings: {}, context: [] });
  });
  return { slots, store };
}

const goal = (id: string, subject: { nodeId?: string; actionId?: string }, metric: SpecializationGoal["metric"], target: number, regionId = "forearm"): SpecializationGoal => ({
  id, regionId, nodeId: subject.nodeId ?? null, actionId: subject.actionId ?? null, side: "right", metric, target, period: "calendar_week", startsOn: "2026-10-19", endsOn: null, timezone: "Europe/London", createdAt: NOW, updatedAt: NOW,
});

type Options = { region?: SpecializationRegionData; extras?: RegionExtras | null; days: number; content: number[][]; prescriptions?: Record<number, string>[]; goal?: TrainingGoal; gym?: number; access?: GymAccess; goals?: SpecializationGoal[]; holds?: boolean | null; total?: number | null; exclusions?: StackInput["exclusions"]; perDay?: number; dayKeys?: string[] | null };

function inputOf(options: Options): StackInput {
  const { slots, store } = planOf(options.days, options.content, options.prescriptions);
  const access = options.access ?? "Commercial gym";
  return {
    region: options.region ?? forearm,
    extras: options.extras === undefined ? forearmProfiles : options.extras,
    catalog: exercises,
    plan: { week: 1, slots, store, goal: options.goal ?? "Muscle growth", gymMinutes: options.gym ?? 60 },
    goals: options.goals ?? [],
    equipment: { gymAccess: access, availableEquipment: gymAccessProfiles[access] },
    exclusions: options.exclusions ?? { catalogExerciseIds: [], equipment: [] },
    settings: { ...defaultStackSettings, holds: options.holds ?? null, perDay: options.perDay ?? STACK_RULES.exercisesPerDay.default, days: options.dayKeys ?? null },
    total: options.total ?? null,
    now: NOW,
  };
}

/** The page's planned direct moving sets for the plan week after the design's changes. */
const pageCountAfter = (input: StackInput, design: StackDesign) => directWorkCount(input.region, plannedSummaryFor(input, design.storeAfter));
const weekly = (design: StackDesign, catalogExerciseId: number) => design.rows.filter((row) => row.catalogExerciseId === catalogExerciseId).reduce((total, row) => total + row.sets, 0);
const rowsOn = (design: StackDesign, dayIndex: number) => design.rows.filter((row) => row.slotIndex === dayIndex);
const minutes = (design: StackDesign) => design.days.map((day) => day.minutesAfter);
const added = (design: StackDesign) => design.exercises.map((exercise) => exercise.catalogExerciseId).sort((a, b) => a - b);

// The prototype's plans, seeded as Home stores them (architect-v3/run.ts).
const A = [[161, 1, 43, 103, 150], [41, 4, 66, 111, 121], [173, 2, 54, 186, 132]];
const B = [[1, 43, 103, 57, 121, 150], [161, 186, 171, 194, 221], [5, 47, 66, 111, 148, 123], [41, 173, 206, 195, 222]];
const C = [[4, 103, 26, 155], [46, 75, 123, 82], [165, 189, 175, 224], [7, 46, 108, 132], [173, 26, 66]];
const targetsB = [goal("fcu", { nodeId: "forearm.fcu" }, "direct_dynamic_bouts", 8), goal("fds-hold", { nodeId: "forearm.fds" }, "deliberate_hold_seconds", 120), goal("sup", { actionId: "forearm.supination" }, "direct_dynamic_bouts", 6)];
const planA: Options = { days: 3, content: A };
const planB: Options = { days: 4, content: B, gym: 75, goals: targetsB };
const planC: Options = { days: 5, content: C, goal: "Athleticism", gym: 45, access: "At home" };

const THUMB = [412, 413, 414];
const NON_THUMB_A = [139, 140, 401, 404, 405, 406, 407, 408];

describe("the model, from region data only", () => {
  const model = stackModelFor(forearm);

  it("finds the forearm's 24 prime actions, 12 moving and 2 hold movements, and its three gaps", () => {
    expect(model.slotCount.moving).toBe(24);
    expect(model.movements.filter((movement) => movement.mode === "moving")).toHaveLength(12);
    expect(model.movements.filter((movement) => movement.mode === "hold").map((movement) => movement.label)).toEqual(["Middle-joint flexion and fingertip flexion (hold)", "Thumb-tip flexion (hold)"]);
    expect(model.gaps.map((gap) => `${gap.nodeId}|${gap.actionId}`)).toEqual(["forearm.pl|hand.palmar_aponeurosis_tension", "forearm.edm|little_finger.extension", "forearm.ei|index_finger.extension"]);
    // Each gap names the reviewed exercises that work the muscle as a helper.
    expect(model.gaps.find((gap) => gap.nodeId === "forearm.edm")!.helpers.map((helper) => helper.catalogExerciseId)).toContain(404);
    expect(model.gaps.find((gap) => gap.nodeId === "forearm.pl")!.helpers.map((helper) => helper.catalogExerciseId)).toContain(139);
  });

  it("keeps shared rows together in one movement", () => {
    const nodesOf = (label: string) => model.movements.find((movement) => movement.label === label)!.nodeIds;
    expect(nodesOf("Middle-joint flexion and fingertip flexion")).toEqual(["forearm.fds", "forearm.fdp"]);
    expect(nodesOf("Pronation")).toEqual(["forearm.pt", "forearm.pq"]);
    expect(nodesOf("Thumb-knuckle extension and thumb-tip extension")).toEqual(["forearm.epb", "forearm.epl"]);
    expect(nodesOf("Radial deviation")).toEqual(["forearm.fcr", "forearm.ecrl", "forearm.ecrb"]);
    expect(nodesOf("Ulnar deviation")).toEqual(["forearm.fcu", "forearm.ecu"]);
  });

  it("lets only reviewed direct rows cover a movement: no draft, helper, incidental or contributing hold", () => {
    const covering = new Set(model.movements.flatMap((movement) => movement.variantIds));
    // 141 Wrist Roller (contributing, direction unrecorded), 43 Bent-Over Row (helper and grip), 300 Zercher Carry (contributing hold).
    for (const variantId of ["cat-141", "cat-43", "cat-300", "cat-121"]) expect(covering.has(variantId), variantId).toBe(false);
    // The carries' thumb-flexor rows are drafts: they never cover the thumb hold.
    expect(model.movements.find((movement) => movement.label === "Thumb-tip flexion (hold)")!.variantIds).toEqual(["cat-142"]);
    // A hold never covers a moving movement.
    for (const movement of model.movements.filter((item) => item.mode === "moving")) for (const variantId of movement.variantIds) expect(forearm.variants.find((variant) => variant.id === variantId)!.deliberateHold, variantId).toBe(false);
  });

  it("reads the deltoid fixture with no deltoid code", () => {
    const deltoid = stackModelFor(deltoidRegionData);
    expect(deltoid.movements.map((movement) => [movement.nodeIds, movement.variantIds])).toEqual([
      [[deltoidIds.anterior], ["fx-101"]],
      [[deltoidIds.lateral], ["fx-111"]],
      [[deltoidIds.posterior], ["fx-90", "fx-93"]],
    ]);
    expect(deltoid.gaps).toEqual([]);
  });
});

describe("plan A, as the prototype ran it", () => {
  const input = inputOf(planA);
  const design = designStack(input);

  it("starts at 14: the plan's 3 and one set for each of the 11 movements it does not train directly", () => {
    expect(design.own).toBe(3);
    expect(design.start).toMatchObject({ value: 14, targetSets: 0, movementsReachable: 11, movementsFit: 11, exercises: 11, cappedByTime: false });
    expect(design.total).toBe(14);
    expect(design.range).toEqual({ min: 3, max: 30, fitsTime: 28 });
    expect(design.exercises.map((exercise) => exercise.weeklySets)).toEqual(new Array(11).fill(1));
    expect(design.days.map((day) => rowsOn(design, day.slotIndex).length)).toEqual([4, 4, 3]);
    expect(design.days.map((day) => [day.exercisesBefore, day.exercisesAfter])).toEqual([[5, 9], [5, 9], [5, 8]]);
    expect(minutes(design)).toEqual([48, 48, 46]);
    expect(design.days.map((day) => day.secondSideMinutes)).toEqual([2, 3, 3]);
  });

  it("gives 16 of the 19 muscles direct moving work, and the page then counts the total", () => {
    expect(design.counts.before.musclesWithMovingWork).toHaveLength(1);
    expect(design.counts.after.musclesWithMovingWork).toHaveLength(16);
    expect(pageCountAfter(input, design).moving).toBe(14);
    expect(design.counts.after.moving).toBe(14);
    expect(design.movements.filter((movement) => movement.mode === "moving" && movement.status === "added")).toHaveLength(11);
  });

  it("at 8 keeps the five most needed and lists the six it leaves out", () => {
    const at8 = designStack({ ...input, total: 8 });
    expect(added(at8)).toEqual([139, 140, 401, 405, 413]);
    expect(at8.cut.byTotal.catalogExerciseIds.sort((a, b) => a - b)).toEqual([404, 406, 407, 408, 412, 414]);
    expect(at8.cut.byTotal.raiseBy).toBe(6);
    expect(minutes(at8)).toEqual([43, 43, 41]);
    expect(at8.counts.after.musclesWithMovingWork).toHaveLength(12);
    expect(pageCountAfter(input, at8).moving).toBe(8);
  });

  it("at 30 gives every exercise but the thumb drills 3 sets, and says the days over the gym window in Plan's words", () => {
    const at30 = designStack({ ...input, total: 30 });
    for (const id of NON_THUMB_A) expect(weekly(at30, id), name(id)).toBe(3);
    for (const id of THUMB) expect(weekly(at30, id), name(id)).toBe(1);
    expect(minutes(at30)).toEqual([59, 64, 61]);
    expect(at30.days.map((day) => day.overWindow)).toEqual([false, true, true]);
    for (const day of at30.days.filter((item) => item.overWindow)) expect(day.planPromptsAdded.some((prompt) => prompt.includes(`above your 60 min gym window`))).toBe(true);
    // Plan's "nothing to review" line is never quoted as something the stack brings, at any total.
    for (const total of [8, 14, 20, 30]) for (const day of designStack({ ...input, total }).days) expect(day.planPromptsAdded).not.toContain(NOTHING_TO_REVIEW_PROMPT);
    expect(pageCountAfter(input, at30).moving).toBe(30);
  });

  it("stops at 30 when asked for 40, and at the plan's own when asked for less", () => {
    const at40 = designStack({ ...input, total: 40 });
    expect([at40.total, at40.clamped]).toEqual([30, "above_max"]);
    const at2 = designStack({ ...input, total: 2 });
    expect([at2.total, at2.clamped, at2.changes.length]).toEqual([3, "below_own", 0]);
  });

  it("with holds on, says the plate pinch has no room at 4 exercises a day and would at 5", () => {
    const holds = designStack(inputOf({ ...planA, holds: true }));
    expect(holds.total).toBe(14);
    expect(holds.settings.holdsOn).toBe(true);
    expect(holds.cut.holdsNoRoom).toEqual({ catalogExerciseIds: [142], perDayToFit: 5 });
    const fiveInput = inputOf({ ...planA, holds: true, perDay: 5 });
    const five = designStack(fiveInput);
    expect(five.rows.filter((row) => row.kind === "hold").map((row) => row.name)).toEqual(["Plate Pinch"]);
    expect(five.total).toBe(14);
    expect(pageCountAfter(fiveInput, five).moving).toBe(14);
  });

  it("with a Farmer's Walk on Day 02: 13, the finger curl still added, the ulnar deviation lever said not to fit, the carry's holds apart", () => {
    const carryInput = inputOf({ ...planA, content: [A[0], [...A[1], 299], A[2]] });
    const carry = designStack(carryInput);
    expect([carry.own, carry.total]).toEqual([3, 13]);
    expect(added(carry)).toContain(401);
    expect(carry.cut.byRoom.catalogExerciseIds).toEqual([408]);
    expect(carry.cut.byRoom.perDayToFit).toBe(5);
    expect([carry.counts.before.holds.bouts, carry.counts.after.holds.bouts]).toEqual([3, 3]);
    expect(minutes(carry)).toEqual([48, 54, 46]);
    expect(pageCountAfter(carryInput, carry).moving).toBe(13);
  });

  it("with the Hammer Curl replaced by a Zercher Carry: 12 from 0, the Hammer Curl among them", () => {
    const zercher = designStack(inputOf({ ...planA, content: [A[0], A[1], [173, 2, 54, 186, 300]] }));
    expect([zercher.own, zercher.total]).toEqual([0, 12]);
    expect(added(zercher)).toContain(132);
    expect(minutes(zercher)).toEqual([48, 48, 48]);
    expect(zercher.counts.after.musclesWithMovingWork).toHaveLength(16);
  });
});

describe("plan B: targets first, holds apart", () => {
  const input = inputOf(planB);
  const design = designStack(input);

  it("starts at 23 from 0 and adds 4 hold sets beside it, every target met", () => {
    expect([design.own, design.start.value, design.total]).toEqual([0, 23, 23]);
    expect(design.start.targetSets).toBe(11);
    expect(design.settings).toMatchObject({ holdsOn: true, holdsByTarget: true });
    expect(design.added.holdSets).toBe(4);
    expect(design.targets.map((target) => [target.goalId, target.after, target.status])).toEqual([["fcu", 8, "met"], ["fds-hold", 120, "met"], ["sup", 6, "met"]]);
    expect(pageCountAfter(input, design).moving).toBe(23);
    expect(design.counts.after.holds).toMatchObject({ bouts: 4, seconds: 120 });
  });

  it("fills the targets with the prototype's exercises: Wrist Curl 3 + 2 and Lever Ulnar Deviation 3, Lever Supination 3 + 3, Plate Pinch 2 + 2 × 30 sec", () => {
    const sessions = (id: number) => design.rows.filter((row) => row.catalogExerciseId === id).map((row) => row.sets).sort((a, b) => b - a);
    expect(sessions(139)).toEqual([3, 2]);
    expect(sessions(408)).toEqual([3]);
    expect(sessions(406)).toEqual([3, 3]);
    expect(design.rows.filter((row) => row.catalogExerciseId === 142).map((row) => row.prescription)).toEqual(["2 × 30 sec", "2 × 30 sec"]);
    // The plan's Barbell Curl credits the brachioradialis only as a helper.
    expect(weekly(design, 132)).toBe(1);
    expect(design.exercises).toHaveLength(13);
    expect(design.counts.after.musclesWithMovingWork).toHaveLength(16);
  });

  it("under Max strength writes the strength ranges where they apply, the seconds target's holds at 30 s, and the band drills at their growth range", () => {
    const strength = designStack(inputOf({ ...planB, goal: "Max strength" }));
    expect(strength.total).toBe(23);
    const rx = (id: number) => strength.rows.find((row) => row.catalogExerciseId === id)!.prescription;
    expect(rx(140)).toBe("1 × 6–12");
    expect(rx(132)).toBe("1 × 3–6");
    expect(rx(401)).toBe("1 × 5–10");
    expect(rx(404)).toBe("1 × 10–25");
    for (const id of THUMB) expect(rx(id)).toBe("1 × 12–25");
    expect(strength.rows.filter((row) => row.catalogExerciseId === 142).map((row) => row.prescription)).toEqual(["2 × 30 sec", "2 × 30 sec"]);
    expect(strength.targets.every((target) => target.status === "met")).toBe(true);
  });

  it("at a lower total keeps the targets first and says what stays short", () => {
    const at12 = designStack({ ...input, total: 12 });
    expect(pageCountAfter(input, at12).moving).toBe(12);
    expect(at12.targets.find((target) => target.goalId === "fcu")).toMatchObject({ status: "short" });
    // Holds are outside the total: the seconds target is still met.
    expect(at12.targets.find((target) => target.goalId === "fds-hold")).toMatchObject({ status: "met", after: 120 });
  });
});

describe("plan C: five days at home", () => {
  const input = inputOf(planC);
  const design = designStack(input);

  it("starts at 14 (3 + 11), spread over all five days, two or three a day", () => {
    expect([design.own, design.total]).toEqual([3, 14]);
    expect(design.days.map((day) => rowsOn(design, day.slotIndex).length).every((count) => count >= 2 && count <= 3)).toBe(true);
    expect(design.days.every((day) => !day.overWindow)).toBe(true);
    expect(pageCountAfter(input, design).moving).toBe(14);
  });

  it("offers no barbell work at home now that 139 and 140 are filed as Barbell, as their variants and photos define them", () => {
    expect(byId.get(139)!.equipment).toBe("Barbell");
    expect(byId.get(140)!.equipment).toBe("Barbell");
    for (const row of design.rows) expect(["Barbell", "Cable", "Machine"], row.name).not.toContain(row.equipment);
    expect(added(design)).not.toContain(139);
    expect(added(design)).not.toContain(140);
  });
});

describe("plans D, E and F: what it says when it cannot", () => {
  it("D, bodyweight only with holds on: a dead hang of 10 s under Max strength, the total staying 0, every moving movement needing equipment", () => {
    const d = designStack(inputOf({ days: 2, content: [[26, 66, 75], [184, 217]], goal: "Max strength", gym: 30, access: "Bodyweight only", holds: true }));
    expect([d.own, d.total, d.range.max]).toEqual([0, 0, 0]);
    expect(d.rows.map((row) => `${row.name} ${row.prescription}`)).toEqual(["Dead Hang 1 × 10 sec"]);
    expect(d.days.map((day) => day.minutesAfter)).toEqual([28, 23]);
    expect(d.movements.filter((movement) => movement.mode === "moving").every((movement) => movement.status === "not_usable" && movement.unusable.every((item) => item.why === "equipment"))).toBe(true);
    expect(d.counts.after.moving).toBe(0);
  });

  it("E, a plan with 6 direct moving sets and a total of 4: nothing added, the plan's own kept", () => {
    const input = inputOf({ days: 1, content: [[161, 1, 43, 139, 140]], prescriptions: [{ 139: "3 × 15", 140: "3 × 15" }], total: 4 });
    const e = designStack(input);
    expect([e.own, e.total, e.clamped, e.changes.length]).toEqual([6, 6, "below_own", 0]);
    expect(e.storeAfter).toBe(input.plan.store);
  });

  it("F, targets no reviewed exercise can fill: each said once, never as a shortfall, and no hold added for them", () => {
    const leftOut = stackModelFor(forearm).movements.filter((movement) => movement.mode === "moving" && movement.nodeIds.some((id) => ["forearm.fds", "forearm.fpl", "forearm.apl", "forearm.epb", "forearm.ed"].includes(id))).map((movement) => movement.key);
    const input = { ...inputOf({ ...planA, goals: [goal("pl", { nodeId: "forearm.pl" }, "direct_dynamic_bouts", 6), goal("fcr-hold", { nodeId: "forearm.fcr" }, "deliberate_hold_seconds", 90), goal("edm", { nodeId: "forearm.edm" }, "direct_dynamic_bouts", 4)] }), edits: { leftOut } };
    const f = designStack(input);
    expect([f.own, f.total]).toEqual([3, 9]);
    expect(added(f)).toEqual([139, 140, 405, 406, 407, 408]);
    expect(f.targets.map((target) => target.status)).toEqual(["no_reviewed_exercise", "no_reviewed_exercise", "no_reviewed_exercise"]);
    expect(f.settings.holdsOn).toBe(false);
    expect(f.counts.after.musclesWithMovingWork).toHaveLength(9);
    expect(f.movements.filter((movement) => movement.status === "left_out")).toHaveLength(5);
  });
});

describe("the rules", () => {
  it("makes the page's planned direct moving count equal the total, for a one-arm and a two-handed exercise", () => {
    // The two-handed wrist curls left out by the athlete, so wrist flexion is the one-arm dumbbell curl (410).
    const input = inputOf({ ...planA, exclusions: { catalogExerciseIds: [139, 416], equipment: [] }, total: 20 });
    const design = designStack(input);
    expect(added(design)).toContain(410);
    expect(design.rows.find((row) => row.catalogExerciseId === 410)!.oneSided).toBe(true);
    expect(design.rows.find((row) => row.catalogExerciseId === 140)!.oneSided).toBe(false);
    const after = pageCountAfter(input, design);
    expect(after.moving).toBe(20);
    // A planned one-arm set is one bout (planBouts writes …/n), counted once.
    const oneArmBouts = after.movingBoutIds.filter((id) => id.includes("/410/"));
    expect(oneArmBouts).toHaveLength(weekly(design, 410));
    expect(after.movingBoutIds.filter((id) => id.includes("/140/"))).toHaveLength(weekly(design, 140));
  });

  it("never counts holds in the total", () => {
    const input = inputOf(planB);
    const design = designStack(input);
    expect(design.total).toBe(pageCountAfter(input, design).moving);
    expect(design.added.movingSets).toBe(design.total - design.own);
    expect(design.rows.filter((row) => row.kind === "hold").every((row) => row.catalogExerciseId === 142)).toBe(true);
  });

  it("leaves the plan's own entries, their order and their prescriptions untouched, adding after them", () => {
    const input = inputOf({ ...planA, prescriptions: [{ 161: "5 × 5" }, {}, { 132: "4 × 8–12" }] });
    const design = designStack(input);
    for (const slot of input.plan.slots) {
      const before = loadDay(input.plan.store, slot.key);
      const after = loadDay(design.storeAfter, slot.key);
      expect(after.workout.slice(0, before.workout.length)).toEqual(before.workout);
      for (const entry of before.workout) expect(after.prescriptions[entry.id]).toBe(before.prescriptions[entry.id]);
      for (const entry of after.workout.slice(before.workout.length)) expect(design.changes.some((change) => change.dayKey === slot.key && change.catalogExerciseId === entry.id)).toBe(true);
    }
  });

  it("never lets a plan's own carry or hang remove a moving movement", () => {
    const design = designStack(inputOf({ ...planA, content: [[...A[0], 143], [...A[1], 299], A[2]] }));
    const fingers = design.movements.find((movement) => movement.mode === "moving" && movement.nodeIds.includes("forearm.fds"))!;
    expect(fingers.status).toBe("added");
    expect(design.movements.find((movement) => movement.mode === "hold" && movement.nodeIds.includes("forearm.fds"))!.status).toBe("in_plan");
  });

  it("fills a seconds target in holds of 30 s whatever the goal, at most 6 sets, and says the rest", () => {
    for (const trainingGoal of ["Muscle growth", "Max strength"] as const) {
      const design = designStack(inputOf({ ...planA, goal: trainingGoal, perDay: 6, goals: [goal("fds-300", { nodeId: "forearm.fds" }, "deliberate_hold_seconds", 300)] }));
      const holds = design.rows.filter((row) => row.kind === "hold");
      expect(holds.every((row) => row.prescription.endsWith("× 30 sec")), trainingGoal).toBe(true);
      expect(holds.reduce((total, row) => total + row.sets, 0)).toBe(6);
      expect(design.targets[0]).toMatchObject({ status: "short", before: 0, after: 180, target: 300 });
    }
  });

  it("takes every change back with one Undo, the reverts in reverse order, to the week exactly as it was", () => {
    const input = inputOf(planB);
    const design = designStack(input);
    let store = input.plan.store;
    const reverts: { key: string; revert: (current: DayRecord) => DayRecord }[] = [];
    for (const change of design.changes) {
      const outcome = applyPlanChangeToRecord(loadDay(store, change.dayKey), change, byId.get(change.catalogExerciseId)!);
      if (!outcome.ok) throw new Error(outcome.reason);
      store = commitDay(store, change.dayKey, outcome.record);
      reverts.push({ key: change.dayKey, revert: outcome.revert });
    }
    expect(store).toEqual(design.storeAfter);
    for (const { key, revert } of [...reverts].reverse()) store = commitDay(store, key, revert(loadDay(store, key)));
    expect(store).toEqual(input.plan.store);
  });

  it("adds nothing when designed again on the applied week at the same total", () => {
    const input = inputOf(planA);
    const design = designStack(input);
    const again = designStack({ ...input, plan: { ...input.plan, store: design.storeAfter }, total: design.total });
    expect([again.own, again.total, again.changes.length]).toEqual([14, 14, 0]);
  });

  it("gives the same stack for the same inputs", () => {
    const strip = (design: StackDesign) => JSON.stringify({ ...design, storeAfter: null });
    for (const options of [planA, planB, planC]) {
      const one = designStack(inputOf(options));
      const two = designStack(inputOf(options));
      expect(strip(two)).toBe(strip(one));
    }
  });

  it("keeps its caps: 3 sets a session, 2 sessions a week, the per-day number with the plan's own, never one exercise twice in a day or on a day that holds it", () => {
    for (const options of [{ ...planA, total: 30 }, planB, { ...planC, total: 24 }, { ...planB, perDay: 6, total: 42 }]) {
      const input = inputOf(options);
      const design = designStack(input);
      const model = stackModelFor(forearm);
      for (const row of design.rows) expect(row.sets).toBeLessThanOrEqual(STACK_RULES.maxSetsPerSession);
      for (const exercise of design.exercises) expect(exercise.sessions.length).toBeLessThanOrEqual(STACK_RULES.maxSessionsPerWeek);
      for (const slot of input.plan.slots) {
        const own = loadDay(input.plan.store, slot.key).workout.map((entry) => entry.id);
        const here = design.rows.filter((row) => row.dayKey === slot.key);
        const ownDirect = own.filter((id) => model.movements.some((movement) => movement.variantIds.includes(`cat-${id}`))).length;
        expect(ownDirect + here.length).toBeLessThanOrEqual(input.settings.perDay);
        expect(new Set(here.map((row) => row.catalogExerciseId)).size).toBe(here.length);
        for (const row of here) expect(own).not.toContain(row.catalogExerciseId);
      }
      expect(pageCountAfter(input, design).moving).toBe(design.total);
    }
  });

  it("uses only the allowed days", () => {
    const input = inputOf({ ...planA, dayKeys: [buildDaySlots(splitDaysForFrequency(3))[0].key, buildDaySlots(splitDaysForFrequency(3))[2].key] });
    const design = designStack(input);
    expect(new Set(design.rows.map((row) => row.slotIndex))).toEqual(new Set([0, 2]));
    expect(design.start.value).toBe(3 + 7);
    expect(design.cut.byRoom.catalogExerciseIds).toHaveLength(4);
  });

  it("never chooses an excluded exercise or equipment the athlete lacks, and never counts it as covering a need", () => {
    const design = designStack(inputOf({ ...planA, exclusions: { catalogExerciseIds: [405], equipment: ["Band"] } }));
    expect(added(design)).not.toContain(405);
    for (const row of design.rows) expect(row.equipment).not.toBe("Band");
    const pronation = design.movements.find((movement) => movement.label === "Pronation")!;
    expect(pronation.status).toBe("not_usable");
    expect(pronation.unusable).toEqual([{ catalogExerciseId: 405, name: "Lever Pronation", equipment: "Dumbbells", why: "excluded_exercise" }]);
    const thumb = design.movements.find((movement) => movement.label === "Thumb abduction")!;
    expect(thumb.unusable.map((item) => item.why)).toEqual(["excluded_equipment"]);
    expect(design.start.movementsReachable).toBe(11 - 1 - 4);
  });

  it("gives every reachable movement a set at the starting total, and spreads further sets by exercise, the most needed first", () => {
    const input = inputOf(planA);
    const start = designStack(input);
    expect(start.movements.filter((movement) => movement.mode === "moving" && !["in_plan", "added"].includes(movement.status))).toEqual([]);
    const at16 = designStack({ ...input, total: 16 });
    const extra = at16.exercises.filter((exercise) => exercise.spreadSets > 0);
    expect(extra.map((exercise) => [exercise.rank, exercise.spreadSets])).toEqual([[1, 1], [2, 1]]);
    // By exercise, never by muscle count: the three-muscle lever gets no more than the one-muscle one.
    const at20 = designStack({ ...input, total: 20 });
    const sets = at20.exercises.filter((exercise) => !exercise.coverageOnly).map((exercise) => exercise.weeklySets);
    expect(Math.max(...sets) - Math.min(...sets)).toBeLessThanOrEqual(1);
  });

  it("keeps the thumb drills at one set unless the athlete raises the row or a target asks for more", () => {
    const input = inputOf(planA);
    for (const total of [14, 20, 30]) for (const id of THUMB) expect(weekly(designStack({ ...input, total }), id), `${name(id)} at ${total}`).toBe(1);
    const design = designStack(input);
    const row = design.rows.find((item) => item.catalogExerciseId === 414)!;
    const raised = setRowSets(input, design, row.key, 2);
    expect(raised.total).toBe(15);
    const after = designStack(raised);
    expect(weekly(after, 414)).toBe(2);
    expect(after.rows.find((item) => item.catalogExerciseId === 414)!.setByAthlete).toBe(true);
    expect(pageCountAfter(raised, after).moving).toBe(15);
    const targeted = designStack(inputOf({ ...planA, goals: [goal("fpl", { nodeId: "forearm.fpl" }, "direct_dynamic_bouts", 3)] }));
    expect(weekly(targeted, 412)).toBe(3);
    expect(targeted.total).toBe(16);
  });

  it("gives no further set to work whose every direct muscle has met the athlete's target of that kind", () => {
    const design = designStack(inputOf({ ...planA, total: 30, goals: [goal("fcr", { nodeId: "forearm.fcr" }, "direct_dynamic_bouts", 1), goal("fcu", { nodeId: "forearm.fcu" }, "direct_dynamic_bouts", 1)] }));
    expect(weekly(design, 139)).toBe(1);
    // The ulnar deviation lever's other muscle has no target, so it is spread to as before.
    expect(weekly(design, 408)).toBe(3);
    expect(design.range.max).toBe(28);
  });

  it("leaves a movement out at once: its rows go, the total drops by its sets, and no other row changes", () => {
    for (const options of [planA, { ...planA, total: 20 }, planB]) {
      const input = inputOf(options);
      const design = designStack(input);
      for (const movement of design.movements.filter((item) => item.status === "added" && item.mode === "moving")) {
        const next = leaveOutMovement(input, design, movement.key);
        const redesign = designStack(next);
        const going = new Set(movement.catalogExerciseIds);
        const goneSets = design.rows.filter((row) => going.has(row.catalogExerciseId) && row.kind === "moving").reduce((total, row) => total + row.sets, 0);
        expect(redesign.total, movement.label).toBe(design.total - goneSets);
        const shape = (rows: StackDesign["rows"]) => rows.filter((row) => !going.has(row.catalogExerciseId)).map((row) => `${row.key}@${row.dayKey}:${row.prescription}`).sort();
        expect(shape(redesign.rows), movement.label).toEqual(shape(design.rows));
        expect(redesign.movements.find((item) => item.key === movement.key)!.status).toBe("left_out");
        expect(pageCountAfter(next, redesign).moving).toBe(redesign.total);
      }
    }
    // Bringing one back raises the total by its one set.
    const input = inputOf(planA);
    const design = designStack(input);
    const key = design.movements.find((movement) => movement.label === "Thumb abduction")!.key;
    const out = leaveOutMovement(input, design, key);
    const back = designStack(bringBackMovement(out, key));
    expect(back.total).toBe(14);
    expect(back.movements.find((movement) => movement.key === key)!.status).toBe("added");
  });

  it("moves a row to a day the athlete picks, and takes another reviewed exercise for a movement", () => {
    const input = inputOf(planA);
    const design = designStack(input);
    const row = design.rows.find((item) => item.catalogExerciseId === 139)!;
    const choices = dayChoicesFor(input, design, row.key);
    expect(choices.find((choice) => choice.current)!.dayKey).toBe(row.dayKey);
    const elsewhere = input.plan.slots.find((slot) => slot.key !== row.dayKey)!;
    const moved = designStack(moveRow(input, row.key, elsewhere.key));
    expect(moved.rows.find((item) => item.catalogExerciseId === 139)!.dayKey).toBe(elsewhere.key);
    const flexion = design.movements.find((movement) => movement.label === "Wrist flexion")!;
    expect(flexion.choices.map((choice) => choice.catalogExerciseId)).toEqual([139, 410, 416]);
    const swapped = designStack(chooseExercise(input, flexion.key, 410));
    expect(added(swapped)).toContain(410);
    expect(added(swapped)).not.toContain(139);
    expect(swapped.total).toBe(14);
  });

  it("gives no muscle a number of its own anywhere in a design (the athlete's own targets aside)", () => {
    const nodeIds = new Set(forearm.nodes.map((node) => node.id));
    for (const options of [planA, planB, planC]) {
      const { targets: _targets, storeAfter: _store, ...design } = designStack(inputOf(options));
      const visit = (value: unknown, path: string) => {
        if (Array.isArray(value)) { value.forEach((item, index) => visit(item, `${path}[${index}]`)); return; }
        if (!value || typeof value !== "object") return;
        const record = value as Record<string, unknown>;
        for (const key of Object.keys(record)) expect(nodeIds.has(key), `${path}.${key} is keyed by a muscle`).toBe(false);
        if (typeof record.nodeId === "string") for (const [key, item] of Object.entries(record)) expect(typeof item === "number", `${path}.${key} gives a muscle a number`).toBe(false);
        for (const [key, item] of Object.entries(record)) visit(item, `${path}.${key}`);
      };
      visit(design, "design");
    }
  });

  it("stays within the design's runtime on the sandbox: every prototype plan designs in well under the bound", () => {
    const runs: Options[] = [planA, { ...planA, total: 30 }, planB, { ...planB, total: 20 }, planC, { ...planC, total: 24 }];
    for (const options of runs) {
      const input = inputOf(options);
      designStack(input);
      const times: number[] = [];
      for (let run = 0; run < 3; run += 1) {
        const started = performance.now();
        designStack(input);
        times.push(performance.now() - started);
      }
      // The design's bound is 1.6–31 ms plus about 15 ms of placement search on the sandbox under
      // Node; a test runner shares the machine, so the gate here is generous.
      expect(times.sort((a, b) => a - b)[1]).toBeLessThan(250);
    }
  });
});

describe("other regions, with no region code", () => {
  it("designs for the deltoid fixture: each movement one set, the coverage-only fly kept at one, the press at its goal default", () => {
    const input = inputOf({ region: deltoidRegionData, extras: deltoidRepProfiles, days: 2, content: [[161], [1]] });
    const design = designStack(input);
    expect([design.own, design.total]).toEqual([0, 3]);
    expect(added(design)).toEqual([90, 101, 111]);
    const rx = (id: number) => design.rows.find((row) => row.catalogExerciseId === id)!;
    expect(rx(111).prescription).toBe("1 × 12–20");
    expect(rx(90).prescription).toBe("1 × 12–25");
    expect(rx(101).profile).toBeNull();
    const position = loadDay(design.storeAfter, rx(101).dayKey).workout.findIndex((entry) => entry.id === 101);
    expect(rx(101).prescription).toBe(`1 × ${getGoalPrescription("Muscle growth", position).split("× ")[1]}`);
    expect(pageCountAfter(input, design).moving).toBe(3);
    const wide = designStack({ ...input, total: 9, exclusions: { catalogExerciseIds: [90], equipment: [] } });
    expect(weekly(wide, 93)).toBe(1);
    expect(pageCountAfter(input, wide).moving).toBe(wide.total);
  });

  it("designs for a midline region: moving work in the total, holds beside it", () => {
    const core = composeRegionData({
      ...fxCoreContent,
      nodeActions: [
        { nodeId: fx.rectus, actionId: "spine.flexion", role: "prime", claimId: "fx.rectus", claimKey: "fx_core:fx.rectus" },
        { nodeId: fx.obliques, actionId: "spine.lateral_flexion", role: "prime", claimId: "fx.obliques", claimKey: "fx_core:fx.obliques" },
      ],
    }, [fxBackContent]);
    const input = inputOf({ region: core, extras: null, days: 2, content: [[161], [1]], holds: true });
    const design = designStack(input);
    expect(stackModelFor(core).movements.map((movement) => movement.mode)).toEqual(["moving", "hold"]);
    expect(added(design)).toEqual([241, 247]);
    expect(design.total).toBe(1);
    expect(pageCountAfter(input, design).moving).toBe(1);
    expect(design.counts.after.holds.bouts).toBe(1);
  });

  it("chooses the fewest exercises exactly when no need has a single answer, ties by the design's order", () => {
    // A test assumption: each exercise covers two of three movements or one, so no exercise is forced.
    const base = deltoidContent.mappings[0];
    const direct = (variantId: string, nodeId: string, actionId: string) => ({ ...base, id: `${variantId}:${nodeId}`, variantId, nodeId, actionId, relationship: "direct" as const, reviewStatus: "reviewed" as const });
    const region = composeRegionData({
      ...deltoidContent,
      mappings: [
        direct("fx-111", deltoidIds.anterior, deltoidActionIds.flexion), direct("fx-111", deltoidIds.lateral, deltoidActionIds.abduction),
        direct("fx-101", deltoidIds.lateral, deltoidActionIds.abduction), direct("fx-101", deltoidIds.posterior, deltoidActionIds.horizontalAbduction),
        direct("fx-90", deltoidIds.anterior, deltoidActionIds.flexion),
        direct("fx-93", deltoidIds.posterior, deltoidActionIds.horizontalAbduction),
      ],
    }, [fixtureArmContent]);
    const design = designStack(inputOf({ region, extras: deltoidRepProfiles, days: 2, content: [[161], [1]] }));
    expect(design.search).toMatchObject({ coverPatterns: 4, coverExact: true });
    // Three covers of two: {111, 101}, {111, 93} (one-arm, so later) and {90, 101}; the lower ids win the tie.
    expect(added(design)).toEqual([90, 101]);
    expect(design.movements.every((movement) => movement.status === "added")).toBe(true);
  });

  it("names no side in any total or line, for any fixture region", () => {
    const designs = [
      designStack(inputOf(planA)),
      designStack(inputOf({ region: deltoidRegionData, extras: deltoidRepProfiles, days: 2, content: [[161], [1]] })),
    ];
    for (const design of designs) {
      const { storeAfter: _store, ...rest } = design;
      expect(JSON.stringify(rest)).not.toMatch(/\b(left|right)\b|each (arm|side|leg)|per (arm|side|leg)/i);
    }
  });
});

describe("F3: the stack under forearm_mappings_v2 (the tree's data)", () => {
  const model = stackModelFor(forearmV2);
  const input = inputOf({ ...planA, region: forearmV2 });
  const design = designStack(input);
  const movingLabels = (list: typeof model.movements) => list.filter((movement) => movement.mode === "moving").map((movement) => movement.label);

  it("reaches the two finger extensors through 420, leaving only the palmaris longus without a direct exercise (§10 decision 2)", () => {
    expect(movingLabels(model.movements)).toEqual([...movingLabels(stackModelFor(forearm).movements).slice(0, 9), "Little-finger extension and index-finger extension", ...movingLabels(stackModelFor(forearm).movements).slice(9)]);
    const fingers = model.movements.find((movement) => movement.label === "Little-finger extension and index-finger extension")!;
    expect([fingers.nodeIds, fingers.variantIds]).toEqual([["forearm.edm", "forearm.ei"], ["cat-420"]]);
    expect(model.gaps.map((gap) => `${gap.nodeId}|${gap.actionId}`)).toEqual(["forearm.pl|hand.palmar_aponeurosis_tension"]);
  });

  it("offers the new wrist curls and the barbell hold among its choices, and nothing for the steadying rows", () => {
    expect(model.movements.find((movement) => movement.label === "Wrist flexion")!.variantIds).toEqual(["cat-139", "cat-410", "cat-416", "cat-417", "cat-418"]);
    expect(model.movements.find((movement) => movement.label === "Middle-joint flexion and fingertip flexion (hold)")!.variantIds).toContain("cat-419");
    // The wrist muscles' new rows steady (stabilizer) and the thumb's grips (incidental): neither covers a movement.
    const covering = new Set(model.movements.flatMap((movement) => movement.variantIds));
    for (const variantId of ["cat-87", "cat-88", "cat-318", "cat-326", "cat-329", "cat-330", "cat-333"]) expect(covering.has(variantId), variantId).toBe(false);
  });

  it("on plan A starts at 14 still, now reaching 18 of the 19 muscles, and says the ulnar deviation lever has no room at 4 exercises a day", () => {
    expect(design.start).toMatchObject({ value: 14, targetSets: 0, movementsReachable: 12, movementsFit: 11, exercises: 11, cappedByTime: false });
    expect(added(design)).toEqual([139, 140, 401, 404, 405, 406, 407, 412, 413, 414, 420]);
    expect(design.cut.byRoom).toMatchObject({ catalogExerciseIds: [408], perDayToFit: 5 });
    expect(design.counts.after.musclesWithMovingWork).toHaveLength(18);
    expect(design.counts.after.musclesWithMovingWork).not.toContain("forearm.pl");
    expect(pageCountAfter(input, design).moving).toBe(14);
    expect(minutes(design)).toEqual([48, 48, 46]);
  });
});
