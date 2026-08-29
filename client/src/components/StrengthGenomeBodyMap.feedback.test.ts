import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./StrengthGenomeBodyMap.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../index.css", import.meta.url), "utf8");

describe("Strength Genome interaction feedback", () => {
  it("uses the optional nonblocking feedback helper for muscle-map, selector, and view-switch actions", () => {
    expect(source).toContain('import { emitInteractionFeedback } from "@/lib/interactionFeedback"');
    expect((source.match(/emitInteractionFeedback\(\)/g) || []).length).toBeGreaterThanOrEqual(3);
    expect(source).toContain('if (region) { emitInteractionFeedback(); onSelect(selectedRegionId === region.id ? undefined : region); }');
  });

  it("provides a visual pressed state and visible keyboard focus for map and regional-detail actions", () => {
    expect(styles).toContain(".strength-map-region-selector button:active");
    expect(styles).toContain(".strength-body-chart .body-chart-muscle:active");
    expect(styles).toContain(".strength-body-chart .body-chart-muscle:focus-visible");
    expect(styles).toContain(".strength-region-history button:active");
    expect(styles).toContain(".strength-ratio-entry button:active");
    expect(styles).toContain(".strength-map-region-selector button:focus-visible");
  });
});
