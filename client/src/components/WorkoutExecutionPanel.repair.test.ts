import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { hasLoggedValue } from "@/components/WorkoutExecutionPanel";

const panel = readFileSync(new URL("./WorkoutExecutionPanel.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../workout-planner.css", import.meta.url), "utf8");

/**
 * An athlete who logged 225 for a 22.5kg dumbbell had no way to take it back:
 * `removePasskey` was the only destructive operation in the API, so the number
 * stayed in the history and in every progression estimate drawn from it.
 */
describe("removing a mistyped set", () => {
  it("offers the control only where there is something to remove", () => {
    expect(hasLoggedValue(undefined)).toBe(false);
    expect(hasLoggedValue({ actualWeight: null, actualReps: null, completed: false })).toBe(false);
  });

  it("counts a set with only a weight, only reps, or only completion", () => {
    expect(hasLoggedValue({ actualWeight: "100.00", actualReps: null, completed: false })).toBe(true);
    expect(hasLoggedValue({ actualWeight: null, actualReps: 5, completed: false })).toBe(true);
    expect(hasLoggedValue({ actualWeight: null, actualReps: null, completed: true })).toBe(true);
  });

  it("counts a logged zero, which is a recorded value and not an empty row", () => {
    expect(hasLoggedValue({ actualWeight: "0.00", actualReps: 0, completed: false })).toBe(true);
  });

  it("hides the control on an untouched row rather than disabling it", () => {
    // A dead control on every empty set would be five pieces of furniture per
    // exercise that never do anything.
    expect(panel).toContain("onClear={hasLoggedValue(");
    expect(panel).toContain(": undefined}");
    expect(panel).toContain("{onClear && <button");
  });

  it("confirms before deleting, naming the set and the consequence", () => {
    expect(panel).toContain('import { ConfirmDialog, type ConfirmDialogRequest } from "@/components/ConfirmDialog";');
    expect(panel).toContain("confirmLabel: \"Remove set\"");
    expect(panel).toContain("stop counting toward progression");
    expect(panel).toContain("cannot be undone");
    expect(panel).toContain("<ConfirmDialog {...pendingSetRemoval}");
  });

  it("goes through the ownership-checked repair endpoint", () => {
    expect(panel).toContain("trpc.repair.deleteWorkoutSet.useMutation");
  });

  it("refetches the session so the removed set leaves the screen", () => {
    expect(panel).toContain("utils.workoutLog.get.invalidate({ sessionId: activeSessionId })");
    expect(panel).toContain("utils.workoutLog.list.invalidate()");
  });

  it("says something when the delete fails instead of appearing to succeed", () => {
    expect(panel).toContain("clearSetMutation.isError");
    expect(panel).toContain('role="alert"');
  });

  it("labels the control for a screen reader, since it is icon-only", () => {
    expect(panel).toContain("aria-label={`Remove set ${setNumber}`}");
  });

  it("keeps the destructive colour in a completed row", () => {
    // `.session-set-complete button` paints every button in a finished row with
    // the positive state colour, which would render this as a green confirm.
    expect(css).toContain(".session-set-complete .session-set-clear");
    expect(css).toContain("color: var(--sg-state-critical)");
    expect(css).toContain(".device-workout-tracker .session-set-complete .session-set-clear");
  });

  it("makes room for the extra control instead of wrapping it to a new row", () => {
    expect(css).toContain("grid-template-columns: 52px minmax(86px, 1fr) minmax(65px, .7fr) auto auto");
    expect(css).toContain(".device-workout-tracker .session-set-row { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto auto; }");
  });

  it("keeps a 44px touch target in the tracker", () => {
    const tracker = css.slice(css.indexOf(".device-workout-tracker .session-set-row .session-set-clear"));
    expect(tracker).toContain("min-height: 44px");
  });
});
