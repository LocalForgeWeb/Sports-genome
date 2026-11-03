import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { dynamicWorkText, holdWorkText, neckLineLabel, type NeckWeekLine, type NeckWeekSummary, type NeckWorkSet } from "@/lib/neckWeek";
import "./neck-week.css";

/**
 * The neck's week on the Review board (lib/neckWeek.ts): one row per direction, Side bend and
 * Rotation split into Left and Right, sets and reps in one column and holds and seconds in the
 * other, never added together. Shown only in a week with neck work logged. A row with work opens
 * to the sets behind it; a row without reads "No logged work", which is not a judgement. Read from
 * finished workouts on this device, not from the plan the rest of the board reads.
 */
export function NeckWeekCard({ summary }: { summary: NeckWeekSummary }) {
  const [open, setOpen] = useState<string | null>(null);
  const last = new Date(summary.to);
  last.setDate(last.getDate() - 1);
  const day = (date: Date) => date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  return <section className="wr-section wr-neck" aria-labelledby="wr-neck-heading">
    <div className="wr-section-head"><div>
      <h2 id="wr-neck-heading">Neck work logged this week</h2>
      <p>{day(summary.from)} – {day(last)} · finished workouts on this device.</p>
    </div></div>
    <div className="wr-neck-columns" aria-hidden="true"><span>Direction</span><span>Sets · reps</span><span>Holds · time</span></div>
    <ol className="wr-neck-lines" aria-label="Neck work by direction">
      {summary.lines.map((line) => {
        const key = `${line.action}:${line.side}`;
        const label = neckLineLabel(line);
        if (!line.sets.length) return <li key={key} className="wr-neck-line" data-empty="">
          <span className="wr-neck-name">{label}</span>
          <span className="wr-neck-empty">No logged work</span>
        </li>;
        const expanded = open === key;
        const dynamic = dynamicWorkText(line.work);
        const holds = holdWorkText(line.work);
        return <li key={key} className="wr-neck-line" data-unknown={line.side === "unknown" ? "" : undefined}>
          <button type="button" className="wr-neck-toggle" aria-expanded={expanded} aria-controls={`wr-neck-${key}`} aria-label={`${label}: ${dynamic ?? "no sets"}; ${holds ?? "no holds"}. ${expanded ? "Hide" : "Show"} the sets.`} onClick={() => setOpen(expanded ? null : key)}>
            <span className="wr-neck-name">{label}</span>
            <span>{dynamic ?? "—"}</span>
            <span>{holds ?? "—"}</span>
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
          {expanded && <NeckSets id={`wr-neck-${key}`} line={line} />}
        </li>;
      })}
    </ol>
  </section>;
}

/** "Tue 3 Nov · Isometric Neck Rotation — Manual Resistance · Right · 20 s": the sets behind a row. */
function NeckSets({ id, line }: { id: string; line: NeckWeekLine }) {
  const dose = (set: NeckWorkSet) => (set.hold ? (set.seconds === null ? "seconds not recorded" : `${set.seconds} s`) : `${set.reps} ${set.reps === 1 ? "rep" : "reps"}`);
  return <ul id={id} className="wr-neck-sets" aria-label={`Sets behind ${neckLineLabel(line)}`}>
    {line.sets.map((set, index) => <li key={`${set.sessionId}-${index}`}>
      <b>{set.exerciseName}</b>
      <small>{new Date(set.completedAt).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}{set.direction ? ` · ${set.direction === "left" ? "Left" : "Right"}` : ""} · {dose(set)}</small>
    </li>)}
  </ul>;
}
