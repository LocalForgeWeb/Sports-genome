import { eq } from "drizzle-orm";
import { athleteStrengthProfiles } from "../drizzle/schema";
import { getDb } from "./db";

export type SexForReference = "female" | "male" | "intersex" | "unspecified";

export type AthleteStrengthProfileInput = {
  dateOfBirth?: string | null;
  sexForReference?: SexForReference;
};

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
  await db
    .insert(athleteStrengthProfiles)
    .values(values)
    .onDuplicateKeyUpdate({
      set: { dateOfBirth: values.dateOfBirth, sexForReference: values.sexForReference },
    });
  return getAthleteStrengthProfile(userId);
}
