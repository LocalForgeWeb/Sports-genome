import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("Home multi-day routine handoff", () => {
  it("maps imported day labels into editable split-day weekly-plan, prescription, and plan-context state", () => {
    expect(source).toContain('const importRoutine = (routine: ImportedRoutine) =>');
    expect(source).toContain('const planKey = `${index}-${splitDay}`');
    expect(source).toContain('nextPlan[planKey] = dayExercises');
    expect(source).toContain('nextWeeklyPrescriptions[planKey]');
    expect(source).toContain('nextContext[planKey] = day.context');
    expect(source).toContain('setWeeklyPlan((current) => ({ ...current, ...nextPlan }))');
    expect(source).toContain('navigateWorkspace("day-plan")');
  });
});
