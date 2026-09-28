import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { StrengthBodyMassInput, StrengthLoadInput } from "./StrengthGenomePanel";

describe("Strength Genome pound-profile entry UI", () => {
  it("renders pound-first load and body-mass prompts with no default kilogram prompt", () => {
    const markup = renderToStaticMarkup(
      React.createElement("div", null,
        React.createElement(StrengthLoadInput, { weightUnit: "lb", value: "", requiresLoad: true, onChange: vi.fn() }),
        React.createElement(StrengthBodyMassInput, { weightUnit: "lb", value: "", onChange: vi.fn() })
      )
    );
    expect(markup).toContain("Load in pounds");
    expect(markup).toContain("Enter lb");
    expect(markup).toContain("Body mass at test (lb)");
    expect(markup).toContain("Body mass at test in pounds");
    expect(markup).not.toContain("Load in kilograms");
    expect(markup).not.toContain("Body mass at test (kg)");
  });

  // Backend V1 EN-07, EN-09: the box says what the weight means for the chosen exercise.
  it("asks for one dumbbell's weight, or the added weight, where the scoring policy reads it that way", () => {
    const label = (convention: "per_implement" | "bodyweight_reps" | "per_hand") =>
      renderToStaticMarkup(React.createElement(StrengthLoadInput, { weightUnit: "kg", value: "", requiresLoad: false, convention, onChange: vi.fn() }));
    expect(label("per_implement")).toContain("Weight of one dumbbell in kilograms");
    expect(label("bodyweight_reps")).toContain("Added weight in kilograms");
    expect(label("per_hand")).toContain("Weight in each hand in kilograms");
  });
});
