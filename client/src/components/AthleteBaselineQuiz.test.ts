import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { boundedQuizStep, convertBodyWeight, quizStepIds } from "./AthleteBaselineQuiz";

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

  it("keeps quiz evidence available through a concise optional disclosure rather than a persistent methodology banner", () => {
    expect(source).toContain('<details className="athlete-evidence-note">');
    expect(source).toContain("Why this matters");
    expect(styles).toContain(".athlete-evidence-note summary { display: flex;");
    expect(styles).toContain(".athlete-evidence-note summary::-webkit-details-marker { display: none; }");
  });

  it("keeps the official brand name visible beside its mark on mobile without removing quiz progress", () => {
    expect(source).toContain('<span>Sports Genome</span>');
    expect(source).toContain('className="athlete-quiz-progress"');
    expect(styles).toContain('.athlete-quiz-brand span { display: inline;');
    expect(styles).toContain('.athlete-quiz-progress { min-width: 112px;');
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

  it("keeps the focus step optional and the constraint default proactive", () => {
    expect(quizStepIds("undecided", false)).toContain("focus");
    expect(source).toContain('focusTargetKey ? "Continue" : "Skip for now"');
    expect(source).toContain('useState<ConstraintType>("proactive_none")');
  });

  it("submits no sport id and no inferred constraint outside sport mode", () => {
    expect(source).toContain('sportId: mode === "sport" ? sportId : ""');
    // A constraint is only ever sent alongside a focus area the athlete chose.
    expect(source).toContain('constraint: focusTargetKey ?');
  });

  // requirement: scope_escalation_boundary - withhold without diagnosing.
  it("shows a withhold notice that escalates without naming a condition", () => {
    expect(source).toContain('posture === "withhold"');
    expect(source).toContain("Sports Genome will not build around this on its own.");
    expect(source).toContain("we are not telling you what the problem is");
    expect(styles).toContain(".athlete-quiz-escalation {");
  });

  it("states the insufficiency case rather than implying every target is covered", () => {
    expect(source).toContain("No reviewed exercise routine covers");
    expect(source).toContain("the plan will say what is missing instead of guessing");
  });
});
