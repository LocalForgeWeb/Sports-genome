import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/StrengthGenomeBodyMap.tsx"), "utf8");
const styles = fs.readFileSync(path.resolve(process.cwd(), "client/src/index.css"), "utf8");
const gridStyles = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/anatomy/anatomy-region-grid.css"), "utf8");

describe("Strength Genome body-map accessible region selection", () => {
  it("keeps every region reachable in words, without implying rank", () => {
    // The disclosure this replaces hid the list behind a summary, so the only
    // visible route to a region was hitting its shape. With both bodies on one
    // canvas each shape is half the size it was, which makes the written list
    // the primary route rather than the fallback — so it is always open.
    expect(source).toContain('label="Strength Genome regions"');
    expect(source).toContain('state: region.state === "OBSERVED_TEST_CONTEXT" ? "On record" : "Nothing yet"');
    expect(source).toContain("selectedRegionId === region.id ? undefined : region");
    expect(source).toContain('aria-label="Clear selected strength region"');
    expect(source).not.toContain("percentile");
    expect(source).not.toContain("strength-map-region-selector");
    // Every card is a full target, so nothing here depends on precision.
    expect(gridStyles).toContain("min-height: 3.5rem");
  });

  it("states coverage in words and a dot, so the figure's colour is never the only carrier", () => {
    expect(source).toContain('className="strength-map-legend"');
    expect(source).toContain("On record");
    expect(source).toContain("Nothing logged yet");
    expect(styles).toContain(".strength-map-legend-on i");
    expect(styles).toContain(".strength-map-legend-off i");
  });

  it("shows both bodies at once rather than a view the athlete has to flip", () => {
    expect(source).toContain('view="both"');
    expect(source).not.toMatch(/setView|RotateCw/);
    // Which body is which, said under the figure rather than written across it.
    expect(source).toContain('className="strength-body-chart-views"');
  });

  it("uses the map to distinguish saved-test coverage from an untested region without a strength score", () => {
    // Coverage is one categorical state, not a 0-10 magnitude. The figure had
    // been fed intensity 4 for "on record" and 9 for "selected", which read as a
    // scale the data does not support; selection is now the figure's outline.
    expect(source).toContain('if (region.state !== "OBSERVED_TEST_CONTEXT") return;');
    expect(source).toContain('map[key] = "primary";');
    expect(source).not.toMatch(/intensity/i);
    expect(source).not.toContain("Top 1%");
  });

  it("lets a repeated region tap clear the detail state and keeps the profile ring scoped to recorded coverage", () => {
    expect(source).toContain('onSelect: (region?: StrengthRegionDefinition) => void');
    expect(styles).toContain('.strength-profile-coverage-ring {');
    expect(styles).toContain('conic-gradient');
    expect(styles).toContain('Recorded coverage only · not a rank');
  });
});
