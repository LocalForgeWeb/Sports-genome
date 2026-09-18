/**
 * Which pasted lines start a new training day.
 *
 * The header test used to be a fixed list of seven split names, so the way people
 * actually write a four-day week - "Upper A", "Upper B" - matched nothing. Every
 * exercise under those headings was folded into one day, and pasting a routine
 * silently turned four days into one. "Arms" and "Back & Biceps" did the same, landing
 * in whichever day happened to come before them.
 *
 * A header is now recognised by shape: a `Day 3`, a weekday, or a short line built
 * entirely out of training-day words, joins and an A/B-style marker. Requiring the
 * WHOLE line to be day vocabulary is what keeps "Back Squat" an exercise while "Back
 * & Biceps" is a heading - "squat" is not a day word, so that line is never a header.
 */

const dayWords = [
  // Splits the app itself plans with.
  "push", "pull", "legs", "leg", "upper", "lower", "full", "body", "fullbody", "sport", "transfer",
  // Ways athletes label the rest of the week.
  "conditioning", "cardio", "recovery", "rest", "mobility", "accessory", "accessories", "skill", "technique", "practice", "power", "strength", "hypertrophy", "deload",
  // Body parts used as day names.
  "chest", "back", "shoulders", "shoulder", "delts", "traps", "lats", "arms", "arm", "biceps", "triceps", "core", "abs", "glutes", "quads", "hamstrings", "hams", "calves", "posterior", "anterior", "chain",
];
const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "mon", "tue", "tues", "wed", "thu", "thur", "thurs", "fri", "sat", "sun"];
// Words that only ever decorate a heading, never carry its meaning.
const headerNoise = ["day", "days", "session", "workout", "training", "week", "the", "of", "and"];
/** "A", "B", "1", "2", "i", "ii" - the marker that tells two Upper days apart. */
const orderMarker = /^(?:[a-d]|[1-9]|i{1,3}|iv|v)$/;

const tokenize = (value: string) => value
  .toLowerCase()
  .replace(/[–—]/g, "-")
  .replace(/[^a-z0-9]+/g, " ")
  .trim()
  .split(/\s+/)
  .filter(Boolean);

/** A prescription, a load, or a rep range means this is an exercise line, whatever words it uses. */
const carriesProgramming = (raw: string) => /\d\s*(?:x|×)\s*\d|\brpe\b|\b\d+\s*(?:kg|lb|lbs|reps?|sec|secs|seconds|min|mins|minutes)\b|@/i.test(raw);

export function isRoutineDayHeader(raw: string) {
  const line = raw.trim().replace(/[:\-–—]+$/, "").trim();
  if (!line || line.length > 48) return false;
  if (carriesProgramming(line)) return false;
  const tokens = tokenize(line);
  if (!tokens.length || tokens.length > 6) return false;
  if (tokens[0] === "day" && /^\d+$/.test(tokens[1] || "")) return true;
  if (weekdays.includes(tokens[0])) return true;

  let carriesDayWord = false;
  for (const token of tokens) {
    if (dayWords.includes(token)) { carriesDayWord = true; continue; }
    if (headerNoise.includes(token) || orderMarker.test(token)) continue;
    return false;
  }
  return carriesDayWord;
}

/**
 * The name to show for the day, with the scaffolding removed but the distinguishing
 * marker kept - dropping the "A" from "Upper A" is exactly how two days become one.
 */
export function routineDayLabel(raw: string) {
  const line = raw.trim().replace(/[:\-–—]+$/, "").trim();
  const withoutDayNumber = line.replace(/^(?:week\s*\d+\s*[-–—:]?\s*)?day\s*\d+\s*[-–—:]?\s*/i, "").trim();
  const cleaned = (withoutDayNumber || line).replace(/\s+(?:day|session|workout)$/i, "").trim();
  return cleaned || line;
}
