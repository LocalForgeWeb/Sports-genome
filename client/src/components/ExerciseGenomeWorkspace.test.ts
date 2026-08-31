import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./ExerciseGenomeWorkspace.tsx", import.meta.url), "utf8");

describe("Exercise Genome selected-action selector", () => {
  it("renders the existing mapping classification and selected action in every full-width selector row", () => {
    expect(source).toContain("getExerciseActionConnection(exercise, enrichedSelectedMovement)");
    expect(source).toContain("genome-selector-connection");
    expect(source).toContain("connection.label");
    expect(source).toContain("selectedMovement.label");
    expect(source).toContain("genome-selector-connection-${connection.label.toLowerCase().replace(/\\s+/g, \"-\")}");
    expect(source).toContain("ExerciseGenomePanel exercise={selectedExercise}");
    expect(source).toContain("trpc.researchEvidence.supabaseExercise.useQuery");
    expect(source).toContain("trpc.researchEvidence.supabaseInventory.useQuery");
    expect(source).toContain("supabaseEvidence={connectedEvidence.data}");
  });
});
