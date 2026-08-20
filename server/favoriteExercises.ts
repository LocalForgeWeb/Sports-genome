import { and, desc, eq } from "drizzle-orm";
import { favoriteExercises } from "../drizzle/schema";
import { getDb } from "./db";

export async function listFavoriteExerciseIds(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  const rows = await db.select({ catalogExerciseId: favoriteExercises.catalogExerciseId })
    .from(favoriteExercises)
    .where(eq(favoriteExercises.userId, userId))
    .orderBy(desc(favoriteExercises.createdAt));
  return rows.map((row) => row.catalogExerciseId);
}

export async function setFavoriteExercise(userId: number, catalogExerciseId: number, favorited: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");

  if (favorited) {
    await db.insert(favoriteExercises).values({ userId, catalogExerciseId })
      .onDuplicateKeyUpdate({ set: { createdAt: new Date() } });
  } else {
    await db.delete(favoriteExercises)
      .where(and(
        eq(favoriteExercises.userId, userId),
        eq(favoriteExercises.catalogExerciseId, catalogExerciseId),
      ));
  }

  return listFavoriteExerciseIds(userId);
}
