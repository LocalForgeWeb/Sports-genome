import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { boundedQuizStep, convertBodyWeight } from "./AthleteBaselineQuiz";

const source = readFileSync(new URL("./AthleteBaselineQuiz.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../athlete-baseline-quiz.css", import.meta.url), "utf8");

describe("Athlete Baseline quiz navigation", () => {
  it("keeps Back and Continue navigation inside the available quiz steps", () => {
    expect(boundedQuizStep(-3)).toBe(0);
    expect(boundedQuizStep(3)).toBe(3);
    expect(boundedQuizStep(99)).toBe(10);
  });

  it("converts an entered optional bodyweight instead of silently reinterpreting it when the unit changes", () => {
    expect(convertBodyWeight(200, "lb", "kg")).toBe(90.7);
    expect(convertBodyWeight(90.7, "kg", "lb")).toBe(200);
    expect(convertBodyWeight(200, "lb", "lb")).toBe(200);
  });

  it("states each step's boundary in plain words, under the choices rather than above them", () => {
    // These lines used to be a disclosure titled with the app's own internal
    // vocabulary — "PROGRAM EFFECT", "TRANSFER BOUNDARY", "STACK FILTER" — shown
    // to someone ten seconds into using it. The boundary is worth keeping; the
    // jargon and the gate in front of the question were not.
    expect(source).toContain('<p className="athlete-quiz-note">{stepNotes[1]}</p>{navigation()}');
    expect(source).toContain("Gym work builds the qualities your sport asks for. It does not replace skill practice.");
    expect(source).toContain("None of it is a health, body-composition, or ability score.");
    // The chrome that used to stand between landing and answering: a decorative
    // rule, a methodology disclosure, and a schema-shaped tag on every step.
    expect(source).not.toContain('className="athlete-quiz-techline"');
    expect(source).not.toContain('className="athlete-evidence-note"');
    expect(source).not.toMatch(/athlete-quiz-kicker">\d+ \//);
  });

  it("keeps the official brand name beside its mark, and shows progress as one segment per step", () => {
    expect(source).toContain('<span>Sports Genome</span>');
    expect(source).toContain('className="athlete-quiz-segments"');
    expect(source).toContain('aria-valuenow={step + 1}');
    expect(source).toContain('aria-valuemax={totalSteps}');
    expect(styles).toContain(".athlete-quiz-segments i.is-done { background: var(--sg-action); }");
  });

  it("carries one accent and one selected state, instead of the five it used to run", () => {
    // Neon blue headline, orange callout, blue pill, amber underline and cream
    // cards on navy were five palettes fighting on one screen.
    expect(styles).not.toContain("#65b8ff");
    expect(styles).not.toContain("#f7cf6c");
    expect(styles).not.toContain("#f7f1e7");
    expect(styles).toContain("border-color: var(--sg-action);");
  });
});
