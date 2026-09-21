import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

/**
 * A new account opened on a training day it had never built. `customWorkout`
 * started as four hard-coded exercises, and the write-through effect saved
 * them as Day 01 the moment onboarding finished - "4 planned" on a day nobody
 * had planned. Exercises arrive when the athlete drafts, pastes, adds, or asks
 * the quiz for a suggested stack. Never on their own.
 */
describe("a fresh account starts empty", () => {
  it("seeds no exercises into the working day", () => {
    expect(source).not.toContain("initialCustomNames");
    expect(source).toContain("const [customWorkout, setCustomWorkout] = useState<Exercise[]>([]);");
  });

  it("only builds a stack at onboarding when the athlete chose a suggested one", () => {
    // The quiz's two finishing buttons carry stackMode; "custom" leaves the day
    // empty and opens the page where a day is built - Plan, since the Builder page
    // it used to open was a second copy of it and has been removed.
    expect(source).toContain('if (stackMode === "suggested" && selectedMode === "sport") {');
    expect(source).toContain("      setCustomWorkout([]);\n      navigateWorkspace(\"day-plan\");");
  });
});

/**
 * The tracker's day chooser was a panel - display headline, a sentence, a grid
 * - above a second panel whose first line named the same day. It is one line
 * that opens, and opens itself only when the day on screen has nothing in it.
 */
describe("the tracker's day chooser is a disclosure", () => {
  it("renders as a details element the athlete controls", () => {
    expect(source).toContain('<details className="tracker-day-switch" open={trackerDayPickerOpen} onToggle={(event) => setTrackerDayPickerOpen(event.currentTarget.open)}>');
    expect(source).not.toContain('className="tracker-day-selector"');
    expect(source).not.toContain("Pick the day you are completing.");
  });

  it("opens itself on an empty day and closes once a day is picked", () => {
    // Follows the day's content, not the arrival alone: the plan hydrates after
    // first paint, so the chooser opened for an empty render has to close again
    // when the staged day arrives.
    expect(source).toContain('if (workspace === "tracker") setTrackerDayPickerOpen(!customWorkout.length);');
    expect(source).toContain("onClick={() => { openTrainingDay(slot.index); setTrackerDayPickerOpen(false); }}");
  });
});
