import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const anatomy = readFileSync(new URL("../components/AnatomyMap.tsx", import.meta.url), "utf8");

/**
 * October 1 brief §6, on top of the Sep 30 discovery modes: the action is
 * restated over the muscle rows so it survives a scroll past its selector, the
 * muscle's own search is a second, explicit action inside its detail, and the
 * figure's two counts (muscles involved, muscles on the map) are explained.
 */
describe("Body Lab muscle detail and counts", () => {
  it("restates the action over the rows and offers the muscle's search inside its detail", () => {
    expect(source).toContain("subjectLabel={movementDisplayLabel(referenceMovement.label)}");
    expect(source).toContain('onBrowseMuscle={activeMuscleBrowsable ? (muscle) => openDiscovery({ mode: "muscle", muscleId: muscle }) : undefined}');
    expect(anatomy).toContain("Muscle demands · {subjectLabel}");
    expect(anatomy).toContain("Browse {selectedLabel.toLowerCase()} exercises");
    expect(anatomy).toContain('className="atlas-selected-browse"');
  });

  it("explains 13 involved against 26 on the map instead of calling both 'mapped muscles'", () => {
    expect(anatomy).toContain("muscles on the map");
    expect(anatomy).toContain("with no role recorded");
    expect(anatomy).not.toContain("mapped muscles`");
  });

  it("keeps the primary action the movement's, by its ids, never a muscle's", () => {
    expect(source).toContain('openDiscovery({ mode: "movement", sportId: referenceMovement.sportId, movementId: referenceMovement.id })');
    expect(source).not.toContain("getMovementMuscles(referenceMovement)[0]");
  });
});
