import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { placeImportedDays } from "@/lib/trainingDayPlan";
import { splitDaysForFrequency } from "@/lib/splitCycle";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("Home multi-day routine handoff", () => {
  it("writes each pasted day into the training day it was placed in, with that day's prescriptions, effort and plan context", () => {
    expect(source).toContain("const importRoutine = (routine: ImportedRoutine) =>");
    expect(source).toContain("const { placements, unplacedLabels } = placeImportedDays(importedDays.map((day) => day.label), splitDays);");
    expect(source).toContain("const slot = daySlots[placement.slotIndex];");
    expect(source).toContain("nextStore = commitDay(nextStore, slot.key, {");
    expect(source).toContain("context: day.context,");
    expect(source).toContain('navigateWorkspace("day-plan")');
  });

  it("writes the open day down before the paste lands, so a paste cannot be the one thing that destroys it", () => {
    expect(source).toContain("let nextStore = commitDay(dayStore, draftDayKeyRef.current, activeDraft());");
  });

  it("gives every pasted day a slot of its own rather than letting one overwrite another", () => {
    const { placements, unplacedLabels } = placeImportedDays(["Upper A", "Lower A", "Upper B", "Lower B"], splitDaysForFrequency(4));
    expect(new Set(placements.map((placement) => placement.slotIndex)).size).toBe(4);
    expect(unplacedLabels).toEqual([]);
  });

  it("says which pasted days did not fit the athlete's week instead of dropping them onto the last day", () => {
    const { placements, unplacedLabels } = placeImportedDays(["Push", "Pull", "Legs", "Arms"], splitDaysForFrequency(3));
    expect(placements).toHaveLength(3);
    expect(unplacedLabels).toEqual(["Arms"]);
    expect(source).toContain('toast("Some pasted days did not fit this week"');
  });
});
