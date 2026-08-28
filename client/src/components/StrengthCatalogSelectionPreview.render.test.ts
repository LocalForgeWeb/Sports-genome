import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getStrengthCatalogSelectionContext } from "../../../shared/strengthGenomeDefinitions";
import { exercises } from "../lib/exerciseCatalog";
import { StrengthCatalogSelectionPreview } from "./StrengthGenomePanel";

describe("Strength Genome selected catalog preview", () => {
  it("renders selected catalog primary and supporting muscles with bounded route context across exercise families", () => {
    ["Barbell Bench Press", "Lat Pulldown", "Conventional Deadlift", "RKC Plank"].forEach((exerciseName) => {
      const exercise = exercises.find((entry) => entry.name === exerciseName)!;
      const context = getStrengthCatalogSelectionContext(exercise);
      const markup = renderToStaticMarkup(createElement(StrengthCatalogSelectionPreview, { context }));
      expect(markup).toContain(exercise.name);
      expect(markup).toContain(`Primary: ${exercise.primaryMuscles.join(" · ")}`);
      if (exercise.secondaryMuscles.length) expect(markup).toContain(`Supporting: ${exercise.secondaryMuscles.join(" · ")}`);
      expect(markup).toContain("Recorded context:");
      expect(markup).toContain(context.domainLabels[0]);
      expect(markup).not.toMatch(/percentile|tier|force score/i);
    });
  });
});
