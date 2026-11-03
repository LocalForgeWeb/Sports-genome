import { describe, expect, it } from "vitest";
import { exercises } from "@/lib/exerciseCatalog";
import { exerciseExecutionById } from "@/lib/exerciseExecution";
import { headDirectionPrompt, MANUAL_RESISTANCE_LINE, smithLoadBasisWords } from "@/lib/exerciseLogging";
import { setEntryFieldsFor } from "@/lib/setEntryFields";
import { loadConventionWords, loggingLines } from "./ExerciseExecutionDetail";

/**
 * The exercise detail and the logger name the same things the same way (the owner, 3 Nov 2026:
 * "make sure everything is consistent and cohesive"): the load box's label, the Smith choices,
 * the direction choice and the setup values, each read from the logger's own words.
 */
describe("the detail says what the logger says", () => {
  it("opens each row's load line with the load box the logger shows for it, and says nothing is logged where there is no box", () => {
    for (const [id, execution] of exerciseExecutionById) {
      const exercise = exercises.find((row) => row.id === id)!;
      const weight = setEntryFieldsFor(exercise, "kg", execution.measure).find((field) => field.measure === "weight");
      const words = loadConventionWords[execution.load];
      if (execution.load === "manual_unmeasured") {
        expect(weight, exercise.name).toBeUndefined();
        expect(words.startsWith(MANUAL_RESISTANCE_LINE)).toBe(true);
      } else if (execution.load === "smith_declared") {
        for (const choice of Object.values(smithLoadBasisWords)) expect(words, exercise.name).toContain(choice);
      } else {
        expect(words.startsWith(weight!.label), `${exercise.name}: ${weight!.label}`).toBe(true);
      }
    }
  });

  it("names the direction choice as the logger does, and the setup values by the logger's labels", () => {
    for (const [id, execution] of exerciseExecutionById) {
      const exercise = exercises.find((row) => row.id === id)!;
      const terms = loggingLines(exercise, execution).map((line) => line.term);
      if (execution.headDirection) expect(terms, exercise.name).toContain(headDirectionPrompt(id));
      expect(terms.some((term) => /set-up/i.test(term))).toBe(false);
    }
  });
});
