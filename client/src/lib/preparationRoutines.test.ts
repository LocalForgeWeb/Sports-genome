import { describe, expect, it } from "vitest";
import { preTrainingMobilityLibrary } from "./preTrainingMobility";
import { activeRoutines, archivedRoutines, assignRoutine, chooseForToday, doseMinutes, duplicateRoutine, editRoutine, emptyPrepRunStore, emptyPrepStore, estimatedMinutes, isPrepRunStore, isPrepStore, routineForToday, routineFromDrills, setRoutineArchived, skipPreparation, stepView, todaysRun, toggleStep, upsertRoutine, type PrepRoutine } from "./preparationRoutines";

const PULL = "Week 1 · Day 02 · Pull";
const PUSH = "Week 1 · Day 01 · Push";
const TODAY = "2026-10-07";
const [a, b, c] = ["band-pull-apart", "scap-pullup", "wrist-circle"];

function routine(name = "Pull prep", ids = [a, b, c], id = "r1"): PrepRoutine {
  const result = routineFromDrills(name, ids, { id, now: "2026-10-07T09:00:00Z" });
  if (!result.ok) throw new Error(result.message);
  return result.routine;
}

/** Utility brief §6 (PR01-PR14). */
describe("saved preparation routines", () => {
  it("is built from the existing library's drills, by their ids, in order", () => {
    const made = routine();
    expect(made.steps.map((step) => step.drillId)).toEqual([a, b, c]);
    expect(made.steps.every((step) => preTrainingMobilityLibrary.some((drill) => drill.id === step.drillId && drill.name === step.name))).toBe(true);
    expect(routineFromDrills(" ", [a], { id: "x", now: "n" })).toEqual({ ok: false, message: "Give the routine a name, like Lower-body prep." });
    expect(routineFromDrills("Empty", ["not-a-drill"], { id: "x", now: "n" })).toEqual({ ok: false, message: "Add at least one drill." });
  });

  it("keeps the athlete's dose apart from the library's", () => {
    const made = routine();
    const store = upsertRoutine(emptyPrepStore, made);
    const edited = editRoutine(store, "r1", { name: "Pull prep", steps: [{ ...made.steps[0], dose: "15 reps" }, made.steps[1]] }, "n");
    if (!edited.ok) throw new Error(edited.message);
    const [first, second] = edited.store.routines[0].steps.map(stepView);
    expect(first).toMatchObject({ dose: "15 reps", doseIsLibraryDefault: false });
    expect(second).toMatchObject({ dose: preTrainingMobilityLibrary.find((drill) => drill.id === b)!.dose, doseIsLibraryDefault: true });
  });

  it("estimates duration only when every step supports it", () => {
    const made = routine();
    expect(estimatedMinutes(made.steps)).toBe(3);
    expect(estimatedMinutes([{ ...made.steps[0], dose: "2 × 30 sec" }])).toBe(1);
    expect(estimatedMinutes([{ ...made.steps[0], dose: "12 reps" }])).toBeNull();
    expect(estimatedMinutes([])).toBeNull();
    expect([doseMinutes("45 sec"), doseMinutes("2 min"), doseMinutes("2 × 30 s"), doseMinutes("8 each side")]).toEqual([0.75, 2, 1, null]);
  });

  it("assigns a routine to a planned day without touching anything else, and today's choice overrides it once", () => {
    let store = upsertRoutine(upsertRoutine(emptyPrepStore, routine()), routine("Quick prep", [c], "r2"));
    store = assignRoutine(store, PULL, "r1");
    let runs = emptyPrepRunStore;
    expect(routineForToday(store, runs, PULL, TODAY)).toMatchObject({ scope: "assigned", routine: { id: "r1" } });
    expect(routineForToday(store, runs, PUSH, TODAY)).toBeNull();
    runs = chooseForToday(runs, PULL, TODAY, "r2");
    expect(routineForToday(store, runs, PULL, TODAY)).toMatchObject({ scope: "today", routine: { id: "r2" } });
    // Tomorrow, the assignment is back: "today only" changed nothing saved for the day.
    expect(routineForToday(store, runs, PULL, "2026-10-08")).toMatchObject({ scope: "assigned", routine: { id: "r1" } });
    expect(store.assignments).toEqual({ [PULL]: "r1" });
  });

  it("keeps partial progress and a skip for today, with a snapshot that later edits cannot rewrite", () => {
    const made = routine();
    let store = assignRoutine(upsertRoutine(emptyPrepStore, made), PULL, "r1");
    let runs = toggleStep(emptyPrepRunStore, PULL, TODAY, made, "assigned", 0, "t1");
    runs = toggleStep(runs, PULL, TODAY, made, "assigned", 2, "t2");
    const run = todaysRun(JSON.parse(JSON.stringify(runs)), PULL, TODAY, "r1")!;
    expect(run.done).toEqual([0, 2]);
    expect(isPrepRunStore(runs)).toBe(true);
    // Edit the routine after the workout: today's run still shows what was done.
    const edited = editRoutine(store, "r1", { name: "Pull prep v2", steps: [made.steps[2]] }, "t3");
    if (!edited.ok) throw new Error(edited.message);
    store = edited.store;
    expect(todaysRun(runs, PULL, TODAY, "r1")!.snapshot).toEqual({ name: "Pull prep", steps: made.steps });
    runs = skipPreparation(runs, PULL, TODAY, made, "assigned", true, "t4");
    expect(todaysRun(runs, PULL, TODAY, "r1")).toMatchObject({ skipped: true, done: [0, 2] });
    runs = toggleStep(runs, PULL, TODAY, made, "assigned", 0, "t5");
    expect(todaysRun(runs, PULL, TODAY, "r1")).toMatchObject({ skipped: false, done: [2] });
  });

  it("shows a drill the library no longer has by its saved name, never as another drill", () => {
    const view = stepView({ drillId: "retired-drill", name: "Old shoulder flow", dose: "1 min" });
    expect(view).toMatchObject({ name: "Old shoulder flow", available: false, dose: "1 min" });
    expect(estimatedMinutes([{ drillId: "retired-drill", name: "Old shoulder flow" }])).toBeNull();
  });

  it("duplicates, archives (which unassigns) and restores", () => {
    let store = assignRoutine(upsertRoutine(emptyPrepStore, routine()), PULL, "r1");
    store = duplicateRoutine(store, "r1", "r2", "n");
    expect(activeRoutines(store).map((item) => item.name)).toEqual(["Pull prep", "Pull prep (copy)"]);
    store = setRoutineArchived(store, "r1", true, "n");
    expect(store.assignments).toEqual({});
    expect(archivedRoutines(store).map((item) => item.id)).toEqual(["r1"]);
    store = setRoutineArchived(store, "r1", false, "n");
    expect(activeRoutines(store)).toHaveLength(2);
    expect(isPrepStore(JSON.parse(JSON.stringify(store)))).toBe(true);
  });
});
