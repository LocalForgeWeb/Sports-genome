import { boolean, decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const workoutSessions = mysqlTable("workoutSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  sportId: varchar("sportId", { length: 80 }),
  goal: varchar("goal", { length: 80 }),
  dayLabel: varchar("dayLabel", { length: 100 }),
  status: mysqlEnum("status", ["active", "completed", "abandoned"]).notNull().default("active"),
  plannedExerciseCount: int("plannedExerciseCount").notNull(),
  sessionNotes: text("sessionNotes"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("workoutSessions_user_started_idx").on(table.userId, table.startedAt)]);

export const workoutSessionExercises = mysqlTable("workoutSessionExercises", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull().references(() => workoutSessions.id, { onDelete: "cascade" }),
  catalogExerciseId: int("catalogExerciseId"),
  exerciseName: varchar("exerciseName", { length: 255 }).notNull(),
  movement: varchar("movement", { length: 255 }),
  primaryMuscles: text("primaryMuscles"),
  plannedPrescription: varchar("plannedPrescription", { length: 100 }).notNull(),
  plannedRpe: varchar("plannedRpe", { length: 40 }),
  plannedRest: varchar("plannedRest", { length: 40 }),
  exerciseOrder: int("exerciseOrder").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("workoutSessionExercises_session_order_idx").on(table.sessionId, table.exerciseOrder)]);

export const workoutSetLogs = mysqlTable("workoutSetLogs", {
  id: int("id").autoincrement().primaryKey(),
  sessionExerciseId: int("sessionExerciseId").notNull().references(() => workoutSessionExercises.id, { onDelete: "cascade" }),
  setNumber: int("setNumber").notNull(),
  actualWeight: decimal("actualWeight", { precision: 8, scale: 2 }),
  weightUnit: mysqlEnum("weightUnit", ["lb", "kg"]).notNull().default("lb"),
  actualReps: int("actualReps"),
  completed: boolean("completed").notNull().default(false),
  setNotes: varchar("setNotes", { length: 500 }),
  loggedAt: timestamp("loggedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("workoutSetLogs_exercise_set_unique").on(table.sessionExerciseId, table.setNumber)]);

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type WorkoutSessionExercise = typeof workoutSessionExercises.$inferSelect;
export type WorkoutSetLog = typeof workoutSetLogs.$inferSelect;

/** Account-owned bookmarks for static exercise-catalog records. */
export const favoriteExercises = mysqlTable("favoriteExercises", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  catalogExerciseId: int("catalogExerciseId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("favoriteExercises_user_catalog_unique").on(table.userId, table.catalogExerciseId),
  index("favoriteExercises_user_created_idx").on(table.userId, table.createdAt),
]);

export type FavoriteExercise = typeof favoriteExercises.$inferSelect;
