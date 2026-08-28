import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../index.css", import.meta.url), "utf8");

describe("Training Day planner dock preferences", () => {
  it("keeps the dock collapsed by default, restores the saved visibility, and retains the reopen tab", () => {
    expect(source).toContain('const plannerOpenKey = "gym-optimizer-planner-open-v1"');
    expect(source).toContain('const [plannerOpen, setPlannerOpen] = useState(false)');
    expect(source).toContain('setPlannerOpen(window.localStorage.getItem(plannerOpenKey) === "open")');
    expect(source).toContain('window.localStorage.setItem(plannerOpenKey, plannerOpen ? "open" : "closed")');
    expect(source).toContain('plannerOpen ? "Hide planner" : "Training day"');
  });

  it("retains relocation and explicit close controls inside the expanded planner", () => {
    expect(source).toContain('planner-float-${plannerSide}');
    expect(source).toContain('onClose={() => setPlannerOpen(false)}');
    expect(source).toContain('onMove={() => setPlannerSide((side) => side === "right" ? "left" : "right")}');
  });

  it("does not use a broad custom-row selector that can hide active Training Day content", () => {
    expect(source).toContain('workspace === "day-plan"');
    expect(source).toContain('<WorkoutExecutionPanel');
    expect(styles).not.toContain('main > section:has(.custom-row) { display: none; }');
  });
});
