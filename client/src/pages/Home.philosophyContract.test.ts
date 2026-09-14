import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { leadingConfirmedChange } from "@/lib/homeStateSummary";
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
    expect(order("<TodayActionPanel")).toBeLessThan(order('className="command-hero"'));
  });

  // Anti-pattern for the same principle: "surfacing low-value novelty above a
  // high-value action". Sport/goal/day and gym-time selects are configuration, not
  // state, so they sit after the decision content.
  it("keeps plan-input configuration below the decision content", () => {
    const inputs = order('className="home-input-disclosure"');
    expect(order("<TodayActionPanel")).toBeLessThan(inputs);
    expect(order('className="command-hero"')).toBeLessThan(inputs);
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
