import { describe, expect, it } from "vitest";
import {
  addDaysToDateKey,
  calendarWeekInterval,
  customInterval,
  dateRangeLabel,
  intervalContains,
  isDateKey,
  isValidTimeZone,
  localDateKey,
  mondayIndexOfDateKey,
  planWeekInterval,
  rolling7dInterval,
  zonedStartOfDay,
} from "@shared/specialization/time";

/**
 * Windows for completed work (design §4; brief §11 "Calendar week / rolling 7 days: correct
 * boundaries including DST"). Every expected instant below is worked out by hand from the
 * zone's rules, not read back from the code:
 * - New York changes at 02:00 local (07:00Z in March, 06:00Z in November).
 * - London changes at 01:00 UTC.
 * - Havana changes AT local midnight: 00:00 → 01:00 on 8 Mar 2026, 01:00 → 00:00 on 1 Nov.
 * - Santiago changes at local midnight too: Sat 24:00 → Sun 01:00 on 6 Sep 2026, and
 *   Sun 00:00 → Sat 23:00 on 5 Apr 2026.
 */

const HOUR = 3_600_000;
const span = (interval: { startAt: string | null; endAtExclusive: string | null }) => (Date.parse(interval.endAtExclusive!) - Date.parse(interval.startAt!)) / HOUR;
const minus1ms = (iso: string) => new Date(Date.parse(iso) - 1).toISOString();

describe("time zones and local dates", () => {
  it("accepts zones Intl knows and refuses anything else", () => {
    expect(isValidTimeZone("Europe/London")).toBe(true);
    expect(isValidTimeZone("America/Havana")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("")).toBe(false);
    expect(isValidTimeZone("Mars/Olympus_Mons")).toBe(false);
    expect(isValidTimeZone(42)).toBe(false);
  });

  it("reads the local date of an instant in the zone, not in UTC", () => {
    expect(localDateKey("2026-10-16T23:30:00Z", "Europe/London")).toBe("2026-10-17");
    expect(localDateKey("2026-10-16T23:30:00Z", "America/New_York")).toBe("2026-10-16");
    expect(localDateKey("2026-10-17T03:59:59Z", "America/New_York")).toBe("2026-10-16");
    expect(() => localDateKey("2026-10-16T12:00:00Z", "Nowhere/Zone")).toThrow(RangeError);
  });

  it("checks real calendar dates and does day arithmetic across months and years", () => {
    expect(isDateKey("2026-10-16")).toBe(true);
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("16/10/2026")).toBe(false);
    expect(addDaysToDateKey("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDaysToDateKey("2026-03-01", -1)).toBe("2026-02-28");
    expect(mondayIndexOfDateKey("2026-10-12")).toBe(0);
    expect(mondayIndexOfDateKey("2026-10-18")).toBe(6);
  });
});

describe("the first instant of a local day", () => {
  it("is local midnight around New York's 02:00 changes", () => {
    expect(zonedStartOfDay("2026-03-08", "America/New_York")).toBe("2026-03-08T05:00:00.000Z");
    expect(zonedStartOfDay("2026-03-09", "America/New_York")).toBe("2026-03-09T04:00:00.000Z");
    expect(zonedStartOfDay("2026-11-01", "America/New_York")).toBe("2026-11-01T04:00:00.000Z");
    expect(zonedStartOfDay("2026-11-02", "America/New_York")).toBe("2026-11-02T05:00:00.000Z");
  });

  it("is local midnight around London's changes", () => {
    expect(zonedStartOfDay("2026-03-29", "Europe/London")).toBe("2026-03-29T00:00:00.000Z");
    expect(zonedStartOfDay("2026-03-30", "Europe/London")).toBe("2026-03-29T23:00:00.000Z");
    expect(zonedStartOfDay("2026-10-25", "Europe/London")).toBe("2026-10-24T23:00:00.000Z");
    expect(zonedStartOfDay("2026-10-26", "Europe/London")).toBe("2026-10-26T00:00:00.000Z");
  });

  it("is 01:00 on a Havana day that has no midnight, and the first of two midnights when one repeats", () => {
    expect(zonedStartOfDay("2026-03-07", "America/Havana")).toBe("2026-03-07T05:00:00.000Z");
    expect(zonedStartOfDay("2026-03-08", "America/Havana")).toBe("2026-03-08T05:00:00.000Z");
    expect(zonedStartOfDay("2026-03-09", "America/Havana")).toBe("2026-03-09T04:00:00.000Z");
    expect(zonedStartOfDay("2026-11-01", "America/Havana")).toBe("2026-11-01T04:00:00.000Z");
    expect(zonedStartOfDay("2026-11-02", "America/Havana")).toBe("2026-11-02T05:00:00.000Z");
    // The instant before each start belongs to the previous local day.
    expect(localDateKey(minus1ms("2026-03-08T05:00:00.000Z"), "America/Havana")).toBe("2026-03-07");
    expect(localDateKey(minus1ms("2026-11-01T04:00:00.000Z"), "America/Havana")).toBe("2026-10-31");
  });

  it("handles Santiago's midnight changes in both directions", () => {
    expect(zonedStartOfDay("2026-09-05", "America/Santiago")).toBe("2026-09-05T04:00:00.000Z");
    expect(zonedStartOfDay("2026-09-06", "America/Santiago")).toBe("2026-09-06T04:00:00.000Z");
    expect(zonedStartOfDay("2026-09-07", "America/Santiago")).toBe("2026-09-07T03:00:00.000Z");
    expect(zonedStartOfDay("2026-04-04", "America/Santiago")).toBe("2026-04-04T03:00:00.000Z");
    expect(zonedStartOfDay("2026-04-05", "America/Santiago")).toBe("2026-04-05T04:00:00.000Z");
  });
});

describe("calendar week: Monday 00:00 local to the next Monday 00:00, end excluded", () => {
  it("names the week and finds its Monday in the athlete's zone", () => {
    const week = calendarWeekInterval("2026-10-16T12:00:00Z", "Europe/London");
    expect(week).toEqual({ kind: "calendar_week", startAt: "2026-10-11T23:00:00.000Z", endAtExclusive: "2026-10-18T23:00:00.000Z", timezone: "Europe/London", planWeek: null, label: "This week · 12–18 Oct" });
  });

  it("puts Sunday 23:59:59.999 in this week and Monday 00:00 in the next", () => {
    const week = calendarWeekInterval("2026-10-14T12:00:00Z", "America/New_York");
    expect(week.startAt).toBe("2026-10-12T04:00:00.000Z");
    expect(week.endAtExclusive).toBe("2026-10-19T04:00:00.000Z");
    expect(intervalContains(week, "2026-10-12T04:00:00.000Z")).toBe(true);
    expect(intervalContains(week, minus1ms("2026-10-12T04:00:00.000Z"))).toBe(false);
    expect(intervalContains(week, minus1ms("2026-10-19T04:00:00.000Z"))).toBe(true);
    expect(intervalContains(week, "2026-10-19T04:00:00.000Z")).toBe(false);
  });

  it("depends on the zone when UTC and local disagree on the day", () => {
    // Sunday 19:30 in New York is Monday 00:30 in London.
    expect(calendarWeekInterval("2026-10-18T23:30:00Z", "America/New_York").label).toBe("This week · 12–18 Oct");
    expect(calendarWeekInterval("2026-10-18T23:30:00Z", "Europe/London").label).toBe("This week · 19–25 Oct");
  });

  it("is 167 hours across a spring change and 169 across an autumn one, with exact ends", () => {
    const nySpring = calendarWeekInterval("2026-03-08T12:00:00Z", "America/New_York");
    expect([nySpring.startAt, nySpring.endAtExclusive, span(nySpring)]).toEqual(["2026-03-02T05:00:00.000Z", "2026-03-09T04:00:00.000Z", 167]);
    const nyAutumn = calendarWeekInterval("2026-11-01T12:00:00Z", "America/New_York");
    expect([nyAutumn.startAt, nyAutumn.endAtExclusive, span(nyAutumn)]).toEqual(["2026-10-26T04:00:00.000Z", "2026-11-02T05:00:00.000Z", 169]);
    const londonSpring = calendarWeekInterval("2026-03-29T12:00:00Z", "Europe/London");
    expect([londonSpring.startAt, londonSpring.endAtExclusive, span(londonSpring)]).toEqual(["2026-03-23T00:00:00.000Z", "2026-03-29T23:00:00.000Z", 167]);
    const londonAutumn = calendarWeekInterval("2026-10-25T12:00:00Z", "Europe/London");
    expect([londonAutumn.startAt, londonAutumn.endAtExclusive, span(londonAutumn)]).toEqual(["2026-10-18T23:00:00.000Z", "2026-10-26T00:00:00.000Z", 169]);
    const havana = calendarWeekInterval("2026-03-08T12:00:00Z", "America/Havana");
    expect([havana.startAt, havana.endAtExclusive, span(havana)]).toEqual(["2026-03-02T05:00:00.000Z", "2026-03-09T04:00:00.000Z", 167]);
  });

  it("starts exactly at now when now is Monday 00:00 local", () => {
    expect(calendarWeekInterval("2026-10-12T04:00:00.000Z", "America/New_York").startAt).toBe("2026-10-12T04:00:00.000Z");
  });
});

describe("rolling 7 days and custom dates", () => {
  it("is exactly 168 hours back from now, even across a clock change", () => {
    const rolling = rolling7dInterval("2026-11-03T12:00:00.000Z", "America/New_York");
    expect(rolling).toEqual({ kind: "rolling_7d", startAt: "2026-10-27T12:00:00.000Z", endAtExclusive: "2026-11-03T12:00:00.000Z", timezone: "America/New_York", planWeek: null, label: "Rolling 7 days" });
    expect(intervalContains(rolling, "2026-10-27T12:00:00.000Z")).toBe(true);
    expect(intervalContains(rolling, "2026-11-03T12:00:00.000Z")).toBe(false);
  });

  it("includes both local dates, whatever their length", () => {
    const londonAutumn = customInterval("2026-10-24", "2026-10-25", "Europe/London");
    expect([londonAutumn.startAt, londonAutumn.endAtExclusive, span(londonAutumn), londonAutumn.label]).toEqual(["2026-10-23T23:00:00.000Z", "2026-10-26T00:00:00.000Z", 49, "24–25 Oct"]);
    const havanaShortDay = customInterval("2026-03-08", "2026-03-08", "America/Havana");
    expect([havanaShortDay.startAt, havanaShortDay.endAtExclusive, span(havanaShortDay), havanaShortDay.label]).toEqual(["2026-03-08T05:00:00.000Z", "2026-03-09T04:00:00.000Z", 23, "8 Mar"]);
    const santiagoLongDay = customInterval("2026-04-04", "2026-04-04", "America/Santiago");
    expect(span(santiagoLongDay)).toBe(25);
  });

  it("reads a reversed pair in date order and refuses impossible dates", () => {
    expect(customInterval("2026-10-18", "2026-10-05", "UTC")).toEqual(customInterval("2026-10-05", "2026-10-18", "UTC"));
    expect(() => customInterval("2026-02-30", "2026-03-02", "UTC")).toThrow(RangeError);
    expect(() => customInterval("2026-03-01", "2026-03-02", "Nowhere/Zone")).toThrow(RangeError);
  });

  it("labels ranges plainly", () => {
    expect(dateRangeLabel("2026-10-05", "2026-10-18")).toBe("5–18 Oct");
    expect(dateRangeLabel("2026-09-28", "2026-10-04")).toBe("28 Sep – 4 Oct");
    expect(dateRangeLabel("2026-12-29", "2027-01-03")).toBe("29 Dec 2026 – 3 Jan 2027");
  });
});

describe("plan week", () => {
  it("has no dates and says it is the plan as written", () => {
    expect(planWeekInterval(2, "Europe/London")).toEqual({ kind: "plan_week", startAt: null, endAtExclusive: null, timezone: "Europe/London", planWeek: 2, label: "Plan Week 2, as written" });
    expect(() => planWeekInterval(0)).toThrow(RangeError);
  });

  it("an open window never holds an instant that does not parse", () => {
    expect(intervalContains({ startAt: null, endAtExclusive: null }, "not a date")).toBe(false);
    expect(intervalContains({ startAt: null, endAtExclusive: null }, null)).toBe(false);
  });
});
