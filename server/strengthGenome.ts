import { and, desc, eq } from "drizzle-orm";
import { bodyMassObservations, strengthObservations } from "../drizzle/schema";
import { strengthRegionDefinitions } from "../shared/strengthGenomeDefinitions";
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

export async function getStrengthGenomeOverview(userId: number) {
  const observations = await listStrengthObservations(userId);
  return {
    sourceStatus: "AWAITING_EVIDENCE" as const,
    observationCount: observations.length,
    regions: strengthRegionDefinitions.map(region => ({
      id: region.id,
      label: region.label,
      state: "INSUFFICIENT_DATA" as const,
      message: "Awaiting an approved exercise-to-domain mapping and reference dataset.",
    })),
    nextAction: observations.length
      ? "Performance observations are saved. Strength estimates unlock only after evidence-calibrated mappings and matching reference data are available."
      : "Add a standardized lift or test result to begin your performance history.",
  };
}
