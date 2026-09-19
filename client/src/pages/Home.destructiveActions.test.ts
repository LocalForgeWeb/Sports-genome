import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("Reversible-action and destructive-confirmation contract", () => {
  it("gates the Tier C plan-destroying actions (restart onboarding, reset sport) behind a named confirmation instead of executing immediately", () => {
    expect(source).toContain('import { ConfirmDialog, type ConfirmDialogRequest } from "@/components/ConfirmDialog";');
    expect(source).toContain("const [pendingDestructiveAction, setPendingDestructiveAction] = useState<ConfirmDialogRequest | null>(null);");
    expect(source).toContain("const requestRebuildPlan = () => setPendingDestructiveAction({");
    expect(source).not.toContain("onClick={rebuildPlan}");
    expect(source).toContain("onClick={requestRebuildPlan}");
    expect(source).toContain("setPendingDestructiveAction({\n        title: \"Reset sport selection?\"");
    expect(source).toContain("{pendingDestructiveAction && <ConfirmDialog {...pendingDestructiveAction} onCancel={() => { pendingDestructiveAction.onCancel?.(); setPendingDestructiveAction(null); }} onConfirm={() => { pendingDestructiveAction.onConfirm(); setPendingDestructiveAction(null); }} />}");
  });

  it("gives the Tier B sport-switch an Undo affordance that restores the full prior plan, not just the sport", () => {
    expect(source).toContain("const undoSwitch = () => {");
    expect(source).toContain("action: { label: \"Undo\", onClick: undoSwitch }");
    expect(source).toContain("setDayStore(previous.dayStore);");
    expect(source).toContain("setPlanWeeks(previous.planWeeks);");
    // Undo puts the athlete back on the day they were editing, holding what it held.
    expect(source).toContain("adoptActiveDay(restored, loadDay(previous.dayStore, restored.key));");
  });

  it("gives the Tier A exercise-removal an immediate Undo toast rather than a blocking confirmation", () => {
    expect(source).toContain("const removeExercise = (id: number) => {");
    expect(source).not.toContain("const removeExercise = (id: number) => setCustomWorkout((current) => current.filter((exercise) => exercise.id !== id));");
    expect(source).toContain("toast(`${removed.name} removed`, {");
    expect(source).toContain('label: "Undo",');
  });

  it("surfaces downstream impact when a pasted routine overwrites previously saved training days (Tier B)", () => {
    // The day is named by position as well as split label, because a week can hold two
    // days with the same label and "replaced your Upper" would not say which.
    expect(source).toContain("if (dayExerciseCount(nextStore, slot.key)) overwrittenDayLabels.push(`${slot.ordinal} · ${slot.day}`);");
    expect(source).toContain("Replaced your previously saved ${overwrittenDayLabels.join(\", \")}");
  });
});
