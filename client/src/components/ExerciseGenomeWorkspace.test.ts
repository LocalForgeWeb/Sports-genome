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

  it("drops the connection badge when every visible row carries the same one, and states it once instead", () => {
    // Measured on the shipped build at 390px: the default view and the "row" and
    // "press" searches each held ONE label across all 24 rows - twenty-four
    // identical pills in the accent colour - while the "squat" search split
    // 21/3. A badge earns its place on a row by differing from its neighbours.
    expect(source).toContain("const connectionVaries = new Set(rowConnections.map((connection) => connection.label)).size > 1");
    expect(source).toContain("{connectionVaries && <span className={`genome-selector-connection");
    expect(source).toContain("sharedConnectionSummary(rowConnections[0].label, rowConnections.length)");
    // The fact is not dropped, only moved to the line that already scopes the list.
    expect(source).toContain("Links below are measured against <b>{selectedMovement.label}</b>.{sharedConnection");
    // Rows read the connection computed once above, rather than recomputing it.
    expect(source).toContain("const connection = rowConnections[index]");
  });
});
