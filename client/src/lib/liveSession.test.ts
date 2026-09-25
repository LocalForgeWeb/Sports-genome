import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { exerciseProgressFor, summarizeLiveSession, trainingStateByDayLabel } from "./liveSession";
import type { DeviceWorkoutSession } from "./deviceWorkoutLog";

const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");

const set = (over: Partial<{ weight: string; reps: string; completed: boolean; skipped: boolean }> = {}) =>
  ({ weight: "", reps: "", completed: false, ...over });

function session(over: Partial<DeviceWorkoutSession> = {}): DeviceWorkoutSession {
  return {
    id: "device-1",
    title: "Day 05 workout",
    dayLabel: "Week 1 · Day 05 · Sport Transfer",
    startedAt: "2026-09-25T10:00:00.000Z",
    status: "active",
    exercises: [
      { id: "a", exerciseName: "Box Jump", plannedPrescription: "4 × 3–5", sets: [set({ completed: true }), set(), set(), set()] },
      { id: "b", exerciseName: "Skater Bound", plannedPrescription: "4 × 3–5", sets: [set(), set(), set(), set()] },
    ],
    ...over,
  } as DeviceWorkoutSession;
}

/**
 * Measured with a session running and one set logged: Plan read "start when you
 * are ready", the week board read "6 exercises" for the day being trained, and
 * Home read "0 of 5 sessions done". Three screens describing a workout that was
 * under way as one that had not started, and no way back to it but remembering
 * which tab it was on.
 */
describe("the workout under way is readable from outside the tracker", () => {
  it("says where you are, in the terms the tracker uses", () => {
    const live = summarizeLiveSession([session()]);
    expect(live?.completedSets).toBe(1);
    expect(live?.plannedSets).toBe(8);
    expect(live?.exerciseNumber).toBe(1);
    expect(live?.exerciseCount).toBe(2);
    expect(live?.exerciseName).toBe("Box Jump");
    // The next set to do, not the one just finished.
    expect(live?.setNumber).toBe(2);
    expect(live?.setCount).toBe(4);
  });

  it("reports a finished-but-unsaved session as having nothing left, rather than as absent", () => {
    // Every set done is not the same as no session: the athlete still has to
    // finish it, and the bar has to keep offering the way back until they do.
    const done = session({ exercises: session().exercises.map((exercise) => ({ ...exercise, sets: exercise.sets.map(() => set({ completed: true })) })) });
    const live = summarizeLiveSession([done]);
    expect(live).not.toBeNull();
    expect(live?.exerciseName).toBeNull();
    expect(live?.completedSets).toBe(live?.plannedSets);
  });

  it("is silent when nothing is running", () => {
    expect(summarizeLiveSession([])).toBeNull();
    expect(summarizeLiveSession([session({ status: "completed" })])).toBeNull();
  });

  it("gives each planned exercise the state the session has it in", () => {
    const sessions = [session()];
    expect(exerciseProgressFor("Box Jump", sessions)).toEqual({ completed: 1, planned: 4, state: "current" });
    expect(exerciseProgressFor("Skater Bound", sessions)).toEqual({ completed: 0, planned: 4, state: "todo" });
    // An exercise the day holds but this session does not is not "not started";
    // there is simply nothing to say about it.
    expect(exerciseProgressFor("Bench Press", sessions)).toBeNull();
  });

  it("marks a finished exercise done and a passed one skipped", () => {
    const sessions = [session({
      exercises: [
        { id: "a", exerciseName: "Box Jump", plannedPrescription: "2 × 5", sets: [set({ completed: true }), set({ completed: true })] },
        { id: "b", exerciseName: "Skater Bound", plannedPrescription: "2 × 5", sets: [set({ skipped: true }), set({ skipped: true })] },
      ],
    } as Partial<DeviceWorkoutSession>)];
    expect(exerciseProgressFor("Box Jump", sessions)?.state).toBe("done");
    expect(exerciseProgressFor("Skater Bound", sessions)?.state).toBe("skipped");
  });

  it("tells a trained day from one that was only written down", () => {
    const states = trainingStateByDayLabel([
      session({ status: "completed", dayLabel: "Week 1 · Day 01 · Push" }),
      session({ dayLabel: "Week 1 · Day 05 · Sport Transfer" }),
    ]);
    expect(states["Week 1 · Day 01 · Push"]).toBe("trained");
    expect(states["Week 1 · Day 05 · Sport Transfer"]).toBe("live");
    expect(states["Week 1 · Day 02 · Pull"]).toBeUndefined();
  });

  it("lets a session running now outrank one finished earlier on the same day", () => {
    const label = "Week 1 · Day 05 · Sport Transfer";
    expect(trainingStateByDayLabel([session({ status: "completed" }), session()])[label]).toBe("live");
    expect(trainingStateByDayLabel([session(), session({ status: "completed" })])[label]).toBe("live");
  });
});

describe("every surface that described the day now reads the session", () => {
  it("keeps the way back to the workout on screen, and off the tracker itself", () => {
    expect(home).toContain('{liveSession && workspace !== "tracker" && <SessionResumeBar live={liveSession}');
    expect(home).toContain('onResume={() => navigateWorkspace("tracker")}');
  });

  it("gives the plan rows the state the session has each exercise in", () => {
    expect(home).toContain("progress={liveSession ? exerciseProgressFor(exercise.name) : null}");
  });

  it("marks the week board's days, keyed by the label the session was started with", () => {
    // The same `Week 1 · Day 05 · Sport Transfer` string the tracker stamps on,
    // so no second identity for a day has to be invented or kept in step.
    expect(home).toContain("const activeDayLabel = `Week ${activeWeek} · ${activeSlot.ordinal} · ${activeSlot.day}`;");
    expect(home).toContain("trainingStateFor={(index) => dayTrainingStates[`Week ${activeWeek} · ${daySlots[index]?.ordinal} · ${daySlots[index]?.day}`] || null}");
  });

  it("stops Home telling an athlete who is training to start when they are ready", () => {
    expect(home).toContain("live={liveSession}");
    expect(home).toContain('onOpenTracker={() => navigateWorkspace("tracker")}');
  });
});
