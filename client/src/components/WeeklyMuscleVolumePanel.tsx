/** Kinetic Field Manual: week-level muscle exposure from saved day prescriptions, not a medical readiness metric. */
import { ChevronDown, Layers3 } from "lucide-react";
import type { TrainingGoal } from "@/lib/workoutPlanner";
import { getVolumeStatus, getWeeklyMuscleVolume, type WeeklyPlan, type WeeklyPrescriptionStore } from "@/lib/weeklyVolume";

function dayName(key: string) { return key.split("-").slice(1).join("-") || key; }

/** "18.5" stays "18.5"; "20" is not printed as "20.0". */
function setsFigure(value: number) { return Number.isInteger(value) ? String(value) : value.toFixed(1); }

/**
 * Where the planned week's volume lands, muscle by muscle.
 *
 * Every number here is an attributed set: a primary-muscle set counts 1.0 to that
 * muscle and 0.5 to each supporting muscle, so one performed set can count toward
 * several rows. The rows say so ("11 direct · 9 supporting") and the total is
 * labelled as attributed rather than presented as sets the athlete will perform.
 * The bars share one scale - the largest muscle's total - so a full bar means
 * "the most of any muscle this week", never "on target".
 */
export function WeeklyMuscleVolumePanel({ plan, prescriptions, goal }: { plan: WeeklyPlan; prescriptions: WeeklyPrescriptionStore; goal: TrainingGoal }) {
  const volumes = getWeeklyMuscleVolume(plan, prescriptions, goal);
  const savedDays = Object.values(plan).filter((workout) => workout.length).length;
  const max = Math.max(12, ...volumes.map((volume) => volume.equivalentSets));
  /**
   * "Where does the week's volume land" is answered by the muscles carrying most
   * of it. Eight full rows ran to 1,288px on a phone, so the answer arrived four
   * screens deep in its own evidence. The top four are the answer; the rest are
   * still here, one tap down, in the same order.
   */
  const featured = volumes.slice(0, 4);
  const remaining = volumes.slice(4, 8);
  /**
   * Which day fed this, when only one did: a breakdown of one is the total
   * restated, so the row keeps the number and the header names the day, once.
   */
  const contributingDays = Array.from(new Set(volumes.flatMap((volume) => Object.keys(volume.daySets))));
  const onlyDay = contributingDays.length === 1 ? contributingDays[0] : null;
  const attributedTotal = volumes.reduce((total, volume) => total + volume.equivalentSets, 0);
  const volumeRow = (volume: (typeof volumes)[number]) => {
    const status = getVolumeStatus(volume);
    return <article key={volume.muscle}>
      <div className="weekly-volume-row">
        <div><strong>{volume.label}</strong><small>{setsFigure(volume.directSets)} direct · {setsFigure(volume.supportSets)} supporting</small></div>
        <b>{setsFigure(volume.equivalentSets)}</b>
      </div>
      <div className="weekly-volume-track" role="img" aria-label={`${volume.label}: ${setsFigure(volume.equivalentSets)} attributed sets, of the week's largest ${setsFigure(max)}`}>
        <i className="weekly-volume-bar-direct" style={{ width: `${Math.min(100, (volume.directSets / max) * 100)}%` }} />
        <i className="weekly-volume-bar-support" style={{ width: `${Math.min(100, (volume.equivalentSets / max) * 100)}%` }} />
      </div>
      <p className="weekly-volume-foot">
        <span className={`weekly-volume-status weekly-volume-status-${status.tone}`}><i aria-hidden="true" />{status.label}</span>
        {Object.keys(volume.daySets).length > 1 && <span className="weekly-volume-days">{Object.entries(volume.daySets).map(([key, sets]) => <span key={key}>{dayName(key)} <b>{setsFigure(sets)}</b></span>)}</span>}
      </p>
    </article>;
  };
  return <section className="weekly-volume-panel" aria-label="Weekly per-muscle volume">
    <div className="weekly-volume-head">
      <div>
        <p className="metric-label">Saved-week exposure</p>
        <h3>Muscle volume map</h3>
        <p>{savedDays ? (onlyDay ? `${dayName(onlyDay)} is the one saved training day feeding this estimate.` : `${savedDays} saved training days feed this estimate.`) : "Save a training day to begin the weekly volume map."}</p>
      </div>
      {savedDays > 0 && <p className="weekly-volume-scope">Planned · {savedDays} saved {savedDays === 1 ? "day" : "days"}</p>}
    </div>
    <div className="weekly-volume-legend"><span><i className="weekly-volume-direct" />Direct working sets</span><span><i className="weekly-volume-support" />Supporting work, counted at half</span></div>
    {featured.length ? <>
      <div className="weekly-volume-list">{featured.map(volumeRow)}</div>
      {remaining.length > 0 && <details className="weekly-volume-more">
        <summary><span>Show {remaining.length} more {remaining.length === 1 ? "muscle" : "muscles"}</span><small>{remaining.map((volume) => volume.label).join(" · ")}</small><ChevronDown className="h-4 w-4" aria-hidden="true" /></summary>
        <div className="weekly-volume-list">{remaining.map(volumeRow)}</div>
      </details>}
      <p className="weekly-volume-total"><b>{setsFigure(attributedTotal)}</b> attributed sets across all muscles this week. A set counts toward every muscle it works, so this is more than the sets you will perform.</p>
    </> : <div className="weekly-volume-empty"><Layers3 className="h-4 w-4" /> Save the current draft to a day of the weekly map to calculate exposure.</div>}
    <details className="weekly-volume-details"><summary>How this estimate works <ChevronDown className="h-4 w-4" /></summary><p>Primary-muscle sets count at 1.0. Supporting exposure uses a fixed 0.5 bookkeeping weight so assisting muscles are not shown as full direct sets; it is not a measured physiological fraction. The bars share one scale, the week's largest muscle total. The labels are planned-volume bands on direct sets only: Building below 6, Established from 6, High exposure from 12; they describe the plan as written, not adaptation, soreness or recovery. The map uses the saved day prescription when available, otherwise the current goal default. It is a planning estimate, not a measure of recovery, hypertrophy, or clinical readiness.</p></details>
  </section>;
}
