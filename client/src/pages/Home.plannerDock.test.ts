import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const draftStyles = readFileSync(new URL("../workout-planner.css", import.meta.url), "utf8");

/**
 * The draft controls used to live in a floating "Session Planner" dock. On a phone its
 * own open/close tab sat on top of the panel behind it - the reported jank was that tab
 * covering a heading - and it carried a second copy of the training-day picker, so the
 * app asked "which day?" in two places that could disagree.
 */
describe("the session draft is part of the page, not a layer over it", () => {
  it("has no floating dock left to overlap the content behind it", () => {
    expect(source).not.toContain("planner-float");
    expect(source).not.toContain("plannerOpen");
    expect(source).not.toContain("plannerSide");
    expect(source).not.toContain("SplitDraftControls");
    // The dock's own layout allowance went with it.
    expect(styles).not.toContain(".apex-shell:has(.planner-float)");
  });

  it("draws the draft panel in normal flow, so nothing can sit on top of anything", () => {
    expect(draftStyles).toContain(".session-draft-panel { display: grid;");
    expect(draftStyles).not.toMatch(/\.session-draft-panel \{[^}]*position: (fixed|absolute)/);
  });

  it("puts the draft where the day is built, in both places an athlete builds one", () => {
    // Training Day and Builder edit the same day; the draft has to be reachable from
    // either without hunting for a floating tab.
    expect(source.match(/<SessionDraftPanel dayLabel=/g)?.length).toBe(2);
    expect(source).toContain("onDraft={loadDraft}");
  });

  it("does not use a broad custom-row selector that can hide active Training Day content", () => {
    expect(source).toContain('workspace === "day-plan"');
    expect(source).toContain("<WorkoutExecutionPanel");
    expect(styles).not.toContain("main > section:has(.custom-row) { display: none; }");
  });
});

/**
 * How long an athlete has today is the single input that most changes what a session
 * should be, and it was buried behind a Home disclosure called "Adjust plan inputs" -
 * nowhere near the button that builds the session.
 */
describe("the draft asks how long you have", () => {
  it("offers the session length beside the draft, and feeds it into the draft", () => {
    expect(source).toContain("minutes={gymMinutes}");
    expect(source).toContain("onMinutes={(value) => setGymMinutes(normalizeGymMinutes(value))}");
    // The chosen window is what sizes the draft.
    expect(source).toContain("buildVariedLoadout(pool, activeSplitDay === \"Sport Transfer\" ? sportSeed : [], activeLoadout, gymTimeBudget.recommendationLimit)");
  });

  it("states the cost of the draft before it is made, so the time control cannot be decorative", () => {
    expect(source).toContain("const draftedLoadoutMinutes = useMemo(");
    expect(source).toContain("getWorkoutDiagnostics(draftedLoadout, {}, {}, goal, gymMinutes).estimatedMinutes");
    expect(source).toContain("estimatedMinutes={draftedLoadoutMinutes}");
  });

  it("says what drafting will overwrite rather than silently replacing a built day", () => {
    expect(source).toContain("replacingCount={customWorkout.length}");
  });
});
