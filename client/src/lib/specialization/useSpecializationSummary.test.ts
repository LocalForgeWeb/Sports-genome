// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { deviceWorkoutHistoryKey, loadDeviceWorkoutSessions, removeDeviceWorkoutSession, saveDeviceWorkoutSessions, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { exercises } from "@/lib/exerciseCatalog";
import { buildDaySlots, emptyDayStore, type WeeklyDayStore } from "@/lib/trainingDayPlan";
import { forearmMuscleIds as m } from "@shared/specialization/ids";
import { calendarWeekInterval, planWeekInterval } from "@shared/specialization/time";
import type { SpecializationRegionData, SpecializationSummary } from "@shared/specialization/types";
import { sourceRevision } from "./revision";
import { clearSummaryCache, intervalForView, summaryCacheKey, useDeviceWorkoutSessions, useSpecializationSummary, type SpecializationPlanInput, type SummaryCacheKeyParts, type UseSpecializationSummaryInput } from "./useSpecializationSummary";
import { exercise, finished, syntheticForearm, workSet } from "./__fixtures__/syntheticForearm";

/**
 * The hook the page reads (brief §9): one summary for every node, from the device's own
 * workouts and the plan Home passes in, recalculated when a record is logged, edited or
 * removed, and reused while nothing it depends on has changed.
 *
 * Reverse Curl (135) is two-handed in the fixture, so its sets count for both arms with no
 * side recorded on the set.
 */

const NOW = "2026-10-16T12:00:00.000Z";
const WEEK = calendarWeekInterval(NOW, "Europe/London");
const WED = "2026-10-14T18:00:00.000Z";
const reverseCurls = (id: string, count: number, completedAt = WED) => finished(id, completedAt, [exercise("e1", "Reverse Curl", 135, Array.from({ length: count }, () => workSet()))]);

const slots = buildDaySlots(["Pull"]);
const byId = (id: number) => exercises.find((item) => item.id === id)!;
const planWith = (ids: number[]): SpecializationPlanInput => {
  const store: WeeklyDayStore = { ...emptyDayStore(), plan: { [slots[0].key]: ids.map(byId) }, prescriptions: { [slots[0].key]: Object.fromEntries(ids.map((id) => [id, "3 × 12"])) } };
  return { week: 1, slots, store };
};

const input = (over: Partial<UseSpecializationSummaryInput> = {}): UseSpecializationSummaryInput => ({
  region: syntheticForearm,
  accountScope: "a",
  interval: WEEK,
  side: "left",
  mode: "completed",
  plan: null,
  goals: [],
  catalog: exercises,
  fallbackUnit: "kg",
  now: NOW,
  ...over,
});

const ready = (state: ReturnType<typeof useSpecializationSummary>): SpecializationSummary => {
  if (state.status !== "ready") throw new Error(`expected a summary, got ${state.status}`);
  return state.summary;
};
const direct = (summary: SpecializationSummary, nodeId: string) => summary.nodes.find((node) => node.nodeId === nodeId)!.directDynamicBouts;

afterEach(() => {
  cleanup();
  localStorage.clear();
  clearSummaryCache();
});

describe("useSpecializationSummary", () => {
  it("summarizes every node at once from the workouts already on the device", () => {
    const sessions = [reverseCurls("s1", 3)];
    saveDeviceWorkoutSessions(sessions);
    const { result } = renderHook(() => useSpecializationSummary(input()));
    const summary = ready(result.current);
    expect(direct(summary, m.brachioradialis)).toBe(3);
    expect(summary.nodes).toHaveLength(syntheticForearm.nodes.length);
    // The revision is of the workouts as the app reads them back (normalized on load).
    expect(summary.sourceRevision).toBe(sourceRevision(loadDeviceWorkoutSessions()));
    expect(summary.planRevision).toBeNull();
  });

  it("recalculates when a set is edited or a workout removed, including an old one, and only then", () => {
    const old = reverseCurls("old", 2, "2026-10-13T18:00:00.000Z");
    const recent = reverseCurls("recent", 3);
    saveDeviceWorkoutSessions([old, recent]);
    const { result, rerender } = renderHook((props: UseSpecializationSummaryInput) => useSpecializationSummary(props), { initialProps: input() });
    const first = ready(result.current);
    expect(direct(first, m.brachioradialis)).toBe(5);

    rerender(input());
    expect(ready(result.current)).toBe(first);

    const edited = { ...old, exercises: [{ ...old.exercises[0], sets: [old.exercises[0].sets[0]] }] };
    act(() => { saveDeviceWorkoutSessions([edited, recent]); });
    expect(direct(ready(result.current), m.brachioradialis)).toBe(4);

    act(() => { saveDeviceWorkoutSessions(removeDeviceWorkoutSession([edited, recent], "recent")); });
    expect(direct(ready(result.current), m.brachioradialis)).toBe(1);
  });

  it("picks up workouts written in another tab", () => {
    const { result } = renderHook(() => useSpecializationSummary(input()));
    expect(direct(ready(result.current), m.brachioradialis)).toBe(0);
    act(() => {
      localStorage.setItem(deviceWorkoutHistoryKey, JSON.stringify([reverseCurls("s1", 2)]));
      window.dispatchEvent(new StorageEvent("storage", { key: deviceWorkoutHistoryKey }));
    });
    expect(direct(ready(result.current), m.brachioradialis)).toBe(2);
  });

  it("reads the plan Home passes for planned work; a plan change moves planned totals and leaves completed ones alone", () => {
    saveDeviceWorkoutSessions([reverseCurls("s1", 2)]);
    const planned = renderHook((props: UseSpecializationSummaryInput) => useSpecializationSummary(props), { initialProps: input({ mode: "planned", interval: planWeekInterval(1), plan: planWith([135]) }) });
    const completed = renderHook((props: UseSpecializationSummaryInput) => useSpecializationSummary(props), { initialProps: input({ plan: planWith([135]) }) });
    const plannedBefore = ready(planned.result.current);
    const completedBefore = ready(completed.result.current);
    expect([direct(plannedBefore, m.brachioradialis), plannedBefore.planRevision?.startsWith("plan-"), plannedBefore.sourceRevision]).toEqual([3, true, ""]);

    planned.rerender(input({ mode: "planned", interval: planWeekInterval(1), plan: planWith([135, 132]) }));
    completed.rerender(input({ plan: planWith([135, 132]) }));
    expect(direct(ready(planned.result.current), m.brachioradialis)).toBe(6);
    expect(ready(completed.result.current)).toBe(completedBefore);
  });

  it("reports a calculation that failed as an error state instead of throwing", () => {
    const broken = { ...syntheticForearm, nodes: null } as unknown as SpecializationRegionData;
    const { result } = renderHook(() => useSpecializationSummary(input({ region: broken })));
    expect(result.current.status).toBe("error");
  });
});

describe("the cache key and the window", () => {
  const parts: SummaryCacheKeyParts = {
    accountScope: "a",
    regionId: "forearm",
    interval: { kind: "calendar_week", startAt: WEEK.startAt, endAtExclusive: WEEK.endAtExclusive, planWeek: null },
    timezone: "Europe/London",
    side: "left",
    mode: "completed",
    planRevision: null,
    sourceRevision: "src-1",
    ruleVersion: "specialization_exposure_v1",
    mappingVersion: "forearm_mappings_v1",
    goalsRevision: "g-1",
    nowMinute: "2026-10-16T12:00",
  };

  it("changes with every input the summary depends on", () => {
    const key = summaryCacheKey(parts);
    expect(summaryCacheKey({ ...parts })).toBe(key);
    const changes: Partial<SummaryCacheKeyParts>[] = [
      { accountScope: "b" }, { regionId: "deltoid" }, { interval: { ...parts.interval, startAt: "2026-10-05T00:00:00.000Z" } }, { timezone: "America/New_York" },
      { side: "right" }, { mode: "planned" }, { planRevision: "plan-2" }, { sourceRevision: "src-2" }, { ruleVersion: "specialization_exposure_v2" },
      { mappingVersion: "forearm_mappings_v2" }, { goalsRevision: "g-2" }, { nowMinute: "2026-10-16T12:01" },
    ];
    for (const change of changes) expect(summaryCacheKey({ ...parts, ...change })).not.toBe(key);
  });

  it("turns the page's controls into the window they describe", () => {
    const view = { mode: "completed" as const, window: "week" as const, from: null, to: null, planWeek: null };
    expect(intervalForView(view, NOW, "Europe/London").kind).toBe("calendar_week");
    expect(intervalForView({ ...view, window: "7d" }, NOW, "Europe/London").kind).toBe("rolling_7d");
    expect(intervalForView({ ...view, window: "custom", from: "2026-10-01", to: "2026-10-05" }, NOW, "Europe/London").label).toBe("1–5 Oct");
    expect(intervalForView({ ...view, mode: "planned", planWeek: 3 }, NOW, "Europe/London").label).toBe("Plan Week 3, as written");
    expect(intervalForView({ ...view, mode: "planned" }, NOW, "Europe/London", 2).planWeek).toBe(2);
  });
});

describe("useDeviceWorkoutSessions", () => {
  it("follows the workout history event", () => {
    const { result } = renderHook(() => useDeviceWorkoutSessions());
    expect(result.current).toEqual([]);
    const sessions: DeviceWorkoutSession[] = [reverseCurls("s1", 1)];
    act(() => { saveDeviceWorkoutSessions(sessions); });
    expect(result.current.map((session) => session.id)).toEqual(["s1"]);
  });
});
