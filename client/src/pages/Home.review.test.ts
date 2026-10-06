import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const home = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const chrome = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const board = readFileSync(new URL("../components/weekReview/WeekReviewBoard.tsx", import.meta.url), "utf8");
const planner = readFileSync(new URL("../workout-planner.css", import.meta.url), "utf8");

/** The Review branch alone: from its own `{workspace === "review"` to the next workspace's. */
const reviewBranch = () => {
  const start = home.indexOf('{workspace === "review"');
  expect(start, "the Review branch was found").toBeGreaterThan(-1);
  const next = home.indexOf("{workspace === ", start + 1);
  return home.slice(start, next > -1 ? next : undefined);
};

/**
 * Review is one page in two scopes (5 October 2026 brief). The head names the scope with an
 * explicit Week/Day control; the Week scope is one board read from one analysis; the Day
 * scope keeps the panels that read the open day, in the order the answers are wanted.
 */
describe("Review reads as one page", () => {
  it("names its scope with one control and never mixes the two silently", () => {
    const branch = reviewBranch();
    expect(branch).toContain("<ReviewHead");
    expect(branch).toContain("scope={reviewScope}");
    expect(branch).toContain("onScope={setReviewScope}");
    expect(branch).toContain('reviewScope === "week"');
    // The week's title names the week and the plan; the day's names the day.
    expect(branch).toContain("`Week ${activeWeek} · ${trainingDays}-day plan`");
    expect(branch).toContain(": activeDayLabel}");
  });

  it("stacks the day's sections in the order the answers are wanted, under the day scope only", () => {
    const branch = reviewBranch();
    const stack = branch.slice(branch.indexOf('className="day-review-stack"'));
    const order = ["<WarmupPanel", "<ProgrammingGuidePanel", "<WorkoutHealthPanel", "<ImportedPlanContext"];
    let cursor = -1;
    for (const panel of order) {
      const at = stack.indexOf(panel);
      expect(at, `${panel} is on Review`).toBeGreaterThan(-1);
      expect(at, `${panel} comes after the one before it`).toBeGreaterThan(cursor);
      cursor = at;
    }
    // The week's panels are the board, not the old pair of panels beside the day's.
    expect(branch).toContain("<WeekReviewBoard");
    expect(branch).not.toContain("<WeeklyMuscleVolumePanel");
    expect(branch).not.toContain("<RecoverySpacingPanel");
    // One column: the two-column grid put the warm-up beside the coach scan and
    // made the reading order depend on the viewport.
    expect(home).not.toContain('xl:grid-cols-[.9fr_1.1fr]');
  });

  it("reads the week from one analysis, with the open day's draft written in", () => {
    expect(home).toContain("const weekAnalysis = useMemo(() => {");
    expect(home).toContain("visibleDayPlan(homePlan.weeks[activeWeek] || emptyDayStore(), splitDays)");
    expect(home).toContain("analyzeWeek({ slots: daySlots, plan: week.plan, prescriptions: week.prescriptions, goal, catalog: exercises })");
    // Nothing on the board re-counts a set: the board takes the analysis and no plan.
    expect(board).not.toContain("getWeeklyMuscleVolume");
    expect(board).not.toContain("getRecoverySpacingAlerts");
    expect(board).not.toContain("parseSetCount");
  });

  it("carries the scope on Review's address, with the week as the plain address", () => {
    expect(home).toContain('if (next === "review" && scope === "day") url.searchParams.set("scope", scope); else url.searchParams.delete("scope");');
    expect(home).toContain('if (next === "review") { const scope = reviewScopeFromLocation(params.get("scope"));');
    // Plan's pointer opens the day; Home's link opens the week; the tab keeps whatever was there.
    expect(home).toContain('navigateWorkspace("review", { reviewScope: "day" })');
    // Home's link carries the week Home trains from and switches to it before opening Review.
    expect(home).toContain("onOpenReview={openWeekReview}");
    expect(home).toContain('applyWeek(week, planWeeks[week], { navigate: false });\n    }\n    navigateWorkspace("review", { reviewScope: "week" });');
    // The workout's own review action opens the day; search names a scope per destination.
    expect(home).toContain('onReviewDay={() => navigateWorkspace("review", { reviewScope: "day" })}');
    expect(home).toContain('if (target === "review") scope = anchorId === "day" ? "day" : "week";');
    // Before the plan and profile are read the head shows no week and no numbers (no fake zero).
    expect(home).toContain('title={!reviewReady ? "Review" :');
    expect(home).toContain("const reviewReady = planHydrated && profileHydrated;");
  });

  it("offers the session from the day it reviews, and only there", () => {
    const branch = reviewBranch();
    expect(branch).toContain('className="day-review-open"');
    expect(branch).toContain("chooseDayToTrain(activeSlot)");
    // The board's own actions never set the next workout: that is the Open workout button alone.
    expect(board).not.toContain("chooseDayToTrain");
    // Switching weeks on Review stays on Review; Edit week goes to Plan.
    expect(branch).toContain("onSelect={(week) => selectWeek(week, { navigate: false })}");
    expect(branch).toContain('onEditWeek={() => navigateWorkspace("day-plan")}');
    expect(home).toContain('review: "Review your week"');
  });

  /**
   * Sampled from the rendered page: the recovery-spacing heading was
   * rgb(16,41,71) and its disclosure summary rgb(49,87,124), both on a panel of
   * roughly rgb(13,40,72) — a ratio near 1.0, which is not low contrast, it is
   * invisible. An earlier repaint of these panels caught strong, p and small and
   * stopped there.
   */
  it("paints every heading and summary these panels have for the ground they sit on", () => {
    expect(chrome).toContain(".destination-train .recovery-spacing-head h3,");
    expect(chrome).toContain(".destination-train .programming-guide-panel h3 { color: var(--sg-text-on-dark); }");
    expect(chrome).toContain(".destination-train .programming-guide-disclosure > summary { color: var(--sg-link-on-dark); }");
  });

  /**
   * The first version of that fix repainted the clear state's text without
   * repainting the cream card under it, which put light grey on near-white —
   * the same defect moved rather than fixed.
   */
  it("repaints the clear-state card rather than only the words on it", () => {
    expect(chrome).toContain(".destination-train .recovery-spacing-clear { border-color:");
    expect(chrome).not.toContain(".destination-train .recovery-spacing-panel span {");
  });

  /**
   * The handoff's visual rule: "No outer border around an ordinary page section"
   * and "No bordered container around each exercise, workout record, or
   * setting." Six bordered cards on one column read as six pages, each with its
   * own frame, gradient and shadow.
   */
  it("gives the sections hairlines instead of frames", () => {
    expect(planner).toContain(".day-review-stack > * { border: 0 !important;");
    expect(planner).toContain(".day-review-stack > * + * { border-top: 1px solid var(--sg-divider-on-dark) !important;");
    // The two that kept a frame after the first pass: the spacing check's own
    // card padding and the programming guide's light gradient summary.
    expect(planner).toContain(".day-review-stack .programming-guide-disclosure > summary { min-height: 3.25rem; background: transparent; }");
  });

  /**
   * `overflow: hidden` was doing real containment work on these panels. Forcing
   * it visible while flattening let children that had always been a few pixels
   * too wide stick past the page gutter - measured at 396px on a 390px viewport.
   * The handoff requires 320/360/390/430 to hold.
   */
  it("does not force away the containment the panels relied on", () => {
    expect(planner).not.toContain(".day-review-stack > * { border: 0 !important; border-radius: 0 !important; background: transparent !important; box-shadow: none !important; margin: 0 !important; overflow: visible !important; }");
    expect(planner).toContain("padding-left: 0 !important; padding-right: 0 !important; }");
  });
});
