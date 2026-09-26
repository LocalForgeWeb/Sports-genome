import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const anatomyStyles = readFileSync(new URL("../anatomy-clean.css", import.meta.url), "utf8");

describe("Body Lab workspace hierarchy", () => {
  it("leads with the body: one compact bar above it, and nothing that restates the map", () => {
    // Measured on a 390px phone the body began at 968px, under a 386px
    // navigator card, a second "role map" heading, and a search over eight
    // muscle names. The map is the page; everything above it has to earn its
    // height. What survives is what reads the map (action, sport) and changes
    // it (two pickers, step, browse) — and the map itself is now on screen.
    const navigator = readFileSync(new URL("../components/BodyLabNavigator.tsx", import.meta.url), "utf8");
    const anatomy = readFileSync(new URL("../components/AnatomyMap.tsx", import.meta.url), "utf8");
    expect(navigator).toContain('className="body-lab-navigator body-lab-selection"');
    // The page's name, then the sport and action as one line with Change; the
    // pickers open only when the athlete means to change something.
    expect(navigator).toContain("<h1>Body Lab</h1>");
    expect(navigator).toContain('className="body-lab-selection-action">{selectedMovement.label}</span>');
    expect(navigator).toContain('className="body-lab-selection-change"');
    expect(navigator).toContain("{changing && <div");
    expect(navigator).toContain("<span>Sport</span>");
    expect(navigator).toContain("<span>Action</span>");
    expect(navigator).not.toContain("Change what the map shows");
    expect(navigator).not.toContain("This is a sport action, not a single exercise.");
    // No second heading between the bar and the body.
    expect(anatomy).not.toContain('className="atlas-pro-head"');
    expect(anatomy).not.toContain("Selected action <em>role map.</em>");
    expect(anatomy).not.toContain('className="atlas-pro-controls"');
    expect(source).not.toContain('className="body-lab-workspace-context"');
  });

  it("never claims a muscle is selected when none was tapped", () => {
    // `activeMuscle` defaulted to "obliques" and the navigator forced it to the
    // action's first muscle on every change, so a footer card read "Selected
    // muscle: Pectoralis major" beside a map with no selection on it.
    expect(source).toContain("useState<string | null>(null)");
    expect(source).not.toContain('useState("obliques")');
    expect(source).not.toContain("Selected from the atlas");
    expect(source).not.toContain('<p className="metric-label">Selected muscle</p><strong>{muscleLabels[activeMuscle]');
    expect(source).toContain('className="body-lab-next-step"');
  });

  it("uses the Body Lab destination palette for its own framing while retaining a neutral anatomy canvas for inspection", () => {
    expect(styles).toContain(".destination-body .body-lab-navigator");
    expect(styles).toContain(".destination-body .anatomy-atlas-pro");
    expect(styles).toContain(".destination-body .body-lab-navigator-actions button:last-child { border-color: var(--sg-action); background: var(--sg-action-fill); color: var(--sg-action-on); }");
    expect(anatomyStyles).toContain(".atlas-body-chart-wrap{position:relative;display:flex;justify-content:center;align-items:center");
  });
});
