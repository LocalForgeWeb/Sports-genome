import { useId, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { boutsFromSessions } from "@/lib/specialization/bouts";
import {
  dayLabel, dayOnAxis, formatLength, formatPerformance, formatPerformanceScale, formatReading, formatScale, isTimeOfDay, lengthToCm,
  performanceSeries, performanceValue, progressAxis, progressUnitsFor, splitByAxis, toStoredValue, valueScale, wallClockAt, zonedDateTimeToIso,
  type PerformancePoint, type PerformanceSeries, type ProgressAxis, type ProgressUnits,
} from "@/lib/specialization/progressSeries";
import type { StoreWrite } from "@/lib/specialization/stores";
import { catalogMusclesLookup, useDeviceWorkoutSessions } from "@/lib/specialization/useSpecializationSummary";
import type { DisplayWeightUnit } from "@/lib/weightUnits";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { addDaysToDateKey, calendarWeekInterval, intervalContains, isDateKey, localDateKey, zonedStartOfDay } from "@shared/specialization/time";
import type { ArmSide, MeasurementMetric, MeasurementProtocol, SpecializationMeasurement, SpecializationRegionData } from "@shared/specialization/types";
import "./progress.css";

const postureLabels: Record<MeasurementProtocol["posture"], string> = {
  arm_relaxed_hanging: "Arm relaxed, hanging",
  arm_extended_supported: "Arm straight, supported",
  elbow_90_supported: "Elbow at 90°, supported",
  other: "Other",
};
const conditionLabels: Record<MeasurementProtocol["condition"], string> = { unpumped: "Before training (unpumped)", pumped: "After training (pumped)", unknown: "Not noted" };

let measurementSequence = 0;
const newMeasurementId = () => `measure-${Date.now().toString(36)}-${(measurementSequence += 1).toString(36)}`;

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
function notShown(older: number, later: number, singular: string, plural: string): string {
  const noun = (count: number) => (count === 1 ? `${singular} is` : `${plural} are`);
  return [
    older ? `${older} older ${noun(older)} not shown.` : "",
    later ? `${later} ${noun(later)} dated after this week and not shown.` : "",
  ].filter(Boolean).join(" ");
}

type Dated<T> = { item: T; dateKey: string };

/** One measure's chart: only what falls inside the axis is drawn, and the scale is read from that. */
function ReadingChart({ metric, entries, axis, units, side }: { metric: MeasurementMetric; entries: readonly Dated<SpecializationMeasurement>[]; axis: ProgressAxis; units: ProgressUnits; side: ArmSide }) {
  const { inside, older, later } = splitByAxis(entries, (entry) => entry.dateKey, axis);
  const scale = valueScale(inside.map(({ item }) => item.value));
  const { xOfKey } = axisGeometry(axis);
  const grip = metric === "grip_force_n";
  const title = grip ? `Grip strength on a dynamometer (${units.force}; its own measure, not exercise load)` : `Circumference (${units.length})`;
  const noun = grip ? "grip reading" : "circumference reading";
  const outside = notShown(older, later, "reading", "readings");
  const pumped = !grip && inside.some(({ item }) => item.protocol.condition === "pumped");
  return <figure className="spz-chart">
    <figcaption>{title}</figcaption>
    {scale ? <>
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={`${inside.length} ${inside.length === 1 ? noun : `${noun}s`} on the ${side} arm in these ${axis.weeks} weeks, ${formatScale(metric, scale.low, scale.high, units)}.${outside ? ` ${outside}` : ""}`}>
        <TimeAxis axis={axis} />
        {inside.map(({ item, dateKey }) => <circle key={item.id} cx={xOfKey(dateKey)} cy={scale.y(item.value)} r="4" className="spz-chart-dot" data-condition={item.protocol.condition} />)}
      </svg>
      <p className="spz-chart-scale">Scale {formatScale(metric, scale.low, scale.high, units)}{pumped ? " · open dots were pumped" : ""}</p>
    </> : <p className="spz-note">No {grip ? "grip" : "circumference"} readings for the {side} arm in these {axis.weeks} weeks.</p>}
    {outside && <p className="spz-chart-scale">{outside}</p>}
  </figure>;
}

type PerformanceOption = { series: PerformanceSeries; inside: PerformancePoint[]; older: number; later: number };

/** One exercise's top set (or longest hold) per session, on the same axis, with its own scale. */
function PerformanceChart({ option, axis, side, weightUnit }: { option: PerformanceOption; axis: ProgressAxis; side: ArmSide; weightUnit: DisplayWeightUnit }) {
  const { series, inside, older, later } = option;
  const { xOfKey } = axisGeometry(axis);
  const scale = valueScale(inside.map((point) => performanceValue(point, series.metric)))!;
  const points = inside.map((point) => ({ point, x: xOfKey(point.dateKey), y: scale.y(performanceValue(point, series.metric)) }));
  const first = inside[0];
  const last = inside[inside.length - 1];
  const name = `${series.name}${series.straps ? ", with straps" : ""}`;
  const what = series.measure === "seconds" ? "longest hold" : "top set";
  const text = (point: PerformancePoint) => formatPerformance(point, series, weightUnit);
  const unrecorded = inside.some((point) => point.sideUnrecorded);
  const outside = notShown(older, later, "session", "sessions");
  return <figure className="spz-chart">
    <figcaption>{name}: {what} each session, {side} arm</figcaption>
    <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={`${name}, ${what} each session on the ${side} arm: ${inside.length} sessions from ${dayLabel(first.dateKey)} to ${dayLabel(last.dateKey)}, first ${text(first)}, latest ${text(last)}.`}>
      <TimeAxis axis={axis} />
      <polyline points={points.map(({ x, y }) => `${x},${y}`).join(" ")} className="spz-progress-line" />
      {points.map(({ point, x, y }) => point.sideUnrecorded
        ? <rect key={point.sessionId} x={x - 4} y={y - 4} width="8" height="8" className="spz-progress-marker" data-side="unrecorded" />
        : <circle key={point.sessionId} cx={x} cy={y} r="4" className="spz-chart-dot" data-side="recorded" />)}
    </svg>
    <p className="spz-chart-scale">Scale {formatPerformanceScale(scale.low, scale.high, series.metric, weightUnit)} · first {text(first)} ({dayLabel(first.dateKey)}), latest {text(last)} ({dayLabel(last.dateKey)})</p>
    {unrecorded && <p className="spz-chart-scale">Squares: that set recorded no arm, so it may have been either arm.</p>}
    {outside && <p className="spz-chart-scale">{outside}</p>}
    <ol className="sr-only">{inside.map((point) => <li key={point.sessionId}>{dayLabel(point.dateKey)}: {text(point)}{point.sideUnrecorded ? ", no arm recorded" : ""}</li>)}</ol>
  </figure>;
}

type Notice = { kind: "removed"; entry: SpecializationMeasurement } | { kind: "saved"; text: string };

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
};

/**
 * Progress beyond set totals (brief §10, design §5): circumference by arm with the protocol that
 * makes two readings comparable, grip strength on a dynamometer in its own unit and its own
 * chart (never mixed with exercise load), and the top set of one exercise per session. Exposure,
 * each measure and the exercise are separate charts on one time axis, each with its own scale,
 * and nothing says one caused the other.
 *
 * Everything the athlete has typed lives in this component's state and nothing resets it on a
 * re-render, so the page can keep it mounted while the disclosure is closed and reopened.
 */
export function MeasurementsPanel({ data, side, catalog, weightUnit, timeZone, todayKey, measurements, onSave, onRemove }: MeasurementsPanelProps) {
  const units = progressUnitsFor(weightUnit);
  const nowTime = () => wallClockAt(Date.now(), timeZone).time;
  const [open, setOpen] = useState(false);
  const [metric, setMetric] = useState<MeasurementMetric>("circumference_cm");
  const [arm, setArm] = useState<ArmSide>(side);
  const [date, setDate] = useState(todayKey);
  const [time, setTime] = useState(nowTime);
  // Untouched, the date and time follow the clock when the form opens; once typed, they are kept.
  const [dateEdited, setDateEdited] = useState(false);
  const [timeEdited, setTimeEdited] = useState(false);
  const [value, setValue] = useState("");
  const [landmark, setLandmark] = useState("Thickest point");
  const [distance, setDistance] = useState("");
  const [posture, setPosture] = useState<MeasurementProtocol["posture"]>("arm_relaxed_hanging");
  const [condition, setCondition] = useState<MeasurementProtocol["condition"]>("unpumped");
  const [device, setDevice] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [exerciseKey, setExerciseKey] = useState<string | null>(null);
  const performanceHeading = useId();

  const axis = useMemo(() => progressAxis(todayKey), [todayKey]);
  const { xOfDay, weekWidth } = axisGeometry(axis);

  // Weekly direct work on this arm, the same calculator as the page, over the axis's calendar weeks.
  const sessions = useDeviceWorkoutSessions();
  const weeks = useMemo(() => {
    const bouts = boutsFromSessions(sessions, { catalog, variants: data.variants, fallbackUnit: weightUnit });
    const catalogMusclesFor = catalogMusclesLookup(catalog);
    return Array.from({ length: axis.weeks }, (_, index) => {
      const monday = addDaysToDateKey(axis.firstMonday, 7 * index);
      const interval = calendarWeekInterval(zonedStartOfDay(monday, timeZone), timeZone);
      // Only that week's bouts: the same answer, without reading a year of history eight times.
      const weekBouts = bouts.filter((bout) => intervalContains(interval, bout.performedAt));
      const summary = getSpecializationSummary({ region: data, bouts: weekBouts, interval, side, mode: "completed", goals: [], catalogMusclesFor, sourceRevision: "", planRevision: null, now: interval.startAt ?? new Date().toISOString() });
      return { monday, bouts: summary.regionDistinctBouts };
    });
  }, [sessions, catalog, data, weightUnit, side, timeZone, axis]);
  const maxBouts = Math.max(5, ...weeks.map((week) => week.bouts));

  const armEntries = useMemo(() => measurements.filter((entry) => entry.side === side && entry.regionId === data.region.id), [measurements, side, data.region.id]);
  const dated = (metricOf: MeasurementMetric) => armEntries.filter((entry) => entry.metric === metricOf).map((item) => ({ item, dateKey: localDateKey(item.measuredAt, timeZone) }));
  const circumference = dated("circumference_cm");
  const grip = dated("grip_force_n");

  // Comparable exercise performance: exercises with two sessions or more inside the axis.
  const allSeries = useMemo(() => performanceSeries(sessions, { data, side, weightUnit, timeZone, catalog }), [sessions, data, side, weightUnit, timeZone, catalog]);
  const options = useMemo<PerformanceOption[]>(() => allSeries
    .map((series) => ({ series, ...splitByAxis(series.points, (point) => point.dateKey, axis) }))
    .filter((option) => option.inside.length >= 2)
    .sort((a, b) => b.inside[b.inside.length - 1].performedAt.localeCompare(a.inside[a.inside.length - 1].performedAt) || a.series.name.localeCompare(b.series.name)), [allSeries, axis]);
  const chosen = options.find((option) => option.series.key === exerciseKey) ?? options[0] ?? null;

  const openForm = () => {
    const nextDate = dateEdited ? date : todayKey;
    setOpen(true);
    setArm(side);
    setError(null);
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
    setOpen(false);
    setNotice({ kind: "saved", text: `Saved ${formatReading(metric, entry.value, units)}, ${arm} arm, ${dayLabel(date)} at ${time}.${arm !== side ? ` Switch to the ${arm} arm to see it on the charts.` : ""}` });
  };
  const remove = (entry: SpecializationMeasurement) => {
    const result = onRemove(entry.id);
    if (result.ok) { setNotice({ kind: "removed", entry }); setListError(null); } else setListError(result.reason);
  };
  const undo = () => {
    if (notice?.kind !== "removed") return;
    const result = onSave(notice.entry);
    if (result.ok) { setNotice(null); setListError(null); } else setListError(result.reason);
  };

  const listed = [...armEntries].sort((left, right) => right.measuredAt.localeCompare(left.measuredAt)).slice(0, 8);
  const timeOf = (entry: SpecializationMeasurement) => entry.protocol.timeOfDay ?? wallClockAt(Date.parse(entry.measuredAt), timeZone).time;

  return <div className="spz-measure">
    <p className="spz-note">Charts for the {side} arm on one time axis, {axis.label}, each with its own scale. A tape takes in every muscle under it, so circumference cannot show which muscle changed, and a change beside your training does not show the training caused it.</p>
    <figure className="spz-chart">
      <figcaption>Distinct bouts per week on the {data.region.label.toLowerCase()}, completed</figcaption>
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label={`Bouts per week on the ${side} arm for the last ${axis.weeks} weeks: ${weeks.map((week) => week.bouts).join(", ")}`}>
        <TimeAxis axis={axis} />
        {weeks.map((week, index) => {
          const height = (week.bouts / maxBouts) * 60;
          return <rect key={week.monday} x={xOfDay(index * 7) + 4} y={BASELINE - height} width={weekWidth - 8} height={height} className="spz-chart-bar" />;
        })}
      </svg>
      <p className="spz-chart-scale">Scale 0 to {maxBouts} bouts · weeks from {dayLabel(axis.firstMonday)}</p>
    </figure>
    {circumference.length > 0
      ? <ReadingChart metric="circumference_cm" entries={circumference} axis={axis} units={units} side={side} />
      : <figure className="spz-chart"><figcaption>Circumference ({units.length})</figcaption><p className="spz-note">No circumference readings for the {side} arm yet.</p></figure>}
    {grip.length > 0 && <ReadingChart metric="grip_force_n" entries={grip} axis={axis} units={units} side={side} />}

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
    {notice?.kind === "removed" && <p className="spz-inline-status" role="status">Reading removed. <button type="button" className="spz-link" onClick={undo}>Undo</button></p>}
    {notice?.kind === "saved" && <p className="spz-inline-status" role="status">{notice.text}</p>}
    {listError && <p className="spz-error" role="alert">{listError}</p>}

    {open ? <fieldset className="spz-target-form">
      <legend>New reading</legend>
      <div className="spz-segment" role="group" aria-label="What was measured">
        <button type="button" aria-pressed={metric === "circumference_cm"} onClick={() => { setMetric("circumference_cm"); setLandmark("Thickest point"); }}>Circumference</button>
        <button type="button" aria-pressed={metric === "grip_force_n"} onClick={() => { setMetric("grip_force_n"); setLandmark("Dynamometer grip"); setPosture("elbow_90_supported"); }}>Grip strength</button>
      </div>
      <div className="spz-segment" role="group" aria-label="Which arm">
        <button type="button" aria-pressed={arm === "left"} onClick={() => setArm("left")}>Left arm</button>
        <button type="button" aria-pressed={arm === "right"} onClick={() => setArm("right")}>Right arm</button>
      </div>
      <label className="spz-field"><span>{metric === "grip_force_n" ? `Grip (${units.force} on the dynamometer)` : `Circumference (${units.length})`}</span><input type="number" inputMode="decimal" min={0} step="any" value={value} onChange={(event) => setValue(event.target.value)} /></label>
      <div className="spz-progress-when">
        <label className="spz-field"><span>Date</span><input type="date" value={date} max={todayKey} onChange={(event) => changeDate(event.target.value)} /></label>
        <label className="spz-field"><span>Time</span><input type="time" value={time} required onChange={(event) => changeTime(event.target.value)} /></label>
      </div>
      {date !== todayKey && !time && <p className="spz-note">Enter the time the reading was taken on {dayLabel(date)}.</p>}
      <label className="spz-field"><span>Where (landmark)</span><input type="text" value={landmark} onChange={(event) => setLandmark(event.target.value)} /></label>
      {metric === "circumference_cm" && <label className="spz-field"><span>Distance from the landmark ({units.length}, optional)</span><input type="number" inputMode="decimal" min={0} step="any" value={distance} onChange={(event) => setDistance(event.target.value)} /></label>}
      <label className="spz-field"><span>Posture</span><select value={posture} onChange={(event) => setPosture(event.target.value as MeasurementProtocol["posture"])}>{(Object.keys(postureLabels) as MeasurementProtocol["posture"][]).map((item) => <option key={item} value={item}>{postureLabels[item]}</option>)}</select></label>
      <label className="spz-field"><span>Condition</span><select value={condition} onChange={(event) => setCondition(event.target.value as MeasurementProtocol["condition"])}>{(Object.keys(conditionLabels) as MeasurementProtocol["condition"][]).map((item) => <option key={item} value={item}>{conditionLabels[item]}</option>)}</select></label>
      <label className="spz-field"><span>Tape or dynamometer (optional)</span><input type="text" value={device} onChange={(event) => setDevice(event.target.value)} /></label>
      <label className="spz-field"><span>Note (optional)</span><input type="text" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      <p className="spz-note">The same place, posture, time of day and condition make two readings comparable.</p>
      {error && <p className="spz-error" role="alert">{error}</p>}
      <div className="spz-actions"><button type="button" className="spz-primary" onClick={save}>Save reading</button><button type="button" className="spz-button" onClick={() => { setOpen(false); setError(null); }}>Cancel</button></div>
    </fieldset> : <button type="button" className="spz-button" onClick={openForm}>Add a reading</button>}

    <section className="spz-subsection spz-progress-section" aria-labelledby={performanceHeading}>
      <h3 id={performanceHeading}>Exercise performance</h3>
      <p className="spz-note">Same exercise only. A different grip, implement or range of motion is a different line.</p>
      {chosen ? <>
        <label className="spz-field"><span>Exercise</span>
          <select value={chosen.series.key} onChange={(event) => setExerciseKey(event.target.value)}>
            {options.map((option) => <option key={option.series.key} value={option.series.key}>{option.series.name}{option.series.straps ? ", with straps" : ""} · {option.inside.length} sessions</option>)}
          </select>
        </label>
        <p className="spz-note">{chosen.series.measure === "seconds" ? "The longest hold of each session" : `The top set of each session: the heaviest load in ${weightUnit}, then the most reps`}, from completed sets. A set done with both arms counts for each arm.</p>
        <PerformanceChart option={chosen} axis={axis} side={side} weightUnit={weightUnit} />
      </> : <p className="spz-note">No exercise that works the {data.region.label.toLowerCase()} directly has two finished sessions on the {side} arm in these {axis.weeks} weeks.</p>}
    </section>
  </div>;
}
