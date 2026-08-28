import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./ProgrammingGuidePanel.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../index.css", import.meta.url), "utf8");

describe("Programming Guide default-value boundary", () => {
  it("keeps editable planning-start context visible and places the goal-specific limit behind a keyboard-accessible disclosure", () => {
    expect(source).toContain("adjustable planning reference rather than a rigid rule");
    expect(source).toContain("The active prescription remains fully editable.");
    expect(source).toContain('<details className="programming-guide-boundary">');
    expect(source).toContain("<summary>Planning limits</summary>");
    expect(source).toContain("{target.evidenceBoundary}");
    expect(styles).toContain(".destination-train .programming-guide-panel { border-color: rgb(164 200 232 / .3); background: linear-gradient(145deg, #102f53, #07182e); color: #edf7ff;");
    expect(styles).toContain(".destination-train .programming-guide-boundary p { margin: 0; border-top: 1px solid rgb(164 200 232 / .18); padding: .7rem 1rem .9rem; color: #c3d7ea;");
    expect(styles).toContain(".destination-train .programming-guide-boundary summary { display: flex; min-height: 44px;");
    expect(styles).toContain(".destination-train .programming-guide-boundary summary:focus-visible");
  });
});
