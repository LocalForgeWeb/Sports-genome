import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const anatomyStyles = readFileSync(new URL("../anatomy-clean.css", import.meta.url), "utf8");

describe("Body Lab workspace hierarchy", () => {
  it("leads with compact selected-action context rather than the retired marketing hero", () => {
    // The separate context card was merged into the navigator: a title card and
    // an unlabelled pair of selects in two unconnected boxes left it unclear
    // what the map was showing or where to change it.
    const navigator = readFileSync(new URL("../components/BodyLabNavigator.tsx", import.meta.url), "utf8");
    expect(source).not.toContain('className="body-lab-workspace-context"');
    expect(navigator).toContain('className="body-lab-navigator body-lab-selection"');
    expect(navigator).toContain("Body Lab is showing · Sport action");
    expect(navigator).toContain("Change what the map shows");
    // Athletes read a body map and assume an exercise drives it; say otherwise.
    expect(navigator).toContain("This is a sport action, not a single exercise.");
    expect(source).not.toContain("Body first.<br /><em className=\"text-[#e4512e]\">Details on demand.");
    expect(source).not.toContain("Switch sport actions directly below, then use the role map");
  });

  it("uses the Body Lab destination palette for its own framing while retaining a neutral anatomy canvas for inspection", () => {
    expect(styles).toContain(".destination-body .body-lab-navigator");
    expect(styles).toContain(".destination-body .anatomy-atlas-pro");
    expect(styles).toContain(".destination-body .body-lab-navigator-actions button:last-child { border-color: var(--sg-action); background: var(--sg-action-fill); color: var(--sg-action-on); }");
    expect(anatomyStyles).toContain(".atlas-body-chart-wrap{position:relative;display:flex;justify-content:center;align-items:center");
  });
});
