import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FeatureTour, featureTourSteps } from "./FeatureTour";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("Feature Tour", () => {
  it("includes every task-based lesson and presents a skippable, navigable field guide", () => {
    expect(featureTourSteps.map((step) => step.title)).toEqual(expect.arrayContaining([
      "Recommended Workouts", "Custom Builder", "Import a routine", "Weekly planning", "Body Lab", "Movement Atlas", "Exercise Genome",
    ]));
    expect(featureTourSteps.every((step) => step.tasks.length >= 3 && step.view)).toBe(true);
    const markup = renderToStaticMarkup(createElement(FeatureTour, { onClose: () => undefined, onNavigate: () => undefined }));
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain("Skip guide");
    expect(markup).toContain("Open this area");
    expect(markup).toContain("Next lesson");
  });
});
