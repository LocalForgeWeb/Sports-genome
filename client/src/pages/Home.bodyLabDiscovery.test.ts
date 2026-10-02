import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const anatomy = readFileSync(new URL("../components/AnatomyMap.tsx", import.meta.url), "utf8");

/**
 * October 1 brief §6. The Body Lab's primary action belongs to the sport
 * action being explored, by its own ids; a muscle is a secondary inspection
 * context with its own, separate action inside its detail.
 */
describe("Body Lab discovery context", () => {
  it("names the action on the primary CTA and opens the catalog scoped to it by sport and movement id", () => {
    expect(source).toContain("Find exercises for {movementDisplayLabel(referenceMovement.label).toLowerCase()}");
    expect(source).toContain("Explore exercises that support {movementDisplayLabel(referenceMovement.label).toLowerCase()}.");
    expect(source).toContain("openMovementDiscovery(browseSportId, referenceMovement.id)");
    // Never the inspected muscle, never the action's first muscle.
    expect(source).not.toContain("getMovementMuscles(referenceMovement)[0]");
    expect(source).not.toContain("Choose a muscle above");
    expect(source).not.toMatch(/body-lab-next-step[^]*?muscle: target/);
  });

  it("keeps discovery, the inspected muscle and the add destination as separate state", () => {
    expect(source).toContain("useState<DiscoveryContext>(browseAllExercises)");
    expect(source).toContain('setDiscovery({ mode: "movement", sportId: sportIdForAction, movementId: movementIdForAction })');
    expect(source).toContain('setDiscovery({ mode: "muscle", muscleId: muscle })');
    // Entering movement mode drops an inherited muscle filter and keeps the equipment refinement.
    expect(source).toContain("setCatalogFilters((current) => ({ ...defaultCatalogFilters, equipment: current.equipment }))");
    // Results are derived synchronously from the context's ids, so no stale response can win.
    expect(source).toContain('discovery.mode === "movement" ? discoverMovementExercises(discovery.sportId, discovery.movementId, exercises) : null');
  });

  it("puts the muscle's own search inside its detail and restates the action over the rows", () => {
    expect(source).toContain("onBrowseMuscle={openMuscleDiscovery}");
    expect(source).toContain("subjectLabel={movementDisplayLabel(referenceMovement.label)}");
    expect(anatomy).toContain("Browse {selectedLabel.toLowerCase()} exercises");
    expect(anatomy).toContain("Muscle demands · {subjectLabel}");
    expect(anatomy).toContain("muscles on the map");
    expect(anatomy).toContain("with no role recorded");
  });
});
