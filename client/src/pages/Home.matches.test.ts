import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: null, loading: false, isAuthenticated: false }) }));
vi.mock("@/lib/trpc", () => ({ trpc: {} }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { RecommendationRow } from "./Home";
import { getSportSession, type MovementRecommendation } from "@/lib/movementRecommendations";

const source = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../index.css", import.meta.url), "utf8");

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
    // A match whose score buckets to SS while the catalog rates the exercise S,
    // so a stamp fed the score would read SS and one fed the catalog reads S.
    const base = getSportSession("track-and-field", "Athleticism", 1)[0];
    expect(base).toBeDefined();
    const result: MovementRecommendation = { ...base, grade: "SS", exercise: { ...base.exercise, muscleGrade: "S" }, breakdown: { ...base.breakdown, overall: 97 } };
    const noop = () => {};
    const markup = renderToStaticMarkup(createElement(RecommendationRow, { result, index: 0, onAdd: noop, onInspect: noop, destinationLabel: "Week 1 · Mon" }));

    // Sep 28 regression brief §11: the number names its scale.
    expect(markup).toContain(`aria-label="Match 97 of 99 for ${result.exercise.name}: open details"`);
    // The stamp names the exercise's catalog tier. result.grade is
    // gradeForScore(score): the match score again, in letters, under a label
    // that would call it the catalog tier.
    expect(markup).toContain('aria-label="Catalog planning tier S"');
    expect(markup).not.toContain("Catalog planning tier SS");
    // The stamp is not handed the score, so the two labels cannot restate each other.
    expect(markup).not.toContain("modelled overall match");
    // Home no longer lists a top three beside its sport focus (Sep 28 regression brief §3:
    // a compact preview), so Matches is where an exercise's tier is shown in a list.
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
