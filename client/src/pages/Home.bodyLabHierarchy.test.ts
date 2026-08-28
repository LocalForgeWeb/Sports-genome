import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const anatomyStyles = readFileSync(new URL("../anatomy-clean.css", import.meta.url), "utf8");

describe("Body Lab workspace hierarchy", () => {
  it("leads with compact selected-action context rather than the retired marketing hero", () => {
    expect(source).toContain('className="body-lab-workspace-context"');
    expect(source).toContain("Qualitative action roles. Select a muscle to inspect.");
    expect(source).not.toContain("Body first.<br /><em className=\"text-[#e4512e]\">Details on demand.");
    expect(source).not.toContain("Switch sport actions directly below, then use the role map");
  });

  it("uses the Explore discovery palette for Body Lab framing while retaining a neutral anatomy canvas for inspection", () => {
    expect(styles).toContain(".destination-explore .body-lab-navigator");
    expect(styles).toContain(".destination-explore .anatomy-atlas-pro");
    expect(styles).toContain(".destination-explore .body-lab-navigator-actions button:last-child { border-color: #f2c14d; background: #f2c14d; color: #07182e; }");
    expect(anatomyStyles).toContain(".atlas-body-chart-wrap{position:relative;display:flex;justify-content:center;align-items:center");
  });
});
