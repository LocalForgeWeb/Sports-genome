import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { Exercise } from "@/lib/exerciseCatalog";
import { boutsFromSessions } from "@/lib/specialization/bouts";
import type { StoreWrite } from "@/lib/specialization/stores";
import { catalogMusclesLookup, useDeviceWorkoutSessions } from "@/lib/specialization/useSpecializationSummary";
import type { DisplayWeightUnit } from "@/lib/weightUnits";
import { getSpecializationSummary } from "@shared/specialization/exposure";
import { addDaysToDateKey, calendarWeekInterval, intervalContains, localDateKey, mondayIndexOfDateKey, zonedStartOfDay } from "@shared/specialization/time";
import type { ArmSide, MeasurementMetric, MeasurementProtocol, SpecializationMeasurement, SpecializationRegionData } from "@shared/specialization/types";

const NEWTONS_PER_KGF = 9.80665;
const WEEKS = 8;
const postureLabels: Record<MeasurementProtocol["posture"], string> = {
  arm_relaxed_hanging: "Arm relaxed, hanging",
  arm_extended_supported: "Arm straight, supported",
  elbow_90_supported: "Elbow at 90°, supported",
  other: "Other",
};
const conditionLabels: Record<MeasurementProtocol["condition"], string> = { unpumped: "Before training (unpumped)", pumped: "After training (pumped)", unknown: "Not noted" };

let measurementSequence = 0;
const newMeasurementId = () => `measure-${Date.now().toString(36)}-${(measurementSequence += 1).toString(36)}`;
const displayValue = (entry: SpecializationMeasurement) => (entry.metric === "grip_force_n" ? `${(entry.value / NEWTONS_PER_KGF).toFixed(1)} kg on a dynamometer` : `${entry.value.toFixed(1)} cm around`);

/**
 * Progress beyond set totals (brief §10): circumference by arm with the protocol that makes
 * two readings comparable, and grip strength on a dynamometer, kept in its own unit and its
 * own chart, never mixed with exercise load. Exposure and each measure are drawn as separate
 * charts on one time axis, each with its own scale, and nothing says one caused the other.
 */
export function MeasurementsPanel({ data, side, catalog, weightUnit, timeZone, todayKey, measurements, onSave, onRemove }: {
  data: SpecializationRegionData;
  side: ArmSide;
  catalog: readonly Exercise[];
  weightUnit: DisplayWeightUnit;
  timeZone: string;
  todayKey: string;
  measurements: readonly SpecializationMeasurement[];
  onSave: (entry: SpecializationMeasurement) => StoreWrite;
  onRemove: (id: string) => StoreWrite;
}) {
  const [open, setOpen] = useState(false);
  const [metric, setMetric] = useState<MeasurementMetric>("circumference_cm");
  const [arm, setArm] = useState<ArmSide>(side);
  const [date, setDate] = useState(todayKey);
  const [value, setValue] = useState("");
  const [landmark, setLandmark] = useState("Thickest point");
  const [distance, setDistance] = useState("");
  const [posture, setPosture] = useState<MeasurementProtocol["posture"]>("arm_relaxed_hanging");
  const [condition, setCondition] = useState<MeasurementProtocol["condition"]>("unpumped");
  const [device, setDevice] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState<SpecializationMeasurement | null>(null);

  // Weekly direct work on this arm, the same calculator as the page, over the last eight calendar weeks.
  const sessions = useDeviceWorkoutSessions();
  const weeks = useMemo(() => {
    const thisMonday = addDaysToDateKey(todayKey, -mondayIndexOfDateKey(todayKey));
    const bouts = boutsFromSessions(sessions, { catalog, variants: data.variants, fallbackUnit: weightUnit });
    const catalogMusclesFor = catalogMusclesLookup(catalog);
    return Array.from({ length: WEEKS }, (_, index) => {
      const monday = addDaysToDateKey(thisMonday, -7 * (WEEKS - 1 - index));
      const interval = calendarWeekInterval(zonedStartOfDay(monday, timeZone), timeZone);
      // Only that week's bouts: the same answer, without reading a year of history eight times.
      const weekBouts = bouts.filter((bout) => intervalContains(interval, bout.performedAt));
      const summary = getSpecializationSummary({ region: data, bouts: weekBouts, interval, side, mode: "completed", goals: [], catalogMusclesFor, sourceRevision: "", planRevision: null, now: interval.startAt ?? new Date().toISOString() });
      return { monday, bouts: summary.regionDistinctBouts };
    });
  }, [sessions, catalog, data, weightUnit, side, timeZone, todayKey]);
  const firstMonday = weeks[0]?.monday ?? todayKey;
  const weekIndexOf = (iso: string) => {
    const key = localDateKey(iso, timeZone);
    const days = (Date.parse(`${key}T00:00:00Z`) - Date.parse(`${firstMonday}T00:00:00Z`)) / 86_400_000;
    return days / 7;
  };
  const armEntries = measurements.filter((entry) => entry.side === side && entry.regionId === data.region.id);
  const circumference = armEntries.filter((entry) => entry.metric === "circumference_cm");
  const grip = armEntries.filter((entry) => entry.metric === "grip_force_n");
  const maxBouts = Math.max(5, ...weeks.map((week) => week.bouts));

  const save = () => {
    const amount = Number(value);
    if (!value.trim() || !Number.isFinite(amount) || amount <= 0) { setError("Enter a value above zero."); return; }
    if (!landmark.trim()) { setError("Say where it was measured, so the next reading can be taken at the same place."); return; }
    const now = new Date();
    const timeOfDay = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const measuredAt = new Date(`${date}T${timeOfDay}:00`).toISOString();
    const distanceCm = distance.trim() ? Number(distance) : null;
    if (distanceCm !== null && !(Number.isFinite(distanceCm) && distanceCm >= 0)) { setError("Enter the distance from the landmark in centimetres, or leave it empty."); return; }
    const entry: SpecializationMeasurement = {
      id: newMeasurementId(),
      regionId: data.region.id,
      side: arm,
      measuredAt,
      metric,
      value: metric === "grip_force_n" ? amount * NEWTONS_PER_KGF : amount,
      protocol: { landmark: landmark.trim(), distanceFromLandmarkCm: distanceCm, posture, condition, device: device.trim() || null, timeOfDay },
      notes: notes.trim() || null,
    };
    const result = onSave(entry);
    if (!result.ok) { setError(result.reason); return; }
    setError(null);
    setValue("");
    setNotes("");
    setOpen(false);
  };
  const remove = (entry: SpecializationMeasurement) => {
    const result = onRemove(entry.id);
    if (result.ok) setRemoved(entry); else setError(result.reason);
  };

  const chartWidth = 320;
  const x = (position: number) => 8 + (position / WEEKS) * (chartWidth - 16);
  const series = (entries: SpecializationMeasurement[]) => {
    if (!entries.length) return null;
    const values = entries.map((entry) => entry.value);
    const low = Math.min(...values);
    const high = Math.max(...values);
    const span = high - low || 1;
    return entries.map((entry) => ({ entry, x: x(Math.max(0, Math.min(WEEKS, weekIndexOf(entry.measuredAt)))), y: 70 - ((entry.value - low) / span) * 56 }));
  };
  const circumferencePoints = series(circumference);
  const gripPoints = series(grip);
  const range = (entries: SpecializationMeasurement[]) => entries.length ? `${displayValue(entries.reduce((low, entry) => (entry.value < low.value ? entry : low)))} to ${displayValue(entries.reduce((high, entry) => (entry.value > high.value ? entry : high)))}` : "";

  return <div className="spz-measure">
    <p className="spz-note">Charts for the {side} arm, one time axis, each with its own scale. Circumference is the whole {data.region.label.toLowerCase()}, so it cannot show which muscle changed, and a change beside your training does not show the training caused it.</p>
    <figure className="spz-chart">
      <figcaption>Distinct {data.region.label.toLowerCase()} bouts per week, completed</figcaption>
      <svg viewBox={`0 0 ${chartWidth} 80`} role="img" aria-label={`Bouts per week for the last ${WEEKS} weeks: ${weeks.map((week) => week.bouts).join(", ")}`}>
        <line x1="0" x2={chartWidth} y1="72" y2="72" className="spz-chart-axis" />
        {weeks.map((week, index) => {
          const height = (week.bouts / maxBouts) * 60;
          return <rect key={week.monday} x={x(index) + 4} y={72 - height} width={(chartWidth - 16) / WEEKS - 8} height={height} className="spz-chart-bar" />;
        })}
      </svg>
      <p className="spz-chart-scale">0 to {maxBouts} bouts · weeks from {new Date(`${firstMonday}T12:00:00Z`).toLocaleDateString(undefined, { day: "numeric", month: "short", timeZone: "UTC" })}</p>
    </figure>
    <figure className="spz-chart">
      <figcaption>Circumference</figcaption>
      {circumferencePoints ? <svg viewBox={`0 0 ${chartWidth} 80`} role="img" aria-label={`${circumference.length} circumference readings, ${range(circumference)}`}>
        <line x1="0" x2={chartWidth} y1="72" y2="72" className="spz-chart-axis" />
        {circumferencePoints.map((point) => <circle key={point.entry.id} cx={point.x} cy={point.y} r="4" className="spz-chart-dot" data-condition={point.entry.protocol.condition} />)}
      </svg> : <p className="spz-note">No circumference readings for this arm yet.</p>}
      {circumferencePoints && <p className="spz-chart-scale">{range(circumference)} · open dots were pumped</p>}
    </figure>
    {gripPoints && <figure className="spz-chart">
      <figcaption>Grip strength on a dynamometer (its own unit, not exercise load)</figcaption>
      <svg viewBox={`0 0 ${chartWidth} 80`} role="img" aria-label={`${grip.length} grip readings, ${range(grip)}`}>
        <line x1="0" x2={chartWidth} y1="72" y2="72" className="spz-chart-axis" />
        {gripPoints.map((point) => <circle key={point.entry.id} cx={point.x} cy={point.y} r="4" className="spz-chart-dot" />)}
      </svg>
      <p className="spz-chart-scale">{range(grip)}</p>
    </figure>}

    {armEntries.length > 0 && <ul className="spz-measure-list">
      {[...armEntries].sort((left, right) => right.measuredAt.localeCompare(left.measuredAt)).slice(0, 8).map((entry) => <li key={entry.id}>
        <span><b>{displayValue(entry)}</b><small>{new Date(entry.measuredAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} · {entry.protocol.landmark}{entry.protocol.distanceFromLandmarkCm !== null ? `, ${entry.protocol.distanceFromLandmarkCm} cm` : ""} · {postureLabels[entry.protocol.posture]} · {conditionLabels[entry.protocol.condition]}{entry.notes ? ` · ${entry.notes}` : ""}</small></span>
        <button type="button" className="spz-icon-button" onClick={() => remove(entry)} aria-label={`Remove the reading of ${displayValue(entry)}`}><X className="h-4 w-4" aria-hidden="true" /></button>
      </li>)}
    </ul>}
    {removed && <p className="spz-inline-status" role="status">Reading removed. <button type="button" className="spz-link" onClick={() => { if (onSave(removed).ok) setRemoved(null); }}>Undo</button></p>}

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
      <label className="spz-field"><span>{metric === "grip_force_n" ? "Grip (kg on the dynamometer)" : "Circumference (cm)"}</span><input type="number" inputMode="decimal" min={0} step={0.1} value={value} onChange={(event) => setValue(event.target.value)} /></label>
      <label className="spz-field"><span>Date</span><input type="date" value={date} max={todayKey} onChange={(event) => setDate(event.target.value || todayKey)} /></label>
      <label className="spz-field"><span>Where (landmark)</span><input type="text" value={landmark} onChange={(event) => setLandmark(event.target.value)} /></label>
      {metric === "circumference_cm" && <label className="spz-field"><span>Distance from the landmark (cm, optional)</span><input type="number" inputMode="decimal" min={0} step={0.5} value={distance} onChange={(event) => setDistance(event.target.value)} /></label>}
      <label className="spz-field"><span>Posture</span><select value={posture} onChange={(event) => setPosture(event.target.value as MeasurementProtocol["posture"])}>{(Object.keys(postureLabels) as MeasurementProtocol["posture"][]).map((item) => <option key={item} value={item}>{postureLabels[item]}</option>)}</select></label>
      <label className="spz-field"><span>Condition</span><select value={condition} onChange={(event) => setCondition(event.target.value as MeasurementProtocol["condition"])}>{(Object.keys(conditionLabels) as MeasurementProtocol["condition"][]).map((item) => <option key={item} value={item}>{conditionLabels[item]}</option>)}</select></label>
      <label className="spz-field"><span>Tape or dynamometer (optional)</span><input type="text" value={device} onChange={(event) => setDevice(event.target.value)} /></label>
      <label className="spz-field"><span>Note (optional)</span><input type="text" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
      <p className="spz-note">The same place, posture, time of day and condition make two readings comparable. The time is recorded with the reading.</p>
      {error && <p className="spz-error" role="alert">{error}</p>}
      <div className="spz-actions"><button type="button" className="spz-primary" onClick={save}>Save reading</button><button type="button" className="spz-button" onClick={() => { setOpen(false); setError(null); }}>Cancel</button></div>
    </fieldset> : <button type="button" className="spz-button" onClick={() => { setOpen(true); setArm(side); setRemoved(null); }}>Add a reading</button>}
  </div>;
}
