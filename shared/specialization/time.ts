import type { SummaryInterval } from "./types";

/**
 * Time windows for specialization exposure, in a named IANA zone (design §4).
 *
 * Completed work belongs to a calendar week (Monday 00:00 to the next Monday 00:00), a
 * rolling 7 days, or a custom run of local dates. All three are written as half-open
 * instant ranges [startAt, endAtExclusive), so a set logged at 23:59:59 on Sunday is in
 * this week and one at 00:00:00 on Monday is in the next, whatever the zone does to its
 * clocks that night. Planned work has no dates at all; its window is a plan week, named
 * as such.
 *
 * Only `Intl` is used, so the same code runs in the browser, in Node and in tests without
 * a time-zone library. Local midnight is FOUND rather than assumed: in a zone that changes
 * its clocks at midnight (Havana, Santiago) some dates have no 00:00, and the day then
 * starts at 01:00. "Midnight minus the offset" would put that day's first hour in the
 * previous day.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

// Building a formatter is far slower than using one, and a summary asks the same zone many times.
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      numberingSystem: "latn",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** True for a zone `Intl` knows ("Europe/London", "UTC"); false for "", "Mars/Olympus" or a non-string. */
export function isValidTimeZone(timeZone: unknown): timeZone is string {
  if (typeof timeZone !== "string" || !timeZone.trim()) return false;
  try {
    formatterFor(timeZone);
    return true;
  } catch {
    return false;
  }
}

function assertZone(timeZone: string): void {
  if (!isValidTimeZone(timeZone)) throw new RangeError(`Unknown time zone: ${String(timeZone)}`);
}

type WallParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function wallPartsAt(instantMs: number, timeZone: string): WallParts {
  const parts = formatterFor(timeZone).formatToParts(new Date(instantMs));
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? Number.NaN);
  // Some engines still print midnight as hour 24 under h23; it is the same instant.
  const hour = read("hour") % 24;
  return { year: read("year"), month: read("month"), day: read("day"), hour, minute: read("minute"), second: read("second") };
}

const pad = (value: number, width = 2) => String(value).padStart(width, "0");
const keyOf = (parts: Pick<WallParts, "year" | "month" | "day">) => `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}`;

/** The zone's offset from UTC at an instant, in ms (positive east of Greenwich). */
function offsetMsAt(instantMs: number, timeZone: string): number {
  const wall = wallPartsAt(instantMs, timeZone);
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  return asUtc - Math.floor(instantMs / 1000) * 1000;
}

function parseInstant(iso: string): number {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) throw new RangeError(`Not an ISO instant: ${String(iso)}`);
  return ms;
}

/** "2026-10-16" is a real calendar date; "2026-02-30" and "16/10/2026" are not. */
export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = DATE_KEY.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function assertDateKey(value: string): [number, number, number] {
  if (!isDateKey(value)) throw new RangeError(`Not a local date (YYYY-MM-DD): ${String(value)}`);
  const [, y, m, d] = DATE_KEY.exec(value)!.map(Number);
  return [y, m, d];
}

/** The local calendar date of an instant in a zone, as YYYY-MM-DD. */
export function localDateKey(isoInstant: string, timeZone: string): string {
  assertZone(timeZone);
  return keyOf(wallPartsAt(parseInstant(isoInstant), timeZone));
}

function localKeyAtMs(instantMs: number, timeZone: string): string {
  return keyOf(wallPartsAt(instantMs, timeZone));
}

/** Pure calendar arithmetic on a local date: no zone, no clock changes. */
export function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = assertDateKey(dateKey);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return keyOf({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() });
}

/** 0 = Monday … 6 = Sunday, the week the app counts in. */
export function mondayIndexOfDateKey(dateKey: string): number {
  const [y, m, d] = assertDateKey(dateKey);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

/**
 * The first instant of a local date in a zone, as an ISO instant.
 *
 * Usually local midnight. When the zone skips midnight that day (a spring-forward at
 * 00:00), the day starts at the first wall time that exists, 01:00. When it repeats an
 * hour after midnight (a fall-back at 01:00), the day starts at the FIRST 00:00.
 */
export function zonedStartOfDay(dateKey: string, timeZone: string): string {
  assertZone(timeZone);
  return new Date(startOfLocalDateMs(dateKey, timeZone)).toISOString();
}

function startOfLocalDateMs(dateKey: string, timeZone: string): number {
  const [y, m, d] = assertDateKey(dateKey);
  const wall = Date.UTC(y, m - 1, d);
  const isStart = (instantMs: number) => localKeyAtMs(instantMs, timeZone) === dateKey && localKeyAtMs(instantMs - 1, timeZone) < dateKey;
  // Fast path: midnight minus the offset in force at (about) midnight, refined once.
  const first = wall - offsetMsAt(wall, timeZone);
  const refined = wall - offsetMsAt(first, timeZone);
  if (isStart(refined)) return refined;
  if (isStart(first)) return first;
  // A transition at midnight: search for the first instant whose local date is this one.
  // Offsets lie within -12h..+14h, so the start is inside ±16h of the wall-clock guess.
  let low = wall - 16 * HOUR; // local date before dateKey
  let high = wall + 16 * HOUR; // local date at or after dateKey
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (localKeyAtMs(mid, timeZone) >= dateKey) high = mid;
    else low = mid;
  }
  return high;
}

// ---------------------------------------------------------------- labels

function dayMonth(dateKey: string, withYear: boolean): string {
  const [y, m, d] = assertDateKey(dateKey);
  return `${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ""}`;
}

/** "12–18 Oct", "28 Sep – 4 Oct", "29 Dec 2025 – 4 Jan 2026", or "8 Mar" for one day. */
export function dateRangeLabel(fromKey: string, toKey: string): string {
  const [fy, fm, fd] = assertDateKey(fromKey);
  const [ty, tm] = assertDateKey(toKey);
  if (fromKey === toKey) return dayMonth(fromKey, false);
  if (fy !== ty) return `${dayMonth(fromKey, true)} – ${dayMonth(toKey, true)}`;
  if (fm !== tm) return `${dayMonth(fromKey, false)} – ${dayMonth(toKey, false)}`;
  return `${fd}–${dayMonth(toKey, false)}`;
}

// ---------------------------------------------------------------- intervals

/** Monday 00:00 local of the week holding `nowIso`, to the next Monday 00:00 local (exclusive). */
export function calendarWeekInterval(nowIso: string, timeZone: string): SummaryInterval {
  const today = localDateKey(nowIso, timeZone);
  const monday = addDaysToDateKey(today, -mondayIndexOfDateKey(today));
  const nextMonday = addDaysToDateKey(monday, 7);
  return {
    kind: "calendar_week",
    startAt: zonedStartOfDay(monday, timeZone),
    endAtExclusive: zonedStartOfDay(nextMonday, timeZone),
    timezone: timeZone,
    planWeek: null,
    label: `This week · ${dateRangeLabel(monday, addDaysToDateKey(monday, 6))}`,
  };
}

/** Exactly 7 × 24 hours back from now, to now (exclusive). Clock changes do not stretch it. */
export function rolling7dInterval(nowIso: string, timeZone: string): SummaryInterval {
  assertZone(timeZone);
  const now = parseInstant(nowIso);
  return {
    kind: "rolling_7d",
    startAt: new Date(now - 7 * DAY).toISOString(),
    endAtExclusive: new Date(now).toISOString(),
    timezone: timeZone,
    planWeek: null,
    label: "Rolling 7 days",
  };
}

/** Two local dates, both included. A reversed pair is read in date order. */
export function customInterval(fromDateKey: string, toDateKey: string, timeZone: string): SummaryInterval {
  assertZone(timeZone);
  assertDateKey(fromDateKey);
  assertDateKey(toDateKey);
  const [from, to] = fromDateKey <= toDateKey ? [fromDateKey, toDateKey] : [toDateKey, fromDateKey];
  return {
    kind: "custom",
    startAt: zonedStartOfDay(from, timeZone),
    endAtExclusive: zonedStartOfDay(addDaysToDateKey(to, 1), timeZone),
    timezone: timeZone,
    planWeek: null,
    label: dateRangeLabel(from, to),
  };
}

/** A plan week. The plan carries no dates, so the window has none and says so. */
export function planWeekInterval(week: number, timeZone = "UTC"): SummaryInterval {
  assertZone(timeZone);
  if (!Number.isInteger(week) || week < 1) throw new RangeError(`Not a plan week: ${String(week)}`);
  return { kind: "plan_week", startAt: null, endAtExclusive: null, timezone: timeZone, planWeek: week, label: `Plan Week ${week}, as written` };
}

/**
 * Whether an instant falls in a window: start included, end excluded. A missing bound is
 * open on that side; an unparseable instant is never inside.
 */
export function intervalContains(interval: Pick<SummaryInterval, "startAt" | "endAtExclusive">, isoInstant: string | null): boolean {
  if (!isoInstant) return false;
  const at = Date.parse(isoInstant);
  if (!Number.isFinite(at)) return false;
  if (interval.startAt !== null && at < Date.parse(interval.startAt)) return false;
  if (interval.endAtExclusive !== null && at >= Date.parse(interval.endAtExclusive)) return false;
  return true;
}
