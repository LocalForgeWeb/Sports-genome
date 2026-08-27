import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./SelectedActionConnectionCard.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../pages/Home.tsx", import.meta.url), "utf8");

describe("inspected exercise selected-action connection", () => {
  it("uses the canonical mapping helper and renders the selected action with a bounded connection explanation", () => {
    expect(source).toContain("getExerciseActionConnection(exercise, enrichedSelectedMovement)");
    expect(source).toContain("selectedMovement.label");
    expect(source).toContain("connection.label");
    expect(source).toContain("catalog mapping and gym-support signal, not evidence of direct skill or performance transfer");
    expect(home).toContain("<SelectedActionConnectionCard exercise={inspectedExercise}");
  });
});
