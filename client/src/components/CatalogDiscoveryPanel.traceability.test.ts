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
});
