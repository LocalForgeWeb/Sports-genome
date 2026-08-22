import { describe, expect, it } from "vitest";
import { applyLocalComplete, applyLocalSetLog, OPTIMISTIC_SET_LOG_ID, type WorkoutSession } from "./offlineSession";

/**
 * A session as the API returns it, trimmed to the fields these helpers read.
 * Cast once here so each test stays about behaviour rather than about
 * reconstructing every column of three joined tables.
 */
function session(setLogs: Array<{ setNumber: number; completed: boolean; actualReps: number | null }> = []) {
  return {
    id: 42,
    status: "active",
    sessionNotes: null,
    completedAt: null,
    exercises: [
      {
        id: 5,
        exerciseName: "Back Squat",
        plannedPrescription: "3 × 5",
        setLogs: setLogs.map((log, index) => ({
          id: 100 + index,
          sessionExerciseId: 5,
          setNumber: log.setNumber,
          actualWeight: "100.00",
          weightUnit: "lb",
          actualReps: log.actualReps,
          completed: log.completed,
          setNotes: null,
          loggedAt: new Date("2026-01-01T10:00:00Z"),
          updatedAt: new Date("2026-01-01T10:00:00Z"),
        })),
      },
      { id: 6, exerciseName: "Bench Press", plannedPrescription: "3 × 5", setLogs: [] },
    ],
  } as unknown as WorkoutSession;
}

describe("applyLocalSetLog", () => {
  it("adds a set that has never been logged", () => {
    const next = applyLocalSetLog(session(), {
      sessionExerciseId: 5,
      setNumber: 1,
      actualWeight: 102.5,
      weightUnit: "lb",
      actualReps: 5,
      completed: true,
    });

    const logs = next.exercises[0].setLogs;
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ setNumber: 1, actualReps: 5, completed: true });
    expect(logs[0].id).toBe(OPTIMISTIC_SET_LOG_ID);
  });

  it("formats weight the way the decimal column returns it", () => {
    // The input field re-renders from this value; a bare number would show
    // "102.5" one moment and "102.50" the next.
    const next = applyLocalSetLog(session(), {
      sessionExerciseId: 5,
      setNumber: 1,
      actualWeight: 102.5,
      weightUnit: "lb",
      completed: true,
    });

    expect(next.exercises[0].setLogs[0].actualWeight).toBe("102.50");
  });

  it("overwrites an existing set and keeps the server's row id", () => {
    const next = applyLocalSetLog(session([{ setNumber: 1, completed: true, actualReps: 5 }]), {
      sessionExerciseId: 5,
      setNumber: 1,
      weightUnit: "lb",
      actualReps: 8,
      completed: false,
    });

    const logs = next.exercises[0].setLogs;
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ id: 100, actualReps: 8, completed: false });
  });

  it("keeps sets ordered when an earlier one is logged after a later one", () => {
    const withThird = applyLocalSetLog(session([{ setNumber: 3, completed: true, actualReps: 5 }]), {
      sessionExerciseId: 5,
      setNumber: 1,
      weightUnit: "lb",
      completed: true,
    });

    expect(withThird.exercises[0].setLogs.map(log => log.setNumber)).toEqual([1, 3]);
  });

  it("leaves other exercises untouched", () => {
    const original = session();
    const next = applyLocalSetLog(original, {
      sessionExerciseId: 5,
      setNumber: 1,
      weightUnit: "lb",
      completed: true,
    });

    expect(next.exercises[1]).toBe(original.exercises[1]);
  });

  it("ignores a set for an exercise not in this session", () => {
    const original = session();
    const next = applyLocalSetLog(original, {
      sessionExerciseId: 999,
      setNumber: 1,
      weightUnit: "lb",
      completed: true,
    });

    expect(next.exercises.every(exercise => exercise.setLogs.length === 0)).toBe(true);
  });

  it("does not mutate the session it was given", () => {
    const original = session();
    applyLocalSetLog(original, { sessionExerciseId: 5, setNumber: 1, weightUnit: "lb", completed: true });

    expect(original.exercises[0].setLogs).toHaveLength(0);
  });
});

describe("applyLocalComplete", () => {
  it("marks the session completed and stamps it", () => {
    const next = applyLocalComplete(session(), "felt strong");

    expect(next.status).toBe("completed");
    expect(next.sessionNotes).toBe("felt strong");
    expect(next.completedAt).toBeInstanceOf(Date);
  });

  it("keeps existing notes when none are supplied", () => {
    const base = { ...session(), sessionNotes: "earlier note" } as WorkoutSession;

    expect(applyLocalComplete(base).sessionNotes).toBe("earlier note");
  });
});
