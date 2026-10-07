// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { deviceWorkoutHistoryKey, finalizeSession, loadDeviceWorkoutSessions, type DeviceWorkoutSession } from "./deviceWorkoutLog";
import { correctSet, elapsedText, exerciseOutcomeLine, removeSet, sessionRecap, updateFinishedSession, withNote } from "./sessionRecap";
import { strengthSyncedKey, strengthSyncQueueKey, loadSyncQueue } from "./strengthSyncQueue";

const done = (weight: string, reps: string) => ({ weight, reps, unit: "lb" as const, completed: true });
const open = () => ({ weight: "", reps: "" });
const skipped = () => ({ weight: "", reps: "", skipped: true });

/** Bench: 2 done, 1 skipped, 1 untouched. Row: never touched. Curl: every set skipped. */
const running = (): DeviceWorkoutSession => ({
  id: "s1", title: "Week 1 · Day 01 · Push workout", dayLabel: "Week 1 · Day 01 · Push", startedAt: "2026-10-07T10:00:00.000Z", status: "active", weightUnit: "lb",
  exercises: [
    { id: "bench", exerciseName: "Barbell Bench Press", plannedPrescription: "4 × 5", sets: [done("185", "5"), done("185", "5"), skipped(), open()] },
    { id: "row", exerciseName: "Seated Cable Row", plannedPrescription: "3 × 10", sets: [open(), open(), open()] },
    { id: "curl", exerciseName: "Barbell Curl", plannedPrescription: "2 × 10", sets: [skipped(), skipped()] },
    { id: "dip", exerciseName: "Dips", plannedPrescription: "2 × 8", sets: [{ id: "d", type: "drop", weight: "100", reps: "5", unit: "lb", completed: true, stages: [{ id: "d1", weight: "100", reps: "5", unit: "lb" }, { id: "d2", weight: "70", reps: "6", unit: "lb" }, { id: "d3", weight: "50", reps: "10", unit: "lb" }] }, open()] },
  ],
});

afterEach(() => localStorage.clear());

describe("finishing keeps what was planned, done, skipped and never recorded (R03, R04)", () => {
  it("never turns an untouched set into a done one, and names the exercises not done", () => {
    const { session, completedSets } = finalizeSession(running(), "2026-10-07T10:52:00.000Z");
    expect(completedSets).toBe(3);
    expect(session.exercises.map((exercise) => [exercise.exerciseName, exercise.sets.length, exercise.plannedSets, exercise.skippedSets])).toEqual([
      ["Barbell Bench Press", 2, 4, 1],
      ["Dips", 1, 2, 0],
    ]);
    expect(session.notPerformed).toEqual([
      { exerciseName: "Seated Cable Row", plannedSets: 3, skipped: false },
      { exerciseName: "Barbell Curl", plannedSets: 2, skipped: true },
    ]);
  });
});

describe("the recap is built from the stored record alone", () => {
  const recap = () => sessionRecap(finalizeSession(running(), "2026-10-07T10:52:00.000Z").session, "lb");

  it("has at most three summary numbers, and counts a drop set once (R06, R09)", () => {
    const view = recap();
    expect(view.totals).toEqual({ exercises: 2, workingSets: 3 });
    expect(view.elapsedMinutes).toBe(52);
    const dips = view.exercises.find((exercise) => exercise.name === "Dips")!;
    expect(dips.sets).toHaveLength(1);
    expect(dips.sets[0].drop).toBe(true);
    expect(dips.sets[0].line).toBe("Drop set · 100 lb × 5 → 70 lb × 6 → 50 lb × 10");
    expect(dips.sets[0].detail).toContain("1 drop set · 3 stages · 21 reps");
  });

  it("says what was done against what was planned", () => {
    const [bench, dips] = recap().exercises;
    expect(exerciseOutcomeLine(bench)).toBe("2 of 4 planned sets · 1 skipped · 1 not recorded");
    expect(exerciseOutcomeLine(dips)).toBe("1 of 2 planned sets · 1 not recorded");
    expect(recap().notDone).toEqual([
      { name: "Seated Cable Row", plannedSets: 3, skipped: false },
      { name: "Barbell Curl", plannedSets: 2, skipped: true },
    ]);
  });

  it("labels time as elapsed, and drops a finish a day later as not measurable (R08)", () => {
    expect(elapsedText(52)).toBe("52 min elapsed");
    expect(elapsedText(65)).toBe("1 h 05 min elapsed");
    const left = sessionRecap({ ...finalizeSession(running(), "2026-10-09T10:00:00.000Z").session }, "lb");
    expect(left.elapsedMinutes).toBeNull();
  });

  it("never carries calories, effort or a score", () => {
    expect(Object.keys(recap())).toEqual(["id", "title", "dayLabel", "completedAt", "elapsedMinutes", "exercises", "notDone", "totals", "note"]);
  });
});

describe("corrections go through the one stored record (R11, R12)", () => {
  const store = () => {
    const finished = finalizeSession(running(), "2026-10-07T10:52:00.000Z").session;
    localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([finished]));
    return finished;
  };

  it("edits a standard set, refuses invalid reps and never edits a drop set", () => {
    const finished = store();
    const fixed = correctSet(finished, "bench", 1, { weight: "190", reps: "4" }, "2026-10-07T12:00:00.000Z");
    expect(fixed.exercises[0].sets[1]).toMatchObject({ weight: "190", reps: "4", completed: true });
    expect(fixed.correctedAt).toBe("2026-10-07T12:00:00.000Z");
    expect(correctSet(finished, "bench", 1, { weight: "190", reps: "0" })).toBe(finished);
    expect(correctSet(finished, "bench", 1, { weight: "abc", reps: "5" })).toBe(finished);
    expect(correctSet(finished, "dip", 0, { weight: "90", reps: "5" })).toBe(finished);
  });

  it("removes a set, but never the workout's last one", () => {
    const finished = store();
    const fewer = removeSet(finished, "dip", 0);
    expect(fewer.exercises.map((exercise) => exercise.id)).toEqual(["bench"]);
    const last = removeSet(removeSet(fewer, "bench", 0), "bench", 0);
    expect(last.exercises[0].sets).toHaveLength(1);
  });

  it("saves a note and an empty note removes it", () => {
    const finished = store();
    const noted = withNote(finished, "  Shoulder felt fine  ");
    expect(noted.note).toBe("Shoulder felt fine");
    expect(withNote(noted, "   ").note).toBeUndefined();
  });

  it("saves the change, drops unsent lifts of this workout, and says when the account already holds the old ones", () => {
    store();
    localStorage.setItem(strengthSyncQueueKey, JSON.stringify([
      { key: "workout-s1-bench", queuedAt: "x", athlete: {}, lift: {} },
      { key: "workout-other-bench", queuedAt: "x", athlete: {}, lift: {} },
    ]));
    const first = updateFinishedSession("s1", (session) => correctSet(session, "bench", 0, { weight: "180", reps: "5" }))!;
    expect(first.alreadySent).toBe(false);
    expect(loadDeviceWorkoutSessions()[0].exercises[0].sets[0].weight).toBe("180");
    expect(loadSyncQueue().map((item) => item.key)).toEqual(["workout-other-bench"]);

    localStorage.setItem(strengthSyncedKey, JSON.stringify(["workout-s1-bench"]));
    expect(updateFinishedSession("s1", (session) => correctSet(session, "bench", 0, { weight: "175", reps: "5" }))!.alreadySent).toBe(true);
    // A note is not a lift: nothing about the account changes.
    expect(updateFinishedSession("s1", (session) => withNote(session, "ok"))!.alreadySent).toBe(false);
    expect(updateFinishedSession("missing", (session) => session)).toBeNull();
  });
});

describe("Last logged follows the exercise's identity (H07, H11)", () => {
  it("keeps two catalog entries that share a name apart, and falls back to the name for older records", async () => {
    const { lastCompletedSetFor } = await import("./deviceWorkoutLog");
    const at = (iso: string, catalogId: number | undefined, weight: string): DeviceWorkoutSession => ({
      id: iso, title: "W", dayLabel: "W", startedAt: iso, completedAt: iso, status: "completed",
      exercises: [{ id: "e", exerciseName: "Row", ...(catalogId !== undefined ? { catalogId } : {}), plannedPrescription: "3 × 5", sets: [done(weight, "5")] }],
    });
    const history = [at("2026-10-05T10:00:00.000Z", 2, "90"), at("2026-10-06T10:00:00.000Z", 1, "120"), at("2026-10-01T10:00:00.000Z", undefined, "60")];
    expect(lastCompletedSetFor({ exerciseName: "Row", catalogId: 2 }, history)?.weight).toBe("90");
    expect(lastCompletedSetFor({ exerciseName: "Row", catalogId: 1 }, history)?.weight).toBe("120");
    expect(lastCompletedSetFor({ exerciseName: "Row", catalogId: 3 }, [history[2]])?.weight).toBe("60");
    expect(lastCompletedSetFor("Row", history)?.weight).toBe("120");
  });
});

describe("Repeat a workout copies the prescription, never the history (H10)", () => {
  it("takes each exercise done, once, with its planned prescription and none of its sets", async () => {
    const { repeatDayFrom } = await import("./sessionRecap");
    const finished = finalizeSession(running(), "2026-10-07T10:52:00.000Z").session;
    const withRetired = { ...finished, exercises: [...finished.exercises, { id: "gone", exerciseName: "Retired Lift", plannedPrescription: "3 × 8", sets: [done("50", "8")] }] };
    const { day, leftOut } = repeatDayFrom(withRetired);
    expect(day.label).toBe("Push");
    // "Dips" is not a catalog name (the catalog has "Parallel-Bar Dip"), so it is named, not guessed.
    expect(day.items.map((item) => [item.exercise.name, item.prescription])).toEqual([["Barbell Bench Press", "4 × 5"]]);
    // Nothing logged travels: no weight, reps, completion, rpe, rest or note.
    for (const item of day.items) expect(Object.keys(item).sort()).toEqual(["exercise", "prescription"]);
    expect(leftOut).toEqual(["Dips", "Retired Lift"]);
    expect(day.unresolved).toEqual([]);
  });
});

describe("one exercise's history (H07, H08)", () => {
  it("lists the workouts that did it, newest first, by identity, with sets in their logged units", async () => {
    const { exerciseHistory } = await import("./sessionRecap");
    const at = (id: string, iso: string, catalogId: number | undefined, weight: string, unit: "lb" | "kg"): DeviceWorkoutSession => ({
      id, title: "W", dayLabel: `Week 1 · ${id}`, startedAt: iso, completedAt: iso, status: "completed",
      exercises: [{ id: "e", exerciseName: "Romanian Deadlift", ...(catalogId !== undefined ? { catalogId } : {}), plannedPrescription: "3 × 8", sets: [{ weight, reps: "8", unit, completed: true }, { weight: "", reps: "" }] }],
    });
    const sessions = [at("A", "2026-10-01T10:00:00Z", 186, "100", "kg"), at("B", "2026-10-05T10:00:00Z", 186, "225", "lb"), at("C", "2026-10-06T10:00:00Z", 42, "60", "kg"), { ...at("D", "2026-10-07T10:00:00Z", 186, "1", "lb"), status: "active" as const }];
    const { entries, total } = exerciseHistory({ exerciseName: "Romanian Deadlift", catalogId: 186 }, sessions, "lb");
    expect(total).toBe(2);
    expect(entries.map((entry) => entry.sessionId)).toEqual(["B", "A"]);
    expect(entries[0].sets.map((set) => set.line)).toEqual(["225 lb × 8"]);
    expect(entries[1].sets.map((set) => set.line)).toEqual(["100 kg × 8"]);
    expect(entries[0].dayName).toBe("B");
    expect(exerciseHistory({ exerciseName: "Romanian Deadlift", catalogId: 186 }, sessions, "lb", 1).entries).toHaveLength(1);
  });
});

describe("Last logged says what was logged when it is offered in another unit (H08)", () => {
  it("keeps the logged weight and unit beside the converted offer", async () => {
    const { carriedEntryFor } = await import("./deviceWorkoutLog");
    const past: DeviceWorkoutSession = { id: "p", title: "W", dayLabel: "W", startedAt: "2026-10-01T10:00:00Z", completedAt: "2026-10-01T11:00:00Z", status: "completed",
      exercises: [{ id: "e", exerciseName: "Barbell Bench Press", catalogId: 1, plannedPrescription: "3 × 5", sets: [{ weight: "82.5", reps: "4", unit: "kg", completed: true }] }] };
    const today = { id: "t", exerciseName: "Barbell Bench Press", catalogId: 1, plannedPrescription: "3 × 5", sets: [{ weight: "", reps: "" }] };
    expect(carriedEntryFor(today, 0, [past], "lb")).toEqual({ weight: "181.88", reps: "4", height: "", source: "history", logged: { weight: "82.5", unit: "kg" } });
    expect(carriedEntryFor(today, 0, [past], "kg")).toEqual({ weight: "82.5", reps: "4", height: "", source: "history" });
  });
});
