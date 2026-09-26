import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const rows = source.slice(source.indexOf("function RecommendationRow"), source.indexOf("function Onboarding"));

/** The Matches workspace, from its gate to the next workspace. */
const start = source.indexOf('{workspace === "recommended" && hasSportContext &&');
const matches = source.slice(start, source.indexOf("{workspace ===", start + 10));

/**
 * Handoff 09. Matches used to be two panels: a scrolling list of every action
 * beside a boxed match set, with the action's anatomy restated between them
 * and the plus buttons adding to a day named nowhere on the screen.
 */
describe("Matches is one column of real controls", () => {
  it("renders the Matches workspace", () => {
    expect(start).toBeGreaterThan(-1);
    expect(matches).toContain('className="matches-page"');
  });

  it("chooses the sport and the action with the handlers the plan already uses", () => {
    // The athlete's sport, not a browse: Matches ranks for the sport the plan
    // is built on. The action select replaces a list of twenty to scroll.
    expect(matches).toContain("onChange={(event) => chooseSport(event.target.value)}");
    expect(matches).toContain("onChange={(event) => setMovementId(event.target.value)}");
    expect(matches).toContain("sportMovements.map((movement) => <option");
    expect(matches).not.toContain("sport-chip");
    expect(matches).not.toContain("movement-list-item");
  });

  it("opens the Movement Atlas on the same action", () => {
    expect(matches).toContain('onClick={() => navigateWorkspace("movement")}');
    // The atlas reads the athlete's selected movement whenever no other sport is being browsed.
    expect(source).toContain("referenceMovementId(movementId, sportBrowse)");
    // Its anatomy is not restated here.
    for (const gone of ["Prime movers", "Gym transfer cue", "Movement selector", "Exercise match set"]) expect(matches).not.toContain(gone);
  });

  it("states the ranking qualities once, from the selected model, as the line that opens the method", () => {
    expect(matches).toContain('className="matches-lens-method"');
    expect(matches).toContain("sportProgrammingContext.priorities.map");
    expect(matches).toContain("Ranking qualities");
    expect(matches).toContain("How matching works");
    // No ranking data is a stated condition, not an empty line.
    expect(matches).toContain("No priority qualities identified for this profile");
    expect(matches).not.toContain("movement demands");
  });

  it("counts the matches, and says so when there are none", () => {
    expect(matches).toContain('{movementRecommendations.length} {movementRecommendations.length === 1 ? "match" : "matches"}');
    expect(matches).toContain('className="matches-empty"');
  });

  it("adds one exercise per plus, with no preselected batch", () => {
    expect(matches).toContain("onAdd={() => addExercise(result.exercise)}");
    for (const batch of ["selected\"", "Add selected", "Add all", "6 selected"]) expect(matches).not.toContain(batch);
  });

  it("labels the score and the tier so two adjacent marks read as two facts", () => {
    expect(rows).toContain("aria-label={`Match score ${score} for ${result.exercise.name}: open details`}");
    // The stamp names its own tier and is not handed the score, so the two
    // labels cannot restate each other.
    expect(rows).toContain("<GradeStamp grade={result.grade} compact />");
    expect(rows).not.toContain("score={result.breakdown.overall}");
  });

  it("keeps research context and movement intelligence on the page, behind their own lines", () => {
    const disclosure = matches.indexOf('className="matches-disclosure"');
    expect(disclosure).toBeGreaterThan(-1);
    expect(disclosure).toBeLessThan(matches.indexOf("<SportEvidencePanel"));
    expect(matches).toContain("<MovementIntelligencePanel");
    expect(source.match(/<MovementIntelligencePanel /g), "rendered once, on Matches").toHaveLength(1);
  });

  it("names the day a plus adds to, and changes it through the plan's own day choice without leaving Matches", () => {
    expect(matches).toContain("<AddDestinationStrip week={activeWeek} slots={daySlots} activeIndex={activeDayIndex}");
    expect(matches).toContain("onChoose={selectTrainingDay}");
    // Measured before the split: choosing a day from the strip opened Plan,
    // because the only day handler also navigated. Selecting moves the marker;
    // opening is the day tabs' act, built on top of it.
    const select = source.slice(source.indexOf("const selectTrainingDay = "), source.indexOf("const openTrainingDay = "));
    expect(select).toContain("setActiveSplitDayIndex(slot.index)");
    expect(select).not.toContain("navigateWorkspace");
    expect(source).toContain("if (!selectTrainingDay(index)) return;");
    expect(styles).toContain(".add-destination { position: sticky;");
  });

  it("is flat on the page: no card around the list, dividers between rows", () => {
    expect(matches).not.toContain("dark-panel");
    expect(matches).not.toContain("light-panel");
    expect(styles).toContain(".matches-list > * + * { border-top: 1px solid var(--sg-divider-on-dark); }");
  });
});
