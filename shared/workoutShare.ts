import { z } from "zod";

// No code generated at run time: zod 4 otherwise probes `new Function("")` to decide whether it
// can compile validators, and a Content-Security-Policy without 'unsafe-eval' reports that probe
// as a violation (Infrastructure V2, SEC10). Interpreted validation is fast enough for a share.
z.config({ jitless: true });
import { orderedSnapshot } from "./workoutShareFormat";

/**
 * A shared workout: the snapshot a sender publishes and a recipient reads and saves.
 *
 * It is a copy, made when the link is created, never a view of the sender's plan:
 * editing or deleting the plan afterwards changes nothing a recipient sees, and a
 * recipient's saved copy is theirs. It carries only what a workout needs - the
 * exercises in order and their planned prescriptions, with notes only where the
 * sender chose to include them - and nothing about the sender but the name they
 * typed, if any. No account, email, logged sets, history or body measures.
 *
 * Versioned (`schema`), so a link made today still reads after the format grows.
 * The same schema validates on the server before anything is stored and again in
 * the browser before anything is shown or saved: a shared payload is untrusted.
 */
export const SHARE_SCHEMA_VERSION = 1 as const;

export const shareLimits = {
  title: 80,
  description: 400,
  attribution: 40,
  dayLabel: 48,
  exerciseName: 120,
  field: 60,
  notes: 300,
  days: 7,
  exercisesPerDay: 30,
  /** Bytes of JSON accepted for one snapshot; a full week is a few kilobytes. */
  payloadBytes: 64_000,
} as const;

/** Control characters out, whitespace trimmed: text is shown as text, never as markup. */
const cleanText = (value: string) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\s+\n/g, "\n").trim();
const text = (max: number) => z.string().max(max * 2).transform(cleanText).pipe(z.string().max(max));
const requiredText = (max: number) => text(max).pipe(z.string().min(1));

export const shareExerciseSchema = z.object({
  /** 1-based position in its day. Order is explicit, never left to array order alone. */
  order: z.number().int().min(1).max(shareLimits.exercisesPerDay),
  /** The catalog id it was shared from; null for an entry the catalog does not hold. */
  catalogId: z.number().int().positive().nullable(),
  /** The name as the sender's catalog had it, kept so the share reads even if the catalog changes. */
  name: requiredText(shareLimits.exerciseName),
  movement: text(shareLimits.field).optional(),
  equipment: text(shareLimits.field).optional(),
  /** The planned prescription exactly as the sender's plan shows it ("4 × 3–6", "3 × 30–45 sec"). */
  prescription: text(shareLimits.field),
  /** True when the sender had not set one and the plan showed its goal default. */
  prescriptionIsDefault: z.boolean().optional(),
  rpe: text(shareLimits.field).optional(),
  rest: text(shareLimits.field).optional(),
  /** Only when the sender chose to include notes. */
  notes: text(shareLimits.notes).optional(),
});

export const shareDaySchema = z.object({
  order: z.number().int().min(1).max(shareLimits.days),
  /** The day's name in the sender's plan: "Push", "Upper A". */
  label: requiredText(shareLimits.dayLabel),
  exercises: z.array(shareExerciseSchema).min(1).max(shareLimits.exercisesPerDay),
});

export const shareSnapshotSchema = z.object({
  schema: z.literal(SHARE_SCHEMA_VERSION),
  /** One training day, or a week of days in their order. */
  scope: z.enum(["day", "week"]),
  title: requiredText(shareLimits.title),
  description: text(shareLimits.description).optional(),
  /** The name the sender chose to show, if any. Never derived from an account. */
  attribution: text(shareLimits.attribution).optional(),
  /** The plan week it came from, for context only. */
  week: z.number().int().min(1).max(12).optional(),
  sport: text(shareLimits.field).optional(),
  goal: text(shareLimits.field).optional(),
  days: z.array(shareDaySchema).min(1).max(shareLimits.days),
}).superRefine((snapshot, context) => {
  if (snapshot.scope === "day" && snapshot.days.length !== 1) context.addIssue({ code: "custom", message: "A shared day has exactly one day." });
  const orders = snapshot.days.map((day) => day.order);
  if (new Set(orders).size !== orders.length) context.addIssue({ code: "custom", message: "Day order repeats." });
  snapshot.days.forEach((day) => {
    const positions = day.exercises.map((exercise) => exercise.order);
    if (new Set(positions).size !== positions.length) context.addIssue({ code: "custom", message: `Exercise order repeats in ${day.label}.` });
  });
});

export type ShareSnapshot = z.infer<typeof shareSnapshotSchema>;
export type ShareDay = ShareSnapshot["days"][number];
export type ShareExercise = ShareDay["exercises"][number];

export function parseShareSnapshot(value: unknown): { ok: true; snapshot: ShareSnapshot } | { ok: false; reason: string } {
  try {
    if (JSON.stringify(value).length > shareLimits.payloadBytes) return { ok: false, reason: "too-large" };
  } catch { return { ok: false, reason: "unreadable" }; }
  const parsed = shareSnapshotSchema.safeParse(value);
  return parsed.success ? { ok: true, snapshot: orderedSnapshot(parsed.data) } : { ok: false, reason: parsed.error.issues[0]?.message ?? "invalid" };
}


export { orderedSnapshot, shareExerciseCount, shareScopeLine, shareDoseLine, SHARE_TEXT_MARKER, shareSnapshotText } from "./workoutShareFormat";
