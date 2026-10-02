import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { workspaceFromLocation, workspaceTitles } from "./Home";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("Strength Genome workspace integration", () => {
  it("provides an explicit workspace destination and panel without relabeling qualitative Body Lab", () => {
    expect(source).toContain('"strength"');
    // Its own page, named once in workspaceTitles (the retired side-rail list used to carry the label).
    expect(workspaceFromLocation("strength")).toBe("strength");
    expect(workspaceTitles.strength).toBe("Strength Genome");
    expect(source).toContain('<StrengthGenomePanel weightUnit={athleteBaseline.weightUnit} baselineBodyWeight={athleteBaseline.bodyWeight} sexForReference={athleteBaseline.sexForReference} birthYear={athleteBaseline.birthYear} onRankProfile={(patch) => updateBaseline({ ...athleteBaseline, ...patch })} directAccess={directWorkspaceAccess} onOpenTraining={() => navigateWorkspace("day-plan")} />');
    expect(source).toContain('{workspace === "body"');
  });
});
