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
});
