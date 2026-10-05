import { SHARE_TEXT_MARKER } from "@shared/workoutShareFormat";

/**
 * Reads a workout that Sports Genome itself copied, exactly.
 *
 * Two shapes are ours. The current one (shareSnapshotText) puts each exercise on
 * one line with its whole prescription. The one copied before October 4
 * (workoutSummaryText) put the name on one line, the prescription on the next and
 * the muscles on a third, separated by blank lines - pasted back through the
 * general reader, every prescription was lost (replaced by a default) and every
 * muscle line became a day of its own. Both are recognised by their markers and
 * read line for line here; anything else goes to the general reader.
 */
export type SharedTextLine = { raw: string; name: string; prescription: string; rpe?: string; rest?: string; notes?: string };
export type SharedTextDay = { label: string; lines: SharedTextLine[] };
export type SharedTextWorkout = { title?: string; attribution?: string; description?: string; days: SharedTextDay[] };

const exerciseLine = /^\s*(\d{1,2})[.)]\s+(.+?)\s*$/;

/** "4 × 3–6 · RPE 8 · Rest 120 sec · Note: …" into its parts; the first unlabelled part is the prescription. */
function readDose(dose: string): Omit<SharedTextLine, "raw" | "name"> {
  const result: Omit<SharedTextLine, "raw" | "name"> = { prescription: "" };
  // A note is free text and may itself contain " · ", so it is taken whole from its label to the end.
  const noteAt = dose.search(/(?:^|\s·\s)Note:\s*/i);
  let rest = dose;
  if (noteAt >= 0) {
    result.notes = dose.slice(noteAt).replace(/^(?:\s·\s)?Note:\s*/i, "").trim() || undefined;
    rest = dose.slice(0, noteAt);
  }
  for (const part of rest.split(/\s+·\s+/).map((value) => value.trim()).filter(Boolean)) {
    if (/^rpe\b/i.test(part)) result.rpe = part.replace(/^rpe\s*/i, "RPE ");
    else if (/^rest\b/i.test(part)) result.rest = part.replace(/^rest\s*[:@]?\s*/i, "");
    else if (!result.prescription) result.prescription = part;
    else result.notes = [result.notes, part].filter(Boolean).join(" · ");
  }
  return result;
}

function readCurrent(lines: string[]): SharedTextWorkout {
  const workout: SharedTextWorkout = { days: [] };
  const markerAt = lines.findIndex((line) => line.startsWith(SHARE_TEXT_MARKER));
  if (markerAt > 0) workout.title = lines[markerAt - 1].trim();
  let day: SharedTextDay | null = null;
  lines.forEach((line, index) => {
    const value = line.trim();
    if (!value || index <= markerAt) return;
    if (/^By\s+/.test(value) && !workout.days.length) { workout.attribution = value.replace(/^By\s+/, ""); return; }
    if (/^Open it or save a copy:/i.test(value)) return;
    const header = value.match(/^Day\s+\d+\s*[·:\-–—]\s*(.+)$/i);
    if (header) { day = { label: header[1].trim(), lines: [] }; workout.days.push(day); return; }
    const exercise = value.match(exerciseLine);
    if (exercise && day) {
      const [, , body] = exercise;
      const split = body.search(/\s+—\s+/);
      const name = (split >= 0 ? body.slice(0, split) : body).trim();
      const dose = split >= 0 ? body.slice(split).replace(/^\s+—\s+/, "") : "";
      (day as SharedTextDay).lines.push({ raw: value, name, ...readDose(dose) });
      return;
    }
    // Before the first day, an unnumbered line is the sender's description.
    if (!workout.days.length) workout.description = [workout.description, value].filter(Boolean).join(" ");
  });
  return workout;
}

function readLegacy(source: string): SharedTextWorkout {
  const blocks = source.split(/\n\s*\n/).map((block) => block.split("\n").map((line) => line.trim()).filter(Boolean)).filter((block) => block.length);
  const [head, ...rest] = blocks;
  // "Week 1 · Day 02 · Pull": the day is the last part.
  const dayLine = head.find((line) => /^Week\s+\d+\s*·/i.test(line));
  const label = dayLine?.split("·").map((part) => part.trim()).filter(Boolean).pop() || "Imported session";
  const lines: SharedTextLine[] = [];
  for (const block of rest) {
    const first = block[0].match(/^(\d{2})\s+(.+)$/);
    if (!first) continue;
    // The dose line is the one that reads as a prescription; the muscle line never does.
    const doseLine = block.slice(1).find((line) => /^\d+\s*(?:×|x)\s*\S/i.test(line)) ?? "";
    const note = block.slice(1).find((line) => /^Note:\s*/i.test(line))?.replace(/^Note:\s*/i, "");
    const dose = readDose(doseLine);
    // The old summary wrote rest as a bare "90 sec" third part; read it as rest, not a note.
    if (!dose.rest && dose.notes && /^\d+\s*(?:sec|s|min|m)\b/i.test(dose.notes)) { dose.rest = dose.notes; dose.notes = undefined; }
    lines.push({ raw: block.join(" / "), name: first[2].trim(), ...dose, notes: note || dose.notes });
  }
  return { title: dayLine ? `${label} · ${dayLine.split("·")[0].trim()}` : undefined, days: lines.length ? [{ label, lines }] : [] };
}

/** The workout in a paste, if Sports Genome copied it; null for anything else. */
export function readSharedWorkoutText(source: string): SharedTextWorkout | null {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  if (lines.some((line) => line.trim().startsWith(SHARE_TEXT_MARKER))) {
    const workout = readCurrent(lines);
    return workout.days.some((day) => day.lines.length) ? workout : null;
  }
  if (lines.find((line) => line.trim())?.trim() === "SPORTS GENOME") {
    const workout = readLegacy(source.replace(/\r\n?/g, "\n"));
    return workout.days.length ? workout : null;
  }
  return null;
}
