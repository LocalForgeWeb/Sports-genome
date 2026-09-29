import { eq } from "drizzle-orm";
import { z } from "zod";
import { athleteStrengthProfiles } from "../drizzle/schema";
import { getDb } from "./db";

export type SexForReference = "female" | "male" | "intersex" | "unspecified";

export type AthleteStrengthProfileInput = {
  dateOfBirth?: string | null;
  sexForReference?: SexForReference;
};

/**
 * A YYYY-MM-DD day that exists on the calendar, is not in the future and is within 120 years.
 * JavaScript rolls 2000-02-30 over to 2000-03-01, so the parsed day has to read back unchanged.
 */
export function isPastCalendarDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  if (date.toISOString().slice(0, 10) !== value) return false;
  return date.getTime() <= Date.now() && date.getUTCFullYear() >= new Date().getUTCFullYear() - 120;
}

/** Either field may be left out, which keeps what is saved; a null birth date clears it. */
export const athleteStrengthProfileInputSchema = z.object({
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(isPastCalendarDate, { message: "Enter a real birth date in the past." })
    .nullable()
    .optional(),
  sexForReference: z
    .enum(["female", "male", "intersex", "unspecified"])
    .optional(),
});

/**
 * Captured once in onboarding (or edited in About Me) so population-reference
 * comparisons never have to re-ask sex/age inline, buried in a per-lift form.
 */
export async function getAthleteStrengthProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(athleteStrengthProfiles)
    .where(eq(athleteStrengthProfiles.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertAthleteStrengthProfile(
  userId: number,
  input: AthleteStrengthProfileInput
) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const values = {
    userId,
    dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
    sexForReference: input.sexForReference ?? "unspecified",
  };
  // An existing profile changes only in the fields the caller sent: saving sex alone must not
  // wipe the birth date, and saving the birth date alone must not reset sex.
  const set: Partial<Pick<typeof values, "dateOfBirth" | "sexForReference">> = {};
  if (input.dateOfBirth !== undefined) set.dateOfBirth = values.dateOfBirth;
  if (input.sexForReference !== undefined) set.sexForReference = values.sexForReference;
  await db
    .insert(athleteStrengthProfiles)
    .values(values)
    // MySQL refuses an empty SET, so a call that sends neither field rewrites the key to itself.
    .onDuplicateKeyUpdate({ set: Object.keys(set).length ? set : { userId } });
  return getAthleteStrengthProfile(userId);
}
