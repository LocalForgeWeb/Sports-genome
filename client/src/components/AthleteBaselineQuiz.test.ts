import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { AthleteBaselineQuiz, boundedQuizStep, convertBodyWeight, quizProgressLabel, quizStepIds, quizStepRange } from "./AthleteBaselineQuiz";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

const source = readFileSync(new URL("./AthleteBaselineQuiz.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../athlete-baseline-quiz.css", import.meta.url), "utf8");

describe("Athlete Baseline quiz navigation", () => {
  it("keeps Back and Continue navigation inside the available quiz steps", () => {
    const steps = quizStepIds("sport", true).length;
    expect(boundedQuizStep(-3, steps)).toBe(0);
    expect(boundedQuizStep(3, steps)).toBe(3);
    expect(boundedQuizStep(99, steps)).toBe(steps - 1);
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
    expect(source).toContain('<p className="athlete-quiz-note">{note[1]}</p>{navigation()}');
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
    expect(source).toContain('aria-valuemax={stepRange.max}');
    expect(source).toContain('aria-valuetext={progressLabel}');
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

describe("Sport-optional onboarding", () => {
  // requirement: manual_focus_selection - "Never require a sport."
  it("drops the sport steps entirely outside sport mode", () => {
    for (const mode of ["general", "undecided"] as const) {
      const steps = quizStepIds(mode, false);
      expect(steps, mode).not.toContain("sport");
      expect(steps, mode).not.toContain("sport-modifier");
      expect(steps[steps.length - 1], mode).toBe("preview");
    }
  });

  it("asks for a sport only when the athlete says they train for one", () => {
    const steps = quizStepIds("sport", false);
    expect(steps).toContain("sport");
    expect(steps).toContain("sport-modifier");
    expect(steps.indexOf("context-mode")).toBeLessThan(steps.indexOf("sport"));
  });

  it("offers the three context states and never a synthetic sport", () => {
    expect(source).toContain('value: "sport"');
    expect(source).toContain('value: "general"');
    expect(source).toContain('value: "undecided"');
    // General is a context state, not a sport record: no mode carries a sport id, and no
    // synthetic sport is ever added to the list the athlete picks from.
    expect(source).not.toMatch(/label: ["']General Fitness["']/i);
    expect(source).not.toMatch(/sports\.(push|concat)\(/);
    // Leaving sport mode must clear the id rather than keeping it as a hidden default.
    expect(source).toContain('if (mode !== "sport") { setSportId(""); setSportModifierId(""); }');
  });

  // principle: separate-capacity-targets-from-constraints - two questions, never merged.
  it("asks what to work around only after an area is chosen to build", () => {
    expect(quizStepIds("general", false)).not.toContain("focus-state");
    expect(quizStepIds("general", true)).toContain("focus-state");
    const withFocus = quizStepIds("general", true);
    expect(withFocus.indexOf("focus")).toBeLessThan(withFocus.indexOf("focus-state"));
  });

  it("keeps the focus step optional, and asks how the area is without answering for the athlete", () => {
    expect(quizStepIds("undecided", false)).toContain("focus");
    expect(source).toContain('focusTargetKey ? "Continue" : "Skip for now"');
    // No answer until one is given: "Feels fine" is a claim about the athlete's body, not a default.
    expect(source).toContain("useState<ConstraintType | null>(null)");
    expect(source).not.toContain('useState<ConstraintType>("proactive_none")');
  });

  it("submits no sport id and no inferred constraint outside sport mode", () => {
    expect(source).toContain('sportId: mode === "sport" ? sportId : ""');
    // A constraint is only ever sent alongside a focus area the athlete chose.
    expect(source).toContain("constraint: focusTargetKey && constraintType ?");
  });

  // requirement: scope_escalation_boundary - withhold without diagnosing.
  it("shows a withhold notice that escalates without naming a condition", () => {
    expect(source).toContain('posture === "withhold"');
    expect(source).toContain("Sports Genome will not build around this on its own.");
    expect(source).toContain("we are not telling you what the problem is");
    expect(styles).toContain(".athlete-quiz-escalation {");
  });

  it("counts the steps the athlete will actually see, not a fixed eleven", () => {
    // The live step list decides the count - a general-mode athlete answers two fewer
    // questions and the progress must say so.
    expect(source).toContain("const totalSteps = stepIds.length;");
    expect(source).not.toMatch(/const totalSteps = \d+/);
    expect(quizStepIds("general", false).length).toBeLessThan(quizStepIds("sport", true).length);
    expect(source).toContain('<p className="athlete-quiz-count">{progressLabel}</p>');
  });

  it("says the count in words, and as a range while the branches are still open", () => {
    // Nothing decided yet: no sport and no area (11) up to sport and an area (14).
    expect(quizProgressLabel(0, quizStepRange(null, false, false))).toBe("Step 1 of 11–14");
    // Sport chosen, area not yet decided.
    expect(quizProgressLabel(4, quizStepRange("sport", false, false))).toBe("Step 5 of 13–14");
    // Sport and an area: the question in the Oct 4 screenshot.
    expect(quizProgressLabel(5, quizStepRange("sport", true, true))).toBe("Step 6 of 14");
    // Past the area step without choosing one: settled at 13.
    expect(quizProgressLabel(5, quizStepRange("sport", false, true))).toBe("Step 6 of 13");
    expect(quizStepRange("general", false, true)).toEqual({ min: 11, max: 11 });
  });

  it("states the insufficiency case rather than implying every target is covered", () => {
    expect(source).toContain("No reviewed exercise routine covers");
    expect(source).toContain("the plan will say what is missing instead of guessing");
  });
});

describe("Onboarding quiz choices for assistive tech", () => {
  const choiceClasses = ["athlete-choice", "athlete-access-choice", "athlete-equipment-choice", "athlete-schedule-choice", "athlete-unit-choice"];

  it("says which answer is chosen on every choice button, not only through a class and an icon", () => {
    // Split on the tag rather than matching `<button[^>]*>`: the `=>` in each onClick ends that match early.
    const choiceButtons = source.split("<button").slice(1).filter((chunk) => {
      const className = chunk.match(/className=\{?[`"]([\w-]+)/)?.[1];
      return className !== undefined && choiceClasses.includes(className);
    });
    // The area question's answers are native radios now (athlete-radio), so they are not counted here.
    expect(choiceButtons.length).toBe(13);
    for (const chunk of choiceButtons) {
      const opening = chunk.slice(0, chunk.indexOf("className="));
      expect(opening, chunk.slice(0, 80)).toContain("aria-pressed=");
      expect(opening, chunk.slice(0, 80)).toContain('type="button"');
    }
  });

  it("marks only the chosen goal as pressed on the first step", () => {
    const markup = renderToStaticMarkup(createElement(AthleteBaselineQuiz, { sports: [], onComplete: () => {} }));
    const buttons = markup.split("<button").slice(1);
    const pressed = buttons.filter((button) => button.includes('aria-pressed="true"'));
    expect(pressed).toHaveLength(1);
    expect(pressed[0]).toContain("Build muscle");
    expect(buttons.filter((button) => button.includes('aria-pressed="false"'))).toHaveLength(3);
  });
});
