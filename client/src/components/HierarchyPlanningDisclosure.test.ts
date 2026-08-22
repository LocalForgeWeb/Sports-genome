import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HierarchyPlanningDisclosure } from "./HierarchyPlanningDisclosure";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("hierarchy planning disclosure", () => {
  it("renders the demand-to-programming pathway with a source-bounded planning rule", () => {
    const markup = renderToStaticMarkup(createElement(HierarchyPlanningDisclosure, {
      modifierLabel: "Sprint", movement: "Sprint start", demands: ["Acceleration (reviewed evidence)"], physicalQualities: ["Acceleration"], adaptations: ["acceleration development"], modality: "Gym work develops capacity.", exerciseRole: "Use diverse contributors.", programming: "Planning variables are not fixed sport outcomes.",
    }));
    expect(markup).toContain("Sport-to-program hierarchy / Sprint");
    expect(markup).toContain("Movement");
    expect(markup).toContain("Physiological demand");
    expect(markup).toContain("Physical quality");
    expect(markup).toContain("Adaptation target");
    expect(markup).toContain("Programming boundary");
  });
});
