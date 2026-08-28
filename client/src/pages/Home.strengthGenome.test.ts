import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("Strength Genome workspace integration", () => {
  it("provides an explicit workspace destination and panel without relabeling qualitative Body Lab", () => {
    expect(source).toContain('"strength"');
    expect(source).toContain('label: "Strength Genome"');
    expect(source).toContain('<StrengthGenomePanel weightUnit={athleteBaseline.weightUnit} directAccess={directWorkspaceAccess} onOpenTraining={() => navigateWorkspace("day-plan")} />');
    expect(source).toContain('{workspace === "body"');
  });
});
