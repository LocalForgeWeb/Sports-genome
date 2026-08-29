import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/StrengthGenomeBodyMap.tsx"), "utf8");
const styles = fs.readFileSync(path.resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("Strength Genome body-map accessible region selection", () => {
  it("keeps a compact selector available for recorded and unrecorded regions without implying rank", () => {
    const selector = source.split('className="strength-map-region-selector"')[1].split('className="strength-body-map-boundary"')[0];
    expect(source).toContain('className="strength-map-region-selector"');
    expect(source).toContain('aria-label="Strength Genome regions"');
    expect(source).toContain('aria-pressed={selectedRegionId === region.id}');
    expect(source).toContain('region.state === "OBSERVED_TEST_CONTEXT" ? "Saved test" : "No test yet"');
    expect(source).toContain('onClick={() => { emitInteractionFeedback(); onSelect(region); }}');
    expect(selector).not.toContain("percentile");
    expect(styles).toContain(".strength-map-region-selector button { min-height: 44px");
  });

  it("uses the map to distinguish saved-test coverage from an untested region without a strength score", () => {
    expect(source).toContain('region.state === "OBSERVED_TEST_CONTEXT" ? 4 : 0');
    expect(source).toContain('selectedRegionId === region.id ? 9');
    expect(source).not.toContain("Top 1%");
  });
});
