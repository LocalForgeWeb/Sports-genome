import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./RateStackPanel.tsx", import.meta.url), "utf8");
const stackAnalysisSource = readFileSync(new URL("./StackAnalysisPage.tsx", import.meta.url), "utf8");
const globalCss = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const plannerCss = readFileSync(new URL("../workout-planner.css", import.meta.url), "utf8");

describe("Rate Stack split-target index", () => {
  it("uses split analysis for the visible index and distinguishes it from the full-body involvement view", () => {
    expect(source).toContain("analyzeSplitStack(workout, catalog, split)");
    expect(source).toContain("{split} target index {analysis.score}/100");
    expect(source).toContain("The index evaluates {split.toLowerCase()} targets only.");
    expect(source).toContain("full body map to inspect all involved muscles");
    expect(source).toContain('<details className="rate-stack-scope">');
    expect(source).toContain("Target-only score and planning note");
    expect(source).toContain("targetIndex={analysis.score}");
    expect(stackAnalysisSource).toContain("{split} target index");
    expect(stackAnalysisSource).toContain("Target coverage is calculated from this split’s intended muscles only.");
  });

  it("passes catalog-backed missing-target suggestions into the full review as direct add actions", () => {
    expect(source).toContain("suggestions={analysis.suggestions}");
    expect(source).toContain("onAddSuggestion={onAdd}");
    expect(stackAnalysisSource).toContain("Suggested target additions");
    expect(stackAnalysisSource).toContain("Add to {split} day");
  });

  it("uses shared high-contrast tokens for Training Day and other athlete-facing dark panels", () => {
    expect(globalCss).toContain("--sg-text-on-dark: #f7fbff");
    expect(globalCss).toContain("--sg-text-muted-on-dark: #c3d7ea");
    expect(globalCss).toContain("--sg-divider-on-dark: rgb(164 200 232 / .24)");
    expect(globalCss).toContain("--sg-control-border-on-dark: rgb(164 200 232 / .35)");
    expect(globalCss).toContain("--sg-focus-on-dark: #f2c14d");
    expect(globalCss).toContain(".workout-health-panel,");
    expect(globalCss).toContain(".destination-explore .atlas-tool-row,");
    expect(globalCss).toContain(".catalog-discovery {");
    expect(globalCss).toContain(".about-me-equipment {");
    expect(globalCss).toContain("background: var(--sg-surface-raised)");
    expect(globalCss).toContain("outline: 2px solid var(--sg-focus-on-dark)");
    expect(plannerCss).toContain(".workout-health-panel");
    expect(globalCss).toContain(".stack-analysis-page { background: #07182e; color: #edf7ff; }");
    expect(globalCss).toContain(".stack-analysis-head { border-bottom-color: rgb(164 200 232 / .24); background: linear-gradient(115deg, #07182e, #123b68); }");
    expect(globalCss).toContain(".stack-analysis-rank-head h2, .stack-analysis-detail h2, .stack-analysis-detail-head h2 { color: #f7fbff; }");
    expect(globalCss).toContain(".stack-analysis-row strong, .stack-analysis-row em, .stack-analysis-metric div, .stack-analysis-metric strong, .stack-analysis-contributions strong, .stack-analysis-contributions button > span { color: #f7fbff; }");
  });
});
