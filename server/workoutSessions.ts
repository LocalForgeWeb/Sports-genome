import { and, desc, eq, inArray } from "drizzle-orm";
import { workoutSessionExercises, workoutSessions, workoutSetLogs } from "../drizzle/schema";
import { getDb } from "./db";

export type PlannedWorkoutExercise = {
  catalogExerciseId?: number;
  exerciseName: string;
  movement?: string;
  primaryMuscles?: string[];
  plannedPrescription: string;
  plannedRpe?: string;
  plannedRest?: string;
};

export type StartWorkoutSessionInput = {
  title: string;
  sportId?: string;
  goal?: string;
  dayLabel?: string;
  exercises: PlannedWorkoutExercise[];
};

export async function createWorkoutSession(userId: number, input: StartWorkoutSessionInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const inserted = await db.insert(workoutSessions).values({
    userId,
    title: input.title,
    sportId: input.sportId,
    goal: input.goal,
    dayLabel: input.dayLabel,
    plannedExerciseCount: input.exercises.length,
  }).$returningId();
  const sessionId = inserted[0]?.id;
  if (!sessionId) throw new Error("Workout session could not be created");

  if (input.exercises.length) {
    await db.insert(workoutSessionExercises).values(input.exercises.map((exercise, index) => ({
      sessionId,
      catalogExerciseId: exercise.catalogExerciseId,
      exerciseName: exercise.exerciseName,
      movement: exercise.movement,
      primaryMuscles: exercise.primaryMuscles?.join(", "),
      plannedPrescription: exercise.plannedPrescription,
      plannedRpe: exercise.plannedRpe,
      plannedRest: exercise.plannedRest,
      exerciseOrder: index,
    })));
  }

  return getWorkoutSession(userId, sessionId);
}

export async function getWorkoutSession(userId: number, sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const sessions = await db.select().from(workoutSessions).where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId))).limit(1);
  const session = sessions[0];
  if (!session) return null;

  const exercises = await db.select().from(workoutSessionExercises).where(eq(workoutSessionExercises.sessionId, sessionId)).orderBy(workoutSessionExercises.exerciseOrder);
  const exerciseIds = exercises.map((exercise) => exercise.id);
  const setLogs = exerciseIds.length ? await db.select().from(workoutSetLogs).where(inArray(workoutSetLogs.sessionExerciseId, exerciseIds)).orderBy(workoutSetLogs.setNumber) : [];
  const logsByExercise = new Map<number, typeof setLogs>();
  setLogs.forEach((log) => logsByExercise.set(log.sessionExerciseId, [...(logsByExercise.get(log.sessionExerciseId) || []), log]));

  return {
    ...session,
    exercises: exercises.map((exercise) => ({ ...exercise, setLogs: logsByExercise.get(exercise.id) || [] })),
  };
}

export async function listWorkoutSessions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const sessions = await db.select().from(workoutSessions).where(eq(workoutSessions.userId, userId)).orderBy(desc(workoutSessions.startedAt)).limit(12);
  const ids = sessions.map((session) => session.id);
  const sessionExercises = ids.length ? await db.select().from(workoutSessionExercises).where(inArray(workoutSessionExercises.sessionId, ids)) : [];
  const exerciseIds = sessionExercises.map((exercise) => exercise.id);
  const logs = exerciseIds.length ? await db.select().from(workoutSetLogs).where(inArray(workoutSetLogs.sessionExerciseId, exerciseIds)) : [];
  const sessionIdByExerciseId = new Map(sessionExercises.map((exercise) => [exercise.id, exercise.sessionId]));
  const completedSetsBySession = new Map<number, number>();
  logs.filter((log) => log.completed).forEach((log) => {
    const parent = sessionIdByExerciseId.get(log.sessionExerciseId);
    if (parent) completedSetsBySession.set(parent, (completedSetsBySession.get(parent) || 0) + 1);
  });

  return sessions.map((session) => ({
    ...session,
    completedSetCount: completedSetsBySession.get(session.id) || 0,
    exerciseCount: sessionExercises.filter((exercise) => exercise.sessionId === session.id).length,
  }));
}

export async function upsertWorkoutSet(userId: number, input: { sessionExerciseId: number; setNumber: number; actualWeight?: number; weightUnit: "lb" | "kg"; actualReps?: number; completed: boolean; setNotes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const owners = await db.select({ sessionId: workoutSessions.id, userId: workoutSessions.userId, status: workoutSessions.status })
    .from(workoutSessionExercises)
    .innerJoin(workoutSessions, eq(workoutSessionExercises.sessionId, workoutSessions.id))
    .where(eq(workoutSessionExercises.id, input.sessionExerciseId))
    .limit(1);
  const owner = owners[0];
  if (!owner || owner.userId !== userId || owner.status !== "active") return null;

  const values = {
    sessionExerciseId: input.sessionExerciseId,
    setNumber: input.setNumber,
    actualWeight: input.actualWeight === undefined ? null : input.actualWeight.toFixed(2),
    weightUnit: input.weightUnit,
    actualReps: input.actualReps ?? null,
    completed: input.completed,
    setNotes: input.setNotes || null,
    loggedAt: new Date(),
  };
  await db.insert(workoutSetLogs).values(values).onDuplicateKeyUpdate({ set: { ...values, updatedAt: new Date() } });
  return getWorkoutSession(userId, owner.sessionId);
}

export async function completeWorkoutSession(userId: number, sessionId: number, sessionNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const session = await getWorkoutSession(userId, sessionId);
  if (!session || session.status !== "active") return null;

  await db.update(workoutSessions).set({ status: "completed", completedAt: new Date(), sessionNotes: sessionNotes || null }).where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)));
  return getWorkoutSession(userId, sessionId);
}
