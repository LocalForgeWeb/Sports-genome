import { describe, expect, it } from "vitest";
import { calendarWeekInterval, intervalContains, localDateKey } from "@shared/specialization/time";
import { canonicalTimeZone, targetMatchesWindow } from "./viewerData";

/**
 * iOS readiness audit, A12. The forearm page's fixture reading failed in Chicago and passed in UTC:
 * its targets are saved in UTC and the page reads the week in the runtime's zone. The suite now
 * runs in one zone (vitest.config.ts); these tests hold the behaviour itself, with every zone
 * passed explicitly, so they read the same on any machine.
 *
 * A target is read over the window on screen only when the two are the same span of time. A
 * calendar week in Chicago and one in UTC are not: Monday starts at different instants, and a
 * late-Sunday session in Chicago is already Monday in UTC. When they differ, the page says the
 * target is "over the target's own period (not this window)", and that stays honest.
 */
const week = (timeZone: string) => ({ mode: "completed" as const, window: "week" as const, timeZone });
const calendarGoal = (timezone: string) => ({ period: "calendar_week" as const, timezone });

describe("the runtime zone the suite reads", () => {
  it("is pinned to UTC for every test", () => {
    expect(process.env.TZ).toBe("UTC");
    expect(canonicalTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)).toBe("UTC");
  });
});

describe("a weekly target and the week on screen", () => {
  it("match when the target and the page share a zone: UTC, or Chicago", () => {
    expect(targetMatchesWindow(calendarGoal("UTC"), week("UTC"))).toBe(true);
    expect(targetMatchesWindow(calendarGoal("America/Chicago"), week("America/Chicago"))).toBe(true);
  });

  it("differ when the zones differ, so the page says the target is over its own period", () => {
    expect(targetMatchesWindow(calendarGoal("UTC"), week("America/Chicago"))).toBe(false);
    expect(targetMatchesWindow(calendarGoal("America/Chicago"), week("UTC"))).toBe(false);
  });

  it("treat two names for one zone as one zone, and never two zones as one because their clocks agree today", () => {
    expect(targetMatchesWindow(calendarGoal("Etc/UTC"), week("UTC"))).toBe(true);
    expect(targetMatchesWindow(calendarGoal("US/Central"), week("America/Chicago"))).toBe(true);
    // Mexico City keeps Chicago's winter offset all year; the two weeks part again each March.
    expect(targetMatchesWindow(calendarGoal("America/Mexico_City"), week("America/Chicago"))).toBe(false);
  });

  it("leaves rolling and planned windows as they were: a rolling target is the same span in any zone", () => {
    expect(targetMatchesWindow({ period: "rolling_7d", timezone: "UTC" }, { mode: "completed", window: "7d", timeZone: "America/Chicago" })).toBe(true);
    expect(targetMatchesWindow(calendarGoal("UTC"), { mode: "completed", window: "7d", timeZone: "UTC" })).toBe(false);
    expect(targetMatchesWindow(calendarGoal("UTC"), { mode: "planned", window: "week", timeZone: "America/Chicago" })).toBe(true);
  });

  it("compares an unknown zone name as written rather than failing", () => {
    expect(canonicalTimeZone("Not/AZone")).toBe("Not/AZone");
    expect(targetMatchesWindow(calendarGoal("Not/AZone"), week("Not/AZone"))).toBe(true);
    expect(targetMatchesWindow(calendarGoal("Not/AZone"), week("UTC"))).toBe(false);
  });
});

describe("weeks across a daylight-saving change, in the zone they are read in", () => {
  // Chicago leaves daylight time at 02:00 on Sunday 1 Nov 2026: that week is 7 days and 1 hour.
  const lastWeekOfDaylight = calendarWeekInterval("2026-10-29T15:00:00.000Z", "America/Chicago");
  const firstWeekOfStandard = calendarWeekInterval("2026-11-04T15:00:00.000Z", "America/Chicago");

  it("starts and ends each Chicago week at local midnight on Monday, whatever the offset", () => {
    expect(lastWeekOfDaylight.startAt).toBe("2026-10-26T05:00:00.000Z");
    expect(lastWeekOfDaylight.endAtExclusive).toBe("2026-11-02T06:00:00.000Z");
    expect(Date.parse(lastWeekOfDaylight.endAtExclusive!) - Date.parse(lastWeekOfDaylight.startAt!)).toBe((7 * 24 + 1) * 3600_000);
    // Consecutive weeks meet exactly: a session can be neither lost nor counted twice.
    expect(firstWeekOfStandard.startAt).toBe(lastWeekOfDaylight.endAtExclusive);
  });

  it("puts a late-Sunday Chicago session in that Sunday's week, and the next one after midnight in the next", () => {
    const sundayNight = "2026-11-02T05:30:00.000Z"; // 23:30 on Sunday 1 Nov in Chicago
    const mondayMorning = "2026-11-02T06:30:00.000Z"; // 00:30 on Monday 2 Nov in Chicago
    expect(localDateKey(sundayNight, "America/Chicago")).toBe("2026-11-01");
    expect(intervalContains(lastWeekOfDaylight, sundayNight)).toBe(true);
    expect(intervalContains(firstWeekOfStandard, sundayNight)).toBe(false);
    expect(intervalContains(lastWeekOfDaylight, mondayMorning)).toBe(false);
    expect(intervalContains(firstWeekOfStandard, mondayMorning)).toBe(true);
  });

  it("counts that same Sunday-night session in a different week in UTC, which is why the zones must match", () => {
    const sundayNightChicago = "2026-11-02T03:00:00.000Z"; // 21:00 Sunday in Chicago, 03:00 Monday in UTC
    const utcWeek = calendarWeekInterval("2026-10-29T15:00:00.000Z", "UTC");
    expect(intervalContains(lastWeekOfDaylight, sundayNightChicago)).toBe(true);
    expect(intervalContains(utcWeek, sundayNightChicago)).toBe(false);
  });

  it("makes the spring week an hour short, with no gap or overlap either side", () => {
    // Chicago enters daylight time at 02:00 on Sunday 8 Mar 2026.
    const springWeek = calendarWeekInterval("2026-03-04T15:00:00.000Z", "America/Chicago");
    const after = calendarWeekInterval("2026-03-11T15:00:00.000Z", "America/Chicago");
    expect(Date.parse(springWeek.endAtExclusive!) - Date.parse(springWeek.startAt!)).toBe((7 * 24 - 1) * 3600_000);
    expect(after.startAt).toBe(springWeek.endAtExclusive);
  });
});
