import { describe, expect, it } from "vitest";
import {
  activePosition, carriedEntryFor, countCompletedSets, countDraftSets, countPlannedSets, countSkippedSets,
  finalizeSession, isDraftSet, isExerciseSkipped, lastCompletedSetFor, skipExercise, unskipExercise,
  type DeviceWorkoutSession,
} from "./deviceWorkoutLog";

const session = (overrides: Partial<DeviceWorkoutSession> = {}): DeviceWorkoutSession => ({
  id: "s1",
  title: "Push workout",
  dayLabel: "Week 1 · Push",
  startedAt: "2026-09-01T10:00:00.000Z",
  status: "active",
  exercises: [
    {
      id: "e1",
      exerciseName: "Barbell Bench Press",
      plannedPrescription: "4 × 6–8",
      sets: [
        { weight: "135", reps: "8", completed: true },
        { weight: "145", reps: "7", completed: true },
        { weight: "145", reps: "", completed: false },
        { weight: "", reps: "", completed: false },
      ],
    },
    {
      id: "e2",
      exerciseName: "Lat Pulldown",
      plannedPrescription: "3 × 10",
      sets: [
        { weight: "", reps: "", completed: false },
        { weight: "", reps: "", completed: false },
        { weight: "", reps: "", completed: false },
      ],
    },
  ],
  ...overrides,
});

describe("live-set commitment semantics contract", () => {
  // "Edited values remain drafts until explicit completion."
  it("treats a typed-but-uncompleted set as a draft, and an untouched one as nothing", () => {
    expect(isDraftSet({ weight: "145", reps: "", completed: false })).toBe(true);
    expect(isDraftSet({ weight: "", reps: "9", completed: false })).toBe(true);
    expect(isDraftSet({ weight: "", reps: "", completed: false })).toBe(false);
    // A completed set is an observation, never a draft.
    expect(isDraftSet({ weight: "145", reps: "7", completed: true })).toBe(false);
  });

  it("counts drafts, completions and the plan separately", () => {
    const active = session();
    expect(countCompletedSets(active)).toBe(2);
    expect(countDraftSets(active)).toBe(1);
    expect(countPlannedSets(active)).toBe(7);
  });

  // "Edited-but-uncompleted sets are excluded by default at workout finish."
  it("drops drafts at finish and reports exactly what it dropped", () => {
    const { session: finished, excludedDrafts, completedSets } = finalizeSession(session(), "2026-09-01T11:00:00.000Z");
    expect(excludedDrafts).toBe(1);
    expect(completedSets).toBe(2);
    expect(finished.status).toBe("completed");
    expect(finished.completedAt).toBe("2026-09-01T11:00:00.000Z");

    // "Only completed observations feed performance history and derived models."
    const kept = finished.exercises.flatMap((exercise) => exercise.sets);
    expect(kept).toHaveLength(2);
    expect(kept.every((set) => set.completed)).toBe(true);
    expect(kept.some((set) => set.weight === "145" && set.reps === "")).toBe(false);
  });

  it("drops an exercise the athlete never confirmed a set for", () => {
    // Progress counts exercises straight off the record, so keeping an empty
    // shell would report an exercise that was never performed.
    const { session: finished } = finalizeSession(session());
    expect(finished.exercises.map((exercise) => exercise.exerciseName)).toEqual(["Barbell Bench Press"]);
  });

  it("leaves the live session untouched when it finalizes a copy", () => {
    const active = session();
    finalizeSession(active);
    expect(countPlannedSets(active)).toBe(7);
  });
});

describe("active workout continuity contract", () => {
  // "On interruption or reconnect, restore last confirmed execution position."
  it("resumes at the first set that is not confirmed complete", () => {
    expect(activePosition(session())).toEqual({ exerciseIndex: 0, setIndex: 2 });
  });

  it("carries a draft forward rather than skipping past it", () => {
    // Set 3 was typed into but never logged, so it is still the active set —
    // resuming must not treat typing as completion.
    const position = activePosition(session())!;
    const set = session().exercises[position.exerciseIndex].sets[position.setIndex];
    expect(set.completed).toBe(false);
    expect(isDraftSet(set)).toBe(true);
  });

  it("reports no active position once every planned set is confirmed", () => {
    const done = session({
      exercises: session().exercises.map((exercise) => ({ ...exercise, sets: exercise.sets.map((set) => ({ ...set, completed: true })) })),
    });
    expect(activePosition(done)).toBeNull();
  });
});

describe("live workout glance contract", () => {
  // "Previous comparable performance is visible only when it helps the
  // immediate decision."
  it("offers the last confirmed observation for the exercise, from finished sessions only", () => {
    const older = session({ id: "old", status: "completed", completedAt: "2026-08-01T10:00:00.000Z" });
    const newer = session({
      id: "new", status: "completed", completedAt: "2026-08-20T10:00:00.000Z",
      exercises: [{ id: "e1", exerciseName: "Barbell Bench Press", plannedPrescription: "4 × 6–8", sets: [{ weight: "155", reps: "6", completed: true }] }],
    });
    const live = session({ id: "live", status: "active" });

    expect(lastCompletedSetFor("Barbell Bench Press", [older, newer, live])).toMatchObject({ weight: "155", reps: "6" });
    // An exercise with no confirmed history has nothing to show, and showing
    // nothing is correct: the contract does not allow an invented reference.
    expect(lastCompletedSetFor("Lat Pulldown", [newer])).toBeNull();
  });

  it("never reads a still-running session as previous performance", () => {
    expect(lastCompletedSetFor("Barbell Bench Press", [session({ status: "active" })])).toBeNull();
  });
});

describe("carried-forward entry", () => {
  // "view next set -> edit ONLY IF NECESSARY -> mark set complete -> manage
  // rest": the next set should already hold the load the athlete just used.
  it("offers the last confirmed set of this exercise before reaching for history", () => {
    const finished = session({ id: "old", status: "completed", completedAt: "2026-08-01T10:00:00.000Z" });
    const carried = carriedEntryFor(session().exercises[0], 2, [finished]);
    expect(carried).toEqual({ weight: "145", reps: "7", height: "", source: "session" });
  });

  it("falls back to the last finished session when this exercise has no confirmed set yet", () => {
    const finished = session({
      id: "old", status: "completed", completedAt: "2026-08-01T10:00:00.000Z",
      exercises: [{ id: "e2", exerciseName: "Lat Pulldown", plannedPrescription: "3 × 10", sets: [{ weight: "120", reps: "10", completed: true }] }],
    });
    const carried = carriedEntryFor(session().exercises[1], 0, [finished]);
    expect(carried).toEqual({ weight: "120", reps: "10", height: "", source: "history" });
  });

  it("offers nothing when there is nothing confirmed to carry", () => {
    expect(carriedEntryFor(session().exercises[1], 0, [])).toBeNull();
  });

  it("never lets a carried default read back as a draft", () => {
    // The default is an input value, not stored state. A set the athlete never
    // touched stays empty, so finishing does not report it as typed-and-dropped.
    const bench = session().exercises[0];
    expect(carriedEntryFor(bench, 3, [])).toEqual({ weight: "145", reps: "7", height: "", source: "session" });
    expect(isDraftSet(bench.sets[3])).toBe(false);
  });
});

describe("skipping an exercise", () => {
  // Reported: "I didn't get to do the smith bar hip thrust, I should be able to
  // skip it and go to the next exercise."
  it("resolves the pending sets and moves execution to the next exercise", () => {
    const active = session();
    expect(activePosition(active)).toEqual({ exerciseIndex: 0, setIndex: 2 });

    const skipped = skipExercise(active, 0);
    expect(activePosition(skipped)).toEqual({ exerciseIndex: 1, setIndex: 0 });
    expect(countSkippedSets(skipped)).toBe(2);
  });

  it("leaves already-logged sets alone, because a skip is about what remains", () => {
    const skipped = skipExercise(session(), 0);
    const bench = skipped.exercises[0].sets;
    expect(bench.filter((set) => set.completed)).toHaveLength(2);
    expect(bench.filter((set) => set.completed && set.skipped)).toHaveLength(0);
  });

  it("stops a skipped set counting as a draft", () => {
    // Set 3 was typed into and never logged. Skipping resolves it, so it is no
    // longer unfinished business.
    expect(countDraftSets(session())).toBe(1);
    expect(countDraftSets(skipExercise(session(), 0))).toBe(0);
  });

  it("records nothing about a skipped exercise at finish", () => {
    const { session: finished, skippedSets, completedSets } = finalizeSession(skipExercise(session(), 1));
    expect(skippedSets).toBe(3);
    expect(completedSets).toBe(2);
    expect(finished.exercises.map((exercise) => exercise.exerciseName)).toEqual(["Barbell Bench Press"]);
  });

  it("is reversible", () => {
    const skipped = skipExercise(session(), 1);
    expect(isExerciseSkipped(skipped.exercises[1])).toBe(true);
    const restored = unskipExercise(skipped, 1);
    expect(isExerciseSkipped(restored.exercises[1])).toBe(false);
    expect(activePosition(restored)).toEqual({ exerciseIndex: 0, setIndex: 2 });
  });

  it("reads an exercise as skipped only when nothing is left pending", () => {
    const partly = { ...session().exercises[0], sets: session().exercises[0].sets.map((set, index) => index === 3 ? { ...set, skipped: true } : set) };
    expect(isExerciseSkipped(partly)).toBe(false);
    expect(isExerciseSkipped(skipExercise(session(), 1).exercises[1])).toBe(true);
  });
});
