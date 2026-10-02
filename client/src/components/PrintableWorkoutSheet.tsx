import { createPortal } from "react-dom";
import type { Exercise } from "@/lib/exerciseCatalog";
import type { ExerciseSettings } from "@/lib/workoutPlanner";
import { muscleLabels } from "@/components/AnatomyMap";
import { getPrintableWorkoutRows } from "@/lib/workoutPrint";
import "../printable-workout.css";

/*
 * Printing the page from the browser (Cmd/Ctrl+P) prints this sheet and nothing else.
 * It renders at <body>, beside the app rather than inside it, so print CSS can take the
 * whole app out of the flow with display:none. It used to hide the app with
 * visibility:hidden, which keeps every hidden block's height: the dark app's full length
 * printed as empty navy pages after the sheet (Oct 2 brief §10). Sharing a PDF does not
 * come through here; it is drawn by lib/workoutPdf.
 */
export function PrintableWorkoutSheet({ workout, prescriptions, settings, goal, sport, dayLabel }: { workout: Exercise[]; prescriptions: Record<number, string>; settings: Record<number, ExerciseSettings>; goal: string; sport: string; dayLabel: string }) {
  const rows = getPrintableWorkoutRows(workout, prescriptions, settings);
  if (typeof document === "undefined") return null;
  return createPortal(<article className="printable-workout-sheet" aria-hidden="true"><header><p>Sports Genome / Training Day</p><h1>{dayLabel}</h1><div><span>Goal: {goal}</span><span>Sport: {sport}</span><span>Date: ____________________</span></div></header><table><thead><tr><th>#</th><th>Exercise</th><th>Prescription</th><th>Effort / rest</th><th>Actual load / reps</th></tr></thead><tbody>{rows.map((row) => <tr key={row.order}><td>{String(row.order).padStart(2, "0")}</td><td><strong>{row.name}</strong><small>{row.muscleSummary.split(", ").map((muscle) => muscleLabels[muscle] || muscle).join(" · ")}</small>{row.notes ? <small className="printable-exercise-note">Coach cue: {row.notes}</small> : null}</td><td>{row.prescription}</td><td>{row.rpe}<br />{row.rest}</td><td>{row.trackingLines.map((line) => <span key={line}>{line}</span>)}</td></tr>)}</tbody></table><footer><p>Coach notes</p><div /><small>Built by Gabe Naim – LocalForgeWeb · Print view is a session aid; adjust loading and exercise selection to your readiness and coaching context.</small></footer></article>, document.body);
}
