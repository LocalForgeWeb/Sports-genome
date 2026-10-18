import { useEffect, useId, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { boutsFromSessions } from "@/lib/specialization/bouts";
import {
  chartPerformance, dayLabel, dayOnAxis, formatLength, formatPerformance, formatPerformanceScale, formatReading, formatScale, isTimeOfDay, latestReading, lengthToCm,
  performanceBest, performanceBestLabel, performanceSeries, performanceValue, progressAxis, progressUnitsFor, protocolChanges, readingBest, sameProtocol, splitByAxis,
  toStoredValue, typedLength, valueScale, wallClockAt, zonedDateTimeToIso,
  type ChartedPerformance, type PerformancePoint, type ProgressAxis, type ProgressUnits,
} from "@/lib/specialization/progressSeries";
import type { StoreWrite } from "@/lib/specialization/stores";
import { catalogMusclesLookup, useDeviceWorkoutSessions } from "@/lib/specialization/useSpecializationSummary";
import type { DisplayWeightUnit } from "@/lib/weightUnits";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { addDaysToDateKey, calendarWeekInterval, dateRangeLabel, intervalContains, isDateKey, localDateKey, zonedStartOfDay } from "@shared/specialization/time";
import type { ArmSide, MeasurementMetric, MeasurementProtocol, RegionBoutRow, SpecializationMeasurement, SpecializationRegionData } from "@shared/specialization/types";
import { BoutListSheet } from "./BoutListSheet";
import { regionBoutRows } from "./model";
import { revealClearOfBars } from "./reveal";
import "./progress.css";

const postureLabels: Record<MeasurementProtocol["posture"], string> = {
  arm_relaxed_hanging: "Arm relaxed, hanging",
  arm_extended_supported: "Arm straight, supported",
  elbow_90_supported: "Elbow at 90°, supported",
  other: "Other",
};
const conditionLabels: Record<MeasurementProtocol["condition"], string> = { unpumped: "Before training (unpumped)", pumped: "After training (pumped)", unknown: "Not noted" };

/**
 * What each measure is called and where a first reading of it starts: the usual place and
 * posture for that measure, and the instrument. After that, a new reading starts from the last
 * one of the same measure on the same arm (a repeatable protocol, brief §10). The athlete can
 * change the place and posture; a change of measure puts them back to that measure's own (its
 * last reading's, or these), so a grip posture never carries over to a tape. Which measures a
 * page offers is the region's (`measurementMetrics`), never this list.
 */
const metricDefaults: Record<MeasurementMetric, { button: string; landmark: string; posture: MeasurementProtocol["posture"]; instrument: string }> = {
  circumference_cm: { button: "Circumference", landmark: "Thickest point", posture: "arm_relaxed_hanging", instrument: "Tape" },
  grip_force_n: { button: "Grip strength", landmark: "Dynamometer grip", posture: "elbow_90_supported", instrument: "Dynamometer" },
};

let measurementSequence = 0;
const newMeasurementId = () => `measure-${Date.now().toString(36)}-${(measurementSequence += 1).toString(36)}`;
const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

// Every Progress chart is drawn in the same box on the same axis, so a week sits at the same x in each.
const CHART_WIDTH = 320;
const CHART_HEIGHT = 80;
const BASELINE = 72;

function axisGeometry(axis: ProgressAxis) {
  const xOfDay = (day: number) => 8 + (day / axis.days) * (CHART_WIDTH - 16);
  return { xOfDay, xOfKey: (dateKey: string) => xOfDay(dayOnAxis(dateKey, axis) + 0.5), weekWidth: (CHART_WIDTH - 16) / axis.weeks };
}

/** The shared baseline with a tick at each Monday, identical in every chart. */
function TimeAxis({ axis }: { axis: ProgressAxis }) {
  const { xOfDay } = axisGeometry(axis);
  return <g aria-hidden="true">
    <line x1="0" x2={CHART_WIDTH} y1={BASELINE} y2={BASELINE} className="spz-chart-axis" />
    {Array.from({ length: axis.weeks + 1 }, (_, week) => <line key={week} x1={xOfDay(week * 7)} x2={xOfDay(week * 7)} y1={BASELINE} y2={BASELINE + 4} className="spz-chart-axis" />)}
  </g>;
}

/** "1 older reading is not shown. 2 readings are dated after this week and not shown." */
function notShown(older: number, later: number, singular: string, pluralWord: string): string {
  const noun = (count: number) => (count === 1 ? `${singular} is` : `${pluralWord} are`);
  return [
    older ? `${older} older ${noun(older)} not shown.` : "",
    later ? `${later} ${noun(later)} dated after this week and not shown.` : "",
  ].filter(Boolean).join(" ");
}

type Dated<T> = { item: T; dateKey: string };

/**
 * One measure's chart: only what falls inside the axis is drawn, and the scale is read from that.
 * A reading taken at a different place or posture from the one before it is a diamond, not a
 * dot, and the scale line says how many there are, so a moved tape never reads as a change on
 * one line. For grip, a measure of performance, the reading that beats every earlier one taken
 * the same way is ringed and said in one line; circumference has no best (a tape takes in every
 * tissue under it, so a larger reading is not a performance).
 */
function ReadingChart({ metric, entries, axis, units, side }: { metric: MeasurementMetric; entries: readonly Dated<SpecializationMeasurement>[]; axis: ProgressAxis; units: ProgressUnits; side: ArmSide }) {
  const { inside, older, later } = splitByAxis(entries, (entry) => entry.dateKey, axis);
  const scale = valueScale(inside.map(({ item }) => item.value));
  const { xOfKey } = axisGeometry(axis);
  const grip = metric === "grip_force_n";
  const title = grip ? `Grip strength on a dynamometer (${units.force}; its own measure, not exercise load)` : `Circumference (${units.length})`;
  const noun = grip ? "grip reading" : "circumference reading";
  const outside = notShown(older, later, "reading", "readings");
  // Any reading taken pumped is drawn hollow, grip as well as circumference, so the key goes with it.
  const pumped = inside.some(({ item }) => item.protocol.condition === "pumped");
  const readings = entries.map(({ item }) => item);
  const changed = protocolChanges(readings);
  const moved = inside.filter(({ item }) => changed.has(item.id)).length;
  const movedText = moved ? `${plural(moved, "diamond")}: ${moved === 1 ? "a reading" : "readings"} at a different place or posture than the one before` : "";
  const best = readingBest(readings);
  const bestDrawn = best ? inside.find(({ item }) => item.id === best.id) ?? null : null;
  // Said with its protocol only when some reading was taken another way, so the claim is never wider than its series.
  const bestText = bestDrawn ? `Highest grip reading so far${readings.some((item) => !sameProtocol(item.protocol, bestDrawn.item.protocol)) ? " at this place, posture and condition" : ""}: ${formatReading(metric, bestDrawn.item.value, units)}, ${dayLabel(bestDrawn.dateKey)}` : "";
  return <figure className="spz-chart">
    <figcaption>{title}</figcaption>
    {scale ? <>
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={`${inside.length} ${inside.length === 1 ? noun : `${noun}s`} on the ${side} arm in these ${axis.weeks} weeks, ${formatScale(metric, scale.low, scale.high, units)}.${moved ? ` ${moved} taken at a different place or posture than the one before.` : ""}${bestText ? ` ${bestText}.` : ""}${outside ? ` ${outside}` : ""}`}>
        <TimeAxis axis={axis} />
        {inside.map(({ item, dateKey }) => {
          const x = xOfKey(dateKey);
          const y = scale.y(item.value);
          return changed.has(item.id)
            ? <polygon key={item.id} points={`${x},${y - 5.5} ${x + 5.5},${y} ${x},${y + 5.5} ${x - 5.5},${y}`} className="spz-chart-dot" data-condition={item.protocol.condition} data-protocol="changed" />
            : <circle key={item.id} cx={x} cy={y} r="4" className="spz-chart-dot" data-condition={item.protocol.condition} />;
        })}
        {bestDrawn && <circle cx={xOfKey(bestDrawn.dateKey)} cy={scale.y(bestDrawn.item.value)} r="8" className="spz-chart-best" data-best="" />}
      </svg>
      <p className="spz-chart-scale">Scale {formatScale(metric, scale.low, scale.high, units)}{pumped ? " · open dots were pumped" : ""}{movedText ? ` · ${movedText}` : ""}</p>
      {bestText && <p className="spz-chart-best-line">{bestText} (ringed)</p>}
    </> : <p className="spz-note">No {grip ? "grip" : "circumference"} readings for the {side} arm in these {axis.weeks} weeks.</p>}
    {outside && <p className="spz-chart-scale">{outside}</p>}
  </figure>;
}

/**
 * One exercise's top set (or longest hold) per session, on the same axis, with its own scale.
 * The session whose top set or longest hold beats every earlier session of the same exercise
 * (its whole history, not only these weeks) is ringed and said in one line ("Longest hold so
 * far: 80 s, 14 Oct"): a fact about the records, never a claim about the muscle.
 */
function PerformanceChart({ option, axis, side, weightUnit }: { option: ChartedPerformance; axis: ProgressAxis; side: ArmSide; weightUnit: DisplayWeightUnit }) {
  const { series, metric, inside, older, later, noLoad } = option;
  const { xOfKey } = axisGeometry(axis);
  const scale = valueScale(inside.map((point) => performanceValue(point, metric)))!;
  const points = inside.map((point) => ({ point, x: xOfKey(point.dateKey), y: scale.y(performanceValue(point, metric)) }));
  const first = inside[0];
  const last = inside[inside.length - 1];
  const name = `${series.name}${series.straps ? ", with straps" : ""}`;
  const what = series.measure === "seconds" ? "longest hold" : "top set";
  const text = (point: PerformancePoint) => formatPerformance(point, series, weightUnit);
  const unrecorded = inside.some((point) => point.sideUnrecorded);
  const outside = notShown(older, later, "session", "sessions");
  const best = performanceBest(series, metric);
  const bestDrawn = best ? points.find(({ point }) => point.sessionId === best.sessionId) ?? null : null;
  const bestLabel = performanceBestLabel(metric);
  const bestText = bestDrawn ? `${bestLabel}: ${text(bestDrawn.point)}, ${dayLabel(bestDrawn.point.dateKey)}${bestDrawn.point.sideUnrecorded ? ", no arm recorded" : ""}` : "";
  return <figure className="spz-chart">
    <figcaption>{name}: {what} each session, {side} arm</figcaption>
    <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={`${name}, ${what} each session on the ${side} arm: ${inside.length} sessions from ${dayLabel(first.dateKey)} to ${dayLabel(last.dateKey)}, first ${text(first)}, latest ${text(last)}.${bestText ? ` ${bestText}.` : ""}`}>
      <TimeAxis axis={axis} />
      <polyline points={points.map(({ x, y }) => `${x},${y}`).join(" ")} className="spz-progress-line" />
      {points.map(({ point, x, y }) => point.sideUnrecorded
        ? <rect key={point.sessionId} x={x - 4} y={y - 4} width="8" height="8" className="spz-progress-marker" data-side="unrecorded" />
        : <circle key={point.sessionId} cx={x} cy={y} r="4" className="spz-chart-dot" data-side="recorded" />)}
      {bestDrawn && <circle cx={bestDrawn.x} cy={bestDrawn.y} r="8" className="spz-chart-best" data-best="" />}
    </svg>
    <p className="spz-chart-scale">Scale {formatPerformanceScale(scale.low, scale.high, metric, weightUnit)} · first {text(first)} ({dayLabel(first.dateKey)}), latest {text(last)} ({dayLabel(last.dateKey)})</p>
    {bestText && <p className="spz-chart-best-line">{bestText} (ringed)</p>}
    {unrecorded && <p className="spz-chart-scale">Squares: that set recorded no arm, so it may have been either arm.</p>}
    {noLoad > 0 && <p className="spz-chart-scale">{noLoad === 1 ? "1 session with no load entered is" : `${noLoad} sessions with no load entered are`} not shown.</p>}
    {outside && <p className="spz-chart-scale">{outside}</p>}
    <ol className="sr-only">{inside.map((point) => <li key={point.sessionId}>{dayLabel(point.dateKey)}: {text(point)}{point.sideUnrecorded ? ", no arm recorded" : ""}{point.sessionId === bestDrawn?.point.sessionId ? `, ${bestLabel.toLowerCase()}` : ""}</li>)}</ol>
  </figure>;
}

type Notice = { kind: "removed"; entry: SpecializationMeasurement } | { kind: "saved"; text: string };
type Week = { monday: string; sunday: string; bouts: number; rows: RegionBoutRow[] };

export type MeasurementsPanelProps = {
  data: SpecializationRegionData;
  /** The arm the page shows; the charts, the list and the performance section read it. */
  side: ArmSide;
  catalog: readonly Exercise[];
  /**
   * The profile's unit. It sets what the athlete types and reads: "lb" → inches and lb on the
   * dynamometer, "kg" → cm and kg. Storage stays in cm and newtons either way.
   */
  weightUnit: DisplayWeightUnit;
  /** The page's IANA zone: a reading's date and time are local to it. */
  timeZone: string;
  /** Today in that zone (YYYY-MM-DD): the last day a reading may be dated, and the axis's last week. */
  todayKey: string;
  measurements: readonly SpecializationMeasurement[];
  onSave: (entry: SpecializationMeasurement) => StoreWrite;
  onRemove: (id: string) => StoreWrite;
  /** A week's bouts open their set records (brief §1); these are what the page does with a row's links. */
  onOpenSession: (sessionId: string) => void;
  onInspectExercise: (catalogExerciseId: number | null, name: string) => void;
  onOpenMethod: () => void;
};

/**
 * Progress beyond set totals (brief §10, design §5): the measures the region offers, by arm, with
 * the protocol that makes two readings comparable (circumference; for the forearm also grip
 * strength on a dynamometer in its own unit and its own chart, never mixed with exercise load),
 * and the top set of one exercise per session. Exposure, each measure and the exercise are
 * separate charts on one time axis, each with its own scale, and nothing says one caused the other.
 * Each week of the exposure chart opens its bouts, as the page's day bars do.
 *
 * Everything the athlete has typed lives in this component's state and nothing resets it on a
 * re-render, so the page can keep it mounted while the disclosure is closed and reopened.
 */
export function MeasurementsPanel({ data, side, catalog, weightUnit, timeZone, todayKey, measurements, onSave, onRemove, onOpenSession, onInspectExercise, onOpenMethod }: MeasurementsPanelProps) {
  const units = progressUnitsFor(weightUnit);
  const nowTime = () => wallClockAt(Date.now(), timeZone).time;
  // Only what the region offers (the forearm: circumference and grip), in its order.
  const offered = data.region.measurementMetrics;
  const [open, setOpen] = useState(false);
  const [chosenMetric, setMetric] = useState<MeasurementMetric | null>(offered[0] ?? null);
  const metric: MeasurementMetric = chosenMetric && offered.includes(chosenMetric) ? chosenMetric : offered[0] ?? "circumference_cm";
  const [arm, setArm] = useState<ArmSide>(side);
  const [date, setDate] = useState(todayKey);
  const [time, setTime] = useState(nowTime);
  // Untouched, the date and time follow the clock when the form opens; once typed, they are kept.
  const [dateEdited, setDateEdited] = useState(false);
  const [timeEdited, setTimeEdited] = useState(false);
  const [value, setValue] = useState("");
  const [landmark, setLandmark] = useState(() => metricDefaults[metric].landmark);
  const [distance, setDistance] = useState("");
  const [posture, setPosture] = useState<MeasurementProtocol["posture"]>(() => metricDefaults[metric].posture);
  const [condition, setCondition] = useState<MeasurementProtocol["condition"]>("unpumped");
  const [device, setDevice] = useState("");
  // The same for the protocol: untouched, it follows the last reading; once typed, it is kept.
  const [protocolEdited, setProtocolEdited] = useState(false);
  const [prefilledFrom, setPrefilledFrom] = useState<SpecializationMeasurement | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [exerciseKey, setExerciseKey] = useState<string | null>(null);
  const [openWeek, setOpenWeek] = useState<string | null>(null);
  const performanceHeading = useId();

  // The control that had focus goes away when the form opens or closes, a reading is removed or
  // restored; focus moves to what replaces it (the form, "Add a reading", Undo), never the page top,
  // and it is brought into view clear of the bottom dock.
  const focusNext = useRef<"form" | "add" | "undo" | null>(null);
  const formRef = useRef<HTMLFieldSetElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const target = focusNext.current;
    if (!target) return;
    focusNext.current = null;
    const first = () => formRef.current?.querySelector<HTMLElement>("button, input, select") ?? null;
    const element = target === "undo" ? undoRef.current : target === "add" ? addRef.current ?? first() : first();
    if (!element) return;
    element.focus({ preventScroll: true });
    revealClearOfBars(element);
  });

  const axis = useMemo(() => progressAxis(todayKey), [todayKey]);
  const { xOfDay, weekWidth } = axisGeometry(axis);

  // Weekly direct work on this arm, the same calculator as the page, over the axis's calendar weeks.
  const sessions = useDeviceWorkoutSessions();
  const weeks = useMemo<Week[]>(() => {
    const bouts = boutsFromSessions(sessions, { catalog, variants: data.variants, fallbackUnit: weightUnit });
    const catalogMusclesFor = catalogMusclesLookup(catalog);
    return Array.from({ length: axis.weeks }, (_, index) => {
      const monday = addDaysToDateKey(axis.firstMonday, 7 * index);
      const interval = calendarWeekInterval(zonedStartOfDay(monday, timeZone), timeZone);
      // Only that week's bouts: the same answer, without reading a year of history eight times.
      const weekBouts = bouts.filter((bout) => intervalContains(interval, bout.performedAt));
      const summary = getSpecializationSummary({ region: data, bouts: weekBouts, interval, side, mode: "completed", goals: [], catalogMusclesFor, sourceRevision: "", planRevision: null, now: interval.startAt ?? new Date().toISOString() });
      // The bar's count and the rows it opens are the same distinct bouts.
      return { monday, sunday: addDaysToDateKey(monday, 6), bouts: summary.regionDistinctBouts, rows: regionBoutRows(summary, "region") };
    });
  }, [sessions, catalog, data, weightUnit, side, timeZone, axis]);
  const maxBouts = Math.max(5, ...weeks.map((week) => week.bouts));
  const shownWeek = weeks.find((week) => week.monday === openWeek && week.bouts > 0) ?? null;
  const regionWord = data.region.label.toLowerCase();

  const armEntries = useMemo(() => measurements.filter((entry) => entry.side === side && entry.regionId === data.region.id), [measurements, side, data.region.id]);
  const dated = (metricOf: MeasurementMetric) => armEntries.filter((entry) => entry.metric === metricOf).map((item) => ({ item, dateKey: localDateKey(item.measuredAt, timeZone) }));
  // The region's first measure always has its chart (or a line saying there is nothing yet); its
  // others once they have readings. Readings of a measure it no longer offers are still drawn.
  const recorded = new Set(armEntries.map((entry) => entry.metric));
  const others = (Object.keys(metricDefaults) as MeasurementMetric[]).filter((item) => !offered.includes(item) && recorded.has(item));
  const charted = [...offered.filter((item) => item === offered[0] || recorded.has(item)), ...others];

  // Comparable exercise performance: exercises with two sessions or more inside the axis.
  const allSeries = useMemo(() => performanceSeries(sessions, { data, side, weightUnit, timeZone, catalog }), [sessions, data, side, weightUnit, timeZone, catalog]);
  const options = useMemo<ChartedPerformance[]>(() => allSeries
    .map((series) => chartPerformance(series, axis))
    .filter((option) => option.inside.length >= 2)
    .sort((a, b) => b.inside[b.inside.length - 1].performedAt.localeCompare(a.inside[a.inside.length - 1].performedAt) || a.series.name.localeCompare(b.series.name)), [allSeries, axis]);
  const chosen = options.find((option) => option.series.key === exerciseKey) ?? options[0] ?? null;

  /**
   * The protocol a new reading starts from: the last reading of this measure on this arm
   * (landmark, distance, posture, condition and device), else the measure's own defaults.
   */
  const startProtocol = (armOf: ArmSide, metricOf: MeasurementMetric) => {
    const latest = latestReading(measurements, { regionId: data.region.id, side: armOf, metric: metricOf });
    const defaults = metricDefaults[metricOf];
    setLandmark(latest?.protocol.landmark ?? defaults.landmark);
    setDistance(metricOf === "circumference_cm" ? typedLength(latest?.protocol.distanceFromLandmarkCm ?? null, units.length) : "");
    setPosture(latest?.protocol.posture ?? defaults.posture);
    setCondition(latest?.protocol.condition ?? "unpumped");
    setDevice(latest?.protocol.device ?? "");
    setPrefilledFrom(latest);
    setProtocolEdited(false);
  };
  const editProtocol = <T,>(set: (next: T) => void) => (next: T) => { set(next); setProtocolEdited(true); };
  const chooseMetric = (next: MeasurementMetric) => {
    setMetric(next);
    startProtocol(arm, next);
  };
  const chooseArm = (next: ArmSide) => {
    setArm(next);
    if (!protocolEdited) startProtocol(next, metric);
  };
  const openForm = () => {
    const nextDate = dateEdited ? date : todayKey;
    focusNext.current = "form";
    setOpen(true);
    setArm(side);
    setError(null);
    if (!protocolEdited) startProtocol(side, metric);
    if (!dateEdited) setDate(todayKey);
    if (!timeEdited) setTime(nextDate === todayKey ? nowTime() : "");
  };
  const changeDate = (next: string) => {
    const nextDate = next || todayKey;
    setDate(nextDate);
    setDateEdited(nextDate !== todayKey);
    // Now's time is right for a reading taken now; for another day it would be a guess, so it is asked.
    if (!timeEdited) setTime(nextDate === todayKey ? nowTime() : "");
  };
  const changeTime = (next: string) => {
    setTime(next.slice(0, 5));
    setTimeEdited(true);
  };

  const save = () => {
    const amount = Number(value);
    if (!value.trim() || !Number.isFinite(amount) || amount <= 0) { setError("Enter a value above zero."); return; }
    if (!landmark.trim()) { setError("Say where it was measured, so the next reading can be taken at the same place."); return; }
    if (!isDateKey(date) || date > todayKey) { setError("Choose a date up to today."); return; }
    if (!isTimeOfDay(time)) { setError("Enter the time it was measured, so the next reading can be taken at the same time of day."); return; }
    const measuredAt = zonedDateTimeToIso(date, time, timeZone);
    if (!measuredAt) { setError("Enter the time it was measured, so the next reading can be taken at the same time of day."); return; }
    if (Date.parse(measuredAt) > Date.now() + 60_000) { setError("That time is later than now. Enter the time the reading was taken."); return; }
    const typedDistance = metric === "circumference_cm" && distance.trim() ? Number(distance) : null;
    if (typedDistance !== null && !(Number.isFinite(typedDistance) && typedDistance >= 0)) { setError(`Enter the distance from the landmark in ${units.length === "in" ? "inches" : "centimetres"}, or leave it empty.`); return; }
    const entry: SpecializationMeasurement = {
      id: newMeasurementId(),
      regionId: data.region.id,
      side: arm,
      measuredAt,
      metric,
      value: toStoredValue(metric, amount, units),
      protocol: { landmark: landmark.trim(), distanceFromLandmarkCm: typedDistance === null ? null : lengthToCm(typedDistance, units.length), posture, condition, device: device.trim() || null, timeOfDay: time },
      notes: notes.trim() || null,
    };
    const result = onSave(entry);
    if (!result.ok) { setError(result.reason); return; }
    setError(null);
    setValue("");
    setNotes("");
    setDateEdited(false);
    setTimeEdited(false);
    // The next reading starts from this one.
    setProtocolEdited(false);
    focusNext.current = "add";
    setOpen(false);
    setNotice({ kind: "saved", text: `Saved ${formatReading(metric, entry.value, units)}, ${arm} arm, ${dayLabel(date)} at ${time}.${arm !== side ? ` Switch to the ${arm} arm to see it on the charts.` : ""}` });
  };
  const remove = (entry: SpecializationMeasurement) => {
    const result = onRemove(entry.id);
    if (result.ok) { focusNext.current = "undo"; setNotice({ kind: "removed", entry }); setListError(null); } else setListError(result.reason);
  };
  const undo = () => {
    if (notice?.kind !== "removed") return;
    const result = onSave(notice.entry);
    if (result.ok) { focusNext.current = "add"; setNotice(null); setListError(null); } else setListError(result.reason);
  };

  const listed = [...armEntries].sort((left, right) => right.measuredAt.localeCompare(left.measuredAt)).slice(0, 8);
  const timeOf = (entry: SpecializationMeasurement) => entry.protocol.timeOfDay ?? wallClockAt(Date.parse(entry.measuredAt), timeZone).time;
  const instrument = metricDefaults[metric].instrument.toLowerCase();

  return <div className="spz-measure">
    <p className="spz-note">Charts for the {side} arm on one time axis, {axis.label}, each with its own scale. A tape takes in every muscle under it, so circumference cannot show which muscle changed, and a change beside your training does not show the training caused it.</p>
    <figure className="spz-chart">
      <figcaption>Distinct bouts per week on the {regionWord}, completed</figcaption>
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={`Bouts per week on the ${side} arm for the last ${axis.weeks} weeks: ${weeks.map((week) => week.bouts).join(", ")}`}>
        <TimeAxis axis={axis} />
        {weeks.map((week, index) => {
          const height = (week.bouts / maxBouts) * 60;
          return <rect key={week.monday} x={xOfDay(index * 7) + 4} y={BASELINE - height} width={weekWidth - 8} height={height} className="spz-chart-bar" />;
        })}
      </svg>
      <p className="spz-chart-scale">Scale 0 to {maxBouts} bouts · weeks from {dayLabel(axis.firstMonday)}</p>
      {/* Each bar is a total, so a week with work opens its bouts (brief §1), as a day's bar does on the page.
          Eight 44 px buttons do not fit one row on a phone, so they take two rows of four, oldest first. */}
      {weeks.some((week) => week.bouts > 0) && <>
        <ol className="spz-weeks" aria-label={`Distinct bouts per week, ${side} arm`}>
          {weeks.map((week) => {
            const inner = <><small>{dayLabel(week.monday)}</small><b>{week.bouts}</b></>;
            return <li key={week.monday} data-current={week.monday <= todayKey && todayKey <= week.sunday || undefined}>
              {week.bouts > 0
                ? <button type="button" className="spz-week" onClick={() => setOpenWeek(week.monday)} aria-label={`Week of ${dayLabel(week.monday)}: ${plural(week.bouts, "distinct bout")}. See these sets`}>{inner}</button>
                : <span className="spz-week">{inner}</span>}
            </li>;
          })}
        </ol>
        <p className="spz-chart-scale">A week with work opens its sets.</p>
      </>}
    </figure>
    {charted.map((item) => {
      const entries = dated(item);
      return entries.length > 0
        ? <ReadingChart key={item} metric={item} entries={entries} axis={axis} units={units} side={side} />
        : <figure key={item} className="spz-chart"><figcaption>{item === "grip_force_n" ? `Grip strength (${units.force})` : `Circumference (${units.length})`}</figcaption><p className="spz-note">No {item === "grip_force_n" ? "grip" : "circumference"} readings for the {side} arm yet.</p></figure>;
    })}

    {listed.length > 0 && <ul className="spz-measure-list" aria-label={`Latest readings, ${side} arm`}>
      {listed.map((entry) => {
        const key = localDateKey(entry.measuredAt, timeZone);
        const shown = formatReading(entry.metric, entry.value, units);
        const distanceText = entry.protocol.distanceFromLandmarkCm !== null ? `, ${formatLength(entry.protocol.distanceFromLandmarkCm, units.length)}` : "";
        return <li key={entry.id}>
          <span><b>{shown}</b><small>{dayLabel(key, true)} · {timeOf(entry)} · {entry.protocol.landmark}{distanceText} · {postureLabels[entry.protocol.posture]} · {conditionLabels[entry.protocol.condition]}{entry.protocol.device ? ` · ${entry.protocol.device}` : ""}{entry.notes ? ` · ${entry.notes}` : ""}</small></span>
          <button type="button" className="spz-icon-button" onClick={() => remove(entry)} aria-label={`Remove the reading of ${shown} on ${dayLabel(key, true)}`}><X className="h-4 w-4" aria-hidden="true" /></button>
        </li>;
      })}
    </ul>}
    {notice?.kind === "removed" && <p className="spz-inline-status" role="status">Reading removed. <button type="button" ref={undoRef} className="spz-link spz-link-box" onClick={undo}>Undo</button></p>}
    {notice?.kind === "saved" && <p className="spz-inline-status" role="status">{notice.text}</p>}
    {listError && <p className="spz-error" role="alert">{listError}</p>}

    {offered.length === 0 ? <p className="spz-note">There is nothing to measure for the {regionWord} yet.</p> : open ? <fieldset ref={formRef} className="spz-target-form">
      <legend>New reading</legend>
      {offered.length > 1 && <div className="spz-segment" role="group" aria-label="What was measured">
        {offered.map((item) => <button key={item} type="button" aria-pressed={metric === item} onClick={() => chooseMetric(item)}>{metricDefaults[item].button}</button>)}
      </div>}
      <div className="spz-segment" role="group" aria-label="Which arm">
        <button type="button" aria-pressed={arm === "left"} onClick={() => chooseArm("left")}>Left arm</button>
        <button type="button" aria-pressed={arm === "right"} onClick={() => chooseArm("right")}>Right arm</button>
      </div>
      <label className="spz-field"><span>{metric === "grip_force_n" ? `Grip (${units.force} on the dynamometer)` : `Circumference (${units.length})`}</span><input type="number" inputMode="decimal" min={0} step="any" value={value} onChange={(event) => setValue(event.target.value)} /></label>
      <div className="spz-progress-when">
        <label className="spz-field"><span>Date</span><input type="date" value={date} max={todayKey} onChange={(event) => changeDate(event.target.value)} /></label>
        <label className="spz-field"><span>Time</span><input type="time" value={time} required onChange={(event) => changeTime(event.target.value)} /></label>
      </div>
      {date !== todayKey && !time && <p className="spz-note">Enter the time the reading was taken on {dayLabel(date)}.</p>}
      {/* Said once, above the fields it filled: where they came from, so a changed protocol is a choice, not an accident. */}
      {prefilledFrom && !protocolEdited && <p className="spz-note">Filled in from your last reading on the {arm} arm ({dayLabel(localDateKey(prefilledFrom.measuredAt, timeZone))}): place, posture, condition and {instrument}. Change any you did differently.</p>}
      <label className="spz-field"><span>Where (landmark)</span><input type="text" value={landmark} onChange={(event) => editProtocol(setLandmark)(event.target.value)} /></label>
      {metric === "circumference_cm" && <label className="spz-field"><span>Distance from the landmark ({units.length}, optional)</span><input type="number" inputMode="decimal" min={0} step="any" value={distance} onChange={(event) => editProtocol(setDistance)(event.target.value)} /></label>}
      <label className="spz-field"><span>Posture</span><select value={posture} onChange={(event) => editProtocol(setPosture)(event.target.value as MeasurementProtocol["posture"])}>{(Object.keys(postureLabels) as MeasurementProtocol["posture"][]).map((item) => <option key={item} value={item}>{postureLabels[item]}</option>)}</select></label>
      <label className="spz-field"><span>Condition</span><select value={condition} onChange={(event) => editProtocol(setCondition)(event.target.value as MeasurementProtocol["condition"])}>{(Object.keys(conditionLabels) as MeasurementProtocol["condition"][]).map((item) => <option key={item} value={item}>{conditionLabels[item]}</option>)}</select></label>
      <label className="spz-field"><span>{metricDefaults[metric].instrument} (optional)</span><input type="text" value={device} onChange={(event) => editProtocol(setDevice)(event.target.value)} /></label>
      <label className="spz-field"><span>Note (optional)</span><input type="text" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      <p className="spz-note">The same place, posture, time of day and condition make two readings comparable.</p>
      {error && <p className="spz-error" role="alert">{error}</p>}
      <div className="spz-actions"><button type="button" className="spz-primary" onClick={save}>Save reading</button><button type="button" className="spz-button" onClick={() => { focusNext.current = "add"; setOpen(false); setError(null); }}>Cancel</button></div>
    </fieldset> : <button type="button" ref={addRef} className="spz-button" onClick={openForm}>Add a reading</button>}

    <section className="spz-subsection spz-progress-section" aria-labelledby={performanceHeading}>
      <h3 id={performanceHeading}>Exercise performance</h3>
      <p className="spz-note">Same exercise only. A change of hand position, implement or range of motion is a different line.</p>
      {chosen ? <>
        <label className="spz-field"><span>Exercise</span>
          <select value={chosen.series.key} onChange={(event) => setExerciseKey(event.target.value)}>
            {options.map((option) => <option key={option.series.key} value={option.series.key}>{option.series.name}{option.series.straps ? ", with straps" : ""} · {option.inside.length} sessions</option>)}
          </select>
        </label>
        <p className="spz-note">{chosen.metric === "seconds" ? "The longest hold of each session" : chosen.metric === "load" ? `The top set of each session: the heaviest load in ${weightUnit}, then the most reps` : "The top set of each session, drawn by its reps"}, from completed sets. A set done with both arms counts for each arm.</p>
        <PerformanceChart option={chosen} axis={axis} side={side} weightUnit={weightUnit} />
      </> : <p className="spz-note">No exercise that works the {regionWord} directly has two finished sessions on the {side} arm in these {axis.weeks} weeks.</p>}
    </section>

    {shownWeek && <BoutListSheet
      eyebrow={`${data.region.label} · ${side} arm`}
      title={`Week of ${dayLabel(shownWeek.monday)}`}
      intro={`${dateRangeLabel(shownWeek.monday, shownWeek.sunday)}: ${plural(shownWeek.bouts, "distinct bout")}, every set that loaded a muscle of the ${regionWord} on the ${side} arm, each counted once however many muscles it loaded.`}
      lists={[{ key: "arm", heading: null, note: null, rows: shownWeek.rows }]}
      weightUnit={weightUnit}
      onOpenSession={(sessionId) => { setOpenWeek(null); onOpenSession(sessionId); }}
      onInspectExercise={(catalogExerciseId, name) => { setOpenWeek(null); onInspectExercise(catalogExerciseId, name); }}
      onOpenMethod={() => { setOpenWeek(null); onOpenMethod(); }}
      onClose={() => setOpenWeek(null)}
    />}
  </div>;
}
