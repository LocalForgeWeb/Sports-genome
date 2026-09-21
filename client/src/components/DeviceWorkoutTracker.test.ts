import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./DeviceWorkoutTracker.tsx", import.meta.url), "utf8");
const log = readFileSync(new URL("../lib/deviceWorkoutLog.ts", import.meta.url), "utf8");
const styles = readFileSync(new URL("../workout-planner.css", import.meta.url), "utf8");

describe("Device Workout Tracker execution focus", () => {
  it("keeps device-local set logging to what the athlete actually records", () => {
    // Height joined weight and reps because a box jump has a box height and no
    // weight; skipped joined completed because passing on an exercise is a
    // resolved state, not an unfinished one. Still no perceived-effort field.
    ["weight: string;", "reps: string;", "height?: string;", "completed: boolean;", "skipped?: boolean;"]
      .forEach((field) => expect(log).toContain(field));
    expect(source).not.toContain('<span>RPE</span>');
    expect(source).not.toContain('rpe: ""');
  });

  it("gives each set a clear save action and communicates Progress handoff without a perceived-effort field", () => {
    expect(source).toContain('aria-pressed={set.completed}');
    // The handoff is the button, not a sentence explaining it: the head carried
    // twenty words describing a mechanism an athlete learns by finishing once.
    expect(source).toContain('Finish workout');
    expect(source).not.toContain('optional effort');
  });

  it("uses the dedicated elevated mobile tracker surface and a two-field set layout rather than three dense input columns", () => {
    expect(styles).toContain(".device-workout-tracker .session-set-row");
    expect(styles).toContain("grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto");
    expect(styles).toContain(".device-workout-tracker .session-exercise");
  });

  it("keeps the progress counter smaller than the active exercise it sits above", () => {
    // "Live workout glance contract": the active exercise leads the first view.
    // Measured before this rule the counter rendered at 32px and the exercise
    // name at 25px, which is that order inverted.
    expect(styles).toContain(".device-workout-tracker:has(.live-set-card) .execution-head h3");
    expect(styles).toContain(".device-workout-tracker .live-set-card h4 { font-size: clamp(1.75rem, 8vw, 2.4rem); }");
  });

  it("steps the finish action down while a session is running", () => {
    // Two full-width vermilion buttons would be two dominant actions; the
    // contract allows one.
    expect(source).toContain('className="execution-secondary-action"');
    expect(styles).toContain(".device-workout-tracker .execution-head > button.execution-secondary-action");
  });

  it("collapses the tracker day chooser once a session is live", () => {
    // Pre-session setup above an execution surface pushed the active set below
    // the fold: the live card started at y=650 on a 390x844 viewport.
    const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");
    // It collapses to nothing now. The banner that replaced the chooser repeated
    // the day the live card's own header already names, directly above it.
    expect(home).toContain("trackerSessionLive ? null :");
    expect(home).not.toContain("tracker-live-context");
    expect(home).toContain("window.addEventListener(deviceWorkoutHistoryEvent, syncTrackerSession)");
  });

  it("renders one concise set-log label instead of duplicating the action copy", () => {
    expect(source).not.toContain(': "Log"}<span>{set.completed ? "Logged" : "Log set"}</span>');
  });
});
