import { describe, expect, it } from "vitest";
import { countCoveredRegions, recordedLifts, summarizeAthleteRecord, type AthleteRecordSources } from "./athleteRecord";
import type { DeviceWorkoutSession } from "./deviceWorkoutLog";

const now = new Date("2026-09-24T18:00:00"); // a Thursday

function session(id: string, daysAgo: number, exercises: Array<[string, number]>, status: "completed" | "active" = "completed"): DeviceWorkoutSession {
  const at = new Date(now.getTime() - daysAgo * 86_400_000).toISOString();
  return {
    id,
    title: `Session ${id}`,
    dayLabel: `Week 1 · Day 0${id} · Push`,
    startedAt: at,
    completedAt: status === "completed" ? at : undefined,
    status,
    exercises: exercises.map(([name, sets], index) => ({ id: `${id}-${index}`, exerciseName: name, plannedPrescription: "3 × 5", sets: Array.from({ length: sets }, () => ({ weight: "80", reps: "5", completed: true })) })),
  };
}

const typed = (id: string, exerciseName: string, daysAgo: number) => ({ id, exerciseName, observedAt: new Date(now.getTime() - daysAgo * 86_400_000).toISOString(), measurementType: "MEASURED_1RM", loadKg: 100, laterality: "BILATERAL" as const, dataQuality: "SELF_REPORTED" });

const base: AthleteRecordSources = { deviceObservations: [], deviceSessions: [], directAccess: true, now };

describe("the athlete's record, read one way", () => {
  it("reports zero everywhere with nothing on record, and names the device as the store", () => {
    expect(summarizeAthleteRecord(base)).toMatchObject({ liftsLogged: 0, liftsFromWorkouts: 0, regionsCovered: 0, workoutsRecorded: 0, completedThisWeek: 0, storage: "device" });
  });

  it("counts typed lifts and workout-derived lifts as one record, the way Strength does", () => {
    const summary = summarizeAthleteRecord({
      ...base,
      deviceObservations: [typed("t1", "Barbell Bench Press", 2), typed("t2", "Back Squat", 9)],
      deviceSessions: [session("1", 1, [["Barbell Bench Press", 3], ["Lat Pulldown", 3]]), session("2", 20, [["Back Squat", 3]])],
    });
    // Two typed, plus one per exercise per finished workout: 2 + 2 + 1.
    expect(summary.liftsLogged).toBe(5);
    expect(summary.liftsFromWorkouts).toBe(3);
    expect(summary.workoutsRecorded).toBe(2);
    expect(summary.regionsCovered).toBeGreaterThan(0);
    expect(summary.regionsCovered).toBe(countCoveredRegions(recordedLifts({ ...base, deviceObservations: [typed("t1", "Barbell Bench Press", 2), typed("t2", "Back Squat", 9)], deviceSessions: [session("1", 1, [["Barbell Bench Press", 3], ["Lat Pulldown", 3]]), session("2", 20, [["Back Squat", 3]])] })));
  });

  it("counts a finished workout for the week it finished in and never counts an active one", () => {
    const summary = summarizeAthleteRecord({ ...base, deviceSessions: [session("1", 1, [["Back Squat", 3]]), session("2", 10, [["Back Squat", 3]]), session("3", 0, [["Back Squat", 3]], "active")] });
    expect(summary.completedThisWeek).toBe(1);
    expect(summary.workoutsRecorded).toBe(2);
    expect(summary.setsThisWeek).toBe(3);
  });

  it("does not count a workout with no logged reps as a lift", () => {
    const empty = session("1", 1, [["Back Squat", 0]]);
    expect(summarizeAthleteRecord({ ...base, deviceSessions: [empty] })).toMatchObject({ liftsLogged: 0, workoutsRecorded: 1 });
  });

  it("reads the account's typed lifts when the account is the source, and the device's otherwise", () => {
    const account = [typed("a1", "Conventional Deadlift", 1)];
    const device = [typed("d1", "Back Squat", 1), typed("d2", "Back Squat", 3)];
    expect(summarizeAthleteRecord({ ...base, deviceObservations: device, accountObservations: account, directAccess: false })).toMatchObject({ liftsLogged: 1, storage: "account" });
    expect(summarizeAthleteRecord({ ...base, deviceObservations: device, accountObservations: account, directAccess: true })).toMatchObject({ liftsLogged: 2, storage: "device" });
  });

  it("counts a region once however many lifts land in it", () => {
    expect(countCoveredRegions([{ exerciseName: "Back Squat" }, { exerciseName: "Back Squat" }, { exerciseName: "Back Squat" }])).toBe(countCoveredRegions([{ exerciseName: "Back Squat" }]));
    expect(countCoveredRegions([{ exerciseName: "Not an exercise" }])).toBe(0);
  });
});
