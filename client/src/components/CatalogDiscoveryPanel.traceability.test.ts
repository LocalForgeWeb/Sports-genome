import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const component = readFileSync(resolve(process.cwd(), "client/src/components/CatalogDiscoveryPanel.tsx"), "utf8");
const styles = readFileSync(resolve(process.cwd(), "client/src/catalog-discovery.css"), "utf8");

describe("Catalog Discovery traceability presentation", () => {
  it("derives its visible catalog total and labels configured grades without implying a population rank", () => {
    expect(component).toContain("`All ${exercises.length} exercises`");
    expect(component).toContain("Catalog tag {exercise.muscleGrade}");
    expect(component).toContain("Configured catalog classification; not a population rank or strength measurement.");
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

  it("uses optional browser feedback and visible pressed states for deliberate catalog actions", () => {
    expect(component).toContain('import { emitInteractionFeedback } from "@/lib/interactionFeedback";');
    expect(component).toContain('if (key !== "query") emitInteractionFeedback();');
    expect(component).toContain('emitInteractionFeedback(); onInspect(exercise);');
    expect(component).toContain('emitInteractionFeedback(); onToggleFavorite(exercise);');
    expect(component).toContain('emitInteractionFeedback(); onAdd(exercise);');
    expect(styles).toContain('.catalog-discovery-card-copy:active');
    expect(styles).toContain('transform: scale(.97);');
  });
});
