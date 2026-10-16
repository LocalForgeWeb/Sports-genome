import { isCompletedSet, isHoldSet, setWeightKg, type DeviceWorkoutSession } from "@/lib/deviceWorkoutLog";
import { formatLoad } from "@/lib/dropSets";
import type { Exercise } from "@/lib/exerciseCatalog";
import { kilogramsToDisplayWeight, type DisplayWeightUnit } from "@/lib/weightUnits";
import { loadConventionFor } from "@shared/loadConventions";
import { addDaysToDateKey, dateRangeLabel, isDateKey, localDateKey, mondayIndexOfDateKey } from "@shared/specialization/time";
import type { ArmSide, MeasurementMetric, SetMeasure, SpecializationRegionData } from "@shared/specialization/types";
import { holdSecondsOf, sideOf, variantLookup } from "./bouts";

/**
 * The Progress disclosure's arithmetic (brief §10, design §5), kept apart from the page so
 * each rule can be tested on its own:
 * - units: storage stays canonical (circumference in cm, grip force in newtons) and the
 *   athlete types and reads in the profile's units (inches and lb, or cm and kg);
 * - time: a reading's local date and time of day, in the page's zone, as one instant;
 * - the time axis every Progress chart shares, and what falls outside it;
 * - comparable exercise performance: one point per session for one catalog exercise, its
 *   top set (or longest hold) on one arm, matched by catalog id and never by name.
 */

// ---------------------------------------------------------------- units

/** One kilogram-force in newtons (the dynamometer's kg is a force, stored as N). */
export const NEWTONS_PER_KGF = 9.80665;
export const KG_PER_LB = 0.45359237;
export const CM_PER_INCH = 2.54;

export type LengthUnit = "cm" | "in";
/** What the athlete types and reads: inches and lb for an lb profile, cm and kg for a kg one. */
export type ProgressUnits = { length: LengthUnit; force: DisplayWeightUnit };

export function progressUnitsFor(weightUnit: DisplayWeightUnit): ProgressUnits {
  return weightUnit === "lb" ? { length: "in", force: "lb" } : { length: "cm", force: "kg" };
}

export const lengthToCm = (value: number, unit: LengthUnit) => (unit === "in" ? value * CM_PER_INCH : value);
export const cmToLength = (cm: number, unit: LengthUnit) => (unit === "in" ? cm / CM_PER_INCH : cm);
/** A dynamometer reading in kg or lb (force) as newtons. */
export const gripToNewtons = (value: number, unit: DisplayWeightUnit) => (unit === "lb" ? value * KG_PER_LB : value) * NEWTONS_PER_KGF;
export const newtonsToGrip = (newtons: number, unit: DisplayWeightUnit) => (unit === "lb" ? newtons / NEWTONS_PER_KGF / KG_PER_LB : newtons / NEWTONS_PER_KGF);

/** A value typed in the athlete's unit, as stored (cm, or N). */
export function toStoredValue(metric: MeasurementMetric, typed: number, units: ProgressUnits): number {
  return metric === "grip_force_n" ? gripToNewtons(typed, units.force) : lengthToCm(typed, units.length);
}

/** A stored value (cm, or N) in the athlete's unit. */
export function toShownValue(metric: MeasurementMetric, stored: number, units: ProgressUnits): number {
  return metric === "grip_force_n" ? newtonsToGrip(stored, units.force) : cmToLength(stored, units.length);
}

export const unitOf = (metric: MeasurementMetric, units: ProgressUnits): string => (metric === "grip_force_n" ? units.force : units.length);
const oneDecimal = (value: number) => (Math.round(value * 10) / 10).toFixed(1);

/** "12.5 in around" or "45.0 kg on a dynamometer". */
export function formatReading(metric: MeasurementMetric, stored: number, units: ProgressUnits): string {
  const shown = `${oneDecimal(toShownValue(metric, stored, units))} ${unitOf(metric, units)}`;
  return metric === "grip_force_n" ? `${shown} on a dynamometer` : `${shown} around`;
}

/** A chart's own scale: "12.1 to 12.5 in", or one value when every reading is the same. */
export function formatScale(metric: MeasurementMetric, low: number, high: number, units: ProgressUnits): string {
  const unit = unitOf(metric, units);
  const from = oneDecimal(toShownValue(metric, low, units));
  const to = oneDecimal(toShownValue(metric, high, units));
  return from === to ? `${from} ${unit}` : `${from} to ${to} ${unit}`;
}

/** A length in the athlete's unit, for the landmark distance: "2 in", "5.5 cm". */
export function formatLength(cm: number, unit: LengthUnit): string {
  return `${formatLoad(cmToLength(cm, unit))} ${unit}`;
}

// ---------------------------------------------------------------- local date and time

const TIME_OF_DAY = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const isTimeOfDay = (value: unknown): value is string => typeof value === "string" && TIME_OF_DAY.test(value);

const formatters = new Map<string, Intl.DateTimeFormat>();
function wallParts(instantMs: number, timeZone: string) {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", numberingSystem: "latn" });
    formatters.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(new Date(instantMs));
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? Number.NaN);
  return { year: read("year"), month: read("month"), day: read("day"), hour: read("hour") % 24, minute: read("minute"), second: read("second") };
}
const pad = (value: number) => String(value).padStart(2, "0");

/** The local date and HH:MM of an instant in a zone. */
export function wallClockAt(instantMs: number, timeZone: string): { dateKey: string; time: string } {
  const wall = wallParts(instantMs, timeZone);
  return { dateKey: `${String(wall.year).padStart(4, "0")}-${pad(wall.month)}-${pad(wall.day)}`, time: `${pad(wall.hour)}:${pad(wall.minute)}` };
}

/**
 * The instant a local date and time of day name in a zone, as ISO; null when either is not
 * one. A time the clocks skip (02:30 on a spring-forward night) lands just after the gap; a
 * time that happens twice (01:30 on a fall-back night) is the first of the two.
 */
export function zonedDateTimeToIso(dateKey: string, time: string, timeZone: string): string | null {
  if (!isDateKey(dateKey) || !isTimeOfDay(time)) return null;
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  const offsetAt = (instantMs: number) => {
    const parts = wallParts(instantMs, timeZone);
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - Math.floor(instantMs / 1000) * 1000;
  };
  const matches = (instantMs: number) => { const at = wallClockAt(instantMs, timeZone); return at.dateKey === dateKey && at.time === time; };
  // The instant lies within 14 h of the wall time read as UTC (offsets run from -12 h to +14 h),
  // so the offsets a day either side are the ones in force before and after any change near it
  // (New Zealand and Chatham sit at +12 h and beyond, where half a day is not far enough).
  // The earlier instant that reads as the wall time wins.
  const before = offsetAt(wall - 24 * 3_600_000);
  const candidates = [wall - before, wall - offsetAt(wall + 24 * 3_600_000), wall - offsetAt(wall)].sort((a, b) => a - b);
  const exact = candidates.find(matches);
  if (exact !== undefined) return new Date(exact).toISOString();
  // In a gap: the wall time plus the offset in force before it (02:30 → 03:30 after spring forward).
  return new Date(wall - before).toISOString();
}

/** "13 Oct" or "13 Oct 2026". */
export function dayLabel(dateKey: string, withYear = false): string {
  return withYear ? `${dateRangeLabel(dateKey, dateKey)} ${dateKey.slice(0, 4)}` : dateRangeLabel(dateKey, dateKey);
}

// ---------------------------------------------------------------- the shared time axis

export const PROGRESS_WEEKS = 8;

/** Calendar weeks, Monday to Sunday, ending with the week holding today. */
export type ProgressAxis = { firstMonday: string; endKeyExclusive: string; weeks: number; days: number; label: string };

export function progressAxis(todayKey: string, weeks = PROGRESS_WEEKS): ProgressAxis {
  const thisMonday = addDaysToDateKey(todayKey, -mondayIndexOfDateKey(todayKey));
  const firstMonday = addDaysToDateKey(thisMonday, -7 * (weeks - 1));
  const endKeyExclusive = addDaysToDateKey(thisMonday, 7);
  return { firstMonday, endKeyExclusive, weeks, days: weeks * 7, label: dateRangeLabel(firstMonday, addDaysToDateKey(endKeyExclusive, -1)) };
}

/** Whole days from the axis's first Monday to a local date (negative before it). */
export function dayOnAxis(dateKey: string, axis: Pick<ProgressAxis, "firstMonday">): number {
  return Math.round((Date.parse(`${dateKey}T00:00:00Z`) - Date.parse(`${axis.firstMonday}T00:00:00Z`)) / 86_400_000);
}

/** What the axis can draw, and how many fall before it (older) or after it (dated later than this week). */
export function splitByAxis<T>(items: readonly T[], dateKeyOf: (item: T) => string, axis: Pick<ProgressAxis, "firstMonday" | "endKeyExclusive">): { inside: T[]; older: number; later: number } {
  const inside: T[] = [];
  let older = 0;
  let later = 0;
  for (const item of items) {
    const key = dateKeyOf(item);
    if (key < axis.firstMonday) older += 1;
    else if (key >= axis.endKeyExclusive) later += 1;
    else inside.push(item);
  }
  return { inside, older, later };
}

/** A chart's own vertical scale from the values it draws: low at the bottom, high at the top, one value in the middle. */
export function valueScale(values: readonly number[], top = 14, bottom = 70): { low: number; high: number; y: (value: number) => number } | null {
  if (!values.length) return null;
  const low = Math.min(...values);
  const high = Math.max(...values);
  const span = high - low;
  return { low, high, y: (value) => (span === 0 ? (top + bottom) / 2 : bottom - ((value - low) / span) * (bottom - top)) };
}

// ---------------------------------------------------------------- comparable exercise performance

export type PerformanceMetric = "load" | "reps" | "seconds";

export type PerformancePoint = {
  sessionId: string;
  /** When the workout was finished (else started), as the exposure counts it. */
  performedAt: string;
  dateKey: string;
  /** The top set's load in the profile's unit; null when no load was entered. */
  load: number | null;
  reps: number | null;
  seconds: number | null;
  /** The set recorded no arm and the exercise is not two-handed: kept, and marked. */
  sideUnrecorded: boolean;
};

export type PerformanceSeries = {
  /** Catalog id, plus ":straps" for sessions logged with straps (a different grip). */
  key: string;
  catalogExerciseId: number;
  name: string;
  straps: boolean;
  measure: SetMeasure;
  /**
   * Over all of its sessions: the top set's load, its reps when no session has a load, or seconds
   * held. The chart reads chartPerformance's metric instead, which looks only inside the axis.
   */
  metric: PerformanceMetric;
  /** One per session, oldest first. */
  points: PerformancePoint[];
};

/**
 * Catalog exercises whose variant has a reviewed, direct mapping (current mapping version) to
 * a node of this region, an external contributor (biceps on a curl) not counting. The variant
 * is the one the exposure reads for that catalog id.
 */
export function directlyMappedCatalogIds(data: SpecializationRegionData): Set<number> {
  const regionNodes = new Set(data.nodes.filter((node) => node.regionId === data.region.id).map((node) => node.id));
  const directVariants = new Set(
    data.mappings
      .filter((mapping) => mapping.versionKey === data.mappingVersion.key && mapping.reviewStatus === "reviewed" && mapping.relationship === "direct" && regionNodes.has(mapping.nodeId))
      .map((mapping) => mapping.variantId),
  );
  const variantOf = variantLookup(data.variants);
  return new Set(data.variants.map((variant) => variant.catalogExerciseId).filter((id) => directVariants.has(variantOf(id)?.id ?? "")));
}

const countOf = (value: string | undefined): number | null => {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

type Candidate = { loadKg: number | null; reps: number | null; seconds: number | null; sideUnrecorded: boolean };

/** Heaviest, then most reps (or longest, then heaviest, for holds); a set with its arm recorded before one without. */
function better(measure: SetMeasure, a: Candidate, b: Candidate): boolean {
  const first = measure === "seconds" ? [(a.seconds ?? 0) - (b.seconds ?? 0), (a.loadKg ?? 0) - (b.loadKg ?? 0)] : [(a.loadKg ?? 0) - (b.loadKg ?? 0), (a.reps ?? 0) - (b.reps ?? 0)];
  for (const difference of first) if (difference !== 0) return difference > 0;
  return !a.sideUnrecorded && b.sideUnrecorded;
}

/**
 * Every directly mapped exercise in the finished workouts, as one point per session on one
 * arm: the top set (heaviest load, then most reps; a drop set reads its first stage), or the
 * longest hold for an exercise measured in seconds. Completed sets only. A set logged for the
 * other arm is left out; one done with both arms counts for either; one with no arm recorded
 * is kept and marked, never guessed onto an arm. Exercises are matched by catalog id only.
 */
export function performanceSeries(sessions: readonly DeviceWorkoutSession[], input: { data: SpecializationRegionData; side: ArmSide; weightUnit: DisplayWeightUnit; timeZone: string; catalog?: readonly Pick<Exercise, "id" | "name">[] }): PerformanceSeries[] {
  const { data, side, weightUnit, timeZone } = input;
  const mapped = directlyMappedCatalogIds(data);
  const variantOf = variantLookup(data.variants);
  const names = new Map((input.catalog ?? []).map((exercise) => [exercise.id, exercise.name] as const));
  const byKey = new Map<string, PerformanceSeries & { best: Map<string, Candidate> }>();
  for (const session of sessions) {
    if (session.status !== "completed") continue;
    const performedAt = session.completedAt ?? session.startedAt;
    if (typeof performedAt !== "string" || !Number.isFinite(Date.parse(performedAt))) continue;
    for (const exercise of session.exercises) {
      const id = exercise.catalogId;
      if (typeof id !== "number" || !mapped.has(id)) continue;
      const variant = variantOf(id);
      const measure: SetMeasure = variant?.measure ?? "reps";
      let top: Candidate | null = null;
      for (const set of exercise.sets) {
        // Completed work only: a skipped, unlogged or warm-up set is not a top set.
        if (!isCompletedSet(set) || set.warmup === true) continue;
        const arm = sideOf(set, variant).side;
        if (arm !== side && arm !== "bilateral" && arm !== "unknown") continue;
        const candidate: Candidate = { loadKg: setWeightKg(set, session, weightUnit) ?? null, reps: null, seconds: null, sideUnrecorded: arm === "unknown" };
        if (measure === "seconds") {
          candidate.seconds = holdSecondsOf(set);
          if (candidate.seconds === null) continue;
        } else {
          if (isHoldSet(set)) continue;
          candidate.reps = countOf(set.reps);
          if (candidate.reps === null) continue;
        }
        if (!top || better(measure, candidate, top)) top = candidate;
      }
      if (!top) continue;
      const straps = exercise.straps === "yes";
      const key = `${id}${straps ? ":straps" : ""}`;
      let series = byKey.get(key);
      if (!series) {
        series = { key, catalogExerciseId: id, name: names.get(id) ?? variant?.catalogName ?? exercise.exerciseName, straps, measure, metric: measure === "seconds" ? "seconds" : "reps", points: [], best: new Map() };
        byKey.set(key, series);
      }
      // The same exercise twice in one workout is still one session: its better top set.
      const earlier = series.best.get(session.id);
      if (earlier && !better(measure, top, earlier)) continue;
      series.best.set(session.id, top);
      series.points = series.points.filter((point) => point.sessionId !== session.id);
      series.points.push({
        sessionId: session.id,
        performedAt,
        dateKey: localDateKey(performedAt, timeZone),
        load: top.loadKg === null ? null : kilogramsToDisplayWeight(top.loadKg, weightUnit),
        reps: top.reps,
        seconds: top.seconds,
        sideUnrecorded: top.sideUnrecorded,
      });
    }
  }
  return Array.from(byKey.values()).map(({ best: _best, ...series }) => {
    const points = [...series.points].sort((a, b) => Date.parse(a.performedAt) - Date.parse(b.performedAt) || (a.sessionId < b.sessionId ? -1 : 1));
    const metric: PerformanceMetric = series.measure === "seconds" ? "seconds" : points.some((point) => point.load !== null) ? "load" : "reps";
    return { ...series, metric, points };
  });
}

/** One exercise's chart inside the axis: what it draws, what its y axis reads, and what it leaves out. */
export type ChartedPerformance = {
  series: PerformanceSeries;
  metric: PerformanceMetric;
  /** The sessions drawn, oldest first. */
  inside: PerformancePoint[];
  older: number;
  later: number;
  /** Sessions inside the axis left off a load line because their top set had no load entered. */
  noLoad: number;
};

/**
 * What one exercise's chart draws inside the axis. The y axis reads seconds for a hold; else the
 * top set's load once two sessions or more in the window have one, and reps otherwise. On a load
 * line a session with no load entered is left out and counted, never drawn at zero (a drop that
 * did not happen); for a bodyweight exercise an empty load is the body alone (+0) and is drawn.
 */
export function chartPerformance(series: PerformanceSeries, axis: Pick<ProgressAxis, "firstMonday" | "endKeyExclusive">): ChartedPerformance {
  const { inside, older, later } = splitByAxis(series.points, (point) => point.dateKey, axis);
  if (series.measure === "seconds") return { series, metric: "seconds", inside, older, later, noLoad: 0 };
  const loaded = inside.filter((point) => point.load !== null);
  if (loadConventionFor(series.catalogExerciseId) === "bodyweight_reps") return { series, metric: loaded.length ? "load" : "reps", inside, older, later, noLoad: 0 };
  if (loaded.length >= 2) return { series, metric: "load", inside: loaded, older, later, noLoad: inside.length - loaded.length };
  return { series, metric: "reps", inside, older, later, noLoad: 0 };
}

/** The number a performance point puts on its chart's y axis. */
export function performanceValue(point: PerformancePoint, metric: PerformanceMetric): number {
  if (metric === "seconds") return point.seconds ?? 0;
  if (metric === "reps") return point.reps ?? 0;
  return point.load ?? 0;
}

/** "35 lb × 10", "+10 kg × 8", "12 reps", "45 s with 24 kg". */
export function formatPerformance(point: PerformancePoint, series: Pick<PerformanceSeries, "catalogExerciseId" | "measure">, weightUnit: DisplayWeightUnit): string {
  const added = loadConventionFor(series.catalogExerciseId) === "bodyweight_reps";
  const load = point.load === null ? null : `${added ? "+" : ""}${formatLoad(point.load)} ${weightUnit}`;
  if (series.measure === "seconds") return `${formatLoad(point.seconds ?? 0)} s${load ? ` with ${load}` : ""}`;
  if (load) return `${load} × ${point.reps ?? 0}`;
  return `${point.reps ?? 0} reps${added ? ", bodyweight" : ""}`;
}

/** The y scale's words: "30 to 35 lb", "8 to 12 reps", "40 to 60 s". */
export function formatPerformanceScale(low: number, high: number, metric: PerformanceMetric, weightUnit: DisplayWeightUnit): string {
  const unit = metric === "load" ? weightUnit : metric === "reps" ? "reps" : "s";
  return low === high ? `${formatLoad(low)} ${unit}` : `${formatLoad(low)} to ${formatLoad(high)} ${unit}`;
}
