import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("Reversible-action and destructive-confirmation contract", () => {
  it("gates the Tier C plan-destroying action behind a named confirmation instead of executing immediately", () => {
    expect(source).toContain('import { ConfirmDialog, type ConfirmDialogRequest } from "@/components/ConfirmDialog";');
    expect(source).toContain("const [pendingDestructiveAction, setPendingDestructiveAction] = useState<ConfirmDialogRequest | null>(null);");
    expect(source).toContain("const requestRebuildPlan = () => setPendingDestructiveAction({");
    expect(source).not.toContain("onClick={rebuildPlan}");
    expect(source).toContain("onClick={requestRebuildPlan}");
    /**
     * "Reset sport selection" is not on this list any more, because it was never a Tier C
     * action - it was an ordinary context change wearing one. Choosing not to train for a
     * sport ran a reset that cleared onboarding and emptied every week, so the profile had
     * no way to say it. The profile now switches context directly and destroys nothing;
     * restarting onboarding is still the one plan-destroying action, and still confirmed.
     */
    expect(source).not.toContain('title: "Reset sport selection?"');
    expect(source).toContain("const chooseSportContextMode = (mode: SportContextMode) => {");
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
    expect(source).toContain("const removeExercise = (id: number, { fromSheet = false }: { fromSheet?: boolean } = {}) => {");
    expect(source).not.toContain("const removeExercise = (id: number) => setCustomWorkout((current) => current.filter((exercise) => exercise.id !== id));");
    expect(source).toContain("toast(`${removed.name} removed`, {");
    expect(source).toContain('label: "Undo",');
  });

  it("lets Add Exercises take an exercise back out, with Undo, in place of its own Added notice", () => {
    expect(source).toContain("onRemove={(entry) => removeExercise(entry.id, { fromSheet: true })}");
    // Same notice id as the add, so "Added to ..." does not linger after the exercise is gone,
    // and the add's own Undo is cleared rather than merged into the removal's notice.
    expect(source).toContain("toast(`Removed from Week ${activeWeek} · ${activeSlot.day}`, { id: \"plan-add\", description: `${removed.name} is out of that day now.`, action: { label: \"Undo\", onClick: undo }, cancel: undefined });");
  });

  it("never lets a paste or a saved share overwrite saved training days without naming them first (Tier B)", () => {
    const dialog = readFileSync(new URL("../components/SaveToPlanDialog.tsx", import.meta.url), "utf8");
    // Adding after what is planned is the default; replacing is a choice, and is confirmed
    // against a list of the days it would clear, named by position as well as label.
    expect(dialog).toContain('useState<DayWriteMode>("append")');
    expect(dialog).toContain("Replace what's planned?");
    expect(source).toContain('const mode = request.mode === "replace" && !replaced.has(slot.key) ? "replace" : "append";');
  });
});
