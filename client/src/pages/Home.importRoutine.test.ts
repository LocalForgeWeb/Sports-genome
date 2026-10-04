import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { placeImportedDays } from "@/lib/trainingDayPlan";
import { splitDaysForFrequency } from "@/lib/splitCycle";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const dialog = readFileSync(new URL("../components/SaveToPlanDialog.tsx", import.meta.url), "utf8");

describe("Home multi-day routine handoff", () => {
  it("asks where a paste goes before anything changes, then writes each day into the day chosen for it, with its prescriptions, effort and plan context", () => {
    expect(source).toContain("const importRoutine = (routine: ImportedRoutine) =>");
    // A paste opens the save dialog; it no longer writes on its own.
    expect(source).toContain('setPendingSave({ heading: "Paste a workout"');
    expect(dialog).toContain("const { placements } = placeImportedDays(days.map((day) => day.label), slots.map((slot) => slot.day));");
    expect(source).toContain("const slot = daySlots[write.slotIndex];");
    expect(source).toContain("const outcome = writeIncomingDay(loadDay(store, slot.key), write.day, mode);");
    expect(source).toContain("store = commitDay(store, slot.key, outcome.record);");
    expect(source).toContain("context: day.context,");
    expect(source).toContain('navigateWorkspace("day-plan")');
  });

  it("writes the open day down before the paste lands, so a paste cannot be the one thing that destroys it", () => {
    expect(source).toContain("let store = isActive ? commitDay(dayStore, draftDayKeyRef.current, activeDraft()) : (planWeeks[request.week]?.days ?? emptyDayStore());");
  });

  it("gives every pasted day a slot of its own rather than letting one overwrite another", () => {
    const { placements, unplacedLabels } = placeImportedDays(["Upper A", "Lower A", "Upper B", "Lower B"], splitDaysForFrequency(4));
    expect(new Set(placements.map((placement) => placement.slotIndex)).size).toBe(4);
    expect(unplacedLabels).toEqual([]);
  });

  it("asks for a day for a pasted day that did not fit the athlete's week instead of dropping it onto the last day", () => {
    const { placements, unplacedLabels } = placeImportedDays(["Push", "Pull", "Legs", "Arms"], splitDaysForFrequency(3));
    expect(placements).toHaveLength(3);
    expect(unplacedLabels).toEqual(["Arms"]);
    // The day that didn't fit has no slot until the athlete picks one, and Save waits for it.
    expect(dialog).toContain("const canSave = writes.length > 0 && !unplaced && pendingResolution.length === 0;");
    expect(dialog).toContain("Choose a day for every workout.");
  });
});
