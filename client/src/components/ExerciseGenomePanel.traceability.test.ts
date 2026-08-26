import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const component = readFileSync(resolve(process.cwd(), "client/src/components/ExerciseGenomePanel.tsx"), "utf8");

describe("Exercise Genome evidence-to-logic disclosure", () => {
  it("keeps source-backed anchors and relative model estimates visible behind one methodology disclosure", () => {
    expect(component).toContain("The model separates population-level training anchors");
    expect(component).toContain("relative planning estimates");
    expect(component).toContain("evidenceTraceability.filter");
    expect(component).toContain("A number is never shown as a scientific measurement simply because it is precise.");
  });
});
