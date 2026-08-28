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
