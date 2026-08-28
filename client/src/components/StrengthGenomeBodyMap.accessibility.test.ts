import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/StrengthGenomeBodyMap.tsx"), "utf8");
const styles = fs.readFileSync(path.resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("Strength Genome body-map accessible region selection", () => {
  it("keeps a compact selector available for recorded and unrecorded regions without implying rank", () => {
    const selector = source.split('className="strength-map-region-selector"')[1].split('className="strength-body-map-legend"')[0];
    expect(source).toContain('className="strength-map-region-selector"');
    expect(source).toContain('aria-label="Strength Genome regions"');
    expect(source).toContain('aria-pressed={selectedRegionId === region.id}');
    expect(source).toContain('region.state === "OBSERVED_TEST_CONTEXT" ? "Recorded" : "No test"');
    expect(source).toContain('onClick={() => onSelect(region)}');
    expect(selector).not.toContain("percentile");
    expect(styles).toContain(".strength-map-region-selector button { min-height: 44px");
  });
});
