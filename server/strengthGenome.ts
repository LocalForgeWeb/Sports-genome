import { and, desc, eq } from "drizzle-orm";
import { athleteStrengthPriorities, bodyMassObservations, strengthObservations } from "../drizzle/schema";
import { resolveStrengthObservationRoute, strengthRegionDefinitions } from "../shared/strengthGenomeDefinitions";
import { getDb } from "./db";

export type StrengthMeasurementType =
  | "MEASURED_1RM"
  | "MULTI_REP"
  | "BODYWEIGHT"
  | "ISOMETRIC"
  | "DYNAMOMETRY"
  | "JUMP"
  | "FORCE_PLATE"
  | "VELOCITY";

export type CreateStrengthObservationInput = {
  catalogExerciseId?: number;
  exerciseName: string;
  observedAt: Date;
  measurementType: StrengthMeasurementType;
  loadKg?: number;
  repetitions?: number;
  measuredOneRmKg?: number;
  estimatedOneRmKg?: number;
  estimationMethod?: string;
  estimatedErrorPercent?: number;
  bodyMassKgAtTest?: number;
  totalSystemLoadKg?: number;
  rpe?: number;
  rir?: number;
  equipment?: string;
  romStandard?: string;
  techniqueVariant?: string;
  tempo?: string;
  laterality: "BILATERAL" | "LEFT" | "RIGHT";
  externalAssistance?: string;
  dataQuality: "SELF_REPORTED" | "STANDARDIZED" | "VERIFIED" | "UNCERTAIN";
  notes?: string;
};

function decimal(value: number | undefined, digits: number) {
  return value === undefined ? null : value.toFixed(digits);
}

export async function createStrengthObservation(
  userId: number,
  input: CreateStrengthObservationInput
) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const inserted = await db
    .insert(strengthObservations)
    .values({
      userId,
      catalogExerciseId: input.catalogExerciseId ?? null,
      exerciseName: input.exerciseName,
      observedAt: input.observedAt,
      measurementType: input.measurementType,
      loadKg: decimal(input.loadKg, 2),
      repetitions: input.repetitions ?? null,
      measuredOneRmKg: decimal(input.measuredOneRmKg, 2),
      estimatedOneRmKg: decimal(input.estimatedOneRmKg, 2),
      estimationMethod: input.estimationMethod || null,
      estimatedErrorPercent: decimal(input.estimatedErrorPercent, 2),
      bodyMassKgAtTest: decimal(input.bodyMassKgAtTest, 2),
      totalSystemLoadKg: decimal(input.totalSystemLoadKg, 2),
      rpe: decimal(input.rpe, 1),
      rir: decimal(input.rir, 1),
      equipment: input.equipment || null,
      romStandard: input.romStandard || null,
      techniqueVariant: input.techniqueVariant || null,
      tempo: input.tempo || null,
      laterality: input.laterality,
      externalAssistance: input.externalAssistance || null,
      dataQuality: input.dataQuality,
      notes: input.notes || null,
    })
    .$returningId();

  const id = inserted[0]?.id;
  if (!id) throw new Error("Strength observation could not be saved");
  if (input.bodyMassKgAtTest !== undefined) {
    await db.insert(bodyMassObservations).values({
      userId,
      bodyMassKg: input.bodyMassKgAtTest.toFixed(2),
      observedAt: input.observedAt,
      source: "athlete_entry",
    });
  }
  return getStrengthObservation(userId, id);
}

/** Adds athlete-entered body mass to the same dated observation; it never estimates missing load or rank. */
export async function setStrengthObservationBodyMass(
  userId: number,
  observationId: number,
  bodyMassKgAtTest: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const existing = await getStrengthObservation(userId, observationId);
  if (!existing) throw new Error("Strength observation was not found");

  await db
    .update(strengthObservations)
    .set({ bodyMassKgAtTest: bodyMassKgAtTest.toFixed(2) })
    .where(and(eq(strengthObservations.userId, userId), eq(strengthObservations.id, observationId)));

  await db.insert(bodyMassObservations).values({
    userId,
    bodyMassKg: bodyMassKgAtTest.toFixed(2),
    observedAt: existing.observedAt,
    source: "athlete_entry",
  });

  return getStrengthObservation(userId, observationId);
}

export async function getStrengthObservation(userId: number, observationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const observation = await db
    .select()
    .from(strengthObservations)
    .where(
      and(
        eq(strengthObservations.userId, userId),
        eq(strengthObservations.id, observationId)
      )
    )
    .limit(1);
  return observation[0] ?? null;
}

export async function listStrengthObservations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db
    .select()
    .from(strengthObservations)
    .where(eq(strengthObservations.userId, userId))
    .orderBy(desc(strengthObservations.observedAt), desc(strengthObservations.id))
    .limit(100);
}

export async function listActiveStrengthPriorities(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db
    .select()
    .from(athleteStrengthPriorities)
    .where(and(eq(athleteStrengthPriorities.userId, userId), eq(athleteStrengthPriorities.status, "ACTIVE")))
    .orderBy(desc(athleteStrengthPriorities.updatedAt));
}

export async function setStrengthPriority(userId: number, regionId: string, active: boolean, note?: string) {
  if (!strengthRegionDefinitions.some(region => region.id === regionId)) {
    throw new Error("Unknown Strength Genome region");
  }
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const existing = await db.select({ id: athleteStrengthPriorities.id }).from(athleteStrengthPriorities)
    .where(and(eq(athleteStrengthPriorities.userId, userId), eq(athleteStrengthPriorities.regionId, regionId))).limit(1);
  if (existing[0]) {
    await db.update(athleteStrengthPriorities).set({ status: active ? "ACTIVE" : "ARCHIVED", note: note?.trim() || null })
      .where(eq(athleteStrengthPriorities.id, existing[0].id));
  } else if (active) {
    await db.insert(athleteStrengthPriorities).values({ userId, regionId, note: note?.trim() || null });
  }
  return listActiveStrengthPriorities(userId);
}

export async function getStrengthGenomeOverview(userId: number) {
  const observations = await listStrengthObservations(userId);
  const priorities = await listActiveStrengthPriorities(userId);
  const routedObservations = observations.map(observation => ({
    observation,
    route: resolveStrengthObservationRoute(observation.exerciseName),
  }));
  const observedDomainIds = new Set(routedObservations.flatMap(item => item.route?.domainIds || []));
  const observedRegionIds = new Set(routedObservations.flatMap(item => item.route?.regionIds || []));
  return {
    sourceStatus: "OBSERVATION_ROUTING_ONLY" as const,
    observationCount: observations.length,
    athleteConfirmedPriorityRegionIds: priorities.map(priority => priority.regionId),
    observedDomains: Array.from(observedDomainIds),
    unmappedObservationCount: routedObservations.filter(item => !item.route).length,
    regions: strengthRegionDefinitions.map(region => ({
      id: region.id,
      label: region.label,
      state: observedRegionIds.has(region.id) ? "OBSERVED_TEST_CONTEXT" as const : "INSUFFICIENT_DATA" as const,
      message: observedRegionIds.has(region.id)
        ? "A saved test routes to this broad region. It is recorded test context, not a direct regional force measurement or strength rank."
        : "No saved mapped test context yet. No rank or deficit is shown.",
    })),
    nextAction: observations.length
      ? "Performance observations are saved. Test routing shows broad context only; estimates, tiers, and population comparison remain withheld until qualifying calibration and reference data are available."
      : "Add a standardized lift or test result to begin your performance history.",
  };
}
