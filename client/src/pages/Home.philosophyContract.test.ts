import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { leadingConfirmedChange, selectHomePriority, type HomePriorityInput } from "@/lib/homeStateSummary";
import type { WithinAthleteStrengthChange } from "@/lib/withinAthleteStrengthChange";

const home = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");
const panel = readFileSync(new URL("../components/TodayActionPanel.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../index.css", import.meta.url), "utf8");

/** Where a block first appears in Home's command workspace. */
function order(marker: string): number {
  const index = home.indexOf(marker);
  expect(index, `${marker} is rendered on Home`).toBeGreaterThan(-1);
  return index;
}

function change(overrides: Partial<WithinAthleteStrengthChange>): WithinAthleteStrengthChange {
  return {
    exerciseName: "Back Squat",
    laterality: "BILATERAL",
    changeState: "meaningful_change_supported",
    observationCount: 4,
    firstPoint: { observedAt: new Date("2026-01-01"), estimatedOneRepMaxKg: 100 },
    latestPoint: { observedAt: new Date("2026-06-01"), estimatedOneRepMaxKg: 120 },
    relativeChangePercent: 20,
    estimationMethod: "epley",
    ...overrides,
  } as WithinAthleteStrengthChange;
}

describe("Home answers state, priority, and next action", () => {
  // "home-state-priority-action" (strong, primary application): the first major
  // viewport communicates current state/trend, the highest-value priority, and the
  // next best action. Secondary content must not compete for first attention.
  it("puts the state and next-action panel ahead of the hero and the decision grid", () => {
    expect(order("<TodayActionPanel")).toBeLessThan(order("<CommandHero"));
  });

  // Anti-pattern for the same principle: "surfacing low-value novelty above a
  // high-value action". Sport/goal/day and gym-time selects are configuration, not
  // state, so they sit after the decision content.
  it("keeps plan-input configuration below the decision content", () => {
    const inputs = order('className="home-input-disclosure"');
    expect(order("<TodayActionPanel")).toBeLessThan(inputs);
    expect(order("<CommandHero")).toBeLessThan(inputs);
  });

  // "overview-first-detail-on-demand": complexity stays reachable behind a labelled
  // disclosure rather than being deleted - the same rule requires that manual
  // complexity controls remain available.
  it("keeps both input decks reachable inside the labelled disclosure", () => {
    const disclosure = home.slice(
      order('className="home-input-disclosure"'),
      home.indexOf("</details>", order('className="home-input-disclosure"'))
    );
    expect(disclosure).toContain('className="home-preference-deck"');
    expect(disclosure).toContain('className="gym-time-budget-card"');
    expect(disclosure).toContain("<summary>");
    expect(home).not.toContain('{workspace === "command" && <section className="home-preference-deck"');
    expect(home).not.toContain('{workspace === "command" && <section className="gym-time-budget-card"');
  });

  it("gives the state layer a visible place above the next action", () => {
    expect(panel.indexOf('className="today-action-state"')).toBeLessThan(
      panel.indexOf('className="today-action-primary"')
    );
    expect(styles).toContain(".today-action-state {");
  });
});

describe("Home does not narrate noise as progress", () => {
  // "Do not narrate noise as progress" (strong): describe direction only when the
  // change exceeds the expected noise of the metric and protocol.
  it("headlines only a change the within-athlete model confirms", () => {
    const confirmed = change({ relativeChangePercent: 18 });
    expect(leadingConfirmedChange([confirmed])).toBe(confirmed);
  });

  it("reports no direction for changes below the confirmed threshold", () => {
    for (const state of ["insufficient_history", "stable", "directional_signal_emerging"] as const) {
      expect(leadingConfirmedChange([change({ changeState: state, relativeChangePercent: 40 })]), state).toBeNull();
    }
  });

  it("picks the largest confirmed movement in either direction", () => {
    const smallGain = change({ exerciseName: "Bench", relativeChangePercent: 16 });
    const bigLoss = change({ exerciseName: "Deadlift", relativeChangePercent: -28 });
    expect(leadingConfirmedChange([smallGain, bigLoss])).toBe(bigLoss);
    // An unconfirmed larger number never outranks a confirmed smaller one.
    const louderButUnconfirmed = change({ changeState: "stable", relativeChangePercent: 90 });
    expect(leadingConfirmedChange([louderButUnconfirmed, smallGain])).toBe(smallGain);
  });

  it("returns nothing rather than a default when no lift is tracked", () => {
    expect(leadingConfirmedChange([])).toBeNull();
  });

  it("keeps the unconfirmed copy free of a directional claim", () => {
    expect(panel).toContain("No change yet is large enough to call a real one rather than normal variation.");
    // The boundary the app states everywhere else travels with the headline.
    expect(panel).toContain("not a rank against other people");
  });
});

describe("Home names one priority and gives it an action posture", () => {
  // "home-state-priority-action": one highest-value priority, answering "where should
  // attention go?". Its failure modes are a metric wall when too many qualify and an
  // arbitrary-feeling dashboard when the ranking is unstable, so selection is a fixed
  // order returning exactly one item.
  const settled: HomePriorityInput = {
    collectableGate: null,
    hasConfirmedChange: false,
    trackedChangeCount: 3,
    stagedExerciseCount: 5,
    observationCount: 9,
  };

  it("always yields exactly one priority with a usable action", () => {
    const priority = selectHomePriority(settled);
    expect(priority.headline.length).toBeGreaterThan(0);
    expect(priority.ctaLabel.length).toBeGreaterThan(0);
    expect(["act", "inspect", "measure"]).toContain(priority.posture);
  });

  // "make-uncertainty-operational": where uncertainty can change the practical action,
  // the next step defaults to collecting the missing measurement rather than
  // prescribing training on top of the gap.
  it("asks for a missing measurement before prescribing any training", () => {
    const priority = selectHomePriority({
      ...settled,
      collectableGate: { reason: "body_mass_required", exerciseName: "Back Squat" },
    });
    expect(priority.posture).toBe("measure");
    expect(priority.headline).toBe("Add your test-day body weight");
    expect(priority.detail).toContain("Back Squat");
    expect(priority.target).toBe("strength");
  });

  it("outranks a staged-day prompt with the collectable measurement", () => {
    const priority = selectHomePriority({
      ...settled,
      stagedExerciseCount: 0,
      collectableGate: { reason: "age_required", exerciseName: "Bench Press" },
    });
    expect(priority.posture).toBe("measure");
  });

  it("ignores a gate the athlete cannot close", () => {
    // No reviewed study covers the lift: there is nothing to act on, so this must not
    // become the priority.
    const priority = selectHomePriority({
      ...settled,
      collectableGate: { reason: "no_reference_for_exercise", exerciseName: "Landmine Press" },
    });
    expect(priority.posture).not.toBe("measure");
    expect(priority.id).not.toContain("no_reference_for_exercise");
  });

  it("asks for a first measurement before anything else when nothing is logged", () => {
    const priority = selectHomePriority({ ...settled, observationCount: 0, stagedExerciseCount: 0 });
    expect(priority).toMatchObject({ id: "first-lift", posture: "measure" });
  });

  it("prompts to stage a day when the plan is the missing piece", () => {
    expect(selectHomePriority({ ...settled, stagedExerciseCount: 0 })).toMatchObject({
      id: "stage-day",
      posture: "act",
      target: "day-plan",
    });
  });

  it("asks for a repeat test when change cannot be established yet", () => {
    expect(selectHomePriority({ ...settled, trackedChangeCount: 0 })).toMatchObject({
      id: "repeat-lift",
      posture: "measure",
    });
  });

  it("sends a confirmed change to inspection rather than straight to a prescription", () => {
    expect(selectHomePriority({ ...settled, hasConfirmedChange: true })).toMatchObject({
      id: "review-change",
      posture: "inspect",
    });
  });

  it("is stable: the same input always selects the same priority", () => {
    const first = selectHomePriority(settled);
    const second = selectHomePriority({ ...settled });
    expect(second).toEqual(first);
  });

  it("renders the priority between the state layer and the next action", () => {
    expect(panel.indexOf('className="today-action-state"')).toBeLessThan(
      panel.indexOf("today-action-priority")
    );
    expect(panel.indexOf("today-action-priority")).toBeLessThan(
      panel.indexOf('className="today-action-primary"')
    );
    expect(styles).toContain(".today-action-priority {");
  });

  it("keeps heading levels in document order for assistive navigation", () => {
    // semantic-accessibility-equivalence: "focus order diverging from logical order".
    // The priority sits above the next action, so it must not be a deeper heading
    // level than the block that follows it.
    const levels = [...panel.matchAll(/<h([1-6])/g)].map(match => Number(match[1]));
    expect(levels.length).toBeGreaterThan(1);
    levels.slice(1).forEach((level, index) => {
      expect(level, `heading ${index + 2} does not jump backwards`).toBeLessThanOrEqual(levels[index] + 1);
    });
    expect(new Set(levels).size, "sibling blocks share one heading level").toBe(1);
  });

  it("states the posture in text rather than leaving colour to carry it", () => {
    // semantic-accessibility-equivalence: meaning must survive when colour is absent.
    expect(panel).toContain("Where attention goes");
    expect(panel).toContain('postureLabel[priority.posture]');
    expect(panel).toContain('act: "Act", inspect: "Inspect", measure: "Measure"');
  });
});
