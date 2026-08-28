import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const component = readFileSync(resolve(process.cwd(), "client/src/components/CatalogDiscoveryPanel.tsx"), "utf8");

describe("Catalog Discovery traceability presentation", () => {
  it("derives its visible catalog total and frames grade output as a catalog rank", () => {
    expect(component).toContain("`All ${exercises.length} exercises`");
    expect(component).toContain("Catalog rank {exercise.muscleGrade}");
    expect(component).not.toContain("All 400 exercises");
  });

  it("leads with a concise discovery header while keeping search and exercise actions available", () => {
    expect(component).toContain("Exercise catalog");
    expect(component).toContain("Find an exercise");
    expect(component).toContain("{exercises.length} options");
    expect(component).toContain('aria-label="Search exercises"');
    expect(component).toContain("Filter & sort");
    expect(component).toContain("onToggleFavorite(exercise)");
    expect(component).toContain("onAdd(exercise)");
  });
});
