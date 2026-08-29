import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./DeviceWorkoutTracker.tsx", import.meta.url), "utf8");
const log = readFileSync(new URL("../lib/deviceWorkoutLog.ts", import.meta.url), "utf8");
const styles = readFileSync(new URL("../workout-planner.css", import.meta.url), "utf8");

describe("Device Workout Tracker execution focus", () => {
  it("keeps device-local set logging limited to weight, reps, and completion", () => {
    expect(log).toContain('export type DeviceSetLog = { weight: string; reps: string; completed: boolean }');
    expect(source).not.toContain('<span>RPE</span>');
    expect(source).not.toContain('rpe: ""');
  });

  it("gives each set a clear save action and communicates Progress handoff without a perceived-effort field", () => {
    expect(source).toContain('aria-pressed={set.completed}');
    expect(source).toContain('Finish the session when the workout is done to add it to Progress.');
    expect(source).not.toContain('optional effort');
  });

  it("uses the dedicated elevated mobile tracker surface and a two-field set layout rather than three dense input columns", () => {
    expect(styles).toContain(".device-workout-tracker .session-set-row");
    expect(styles).toContain("grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto");
    expect(styles).toContain(".device-workout-tracker .session-exercise");
  });

  it("renders one concise set-log label instead of duplicating the action copy", () => {
    expect(source).not.toContain(': "Log"}<span>{set.completed ? "Logged" : "Log set"}</span>');
  });
});
