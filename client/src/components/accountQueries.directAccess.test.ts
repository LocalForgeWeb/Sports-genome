// @vitest-environment jsdom
import React from "react";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * B233. Home and Progress asked the account-only routes on every open, even on the device
 * stores. With no account those are refused as unauthorised, and the refusal raised "Your
 * sign-in has expired" to an athlete who had never signed in (reproduced in a browser against
 * the server's own answers). They are asked only when an account is the source.
 */
const asked = vi.hoisted(() => new Map<string, { enabled?: boolean } | undefined>());

vi.mock("@/lib/trpc", () => {
  const query = (name: string) => ({ useQuery: (_input: unknown, options?: { enabled?: boolean }) => { asked.set(name, options); return { data: undefined }; } });
  return {
    trpc: {
      strengthGenome: { observations: query("observations"), referenceRows: query("referenceRows"), overview: query("overview") },
      workoutLog: { list: query("list"), progressionHistory: query("progressionHistory") },
      strengthPercentile: { forLifts: query("forLifts"), forLift: query("forLift") },
      strengthProfile: { muscleRanks: query("muscleRanks") },
    },
  };
});

import { TodayActionPanel } from "./TodayActionPanel";
import { ProgressOverviewPanel } from "./ProgressOverviewPanel";
import { todayPlan } from "./todayPlanFixture";

const accountOnly = ["list", "observations", "progressionHistory"];

describe("account-only queries on the device stores", () => {
  beforeEach(() => asked.clear());
  afterEach(() => { document.body.innerHTML = ""; });

  it("Home does not ask them without an account, and does with one", () => {
    const props = { plan: todayPlan({}), onOpenWorkout: () => {}, onOpenTraining: () => {}, onOpenStrength: () => {}, hour: 9 };
    render(React.createElement(TodayActionPanel, { ...props, directAccess: true }));
    for (const name of accountOnly) expect(asked.get(name)?.enabled, name).toBe(false);
    asked.clear();
    render(React.createElement(TodayActionPanel, { ...props, directAccess: false }));
    for (const name of accountOnly) expect(asked.get(name)?.enabled, name).toBe(true);
  });

  it("Progress does not ask them without an account, and does with one", () => {
    const props = { onOpenStrength: () => {}, onOpenTraining: () => {} };
    render(React.createElement(ProgressOverviewPanel, { ...props, directAccess: true }));
    for (const name of accountOnly) expect(asked.get(name)?.enabled, name).toBe(false);
    asked.clear();
    render(React.createElement(ProgressOverviewPanel, { ...props, directAccess: false }));
    for (const name of accountOnly) expect(asked.get(name)?.enabled, name).toBe(true);
  });
});
