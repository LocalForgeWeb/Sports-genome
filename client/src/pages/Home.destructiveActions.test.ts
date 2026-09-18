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
    expect(source).toContain("setWeeklyPlan(previous.weeklyPlan);");
    expect(source).toContain("setPlanWeeks(previous.planWeeks);");
  });

  it("gives the Tier A exercise-removal an immediate Undo toast rather than a blocking confirmation", () => {
    expect(source).toContain("const removeExercise = (id: number) => {");
    expect(source).not.toContain("const removeExercise = (id: number) => setCustomWorkout((current) => current.filter((exercise) => exercise.id !== id));");
    expect(source).toContain("toast(`${removed.name} removed`, {");
    expect(source).toContain('label: "Undo",');
  });

  it("surfaces downstream impact when a pasted routine overwrites previously saved training days (Tier B)", () => {
    expect(source).toContain("const overwrittenDayLabels = Object.keys(nextPlan).filter((key) => weeklyPlan[key]?.length)");
    expect(source).toContain("Replaced your previously saved ${overwrittenDayLabels.join(\", \")}");
  });
});
